import { compileTiramisu, toMarkdown } from "@tiramisu-docs/core"
import type { DocMeta, Heading } from "@tiramisu-docs/core"
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import type { Plugin, ResolvedConfig as ViteConfig, HmrContext } from "vite"
import { highlightCodeBlocks } from "./highlight.js"
import type { SectionConfig, TiramisuDocsConfig } from "./config.js"
import { findTiramisuFiles, extractPlainText, titleCase } from "./scan.js"
import type { SidebarItem, SidebarSubgroup, SidebarEntry, SidebarGroup, ResolvedSection } from "./types.js"

export type { SidebarItem, SidebarSubgroup, SidebarEntry, SidebarGroup, ResolvedSection } from "./types.js"

/** Wrap compileTiramisu to produce Vite-friendly errors with file location */
function compileWithLocation(source: string, filePath: string) {
  const dir = path.dirname(filePath)
  try {
    return compileTiramisu(source, {
      resolveFile(src) {
        const resolved = path.resolve(dir, src)
        return fs.readFileSync(resolved, "utf-8")
      },
    })
  } catch (err: unknown) {
    const isParseError = err instanceof Error && "line" in err
    if (isParseError) {
      const parseErr = err as Error & { line: number; column?: number; hint?: string }
      const enhanced = new Error(parseErr.hint ?? parseErr.message)
      Object.assign(enhanced, {
        id: filePath,
        loc: { file: filePath, line: parseErr.line, column: parseErr.column ?? 0 },
        plugin: "tiramisu-docs",
      })
      if (parseErr.stack) enhanced.stack = parseErr.stack
      throw enhanced
    }
    throw err
  }
}

export interface TiramisuPluginOptions {
  docsDir?: string
  config?: TiramisuDocsConfig
}


