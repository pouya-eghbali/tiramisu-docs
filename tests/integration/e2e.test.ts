import { describe, expect, it } from "bun:test"
import { generateProjectFiles } from "../../packages/create-tiramisu-docs/src/scaffold"
import { compileTiramisu } from "../../packages/core/src/compiler"

describe("end-to-end", () => {
  it("scaffolded project has valid tiramisu files that compile", () => {
    const files = generateProjectFiles({ name: "test-docs", sections: false, i18n: false, defaultLocale: "en", locales: [] })
    const tiramisuFiles = files.filter(f => f.path.endsWith(".tiramisu"))

    expect(tiramisuFiles.length).toBeGreaterThan(0)

    for (const file of tiramisuFiles) {
      const result = compileTiramisu(file.content)
      expect(result.svelte).toBeTruthy()
      expect(result.meta.title).toBeTruthy()
    }
  })

  it("compiles a complex doc with custom components", () => {
    const source = `meta { title = API Reference, order = 1, group = API }

h1 { API Reference }

This page uses a custom component:

chart { type = bar, data = [1, 2, 3] }

And a callout { type = warning, Be careful with this API. }
`
    const result = compileTiramisu(source)
    expect(result.meta.title).toBe("API Reference")
    expect(result.svelte).toContain("Chart")
    expect(result.svelte).toContain("import Chart from")
    expect(result.headings).toHaveLength(1)
  })

  it("compiles nested functions correctly", () => {
    const source = `h2 { bold { Important } heading }`
    const result = compileTiramisu(source)
    expect(result.svelte).toContain("<h2")
    expect(result.svelte).toContain("<strong>")
    expect(result.headings).toHaveLength(1)
  })

  it("handles multiple paragraphs", () => {
    const source = `First paragraph.

Second paragraph.

Third paragraph.`
    const result = compileTiramisu(source)
    // Should have 3 <p> tags
    const pCount = (result.svelte.match(/<p>/g) || []).length
    expect(pCount).toBe(3)
  })
})
