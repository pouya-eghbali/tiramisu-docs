import { describe, expect, it } from "bun:test"
import { generateProjectFiles } from "../src/scaffold"

const baseOptions = { name: "my-docs", sections: false, i18n: false, defaultLocale: "en", locales: [] as { code: string; label: string }[] }

describe("generateProjectFiles", () => {
  it("generates the expected file list (flat mode)", () => {
    const files = generateProjectFiles(baseOptions)
    const paths = files.map(f => f.path)

    expect(paths).toContain("package.json")
    expect(paths).toContain("svelte.config.js")
    expect(paths).toContain("vite.config.ts")
    expect(paths).toContain("src/lib/tiramisu.config.ts")
    expect(paths).toContain("src/docs/index.tiramisu")
    expect(paths).toContain("src/docs/getting-started.tiramisu")
    expect(paths).toContain("src/app.html")
    expect(paths).not.toContain("src/docs/api/index.tiramisu")
  })

  it("includes project name in package.json", () => {
    const files = generateProjectFiles(baseOptions)
    const pkg = files.find(f => f.path === "package.json")!
    expect(pkg.content).toContain('"my-docs"')
  })

  it("generates section folders when sections enabled", () => {
    const files = generateProjectFiles({ ...baseOptions, sections: true })
    const paths = files.map(f => f.path)

    expect(paths).toContain("src/docs/guide/index.tiramisu")
    expect(paths).toContain("src/docs/guide/getting-started.tiramisu")
    expect(paths).toContain("src/docs/api/index.tiramisu")
    expect(paths).not.toContain("src/docs/index.tiramisu")
  })

  it("generates locale folders when i18n enabled", () => {
    const files = generateProjectFiles({ ...baseOptions, i18n: true, defaultLocale: "en", locales: [{ code: "en", label: "English" }] })
    const paths = files.map(f => f.path)

    expect(paths).toContain("src/docs/en/index.tiramisu")
    expect(paths).toContain("src/docs/en/getting-started.tiramisu")
    expect(paths).not.toContain("src/docs/index.tiramisu")
  })

  it("generates both section and locale folders when both enabled", () => {
    const files = generateProjectFiles({ ...baseOptions, sections: true, i18n: true, defaultLocale: "en", locales: [{ code: "en", label: "English" }] })
    const paths = files.map(f => f.path)

    expect(paths).toContain("src/docs/en/guide/index.tiramisu")
    expect(paths).toContain("src/docs/en/guide/getting-started.tiramisu")
    expect(paths).toContain("src/docs/en/api/index.tiramisu")
  })

  it("includes sections config in tiramisu.config when sections enabled", () => {
    const files = generateProjectFiles({ ...baseOptions, sections: true })
    const cfg = files.find(f => f.path === "src/lib/tiramisu.config.ts")!
    expect(cfg.content).toContain("sections:")
  })

  it("includes i18n config in tiramisu.config when i18n enabled", () => {
    const files = generateProjectFiles({ ...baseOptions, i18n: true, defaultLocale: "en", locales: [{ code: "en", label: "English" }] })
    const cfg = files.find(f => f.path === "src/lib/tiramisu.config.ts")!
    expect(cfg.content).toContain("i18n:")
    expect(cfg.content).toContain("defaultLocale")
  })

  it("generates error page", () => {
    const files = generateProjectFiles(baseOptions)
    const paths = files.map(f => f.path)
    expect(paths).toContain("src/routes/+error.svelte")
    const errorPage = files.find(f => f.path === "src/routes/+error.svelte")!
    expect(errorPage.content).toContain("$page.status")
    expect(errorPage.content).toContain("$page.error")
  })

  it("generates full-featured +page.ts with redirect support", () => {
    const files = generateProjectFiles(baseOptions)
    const pageTs = files.find(f => f.path === "src/routes/docs/[...slug]/+page.ts")!
    expect(pageTs.content).toContain("redirect")
    expect(pageTs.content).toContain("findActiveSectionSidebar")
  })

  it("generates SEO route files", () => {
    const files = generateProjectFiles(baseOptions)
    const paths = files.map(f => f.path)

    expect(paths).toContain("src/routes/sitemap.xml/+server.ts")
    expect(paths).toContain("src/routes/llms.txt/+server.ts")
    expect(paths).toContain("src/routes/llms-full.txt/+server.ts")
    expect(paths).toContain("src/routes/skill.md/+server.ts")
  })

  it("sitemap route has prerender enabled", () => {
    const files = generateProjectFiles(baseOptions)
    const sitemap = files.find(f => f.path === "src/routes/sitemap.xml/+server.ts")!
    expect(sitemap.content).toContain("export const prerender = true")
    expect(sitemap.content).toContain("generateSitemap")
  })

  it("generates mcp route when mcp option is true", () => {
    const files = generateProjectFiles({ ...baseOptions, mcp: true })
    const mcp = files.find(f => f.path === "src/routes/mcp/+server.ts")!
    expect(mcp).toBeDefined()
    expect(mcp.content).toContain("handleMcpRequest")
  })

  it("omits mcp route when mcp option is false", () => {
    const files = generateProjectFiles(baseOptions)
    const mcp = files.find(f => f.path === "src/routes/mcp/+server.ts")
    expect(mcp).toBeUndefined()
  })

  it("includes commented url hint in tiramisu config", () => {
    const files = generateProjectFiles(baseOptions)
    const config = files.find(f => f.path === "src/lib/tiramisu.config.ts")!
    expect(config.content).toContain('// url: "https://example.com"')
  })

  it("passes slug and baseUrl to DocPage", () => {
    const files = generateProjectFiles(baseOptions)
    const page = files.find(f => f.path === "src/routes/docs/[...slug]/+page.svelte")!
    expect(page.content).toContain("slug={data.slug}")
    expect(page.content).toContain("baseUrl={resolved.url}")
  })

  it("generates OpenDropdown component", () => {
    const files = generateProjectFiles(baseOptions)
    const paths = files.map(f => f.path)
    expect(paths).toContain("src/lib/components/OpenDropdown.svelte")
    const dropdown = files.find(f => f.path === "src/lib/components/OpenDropdown.svelte")!
    expect(dropdown.content).toContain("DropdownMenu")
  })

  it("generates utils.ts with cn helper", () => {
    const files = generateProjectFiles(baseOptions)
    const utils = files.find(f => f.path === "src/lib/utils.ts")!
    expect(utils.content).toContain("export function cn")
  })

  it("generates components.json for shadcn-svelte", () => {
    const files = generateProjectFiles(baseOptions)
    const cj = files.find(f => f.path === "components.json")!
    expect(cj.content).toContain("shadcn-svelte")
  })

  it("page.svelte imports OpenDropdown and getOpenLinks", () => {
    const files = generateProjectFiles(baseOptions)
    const page = files.find(f => f.path === "src/routes/docs/[...slug]/+page.svelte")!
    expect(page.content).toContain("OpenDropdown")
    expect(page.content).toContain("getOpenLinks")
    expect(page.content).toContain("headerActions")
  })

  it("page.ts includes lastEdited in return data", () => {
    const files = generateProjectFiles(baseOptions)
    const pageTs = files.find(f => f.path === "src/routes/docs/[...slug]/+page.ts")!
    expect(pageTs.content).toContain("lastEdited")
  })

  it("package.json includes bits-ui dependency", () => {
    const files = generateProjectFiles(baseOptions)
    const pkg = files.find(f => f.path === "package.json")!
    expect(pkg.content).toContain("bits-ui")
    expect(pkg.content).toContain("clsx")
    expect(pkg.content).toContain("tailwind-merge")
  })

  it("generates custom UI components (collapsible, sheet, scroll-area)", () => {
    const files = generateProjectFiles(baseOptions)
    const paths = files.map(f => f.path)

    expect(paths).toContain("src/lib/components/ui/collapsible/collapsible.svelte")
    expect(paths).toContain("src/lib/components/ui/collapsible/index.ts")
    expect(paths).toContain("src/lib/components/ui/sheet/sheet.svelte")
    expect(paths).toContain("src/lib/components/ui/sheet/sheet-content.svelte")
    expect(paths).toContain("src/lib/components/ui/sheet/sheet-trigger.svelte")
    expect(paths).toContain("src/lib/components/ui/sheet/index.ts")
    expect(paths).toContain("src/lib/components/ui/scroll-area/scroll-area.svelte")
    expect(paths).toContain("src/lib/components/ui/scroll-area/index.ts")
  })

  it("custom components use $lib/utils imports", () => {
    const files = generateProjectFiles(baseOptions)
    const customComponents = files.filter(f =>
      f.path.includes("collapsible/collapsible.svelte") ||
      f.path.includes("sheet/sheet-content.svelte") ||
      f.path.includes("scroll-area/scroll-area.svelte")
    )

    for (const file of customComponents) {
      expect(file.content).toContain('$lib/utils.js')
    }
  })
})
