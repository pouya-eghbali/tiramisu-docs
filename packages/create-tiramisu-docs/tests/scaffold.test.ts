import { describe, expect, it } from "bun:test"
import { generateProjectFiles } from "../src/scaffold"

describe("generateProjectFiles", () => {
  it("generates the expected file list", () => {
    const files = generateProjectFiles({ name: "my-docs", theme: "default" })
    const paths = files.map(f => f.path)

    expect(paths).toContain("package.json")
    expect(paths).toContain("svelte.config.js")
    expect(paths).toContain("vite.config.ts")
    expect(paths).toContain("src/tiramisu.config.ts")
    expect(paths).toContain("src/docs/index.tiramisu")
    expect(paths).toContain("src/docs/getting-started.tiramisu")
    expect(paths).toContain("src/app.html")
  })

  it("includes project name in package.json", () => {
    const files = generateProjectFiles({ name: "my-docs", theme: "default" })
    const pkg = files.find(f => f.path === "package.json")!
    expect(pkg.content).toContain('"my-docs"')
  })
})
