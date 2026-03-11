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
    expect(result.svelte).toContain("<CodeBlock")
    expect(result.svelte).toContain('language="python"')
    expect(result.svelte).toContain('const __code_0 = "def hello(): pass"')
    expect(result.svelte).toContain("code={__code_0}")
    expect(result.svelte).toContain('import { CodeBlock } from "$lib/components"')
  })

  it("imports custom components from $lib/components/tiramisu", () => {
    const result = compileTiramisu("MyWidget { hello = world, content }")
    expect(result.svelte).toContain('import MyWidget from "$lib/components/tiramisu/MyWidget.svelte"')
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

  it("compiles quote with author", () => {
    const result = compileTiramisu("quote { Some wise words, author = Someone Famous }")
    expect(result.svelte).toContain("<blockquote>")
    expect(result.svelte).toContain("Some wise words")
    expect(result.svelte).toContain("<cite>")
    expect(result.svelte).toContain("Someone Famous")
  })

  it("compiles quote without author", () => {
    const result = compileTiramisu("quote { Just a quote }")
    expect(result.svelte).toContain("<blockquote>")
    expect(result.svelte).not.toContain("<cite>")
  })

  it("compiles tasklist with checked and unchecked items", () => {
    const result = compileTiramisu('tasklist { "[x] Done", "[ ] Todo" }')
    expect(result.svelte).toContain('class="task-list"')
    expect(result.svelte).toContain('class="task-checkbox checked"')
    expect(result.svelte).toContain('class="task-checkbox"')
    expect(result.svelte).toContain("Done")
    expect(result.svelte).toContain("Todo")
  })

  it("compiles columns layout", () => {
    const result = compileTiramisu("columns { col { First column }, col { Second column } }")
    expect(result.svelte).toContain('class="columns"')
    expect(result.svelte).toContain('class="column"')
    expect(result.svelte).toContain("First column")
    expect(result.svelte).toContain("Second column")
  })

  it("compiles accordion", () => {
    const result = compileTiramisu("accordion { title = FAQ, Some answer }")
    expect(result.svelte).toContain("<Accordion")
    expect(result.svelte).toContain('title="FAQ"')
    expect(result.svelte).toContain("Some answer")
    expect(result.svelte).toContain('import { Accordion } from "$lib/components"')
  })

  it("compiles cards grid", () => {
    const result = compileTiramisu(
      "cards { card { title = Start, description = Begin here, href = /start } }"
    )
    expect(result.svelte).toContain('class="cards-grid"')
    expect(result.svelte).toContain("<NavCard")
    expect(result.svelte).toContain('title="Start"')
    expect(result.svelte).toContain('href="/start"')
    expect(result.svelte).toContain('import { NavCard } from "$lib/components"')
  })

  it("compiles filetree", () => {
    const result = compileTiramisu("filetree { file { app.ts }, folder { src, file { index.ts } } }")
    expect(result.svelte).toContain("<FileTree>")
    expect(result.svelte).toContain('class="tree-file"')
    expect(result.svelte).toContain('class="tree-folder"')
    expect(result.svelte).toContain('import { FileTree } from "$lib/components"')
  })

  it("compiles image with ZoomImage", () => {
    const result = compileTiramisu('image { src = /img.png, alt = A photo }')
    expect(result.svelte).toContain("<ZoomImage")
    expect(result.svelte).toContain('src="/img.png"')
    expect(result.svelte).toContain('import { ZoomImage } from "$lib/components"')
  })

  it("compiles math block", () => {
    const result = compileTiramisu("math { E = mc^2 }")
    expect(result.svelte).toContain("<MathBlock")
    expect(result.svelte).toContain('import { MathBlock } from "$lib/components"')
    expect(result.svelte).toContain("__math_")
  })

  it("compiles mermaid diagram", () => {
    const result = compileTiramisu('mermaid { """graph TD; A-->B""" }')
    expect(result.svelte).toContain("<Mermaid")
    expect(result.svelte).toContain('import { Mermaid } from "$lib/components"')
    expect(result.svelte).toContain("__mermaid_")
  })
})
