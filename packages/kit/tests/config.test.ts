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

  it("resolves i18n config", () => {
    const config = resolveConfig({
      i18n: {
        defaultLocale: "en",
        locales: [
          { code: "en", label: "English", flag: "🇺🇸" },
          { code: "fr", label: "Français", flag: "🇫🇷" },
        ],
      },
    })
    expect(config.i18n).toBeDefined()
    expect(config.i18n!.defaultLocale).toBe("en")
    expect(config.i18n!.locales).toHaveLength(2)
    expect(config.i18n!.fallback).toBe("default-language")
  })

  it("resolves undefined i18n as undefined", () => {
    const config = resolveConfig({})
    expect(config.i18n).toBeUndefined()
  })
})
