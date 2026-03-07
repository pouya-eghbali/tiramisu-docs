import { describe, expect, it } from "bun:test"
import { defineConfig, resolveConfig } from "../src/config"

describe("defineConfig", () => {
  it("returns the config as-is (type helper)", () => {
    const config = defineConfig({ title: "Test" })
    expect(config.title).toBe("Test")
  })
})

describe("resolveConfig", () => {
  it("fills in defaults", () => {
    const config = resolveConfig({})
    expect(config.title).toBe("Documentation")
    expect(config.sidebar.groupOrder).toEqual([])
  })

  it("resolves sections config", () => {
    const config = resolveConfig({
      sections: [
        { label: "Guides", path: "guides" },
        { label: "Reference", children: [
          { label: "API", path: "api" },
          { label: "CLI", path: "cli" },
        ]},
        { label: "Blog", href: "https://blog.example.com" },
      ],
    })
    expect(config.sections).toHaveLength(3)
    expect(config.sections![0].label).toBe("Guides")
    expect(config.sections![1].children).toHaveLength(2)
    expect(config.sections![2].href).toBe("https://blog.example.com")
  })

  it("resolves undefined sections as undefined", () => {
    const config = resolveConfig({})
    expect(config.sections).toBeUndefined()
  })
})
