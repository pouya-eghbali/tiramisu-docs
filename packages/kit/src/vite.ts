import { compileTiramisu } from "@tiramisu-docs/core"
import type { DocMeta, Heading } from "@tiramisu-docs/core"
import fs from "node:fs"
import path from "node:path"
import type { Plugin, ResolvedConfig, HmrContext } from "vite"

export interface TiramisuPluginOptions {
  docsDir?: string
  componentsDir?: string
}

interface SidebarItem {
  title: string
  slug: string
  order: number
}

interface SidebarGroup {
  label: string
  items: SidebarItem[]
}

const VIRTUAL_MODULE_ID = "virtual:tiramisu-docs"
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID

export function tiramisuPlugin(options: TiramisuPluginOptions = {}): Plugin {
  const docsDir = options.docsDir ?? "src/docs"
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

    // Build sidebar groups
    const groupMap = new Map<string, SidebarItem[]>()

    for (const doc of docs) {
      const groupLabel = doc.meta.group ?? "Docs"
      if (!groupMap.has(groupLabel)) {
        groupMap.set(groupLabel, [])
      }
      groupMap.get(groupLabel)!.push({
        title: doc.meta.title ?? doc.slug,
        slug: doc.slug,
        order: doc.meta.order ?? 999,
      })
    }

    // Sort items within each group by order
    const sidebar: SidebarGroup[] = []
    for (const [label, items] of groupMap) {
      items.sort((a, b) => a.order - b.order)
      sidebar.push({ label, items })
    }

    // Build dynamic imports map
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
      // Let .tiramisu files resolve normally (they exist on disk)
      return undefined
    },

    load(id: string) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return buildVirtualModule()
      }

      // Compile .tiramisu files to Svelte
      if (id.endsWith(".tiramisu")) {
        const filePath = id.startsWith("\0") ? id.slice(1) : id
        if (!fs.existsSync(filePath)) return undefined

        const source = fs.readFileSync(filePath, "utf-8")
        const { svelte } = compileTiramisu(source)
        return svelte
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

        // Trigger full reload since .tiramisu content changed
        ctx.server.ws.send({ type: "full-reload" })
        return []
      }
    },
  }
}