function resolveLastEdited(filePath: string, meta: DocMeta): string {
  if (meta.lastEdited) return new Date(meta.lastEdited).toISOString()
  try {
    const stdout = execSync(`git log -1 --format=%cI "${filePath}"`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim()
    if (stdout) return new Date(stdout).toISOString()
  } catch {}
  return fs.statSync(filePath).mtime.toISOString()
}

const VIRTUAL_MODULE_ID = "virtual:tiramisu-docs"
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID
const TIRAMISU_SVELTE_SUFFIX = ".tiramisu.svelte"

export function buildSidebarTree(
  docs: { slug: string; meta: DocMeta }[],
  groupOrder: string[] = [],
  options?: { stripPrefix?: string; defaultGroup?: string }
): SidebarGroup[] {
  const groupMap = new Map<string, { label: string; items: SidebarEntry[]; icon?: string; slug?: string; order: number }>()

  function getOrCreateGroup(label: string): { label: string; items: SidebarEntry[]; icon?: string; slug?: string; order: number } {
    // Normalize lookup: case-insensitive match against existing groups
    for (const [key, group] of groupMap) {
      if (key.toLowerCase() === label.toLowerCase()) {
        return group
      }
    }
    const group = { label, items: [] as SidebarEntry[], order: 999 }
    groupMap.set(label, group)
    return group
  }

  function getOrCreateSubgroup(
    parent: SidebarEntry[],
    segment: string
  ): SidebarSubgroup {
    const key = segment.toLowerCase()
    const existing = parent.find(
      (e): e is SidebarSubgroup =>
        e.type === "subgroup" && e.key === key
    )
    if (existing) return existing
    const sub: SidebarSubgroup = {
      type: "subgroup",
      key,
      label: titleCase(segment),
      items: [],
      order: 999,
    }
    parent.push(sub)
    return sub
  }

  const prefix = options?.stripPrefix

  for (const doc of docs) {
    // Compute treePath for grouping, but keep original slug for routing
    const treePath = prefix
      ? (doc.slug === prefix ? "index"
         : doc.slug.startsWith(prefix + "/") ? doc.slug.slice(prefix.length + 1)
         : doc.slug)
      : doc.slug
    const segments = treePath.split("/")
    const item: SidebarItem = {
      type: "item",
      title: doc.meta.title ?? doc.slug,
      slug: doc.slug,
      order: doc.meta.order ?? 999,
      icon: doc.meta.icon,
    }

    if (segments.length === 1) {
      if (prefix && treePath === "index") {
        // Section root index — skip as sidebar item (it's the section overview page)
        continue
      }
      // Root-level file: use meta.group or defaultGroup
      const groupLabel = doc.meta.group ?? options?.defaultGroup ?? "Docs"
      const group = getOrCreateGroup(groupLabel)
      group.items.push(item)
    } else {
      // Nested file: first segment = group (static heading), deeper segments = subgroups
      const groupLabel = titleCase(segments[0])
      const group = getOrCreateGroup(groupLabel)
      const fileName = segments[segments.length - 1]

      // Walk/create subgroups for middle segments (starting at segments[1])
      let parent = group.items
      let lastSub: SidebarSubgroup | null = null
      for (let i = 1; i < segments.length - 1; i++) {
        const sub = getOrCreateSubgroup(parent, segments[i])
        lastSub = sub
        parent = sub.items
      }

      if (fileName === "index" && lastSub) {
        // Deeper folder index → sets subgroup slug/label
        lastSub.slug = item.slug.replace(/\/index$/, "")
        if (item.order < lastSub.order) lastSub.order = item.order
        if (item.title !== item.slug) lastSub.label = item.title
        if (doc.meta.icon) lastSub.icon = doc.meta.icon
      } else if (fileName === "index" && !lastSub) {
        // Top-level folder index (e.g. "getting-started/index") → make group header clickable
        group.slug = item.slug.replace(/\/index$/, "")
        if (doc.meta.group) group.label = doc.meta.group
        if (doc.meta.icon) group.icon = doc.meta.icon
        if (item.order < group.order) group.order = item.order
      } else {
        parent.push(item)
      }
    }
  }

  // Sort entries recursively
  function sortEntries(entries: SidebarEntry[]): void {
    for (const entry of entries) {
      if (entry.type === "subgroup") {
        sortEntries(entry.items)
        // Derive subgroup order from its index page, or min child order
        if (!entry.slug) {
          const minOrder = entry.items.reduce((min, e) => {
            const o = e.order
            return o < min ? o : min
          }, entry.order)
          entry.order = minOrder
        }
      }
    }
    entries.sort((a, b) => {
      const ao = a.type === "item" ? a.order : a.order
      const bo = b.type === "item" ? b.order : b.order
      return ao - bo
    })
  }

  const sidebar: SidebarGroup[] = []
  for (const [, group] of groupMap) {
    sortEntries(group.items)
    sidebar.push({ label: group.label, items: group.items, icon: group.icon, slug: group.slug })
  }

  // Build order lookup from internal group objects (keyed by final label)
  const groupOrderMap = new Map<string, number>()
  for (const [, g] of groupMap) groupOrderMap.set(g.label, g.order)

  // Sort groups by groupOrder config, then by internal order
  sidebar.sort((a, b) => {
    if (groupOrder.length > 0) {
      const ai = groupOrder.indexOf(a.label)
      const bi = groupOrder.indexOf(b.label)
      const ao = ai === -1 ? Infinity : ai
      const bo = bi === -1 ? Infinity : bi
      if (ao !== bo) return ao - bo
    }
    return (groupOrderMap.get(a.label) ?? 999) - (groupOrderMap.get(b.label) ?? 999)
  })

  return sidebar
}


export function buildSectionSidebars(
  docs: { slug: string; meta: DocMeta }[],
  sections: SectionConfig[],
  implicitLabel?: string,
  groupOrder: string[] = []
): ResolvedSection[] {
  const allSectionPaths = flattenSectionPaths(sections)
  const rootDocs = docs.filter(
    (d) => !allSectionPaths.some((p) => d.slug === p || d.slug.startsWith(p + "/"))
  )

  const result: ResolvedSection[] = []

  if (rootDocs.length > 0) {
    result.push({
      label: implicitLabel ?? "Docs",
      sidebar: buildSidebarTree(rootDocs, groupOrder),
    })
  }

  for (const section of sections) {
    result.push(resolveSection(docs, section, groupOrder))
  }

  return result
}

function flattenSectionPaths(sections: SectionConfig[]): string[] {
  const paths: string[] = []
  for (const s of sections) {
    if (s.path) paths.push(s.path)
    if (s.children) paths.push(...flattenSectionPaths(s.children))
  }
  return paths
}

function resolveSection(
  docs: { slug: string; meta: DocMeta }[],
  section: SectionConfig,
  groupOrder: string[] = []
): ResolvedSection {
  if (section.href) {
    return { label: section.label, href: section.href, icon: section.icon }
  }
  if (section.children) {
    return {
      label: section.label,
      icon: section.icon,
      children: section.children.map((c) => resolveSection(docs, c, groupOrder)),
    }
  }
  const sectionDocs = docs
    .filter((d) => d.slug === section.path || d.slug.startsWith(section.path + "/"))

  const sidebar = buildSidebarTree(sectionDocs, groupOrder, {
    stripPrefix: section.path,
    defaultGroup: section.label,
  })

  return {
    label: section.label,
    path: section.path,
    icon: section.icon,
    sidebar,
  }
}

export function buildLocaleData(
  allDocs: { slug: string; meta: DocMeta; headings: Heading[]; lastEdited: string; markdown?: string }[],
  locales: { code: string }[]
): Record<string, { docs: { slug: string; meta: DocMeta; headings: Heading[]; lastEdited: string; markdown?: string }[] }> {
  const result: Record<string, { docs: { slug: string; meta: DocMeta; headings: Heading[]; lastEdited: string; markdown?: string }[] }> = {}
  for (const locale of locales) {
    const prefix = locale.code + "/"
    const docs = allDocs
      .filter((d) => d.slug.startsWith(prefix))
      .map((d) => ({ slug: d.slug.slice(prefix.length), meta: d.meta, headings: d.headings, lastEdited: d.lastEdited, markdown: d.markdown }))
    result[locale.code] = { docs }
  }
  return result
}

export function tiramisuPlugin(options: TiramisuPluginOptions = {}): Plugin {
  const docsDir = options.docsDir ?? "src/docs"
  const config = options.config
  const groupOrder = config?.sidebar?.groupOrder ?? []
  let viteRoot = process.cwd()

  function resolveDocsDir(): string {
    return path.resolve(viteRoot, docsDir)
  }

  function buildVirtualModule(): string {
    const absDocsDir = resolveDocsDir()
    const files = findTiramisuFiles(absDocsDir)

    const docs: { slug: string; meta: DocMeta; headings: Heading[]; lastEdited: string; markdown?: string }[] = []

    for (const file of files) {
      const source = fs.readFileSync(file, "utf-8")
      const { meta, headings } = compileWithLocation(source, file)
      const relativePath = path.relative(absDocsDir, file)
      const slug = relativePath.replace(/\.tiramisu$/, "").replace(/\\/g, "/")
      const lastEdited = resolveLastEdited(file, meta)
      docs.push({ slug, meta, headings, lastEdited })
    }

    for (const doc of docs) {
      const file = path.resolve(absDocsDir, doc.slug + ".tiramisu")
      const source = fs.readFileSync(file, "utf-8")
      doc.markdown = toMarkdown(source)
    }

    // Build search index with hierarchical group paths
    function resolveSearchGroup(slug: string, meta: DocMeta): string {
      const segments = slug.split("/")
      if (segments.length === 1) return meta.group ?? "Docs"
      return segments
        .slice(0, -1)
        .map(titleCase)
        .join(" > ")
    }

    const searchIndex = docs.map((doc) => {
      const file = path.resolve(absDocsDir, doc.slug + ".tiramisu")
      const source = fs.readFileSync(file, "utf-8")
      const { svelte } = compileWithLocation(source, file)
      const text = extractPlainText(svelte)
      return {
        id: doc.slug,
        title: doc.meta.title ?? doc.slug,
        group: resolveSearchGroup(doc.slug, doc.meta),
        slug: doc.slug,
        headings: doc.headings.map((h) => h.text).join(" "),
        text,
      }
    })

    // Build dynamic imports — use .tiramisu.svelte suffix so resolveId maps them
    const importsEntries = docs
      .map((doc) => {
        const absPath = path
          .resolve(absDocsDir, doc.slug + ".tiramisu")
          .replace(/\\/g, "/")
        return `  "${doc.slug}": () => import("${absPath}")`
      })
      .join(",\n")

    if (config?.i18n) {
      const localeData = buildLocaleData(docs, config.i18n.locales)

      const localeBlocks = config.i18n.locales.map((locale) => {
        const localeDocs = localeData[locale.code].docs
        const localeSections = config.sections
          ? buildSectionSidebars(localeDocs, config.sections, config.title, groupOrder)
          : undefined
        const localeSidebar = buildSidebarTree(localeDocs, groupOrder)

        // Build locale-specific search index
        const localeSearchIndex = localeDocs.map((doc) => {
          const fullSlug = `${locale.code}/${doc.slug}`
          const file = path.resolve(absDocsDir, fullSlug + ".tiramisu")
          const source = fs.readFileSync(file, "utf-8")
          const { svelte } = compileWithLocation(source, file)
          const text = extractPlainText(svelte)
          return {
            id: doc.slug,
            title: doc.meta.title ?? doc.slug,
            group: resolveSearchGroup(doc.slug, doc.meta),
            slug: doc.slug,
            headings: docs.find(d => d.slug === fullSlug)?.headings?.map(h => h.text).join(" ") ?? "",
            text,
          }
        })

        const localeImports = localeDocs
          .map((doc) => {
            const fullSlug = `${locale.code}/${doc.slug}`
            const absPath = path.resolve(absDocsDir, fullSlug + ".tiramisu").replace(/\\/g, "/")
            return `    "${doc.slug}": () => import("${absPath}")`
          })
          .join(",\n")

        return `  "${locale.code}": {
    sections: ${JSON.stringify(localeSections, null, 2)},
    sidebar: ${JSON.stringify(localeSidebar, null, 2)},
    docs: ${JSON.stringify(localeDocs, null, 2)},
    searchIndex: ${JSON.stringify(localeSearchIndex)},
    docImports: {\n${localeImports}\n    },
  }`
      }).join(",\n")

      return [

        `export const locales = {\n${localeBlocks}\n};`,
        `export const defaultLocale = "${config.i18n.defaultLocale}";`,
        `export const sidebar = locales["${config.i18n.defaultLocale}"].sidebar;`,
        `export const sections = locales["${config.i18n.defaultLocale}"].sections;`,
        `export const docs = locales["${config.i18n.defaultLocale}"].docs;`,
        `export const searchIndex = locales["${config.i18n.defaultLocale}"].searchIndex;`,
        `export const docImports = locales["${config.i18n.defaultLocale}"].docImports;`,
      ].join("\n\n")
    }

    if (config?.sections) {
      const resolvedSections = buildSectionSidebars(docs, config.sections, config.title, groupOrder)
      return [

        `export const locales = undefined;`,
        `export const defaultLocale = undefined;`,
        `export const sections = ${JSON.stringify(resolvedSections, null, 2)};`,
        `export const sidebar = [];`,
        `export const docs = ${JSON.stringify(docs, null, 2)};`,
        `export const searchIndex = ${JSON.stringify(searchIndex)};`,
        `export const docImports = {\n${importsEntries}\n};`,
      ].join("\n\n")
    } else {
      const sidebar = buildSidebarTree(docs, groupOrder)
      return [

        `export const locales = undefined;`,
        `export const defaultLocale = undefined;`,
        `export const sections = undefined;`,
        `export const sidebar = ${JSON.stringify(sidebar, null, 2)};`,
        `export const docs = ${JSON.stringify(docs, null, 2)};`,
        `export const searchIndex = ${JSON.stringify(searchIndex)};`,
        `export const docImports = {\n${importsEntries}\n};`,
      ].join("\n\n")
    }
  }

  return {
    name: "tiramisu-docs",
    enforce: "pre",

    config() {
      return {
        optimizeDeps: {
          exclude: ["@tiramisu-docs/kit"],
        },
      }
    },

    configResolved(config: ViteConfig) {
      viteRoot = config.root
    },

    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
      // Resolve .tiramisu imports to a virtual .svelte ID
      // so the Svelte plugin processes the output
      if (id.endsWith(".tiramisu")) {
        const resolved = path.isAbsolute(id) ? id : path.resolve(viteRoot, id)
        if (fs.existsSync(resolved)) {
          return resolved + ".svelte"
        }
      }
      return undefined
    },

    async load(id: string) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return buildVirtualModule()
      }

      // Compile .tiramisu files to Svelte component source
      // These come in as .tiramisu.svelte due to resolveId above
      if (id.endsWith(TIRAMISU_SVELTE_SUFFIX)) {
        const tiramisuPath = id.slice(0, -".svelte".length)
        if (!fs.existsSync(tiramisuPath)) return undefined

        const source = fs.readFileSync(tiramisuPath, "utf-8")
        const { svelte } = compileWithLocation(source, tiramisuPath)
        return await highlightCodeBlocks(svelte)
      }

      return undefined
    },

    handleHotUpdate(ctx: HmrContext) {
      if (ctx.file.endsWith(".tiramisu")) {
        // Invalidate the virtual module so sidebar/docs get rebuilt
        const virtualMod = ctx.server.moduleGraph.getModuleById(
          RESOLVED_VIRTUAL_MODULE_ID
        )
        if (virtualMod) {
          ctx.server.moduleGraph.invalidateModule(virtualMod)
        }

        // Invalidate the compiled .svelte version too
        const svelteMod = ctx.server.moduleGraph.getModuleById(
          ctx.file + ".svelte"
        )
        if (svelteMod) {
          ctx.server.moduleGraph.invalidateModule(svelteMod)
        }

        ctx.server.ws.send({ type: "full-reload" })
        return []
      }
    },
  }
}
