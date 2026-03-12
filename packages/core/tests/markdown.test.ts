import { describe, expect, it } from "bun:test"
import { toMarkdown } from "../src/markdown"

describe("toMarkdown", () => {
  it("converts meta title to h1", () => {
    const md = toMarkdown("meta { title = Getting Started }\n\nHello world")
    expect(md).toStartWith("# Getting Started\n")
    expect(md).toContain("Hello world")
  })

  it("converts headings", () => {
    const md = toMarkdown("h2 { Features }\n\nh3 { Sub Feature }")
    expect(md).toContain("## Features")
    expect(md).toContain("### Sub Feature")
  })

  it("converts inline formatting", () => {
    const md = toMarkdown("This has bold { strong } and italic { emphasis } and code { snippet } text.")
    expect(md).toContain("**strong**")
    expect(md).toContain("*emphasis*")
    expect(md).toContain("`snippet`")
  })

  it("converts links", () => {
    const md = toMarkdown("Visit link { url = https://example.com, Example Site } for more.")
    expect(md).toContain("[Example Site](https://example.com)")
  })

  it("converts code blocks", () => {
    const md = toMarkdown('codeblock { language = typescript, "const x = 1" }')
    expect(md).toContain("```typescript\nconst x = 1\n```")
  })

  it("converts lists", () => {
    const md = toMarkdown("list { item { First }, item { Second } }")
    expect(md).toContain("- First")
    expect(md).toContain("- Second")
  })

  it("converts callouts as blockquotes", () => {
    const md = toMarkdown("callout { type = warning, Be careful with this. }")
    expect(md).toContain("> **Warning:** Be careful with this.")
  })

  it("converts images", () => {
    const md = toMarkdown('image { src = /photo.png, alt = A photo }')
    expect(md).toContain("![A photo](/photo.png)")
  })

  it("converts blockquotes", () => {
    const md = toMarkdown("blockquote { To be or not to be. }")
    expect(md).toContain("> To be or not to be.")
  })

  it("handles unknown functions as plain text", () => {
    const md = toMarkdown("badge { type = info, Beta }")
    expect(md).toContain("Beta")
  })

  it("separates paragraphs with blank lines", () => {
    const md = toMarkdown("First paragraph.\n\nSecond paragraph.")
    expect(md).toContain("First paragraph.\n\nSecond paragraph.")
  })

  it("emits meta description after h1", () => {
    const md = toMarkdown("meta { title = My Page, description = A brief intro. }\n\nContent here.")
    expect(md).toStartWith("# My Page\n\n")
    expect(md).toContain("A brief intro.")
    // description should come before content
    const descIdx = md.indexOf("A brief intro.")
    const contentIdx = md.indexOf("Content here.")
    expect(descIdx).toBeLessThan(contentIdx)
  })

  it("converts tables to GFM", () => {
    const md = toMarkdown("table { row { cell { Name }, cell { Age } }, row { cell { Alice }, cell { 30 } } }")
    expect(md).toContain("| Name | Age |")
    expect(md).toContain("| --- | --- |")
    expect(md).toContain("| Alice | 30 |")
  })

  it("converts tabs to headings", () => {
    const md = toMarkdown("tabs { tab { label = npm, npm install foo }, tab { label = bun, bun add foo } }")
    expect(md).toContain("#### npm")
    expect(md).toContain("npm install foo")
    expect(md).toContain("#### bun")
    expect(md).toContain("bun add foo")
  })

  it("converts steps to numbered list with bold title", () => {
    const md = toMarkdown("steps { step { title = Install, Run the installer. }, step { title = Configure, Edit the config. } }")
    expect(md).toContain("1. **Install** Run the installer.")
    expect(md).toContain("2. **Configure** Edit the config.")
  })

  it("converts cards to bullet list", () => {
    const md = toMarkdown('cards { card { title = Docs, description = Read the docs, href = /docs } }')
    expect(md).toContain("- **Docs**")
    expect(md).toContain("Read the docs")
    expect(md).toContain("[→](/docs)")
  })

  it("converts codetabs to labeled fenced code blocks", () => {
    const md = toMarkdown('codetabs { codetab { label = JS, language = js, "const x = 1" }, codetab { label = TS, language = ts, "const x: number = 1" } }')
    expect(md).toContain("**JS**")
    expect(md).toContain("```js\nconst x = 1\n```")
    expect(md).toContain("**TS**")
    expect(md).toContain("```ts\nconst x: number = 1\n```")
  })
})
