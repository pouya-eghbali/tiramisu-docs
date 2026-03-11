import { describe, expect, it } from "bun:test"
import { scanDocs, extractPlainText, titleCase, findTiramisuFiles } from "../src/scan"
import path from "node:path"

const playgroundDocs = path.resolve(__dirname, "../../../playground/src/docs")

describe("extractPlainText", () => {
  it("strips HTML tags", () => {
    expect(extractPlainText("<p>Hello <strong>world</strong></p>")).toBe("Hello world")
  })

  it("decodes entities", () => {
    expect(extractPlainText("&amp; &lt; &gt; &quot;")).toBe('& < > "')
  })

  it("removes script tags entirely", () => {
    expect(extractPlainText('<script>var x = 1;</script><p>text</p>')).toBe("text")
  })
})

describe("titleCase", () => {
  it("converts slug to title case", () => {
    expect(titleCase("getting-started")).toBe("Getting Started")
  })
})

describe("findTiramisuFiles", () => {
  it("returns empty for nonexistent dir", () => {
    expect(findTiramisuFiles("/nonexistent/path")).toEqual([])
  })
})

describe("scanDocs", () => {
  it("scans playground docs and returns docs + searchIndex", () => {
    const { docs, searchIndex } = scanDocs(playgroundDocs)
    expect(docs.length).toBeGreaterThan(0)
    expect(searchIndex.length).toBe(docs.length)
    for (const doc of docs) {
      expect(doc.slug).toBeDefined()
      expect(doc.meta).toBeDefined()
      expect(doc.headings).toBeDefined()
    }
    for (const entry of searchIndex) {
      expect(entry.title).toBeDefined()
      expect(entry.text.length).toBeGreaterThan(0)
    }
  })
})
