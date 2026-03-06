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
})
