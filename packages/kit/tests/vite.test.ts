import { describe, expect, it } from "bun:test"
import { tiramisuPlugin, buildSidebarTree, buildSectionSidebars, buildLocaleData } from "../src/vite"
import type { SidebarItem, SidebarSubgroup } from "../src/vite"

describe("tiramisuPlugin", () => {
  it("returns a Vite plugin object", () => {
    const plugin = tiramisuPlugin({ docsDir: "src/docs" })
    expect(plugin.name).toBe("tiramisu-docs")
  })

  it("has required hooks", () => {
    const plugin = tiramisuPlugin({ docsDir: "src/docs" })
    expect(typeof plugin.resolveId).toBe("function")
    expect(typeof plugin.load).toBe("function")
  })
})

describe("buildSidebarTree", () => {
  it("flat docs with meta.group produce flat groups (backward compat)", () => {
    const docs = [
      { slug: "intro", meta: { title: "Introduction", order: 1, group: "Getting Started" } },
      { slug: "install", meta: { title: "Installation", order: 2, group: "Getting Started" } },
      { slug: "basics", meta: { title: "Basics", order: 1, group: "Guide" } },
    ]
    const result = buildSidebarTree(docs)
    expect(result).toHaveLength(2)
    expect(result[0].label).toBe("Getting Started")
    expect(result[0].items).toHaveLength(2)
    expect(result[0].items[0].type).toBe("item")
    expect((result[0].items[0] as SidebarItem).title).toBe("Introduction")
    expect((result[0].items[1] as SidebarItem).title).toBe("Installation")
    expect(result[1].label).toBe("Guide")
  })

  it("folder-based grouping from nested files", () => {
    const docs = [
      { slug: "getting-started/index", meta: { title: "Introduction", order: 1 } },
      { slug: "getting-started/quick-start", meta: { title: "Quick Start", order: 2 } },
    ]
    const result = buildSidebarTree(docs)
    expect(result).toHaveLength(1)
    // Index page title becomes the group label; group has no slug
    expect(result[0].label).toBe("Introduction")
    expect(result[0]).not.toHaveProperty("slug")
    // Non-index files are direct items in the group
    expect(result[0].items).toHaveLength(1)
    expect((result[0].items[0] as SidebarItem).title).toBe("Quick Start")
  })

  it("nested subgroups from deep folder structure", () => {
    const docs = [
      { slug: "writing/markdown/math", meta: { title: "Math", order: 1 } },
      { slug: "writing/markdown/mermaid", meta: { title: "Mermaid", order: 2 } },
      { slug: "writing/page-meta", meta: { title: "Page Meta", order: 3 } },
    ]
    const result = buildSidebarTree(docs)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe("Writing")
    expect(result[0].items).toHaveLength(2)

    // Subgroup should come first (lower order from children)
    const subgroup = result[0].items[0] as SidebarSubgroup
    expect(subgroup.type).toBe("subgroup")
    expect(subgroup.label).toBe("Markdown")
    expect(subgroup.items).toHaveLength(2)
    expect((subgroup.items[0] as SidebarItem).title).toBe("Math")

    // Direct item
    const item = result[0].items[1] as SidebarItem
    expect(item.type).toBe("item")
    expect(item.title).toBe("Page Meta")
  })

  it("merges root file with meta.group into folder group (case-insensitive)", () => {
    const docs = [
      { slug: "page-conventions", meta: { title: "Page Conventions", order: 1, group: "Writing" } },
      { slug: "writing/page-meta", meta: { title: "Page Meta", order: 2 } },
    ]
    const result = buildSidebarTree(docs)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe("Writing")
    expect(result[0].items).toHaveLength(2)
    expect((result[0].items[0] as SidebarItem).title).toBe("Page Conventions")
    expect((result[0].items[1] as SidebarItem).title).toBe("Page Meta")
  })

  it("sorts by order at each level", () => {
    const docs = [
      { slug: "guide/z-last", meta: { title: "Last", order: 10 } },
      { slug: "guide/a-first", meta: { title: "First", order: 1 } },
    ]
    const result = buildSidebarTree(docs)
    expect((result[0].items[0] as SidebarItem).title).toBe("First")
    expect((result[0].items[1] as SidebarItem).title).toBe("Last")
  })

  it("respects groupOrder config", () => {
    const docs = [
      { slug: "alpha/page", meta: { title: "A Page", order: 1 } },
      { slug: "beta/page", meta: { title: "B Page", order: 1 } },
    ]
    const result = buildSidebarTree(docs, ["Beta", "Alpha"])
    expect(result[0].label).toBe("Beta")
    expect(result[1].label).toBe("Alpha")
  })

  it("propagates icon from meta to sidebar items", () => {
    const docs = [
      { slug: "intro", meta: { title: "Intro", order: 1, group: "Guide", icon: "book-open" } },
    ]
    const result = buildSidebarTree(docs)
    expect((result[0].items[0] as SidebarItem).icon).toBe("book-open")
  })

  it("propagates icon from folder index to group", () => {
    const docs = [
      { slug: "guide/index", meta: { title: "Guide", order: 1, icon: "compass" } },
      { slug: "guide/setup", meta: { title: "Setup", order: 2 } },
    ]
    const result = buildSidebarTree(docs)
    expect(result[0].icon).toBe("compass")
  })

  it("propagates icon from subfolder index to subgroup", () => {
    const docs = [
      { slug: "guide/advanced/index", meta: { title: "Advanced", order: 1, icon: "zap" } },
      { slug: "guide/advanced/tips", meta: { title: "Tips", order: 2 } },
    ]
    const result = buildSidebarTree(docs)
    const subgroup = result[0].items[0] as SidebarSubgroup
    expect(subgroup.icon).toBe("zap")
  })

  it("items without icon have undefined icon", () => {
    const docs = [
      { slug: "readme", meta: { title: "README" } },
    ]
    const result = buildSidebarTree(docs)
    expect((result[0].items[0] as SidebarItem).icon).toBeUndefined()
  })

  it("defaults root files without meta.group to 'Docs'", () => {
    const docs = [
      { slug: "readme", meta: { title: "README" } },
    ]
    const result = buildSidebarTree(docs)
    expect(result[0].label).toBe("Docs")
    expect(result[0].items).toHaveLength(1)
  })

  it("subgroup index becomes the subgroup slug and label", () => {
    const docs = [
      { slug: "guide/advanced/index", meta: { title: "Advanced Guide", order: 1 } },
      { slug: "guide/advanced/tips", meta: { title: "Tips", order: 2 } },
    ]
    const result = buildSidebarTree(docs)
    const subgroup = result[0].items[0] as SidebarSubgroup
    expect(subgroup.type).toBe("subgroup")
    expect(subgroup.slug).toBe("guide/advanced/index")
    expect(subgroup.label).toBe("Advanced Guide")
    expect(subgroup.order).toBe(1)
    expect(subgroup.items).toHaveLength(1)
    expect((subgroup.items[0] as SidebarItem).title).toBe("Tips")
  })
})

