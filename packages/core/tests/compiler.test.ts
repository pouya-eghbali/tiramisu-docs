import { describe, expect, it } from "bun:test"
import { compileTiramisu } from "../src/compiler"

describe("compileTiramisu", () => {
  it("compiles plain text to paragraphs", () => {
    const result = compileTiramisu("Hello world")
    expect(result.svelte).toContain("<p>Hello world</p>")
  })

  it("compiles bold and italic", () => {
    const result = compileTiramisu("This is bold { important } text.")
    expect(result.svelte).toContain("<strong>important</strong>")
  })

  it("compiles headings", () => {
    const result = compileTiramisu("h1 { Hello }")
    expect(result.svelte).toContain("<h1")
    expect(result.svelte).toContain("Hello")
    expect(result.headings).toHaveLength(1)
    expect(result.headings[0].level).toBe(1)
  })

  it("compiles code blocks", () => {
    const result = compileTiramisu('codeblock { language = python, "def hello(): pass" }')
    expect(result.svelte).toContain("<pre")
    expect(result.svelte).toContain("python")
  })

  it("compiles links", () => {
    const result = compileTiramisu("link { url = https://example.com, Click here }")
    expect(result.svelte).toContain('href="https://example.com"')
    expect(result.svelte).toContain("Click here")
  })

  it("compiles lists", () => {
    const result = compileTiramisu("list { one, two, three }")
    expect(result.svelte).toContain("<ul>")
    expect(result.svelte).toContain("<li>")
  })

  it("compiles ordered lists", () => {
    const result = compileTiramisu("list { type = ordered, one, two, three }")
    expect(result.svelte).toContain("<ol>")
  })

  it("compiles tables", () => {
    const result = compileTiramisu("table { row = [ A, B ], row = [ 1, 2 ] }")
    expect(result.svelte).toContain("<table>")
    expect(result.svelte).toContain("<th>")
    expect(result.svelte).toContain("<td>")
  })

  it("extracts meta and excludes from output", () => {
    const result = compileTiramisu("meta { title = Test }\n\nHello")
    expect(result.meta.title).toBe("Test")
    expect(result.svelte).not.toContain("meta")
    expect(result.svelte).toContain("Hello")
  })

  it("generates imports for unknown functions (custom components)", () => {
    const result = compileTiramisu("chart { type = bar }")
    expect(result.svelte).toContain("import Chart from")
    expect(result.svelte).toContain("<Chart")
  })
})
