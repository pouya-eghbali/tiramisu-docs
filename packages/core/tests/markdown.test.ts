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
})