describe("buildSectionSidebars", () => {
  it("groups docs by section path", () => {
    const docs = [
      { slug: "guides/intro", meta: { title: "Intro", order: 1 } },
      { slug: "guides/advanced", meta: { title: "Advanced", order: 2 } },
      { slug: "api/endpoints", meta: { title: "Endpoints", order: 1 } },
    ]
    const sections = [
      { label: "Guides", path: "guides" },
      { label: "API", path: "api" },
    ]
    const result = buildSectionSidebars(docs, sections)
    expect(result).toHaveLength(2)
    expect(result[0].label).toBe("Guides")
    expect(result[0].sidebar).toHaveLength(1)
    expect(result[0].sidebar![0].items).toHaveLength(2)
    expect(result[1].label).toBe("API")
    expect(result[1].sidebar).toHaveLength(1)
  })

  it("root-level docs go into implicit section", () => {
    const docs = [
      { slug: "index", meta: { title: "Home", order: 1 } },
      { slug: "guides/intro", meta: { title: "Intro", order: 1 } },
    ]
    const sections = [{ label: "Guides", path: "guides" }]
    const result = buildSectionSidebars(docs, sections, "My Docs")
    expect(result[0].label).toBe("My Docs")
    expect(result[0].sidebar).toHaveLength(1)
    expect(result[1].label).toBe("Guides")
  })

  it("dropdown sections pass through with children sidebars", () => {
    const docs = [
      { slug: "api/endpoints", meta: { title: "Endpoints", order: 1 } },
      { slug: "cli/commands", meta: { title: "Commands", order: 1 } },
    ]
    const sections = [
      { label: "Reference", children: [
        { label: "API", path: "api" },
        { label: "CLI", path: "cli" },
      ]},
    ]
    const result = buildSectionSidebars(docs, sections)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe("Reference")
    expect(result[0].children).toHaveLength(2)
    expect(result[0].children![0].sidebar).toHaveLength(1)
    expect(result[0].children![1].sidebar).toHaveLength(1)
  })

  it("nested docs within a section preserve full hierarchy (no prefix stripping)", () => {
    const docs = [
      { slug: "writing/index", meta: { title: "Writing", order: 1 } },
      { slug: "writing/markup-basics", meta: { title: "Markup Basics", order: 2 } },
      { slug: "writing/content/index", meta: { title: "Content", order: 3 } },
      { slug: "writing/content/code-blocks", meta: { title: "Code Blocks", order: 4 } },
      { slug: "writing/page-meta", meta: { title: "Page Meta", order: 5 } },
    ]
    const sections = [{ label: "Writing", path: "writing" }]
    const result = buildSectionSidebars(docs, sections)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe("Writing")

    const sidebar = result[0].sidebar!
    expect(sidebar).toHaveLength(1)

    const group = sidebar[0]
    expect(group.label).toBe("Writing")
    // Should have: Markup Basics (item), Content (subgroup), Page Meta (item)
    expect(group.items).toHaveLength(3)

    const markupBasics = group.items[0] as SidebarItem
    expect(markupBasics.type).toBe("item")
    expect(markupBasics.title).toBe("Markup Basics")
    expect(markupBasics.slug).toBe("writing/markup-basics")

    const contentSubgroup = group.items[1] as SidebarSubgroup
    expect(contentSubgroup.type).toBe("subgroup")
    expect(contentSubgroup.label).toBe("Content")
    expect(contentSubgroup.slug).toBe("writing/content/index")
    expect(contentSubgroup.items).toHaveLength(1)
    expect((contentSubgroup.items[0] as SidebarItem).slug).toBe("writing/content/code-blocks")

    const pageMeta = group.items[2] as SidebarItem
    expect(pageMeta.type).toBe("item")
    expect(pageMeta.title).toBe("Page Meta")
    expect(pageMeta.slug).toBe("writing/page-meta")
  })

  it("external href sections have no sidebar", () => {
    const docs: { slug: string; meta: any }[] = []
    const sections = [{ label: "Blog", href: "https://blog.example.com" }]
    const result = buildSectionSidebars(docs, sections)
    expect(result).toHaveLength(1)
    expect(result[0].href).toBe("https://blog.example.com")
    expect(result[0].sidebar).toBeUndefined()
  })
})

describe("buildLocaleData", () => {
  it("groups docs by locale prefix", () => {
    const allDocs = [
      { slug: "en/intro", meta: { title: "Intro" }, headings: [], lastEdited: "2026-03-01T00:00:00.000Z" },
      { slug: "en/guide", meta: { title: "Guide" }, headings: [], lastEdited: "2026-03-01T00:00:00.000Z" },
      { slug: "fr/intro", meta: { title: "Introduction" }, headings: [], lastEdited: "2026-03-01T00:00:00.000Z" },
    ]
    const locales = [
      { code: "en", label: "English" },
      { code: "fr", label: "Français" },
    ]
    const result = buildLocaleData(allDocs, locales)
    expect(result.en.docs).toHaveLength(2)
    expect(result.en.docs[0].slug).toBe("intro")
    expect(result.fr.docs).toHaveLength(1)
  })
})
