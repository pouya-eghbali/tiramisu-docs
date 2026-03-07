import { compileTiramisu } from "@tiramisu-docs/core"
import type { DocMeta, Heading } from "@tiramisu-docs/core"
import fs from "node:fs"
import path from "node:path"
import type { Plugin, ResolvedConfig, HmrContext } from "vite"
import { highlightCodeBlocks } from "./highlight.js"
import type { SectionConfig } from "./config.js"

export interface TiramisuPluginOptions {
  docsDir?: string
  componentsDir?: string
  groupOrder?: string[]
}

export interface SidebarItem {
  type: "item"
  title: string
  slug: string
  order: number
}

export interface SidebarSubgroup {
  type: "subgroup"
  key: string
  label: string
  slug?: string
  items: SidebarEntry[]
  order: number
}

export type SidebarEntry = SidebarItem | SidebarSubgroup

export interface SidebarGroup {
  label: string
  items: SidebarEntry[]
}

const VIRTUAL_MODULE_ID = "virtual:tiramisu-docs"
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID
const TIRAMISU_SVELTE_SUFFIX = ".tiramisu.svelte"

/** Strip HTML tags and decode entities to get plain text for search */
function extractPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

export function buildSidebarTree(
  docs: { slug: string; meta: DocMeta }[],
  groupOrder: string[] = []
): SidebarGroup[] {
  const groupMap = new Map<string, SidebarEntry[]>()

  function getOrCreateGroup(label: string): SidebarEntry[] {
    // Normalize lookup: case-insensitive match against existing groups
    for (const [key, entries] of groupMap) {
      if (key.toLowerCase() === label.toLowerCase()) {
        return entries
      }
    }
    const entries: SidebarEntry[] = []
    groupMap.set(label, entries)
    return entries
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

  for (const doc of docs) {
    const segments = doc.slug.split("/")
    const item: SidebarItem = {
      type: "item",
      title: doc.meta.title ?? doc.slug,
      slug: doc.slug,
      order: doc.meta.order ?? 999,
    }

    if (segments.length === 1) {
      // Root-level file: use meta.group
      const groupLabel = doc.meta.group ?? "Docs"
      const entries = getOrCreateGroup(groupLabel)
      entries.push(item)
    } else {
      // Nested file: first segment = group, middle segments = subgroups
      const groupLabel = titleCase(segments[0])
      const entries = getOrCreateGroup(groupLabel)
      const fileName = segments[segments.length - 1]

      // Walk/create subgroups for middle segments
      let parent = entries
      let lastSub: SidebarSubgroup | null = null
      for (let i = 1; i < segments.length - 1; i++) {
        const sub = getOrCreateSubgroup(parent, segments[i])
        lastSub = sub
        parent = sub.items
      }

      // index files become the subgroup's own page rather than a child item
      if (fileName === "index" && lastSub) {
        lastSub.slug = item.slug
        if (item.order < lastSub.order) lastSub.order = item.order
        if (item.title !== item.slug) lastSub.label = item.title
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
  for (const [label, items] of groupMap) {
    sortEntries(items)
    sidebar.push({ label, items })
  }

  // Sort groups by groupOrder config
  if (groupOrder.length > 0) {
    sidebar.sort((a, b) => {
      const ai = groupOrder.indexOf(a.label)
      const bi = groupOrder.indexOf(b.label)
      const ao = ai === -1 ? Infinity : ai
      const bo = bi === -1 ? Infinity : bi
      return ao - bo
    })
  }

  return sidebar
}

export interface ResolvedSection {
  label: string
  path?: string
  href?: string
  children?: ResolvedSection[]
  sidebar?: SidebarGroup[]
}

export function buildSectionSidebars(
  docs: { slug: string; meta: DocMeta }[],
  sections: SectionConfig[],
  implicitLabel?: string
): ResolvedSection[] {
  const allSectionPaths = flattenSectionPaths(sections)
  const rootDocs = docs.filter(
    (d) => !allSectionPaths.some((p) => d.slug === p || d.slug.startsWith(p + "/"))
  )

  const result: ResolvedSection[] = []

  if (rootDocs.length > 0) {
    result.push({
      label: implicitLabel ?? "Docs",
      sidebar: buildSidebarTree(rootDocs),
    })
  }

  for (const section of sections) {
    result.push(resolveSection(docs, section))
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
  section: SectionConfig
): ResolvedSection {
  if (section.href) {
    return { label: section.label, href: section.href }
  }
  if (section.children) {
    return {
      label: section.label,
      children: section.children.map((c) => resolveSection(docs, c)),
    }
  }
  const sectionDocs = docs
    .filter((d) => d.slug === section.path || d.slug.startsWith(section.path + "/"))
    .map((d) => ({
      slug: d.slug.startsWith(section.path + "/")
        ? d.slug.slice(section.path!.length + 1)
        : d.slug.split("/").pop()!,
      meta: d.meta,
    }))

  return {
    label: section.label,
    path: section.path,
    sidebar: buildSidebarTree(sectionDocs),
  }
}

export function tiramisuPlugin(options: TiramisuPluginOptions = {}): Plugin {
  const docsDir = options.docsDir ?? "src/docs"
  const groupOrder = options.groupOrder ?? []
  let viteRoot = process.cwd()

  function resolveDocsDir(): string {
    return path.resolve(viteRoot, docsDir)
  }

  function findTiramisuFiles(dir: string): string[] {
    const results: string[] = []
    if (!fs.existsSync(dir)) return results

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...findTiramisuFiles(fullPath))
      } else if (entry.name.endsWith(".tiramisu")) {
        results.push(fullPath)
      }
    }
    return results
  }

  function buildVirtualModule(): string {
    const absDocsDir = resolveDocsDir()
    const files = findTiramisuFiles(absDocsDir)

    const docs: { slug: string; meta: DocMeta; headings: Heading[] }[] = []

    for (const file of files) {
      const source = fs.readFileSync(file, "utf-8")
      const { meta, headings } = compileTiramisu(source)
      const relativePath = path.relative(absDocsDir, file)
      const slug = relativePath.replace(/\.tiramisu$/, "").replace(/\\/g, "/")
      docs.push({ slug, meta, headings })
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
      const { svelte } = compileTiramisu(source)
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

    const sidebar = buildSidebarTree(docs, groupOrder)

    // Build dynamic imports — use .tiramisu.svelte suffix so resolveId maps them
    const importsEntries = docs
      .map((doc) => {
        const absPath = path
          .resolve(absDocsDir, doc.slug + ".tiramisu")
          .replace(/\\/g, "/")
        return `  "${doc.slug}": () => import("${absPath}")`
      })
      .join(",\n")

    return [
      `export const sidebar = ${JSON.stringify(sidebar, null, 2)};`,
      `export const docs = ${JSON.stringify(docs, null, 2)};`,
      `export const searchIndex = ${JSON.stringify(searchIndex)};`,
      `export const docImports = {\n${importsEntries}\n};`,
    ].join("\n\n")
  }

  return {
    name: "tiramisu-docs",
    enforce: "pre",

    configResolved(config: ResolvedConfig) {
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
        const { svelte } = compileTiramisu(source)
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
