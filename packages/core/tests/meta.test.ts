import { describe, expect, it } from "bun:test"
import { extractMeta } from "../src/meta"
import { compile } from "@timeleap/tiramisu"

describe("extractMeta", () => {
  it("extracts meta from a tiramisu AST", () => {
    const ast = compile("meta { title = Getting Started, order = 1, group = Basics }\n\nHello world")
    const { meta, contentNodes } = extractMeta(ast)
    expect(meta.title).toBe("Getting Started")
    expect(meta.order).toBe(1)
    expect(meta.group).toBe("Basics")
    expect(contentNodes.length).toBeGreaterThan(0)
  })

  it("extracts description from meta block", () => {
    const ast = compile("meta { title = My Page, description = A helpful guide }\n\nContent here")
    const { meta } = extractMeta(ast)
    expect(meta.description).toBe("A helpful guide")
  })

  it("returns empty meta when no meta block", () => {
    const ast = compile("Hello world")
    const { meta, contentNodes } = extractMeta(ast)
    expect(meta.title).toBeUndefined()
    expect(contentNodes.length).toBeGreaterThan(0)
  })
})
