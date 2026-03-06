import { describe, expect, it } from "bun:test"
import { tiramisuPlugin } from "../src/vite"

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
