# Tiramisu Docs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a documentation generator that compiles `.tiramisu` files into a SvelteKit 5 docs site with shadcn-svelte components.

**Architecture:** Bun workspace monorepo with 3 packages: `create-tiramisu-docs` (CLI scaffolder), `@tiramisu-docs/core` (AST → Svelte compiler), `@tiramisu-docs/kit` (Vite plugin + layouts + theme). The existing `@timeleap/tiramisu` parser is consumed as a dependency.

**Tech Stack:** SvelteKit 5, Svelte 5, shadcn-svelte, Tailwind CSS v4, Vite, TypeScript, Bun

**Design doc:** `docs/plans/2026-03-06-tiramisu-docs-design.md`

---

### Task 1: Monorepo Setup

**Files:**
- Create: `package.json` (workspace root)
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/kit/package.json`
- Create: `packages/kit/tsconfig.json`
- Create: `packages/kit/src/index.ts`
- Create: `packages/create-tiramisu-docs/package.json`
- Create: `packages/create-tiramisu-docs/tsconfig.json`
- Create: `packages/create-tiramisu-docs/src/index.ts`

**Step 1: Create workspace root package.json**

```json
{
  "name": "tiramisu-docs-monorepo",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "build": "bun run --filter '*' build",
    "test": "bun run --filter '*' test"
  }
}
```

**Step 2: Create `packages/core/package.json`**

```json
{
  "name": "@tiramisu-docs/core",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "bun test"
  },
  "dependencies": {
    "@timeleap/tiramisu": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.12.11"
  }
}
```

**Step 3: Create `packages/kit/package.json`**

```json
{
  "name": "@tiramisu-docs/kit",
  "version": "0.1.0",
  "type": "module",
  "svelte": "src/index.ts",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "svelte": "./src/index.ts",
      "default": "./dist/index.js"
    },
    "./vite": {
      "types": "./dist/vite.d.ts",
      "default": "./dist/vite.js"
    },
    "./components/*": {
      "svelte": "./src/lib/components/*"
    }
  },
  "scripts": {
    "build": "tsc",
    "test": "bun test"
  },
  "dependencies": {
    "@tiramisu-docs/core": "workspace:*",
    "@timeleap/tiramisu": "^1.6.0"
  },
  "peerDependencies": {
    "@sveltejs/kit": "^2.0.0",
    "svelte": "^5.0.0",
    "vite": "^6.0.0"
  },
  "devDependencies": {
    "svelte": "^5.0.0",
    "@sveltejs/kit": "^2.0.0",
    "vite": "^6.0.0",
    "typescript": "^5.4.5",
    "@types/node": "^20.12.11"
  }
}
```

**Step 4: Create `packages/create-tiramisu-docs/package.json`**

```json
{
  "name": "create-tiramisu-docs",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "create-tiramisu-docs": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "bun test"
  },
  "dependencies": {
    "@clack/prompts": "^0.9.0"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/node": "^20.12.11"
  }
}
```

**Step 5: Create tsconfig.json for each package**

Each package gets a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Step 6: Create placeholder `src/index.ts` for each package**

Each gets a minimal `export {}` placeholder.

**Step 7: Run `bun install` at workspace root**

```bash
cd /Users/pouya/Projects/tiramisu-docs && bun install
```

Expected: Dependencies install, workspace links resolve.

**Step 8: Commit**

```bash
git init && git add -A && git commit -m "chore: initialize bun workspace monorepo with 3 packages"
```

---

### Task 2: Core — AST to Svelte Compiler (Meta Extraction)

**Files:**
- Create: `packages/core/src/meta.ts`
- Create: `packages/core/src/types.ts`
- Test: `packages/core/tests/meta.test.ts`

The core compiler needs to walk the tiramisu AST and extract `meta {}` frontmatter, then compile the rest to Svelte markup. Start with meta extraction.

**Step 1: Write the types**

Create `packages/core/src/types.ts`:

```ts
export interface DocMeta {
  title?: string
  description?: string
  order?: number
  group?: string
}

export interface CompileResult {
  meta: DocMeta
  svelte: string
  headings: Heading[]
}

export interface Heading {
  level: number
  text: string
  id: string
}
```

**Step 2: Write the failing test for meta extraction**

Create `packages/core/tests/meta.test.ts`:

```ts
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

  it("returns empty meta when no meta block", () => {
    const ast = compile("Hello world")
    const { meta, contentNodes } = extractMeta(ast)
    expect(meta.title).toBeUndefined()
    expect(contentNodes.length).toBeGreaterThan(0)
  })
})
```

**Step 3: Run test to verify it fails**

```bash
cd packages/core && bun test tests/meta.test.ts
```

Expected: FAIL — `extractMeta` not found.

**Step 4: Implement meta extraction**

Create `packages/core/src/meta.ts`:

```ts
import type { Node, FunctionCall, NamedParameter, Tiramisu } from "@timeleap/tiramisu"
import type { DocMeta } from "./types"

export interface MetaResult {
  meta: DocMeta
  contentNodes: Node[]
}

export function extractMeta(ast: Tiramisu): MetaResult {
  const meta: DocMeta = {}
  const contentNodes: Node[] = []

  for (const child of ast.children) {
    const metaCall = findMetaCall(child)
    if (metaCall) {
      for (const param of metaCall.parameters.parameters) {
        if (isNamedParameter(param)) {
          const name = param.name.trim()
          const value = Array.isArray(param.value)
            ? param.value.map(v => v.toString()).join("").trim()
            : param.value.toString().trim()

          switch (name) {
            case "title": meta.title = value; break
            case "description": meta.description = value; break
            case "order": meta.order = parseInt(value, 10); break
            case "group": meta.group = value; break
          }
        }
      }
    } else {
      contentNodes.push(child)
    }
  }

  return { meta, contentNodes }
}

function findMetaCall(node: Node): FunctionCall | null {
  if (isFunctionCall(node) && node.functionName === "meta") return node
  // Check inside paragraphs/mixed text
  if ("children" in node) {
    for (const child of (node as any).children) {
      const result = findMetaCall(child)
      if (result) return result
    }
  }
  if ("shards" in node && Array.isArray((node as any).shards)) {
    for (const shard of (node as any).shards) {
      if (typeof shard !== "string") {
        const result = findMetaCall(shard)
        if (result) return result
      }
    }
  }
  return null
}

function isFunctionCall(node: any): node is FunctionCall {
  return node?.constructor?.name === "FunctionCall"
}

function isNamedParameter(node: any): node is NamedParameter {
  return node?.constructor?.name === "NamedParameter"
}
```

**Step 5: Run test to verify it passes**

```bash
cd packages/core && bun test tests/meta.test.ts
```

Expected: PASS

**Step 6: Commit**

```bash
git add packages/core && git commit -m "feat(core): add meta extraction from tiramisu AST"
```

---

### Task 3: Core — AST to Svelte Markup Compiler

**Files:**
- Create: `packages/core/src/compiler.ts`
- Create: `packages/core/src/builtins.ts`
- Test: `packages/core/tests/compiler.test.ts`

This is the heart of the system — walks the AST and emits Svelte component source code.

**Step 1: Write the failing test**

Create `packages/core/tests/compiler.test.ts`:

```ts
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
    expect(result.svelte).toContain("<pre")
    expect(result.svelte).toContain("python")
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
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/core && bun test tests/compiler.test.ts
```

Expected: FAIL — `compileTiramisu` not found.

**Step 3: Implement the built-in function handlers**

Create `packages/core/src/builtins.ts`:

```ts
// Maps tiramisu function names to Svelte markup generators.
// Each handler receives the FunctionCall node and a recursive render function.

import type { Node } from "@timeleap/tiramisu"

export type RenderFn = (nodes: Node[]) => string
export type BuiltinHandler = (params: ParsedParams, render: RenderFn) => string

export interface ParsedParams {
  positional: Node[]
  named: Map<string, Node[] | { values: Node[] }>
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export const builtins: Record<string, BuiltinHandler> = {
  h1: headingHandler(1),
  h2: headingHandler(2),
  h3: headingHandler(3),
  h4: headingHandler(4),
  h5: headingHandler(5),
  h6: headingHandler(6),
  bold: (p, r) => `<strong>${r(p.positional)}</strong>`,
  italic: (p, r) => `<em>${r(p.positional)}</em>`,
  code: (p, r) => `<code>${r(p.positional)}</code>`,
  link: linkHandler,
  image: imageHandler,
  codeblock: codeblockHandler,
  list: listHandler,
  table: tableHandler,
  callout: calloutHandler,
  tabs: tabsHandler,
  steps: stepsHandler,
  badge: badgeHandler,
}

function headingHandler(level: number): BuiltinHandler {
  return (p, r) => {
    const text = r(p.positional)
    const id = slugify(text)
    return `<h${level} id="${id}"><a href="#{id}">${text}</a></h${level}>`
  }
}

function linkHandler(p: ParsedParams, r: RenderFn): string {
  const url = p.named.get("url")
  const href = url ? renderNodeValue(url, r) : r(p.positional)
  const text = url ? r(p.positional) : href
  return `<a href="${href.trim()}">${text.trim()}</a>`
}

function imageHandler(p: ParsedParams, r: RenderFn): string {
  const src = r(p.positional).trim()
  const alt = p.named.get("alt") ? renderNodeValue(p.named.get("alt")!, r).trim() : ""
  return `<img src="${src}" alt="${alt}" />`
}

function codeblockHandler(p: ParsedParams, r: RenderFn): string {
  const lang = p.named.get("language") ? renderNodeValue(p.named.get("language")!, r).trim() : ""
  const code = r(p.positional).trim()
  return `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`
}

function listHandler(p: ParsedParams, r: RenderFn): string {
  const type = p.named.get("type") ? renderNodeValue(p.named.get("type")!, r).trim() : "unordered"
  const tag = type === "ordered" ? "ol" : "ul"

  // Items can be named params (item = ...) or positional params
  const items: string[] = []
  const namedItems = p.named.get("item")
  if (namedItems) {
    // Multiple named "item" params get collected
    items.push(renderNodeValue(namedItems, r).trim())
  }
  for (const pos of p.positional) {
    items.push(pos.toString().trim())
  }

  // Handle multiple "item" named params by iterating all params
  return `<${tag}>\n${items.map(i => `  <li>${i}</li>`).join("\n")}\n</${tag}>`
}

function tableHandler(p: ParsedParams, r: RenderFn): string {
  // All rows come as named "row" params with ArrayValue
  // First row is header, rest are body
  const rows = getAllNamedArrays(p, "row", r)
  if (rows.length === 0) return "<table></table>"

  const [header, ...body] = rows
  let html = "<table>\n  <thead>\n    <tr>\n"
  html += header.map(cell => `      <th>${cell}</th>`).join("\n") + "\n"
  html += "    </tr>\n  </thead>\n  <tbody>\n"
  for (const row of body) {
    html += "    <tr>\n"
    html += row.map(cell => `      <td>${cell}</td>`).join("\n") + "\n"
    html += "    </tr>\n"
  }
  html += "  </tbody>\n</table>"
  return html
}

function calloutHandler(p: ParsedParams, r: RenderFn): string {
  const type = p.named.get("type") ? renderNodeValue(p.named.get("type")!, r).trim() : "info"
  const content = r(p.positional)
  return `<div class="callout callout-${type}" role="alert">\n  ${content}\n</div>`
}

function tabsHandler(p: ParsedParams, r: RenderFn): string {
  // TODO: Will be replaced with shadcn Tabs component in kit
  const content = r(p.positional)
  return `<div class="tabs">${content}</div>`
}

function stepsHandler(p: ParsedParams, r: RenderFn): string {
  const items: string[] = []
  for (const pos of p.positional) {
    items.push(pos.toString().trim())
  }
  return `<ol class="steps">\n${items.map((s, i) => `  <li class="step"><span class="step-number">${i + 1}</span>${s}</li>`).join("\n")}\n</ol>`
}

function badgeHandler(p: ParsedParams, r: RenderFn): string {
  const variant = p.named.get("variant") ? renderNodeValue(p.named.get("variant")!, r).trim() : "default"
  const text = r(p.positional).trim()
  return `<span class="badge badge-${variant}">${text}</span>`
}

function renderNodeValue(value: Node[] | { values: Node[] }, r: RenderFn): string {
  if (Array.isArray(value)) return r(value)
  return value.values.map(v => v.toString()).join(", ")
}

function getAllNamedArrays(p: ParsedParams, name: string, r: RenderFn): string[][] {
  // This needs special handling since tiramisu allows repeated named params
  // The caller should pre-collect these
  return p._allNamed?.get(name)?.map(arr => {
    if ("values" in arr) {
      return arr.values.map(v => v.toString().trim())
    }
    return [r(arr as any).trim()]
  }) ?? []
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
```

> **Note:** The builtins above are a starting point. The exact implementation will need refinement based on testing — especially how tiramisu's AST represents repeated named parameters (like multiple `row = [...]` in tables and multiple `item = ...` in lists). The tests will drive the correct implementation.

**Step 4: Implement the compiler**

Create `packages/core/src/compiler.ts`:

```ts
import { compile } from "@timeleap/tiramisu"
import type { Node, FunctionCall, Parameter, NamedParameter, Paragraph, MixedText, PureText, ArrayValue } from "@timeleap/tiramisu"
import { extractMeta } from "./meta"
import { builtins, slugify } from "./builtins"
import type { CompileResult, Heading } from "./types"

export function compileTiramisu(source: string): CompileResult {
  const ast = compile(source)
  const { meta, contentNodes } = extractMeta(ast)
  const headings: Heading[] = []
  const customComponents = new Set<string>()

  function renderNode(node: Node): string {
    const name = node.constructor.name

    switch (name) {
      case "Paragraph":
        return `<p>${(node as any).children.map(renderNode).join("")}</p>`

      case "MixedText":
        return (node as any).shards.map(renderNode).join("")

      case "PureText":
        return (node as any).shards.join("")

      case "FunctionCall":
        return renderFunctionCall(node as FunctionCall)

      default:
        return node.toString()
    }
  }

  function renderFunctionCall(call: FunctionCall): string {
    const params = parseParams(call)

    // Check headings for TOC
    if (/^h[1-6]$/.test(call.functionName)) {
      const level = parseInt(call.functionName[1])
      const text = renderNodes(params.positional)
      headings.push({ level, text: stripHtml(text), id: slugify(stripHtml(text)) })
    }

    // Check builtins
    if (call.functionName in builtins) {
      return builtins[call.functionName](params, renderNodes)
    }

    // Custom component
    const componentName = capitalize(call.functionName)
    customComponents.add(componentName)
    const props = buildProps(params)
    const children = renderNodes(params.positional)
    if (children.trim()) {
      return `<${componentName}${props}>${children}</${componentName}>`
    }
    return `<${componentName}${props} />`
  }

  function parseParams(call: FunctionCall): any {
    const positional: Node[] = []
    const named = new Map<string, any>()
    const allNamed = new Map<string, any[]>()

    for (const param of call.parameters.parameters) {
      const pName = param.constructor.name
      if (pName === "NamedParameter") {
        const np = param as NamedParameter
        const key = np.name.trim()
        named.set(key, np.value)
        if (!allNamed.has(key)) allNamed.set(key, [])
        allNamed.get(key)!.push(np.value)
      } else if (pName === "Parameter") {
        positional.push(param)
      }
    }

    return { positional, named, _allNamed: allNamed }
  }

  function renderNodes(nodes: Node[]): string {
    return nodes.map(renderNode).join("")
  }

  function buildProps(params: any): string {
    const entries: string[] = []
    for (const [key, value] of params.named.entries()) {
      if (key === "type" || key === "language" || key === "item" || key === "row") continue
      const val = Array.isArray(value)
        ? value.map((v: Node) => v.toString()).join("").trim()
        : value.toString().trim()
      entries.push(`${key}="${val}"`)
    }
    return entries.length ? " " + entries.join(" ") : ""
  }

  const body = contentNodes.map(renderNode).join("\n\n")

  // Build script tag with custom component imports
  let script = ""
  if (customComponents.size > 0) {
    const imports = Array.from(customComponents)
      .map(name => `  import ${name} from "$lib/components/tiramisu/${name}.svelte"`)
      .join("\n")
    script = `<script>\n${imports}\n</script>\n\n`
  }

  return {
    meta,
    svelte: script + body,
    headings,
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "")
}
```

**Step 5: Export from core index**

Update `packages/core/src/index.ts`:

```ts
export { compileTiramisu } from "./compiler"
export { extractMeta } from "./meta"
export type { CompileResult, DocMeta, Heading } from "./types"
```

**Step 6: Run tests**

```bash
cd packages/core && bun test
```

Expected: Tests pass (iterate on compiler if needed — the AST node shapes may require adjustments).

**Step 7: Commit**

```bash
git add packages/core && git commit -m "feat(core): implement tiramisu to Svelte compiler with built-in functions"
```

---

### Task 4: Kit — Vite Plugin

**Files:**
- Create: `packages/kit/src/vite.ts`
- Create: `packages/kit/src/virtual.ts`
- Test: `packages/kit/tests/vite.test.ts`

The Vite plugin intercepts `.tiramisu` file imports, compiles them to Svelte, and generates a virtual module for the sidebar/route manifest.

**Step 1: Write the failing test**

Create `packages/kit/tests/vite.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { tiramisuPlugin } from "../src/vite"

describe("tiramisuPlugin", () => {
  it("returns a Vite plugin object", () => {
    const plugin = tiramisuPlugin({ docsDir: "src/docs" })
    expect(plugin.name).toBe("tiramisu-docs")
  })

  it("resolves .tiramisu files", () => {
    const plugin = tiramisuPlugin({ docsDir: "src/docs" })
    // resolveId should handle .tiramisu imports
    expect(typeof plugin.resolveId).toBe("function")
    expect(typeof plugin.load).toBe("function")
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd packages/kit && bun test tests/vite.test.ts
```

**Step 3: Implement the Vite plugin**

Create `packages/kit/src/vite.ts`:

```ts
import { compileTiramisu } from "@tiramisu-docs/core"
import { readFileSync, readdirSync, statSync } from "fs"
import { join, relative, resolve } from "path"
import type { Plugin } from "vite"
import type { DocMeta, Heading } from "@tiramisu-docs/core"

export interface TiramisuPluginOptions {
  docsDir?: string
  componentsDir?: string
}

interface DocEntry {
  slug: string
  meta: DocMeta
  headings: Heading[]
  filePath: string
}

const VIRTUAL_MODULE_ID = "virtual:tiramisu-docs"
const RESOLVED_VIRTUAL_ID = "\0" + VIRTUAL_MODULE_ID

export function tiramisuPlugin(options: TiramisuPluginOptions = {}): Plugin {
  const docsDir = options.docsDir ?? "src/docs"
  const componentsDir = options.componentsDir ?? "src/lib/components/tiramisu"
  let root = ""

  return {
    name: "tiramisu-docs",
    enforce: "pre",

    configResolved(config) {
      root = config.root
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_ID
      if (id.endsWith(".tiramisu")) return id
      return null
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        return generateVirtualModule(resolve(root, docsDir))
      }

      if (id.endsWith(".tiramisu")) {
        const source = readFileSync(id, "utf-8")
        const result = compileTiramisu(source)
        return {
          code: result.svelte,
          map: null,
        }
      }

      return null
    },

    handleHotUpdate({ file, server }) {
      if (file.endsWith(".tiramisu")) {
        // Invalidate the virtual module so sidebar updates
        const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)

        // Also invalidate the .tiramisu file itself
        const fileMod = server.moduleGraph.getModuleById(file)
        if (fileMod) server.moduleGraph.invalidateModule(fileMod)

        server.ws.send({ type: "full-reload" })
        return []
      }
    },
  }
}

function generateVirtualModule(docsDir: string): string {
  const entries = collectDocs(docsDir, docsDir)

  const sidebarTree = buildSidebarTree(entries)

  return `
    export const sidebar = ${JSON.stringify(sidebarTree, null, 2)};
    export const docs = ${JSON.stringify(entries.map(e => ({ slug: e.slug, meta: e.meta, headings: e.headings })), null, 2)};
  `
}

function collectDocs(dir: string, baseDir: string): DocEntry[] {
  const entries: DocEntry[] = []

  for (const file of readdirSync(dir)) {
    const fullPath = join(dir, file)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      entries.push(...collectDocs(fullPath, baseDir))
    } else if (file.endsWith(".tiramisu")) {
      const source = readFileSync(fullPath, "utf-8")
      const result = compileTiramisu(source)
      const rel = relative(baseDir, fullPath).replace(/\.tiramisu$/, "")
      const slug = rel.replace(/\\/g, "/")

      entries.push({
        slug,
        meta: result.meta,
        headings: result.headings,
        filePath: fullPath,
      })
    }
  }

  return entries
}

interface SidebarGroup {
  label: string
  items: { title: string; slug: string; order: number }[]
}

function buildSidebarTree(entries: DocEntry[]): SidebarGroup[] {
  const groups = new Map<string, SidebarGroup>()

  for (const entry of entries) {
    const groupLabel = entry.meta.group ?? "Documentation"
    if (!groups.has(groupLabel)) {
      groups.set(groupLabel, { label: groupLabel, items: [] })
    }
    groups.get(groupLabel)!.items.push({
      title: entry.meta.title ?? entry.slug,
      slug: entry.slug,
      order: entry.meta.order ?? 999,
    })
  }

  // Sort items within each group
  for (const group of groups.values()) {
    group.items.sort((a, b) => a.order - b.order)
  }

  return Array.from(groups.values())
}
```

**Step 4: Export from kit index**

Update `packages/kit/src/index.ts`:

```ts
export { tiramisuPlugin } from "./vite"
export type { TiramisuPluginOptions } from "./vite"
```

**Step 5: Run tests**

```bash
cd packages/kit && bun test
```

**Step 6: Commit**

```bash
git add packages/kit && git commit -m "feat(kit): implement Vite plugin with .tiramisu compilation and virtual sidebar module"
```

---

### Task 5: Kit — Config System

**Files:**
- Create: `packages/kit/src/config.ts`
- Test: `packages/kit/tests/config.test.ts`

**Step 1: Write the failing test**

Create `packages/kit/tests/config.test.ts`:

```ts
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
```

**Step 2: Run to verify failure, then implement**

Create `packages/kit/src/config.ts`:

```ts
export interface TiramisuDocsConfig {
  title?: string
  description?: string
  logo?: string
  nav?: { label: string; href: string }[]
  sidebar?: {
    groupOrder?: string[]
  }
  theme?: {
    primary?: string
    radius?: string
  }
}

export interface ResolvedConfig {
  title: string
  description: string
  logo: string
  nav: { label: string; href: string }[]
  sidebar: { groupOrder: string[] }
  theme: { primary: string; radius: string }
}

export function defineConfig(config: TiramisuDocsConfig): TiramisuDocsConfig {
  return config
}

export function resolveConfig(config: TiramisuDocsConfig): ResolvedConfig {
  return {
    title: config.title ?? "Documentation",
    description: config.description ?? "",
    logo: config.logo ?? "",
    nav: config.nav ?? [],
    sidebar: {
      groupOrder: config.sidebar?.groupOrder ?? [],
    },
    theme: {
      primary: config.theme?.primary ?? "hsl(262, 83%, 58%)",
      radius: config.theme?.radius ?? "0.5rem",
    },
  }
}
```

**Step 3: Run tests, commit**

```bash
cd packages/kit && bun test && git add packages/kit && git commit -m "feat(kit): add config system with defineConfig and resolveConfig"
```

---

### Task 6: Kit — Default Layout Components (Svelte)

**Files:**
- Create: `packages/kit/src/lib/components/DocsLayout.svelte`
- Create: `packages/kit/src/lib/components/Navbar.svelte`
- Create: `packages/kit/src/lib/components/Sidebar.svelte`
- Create: `packages/kit/src/lib/components/DocPage.svelte`
- Create: `packages/kit/src/lib/components/TableOfContents.svelte`

These are the default layout components shipped with the kit. They use shadcn-svelte primitives and Tailwind CSS v4.

**Step 1: Install shadcn-svelte dependencies in kit**

```bash
cd packages/kit && bun add -d bits-ui clsx tailwind-merge tailwind-variants
```

> **Note:** shadcn-svelte components are typically copy-pasted into the project. For the kit, we'll build our own layout components that use the same design tokens and patterns. Users can override any of them.

**Step 2: Create DocsLayout.svelte**

Create `packages/kit/src/lib/components/DocsLayout.svelte`:

```svelte
<script>
  import Navbar from "./Navbar.svelte"
  import Sidebar from "./Sidebar.svelte"
  import TableOfContents from "./TableOfContents.svelte"

  let { config, sidebar, headings, children } = $props()
</script>

<div class="min-h-screen bg-background text-foreground">
  <Navbar {config} />
  <div class="container mx-auto flex gap-8 px-4 py-8">
    <aside class="hidden w-64 shrink-0 lg:block">
      <Sidebar groups={sidebar} />
    </aside>
    <main class="min-w-0 flex-1">
      {@render children()}
    </main>
    {#if headings?.length}
      <aside class="hidden w-48 shrink-0 xl:block">
        <TableOfContents {headings} />
      </aside>
    {/if}
  </div>
</div>
```

**Step 3: Create Navbar.svelte**

Create `packages/kit/src/lib/components/Navbar.svelte`:

```svelte
<script>
  let { config } = $props()
</script>

<header class="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
  <nav class="container mx-auto flex h-14 items-center gap-6 px-4">
    <a href="/" class="flex items-center gap-2 font-semibold">
      {#if config.logo}
        <img src={config.logo} alt="" class="h-6 w-6" />
      {/if}
      {config.title}
    </a>
    <div class="flex-1" />
    {#each config.nav as link}
      <a href={link.href} class="text-sm text-muted-foreground hover:text-foreground transition-colors">
        {link.label}
      </a>
    {/each}
  </nav>
</header>
```

**Step 4: Create Sidebar.svelte**

Create `packages/kit/src/lib/components/Sidebar.svelte`:

```svelte
<script>
  import { page } from "$app/stores"

  let { groups } = $props()
</script>

<nav class="sticky top-20 space-y-6">
  {#each groups as group}
    <div>
      <h4 class="mb-2 text-sm font-semibold">{group.label}</h4>
      <ul class="space-y-1">
        {#each group.items as item}
          <li>
            <a
              href="/docs/{item.slug}"
              class="block rounded-md px-3 py-1.5 text-sm transition-colors {$page.url.pathname === `/docs/${item.slug}` ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}"
            >
              {item.title}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</nav>
```

**Step 5: Create DocPage.svelte**

Create `packages/kit/src/lib/components/DocPage.svelte`:

```svelte
<script>
  let { meta, children } = $props()
</script>

<article class="prose prose-neutral dark:prose-invert max-w-none">
  {#if meta?.title}
    <h1>{meta.title}</h1>
  {/if}
  {#if meta?.description}
    <p class="lead text-muted-foreground">{meta.description}</p>
  {/if}
  {@render children()}
</article>
```

**Step 6: Create TableOfContents.svelte**

Create `packages/kit/src/lib/components/TableOfContents.svelte`:

```svelte
<script>
  let { headings } = $props()
</script>

<nav class="sticky top-20 space-y-2">
  <h4 class="text-sm font-semibold">On this page</h4>
  <ul class="space-y-1 text-sm">
    {#each headings as heading}
      <li style="padding-left: {(heading.level - 1) * 0.75}rem">
        <a href="#{heading.id}" class="text-muted-foreground hover:text-foreground transition-colors">
          {heading.text}
        </a>
      </li>
    {/each}
  </ul>
</nav>
```

**Step 7: Commit**

```bash
git add packages/kit && git commit -m "feat(kit): add default layout components (DocsLayout, Navbar, Sidebar, DocPage, TableOfContents)"
```

---

### Task 7: Kit — Built-in Tiramisu Components (shadcn-svelte)

**Files:**
- Create: `packages/kit/src/lib/components/tiramisu/Callout.svelte`
- Create: `packages/kit/src/lib/components/tiramisu/Tabs.svelte`
- Create: `packages/kit/src/lib/components/tiramisu/Steps.svelte`
- Create: `packages/kit/src/lib/components/tiramisu/Badge.svelte`
- Create: `packages/kit/src/lib/components/tiramisu/CodeBlock.svelte`

These are the shadcn-svelte-powered components for the richer built-in functions. The simpler ones (bold, italic, headings, etc.) compile directly to HTML in core.

**Step 1: Create Callout.svelte**

```svelte
<script>
  let { type = "info", children } = $props()

  const styles = {
    info: "border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    warning: "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
    error: "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300",
    success: "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300",
  }
</script>

<div class="my-4 rounded-lg border-l-4 p-4 {styles[type] ?? styles.info}" role="alert">
  {@render children()}
</div>
```

**Step 2: Create Tabs, Steps, Badge, CodeBlock similarly**

Each follows the same pattern — receives props from the compiler, renders shadcn-style markup. CodeBlock should integrate shiki for syntax highlighting:

```bash
cd packages/kit && bun add shiki
```

**Step 3: Commit**

```bash
git add packages/kit && git commit -m "feat(kit): add built-in tiramisu components (Callout, Tabs, Steps, Badge, CodeBlock)"
```

---

### Task 8: Kit — Route Generation & SvelteKit Integration

**Files:**
- Create: `packages/kit/src/lib/routes/docs/[...slug]/+page.ts`
- Create: `packages/kit/src/lib/routes/docs/[...slug]/+page.svelte`
- Create: `packages/kit/src/lib/routes/docs/[...slug]/+layout.svelte`

This is where the Vite plugin's virtual module connects to SvelteKit routing. The scaffolded project will use these routes (or the user overrides them).

**Step 1: Plan the route integration**

The Vite plugin compiles `.tiramisu` → Svelte component strings. The virtual module provides the sidebar. The catch-all route `docs/[...slug]` dynamically imports the right compiled component.

The approach: The Vite plugin creates a virtual module that maps slugs to dynamic imports of the compiled `.tiramisu` files. The `+page.ts` load function reads the slug, imports the component, and passes it to `+page.svelte`.

**Step 2: Update the Vite plugin virtual module** to export a `getDoc` function:

Add to `generateVirtualModule()` in `packages/kit/src/vite.ts`:

```ts
// Add dynamic imports for each doc
const imports = entries.map(e =>
  `"${e.slug}": () => import("${e.filePath}")`
).join(",\n  ")

return `
  export const sidebar = ${JSON.stringify(sidebarTree, null, 2)};
  export const docs = ${JSON.stringify(entries.map(e => ({
    slug: e.slug, meta: e.meta, headings: e.headings
  })), null, 2)};
  export const docImports = {
    ${imports}
  };
`
```

**Step 3: Create template route files** that the scaffolder will copy:

Create `packages/kit/src/lib/routes/docs/[...slug]/+page.ts`:

```ts
import { error } from "@sveltejs/kit"

export async function load({ params }) {
  const slug = params.slug || "index"
  try {
    const { docImports, docs } = await import("virtual:tiramisu-docs")
    const importFn = docImports[slug]
    if (!importFn) throw error(404, "Page not found")

    const component = await importFn()
    const doc = docs.find((d: any) => d.slug === slug)

    return {
      component: component.default,
      meta: doc?.meta ?? {},
      headings: doc?.headings ?? [],
    }
  } catch (e) {
    throw error(404, "Page not found")
  }
}
```

Create `packages/kit/src/lib/routes/docs/[...slug]/+page.svelte`:

```svelte
<script>
  import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
  import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
  import { sidebar } from "virtual:tiramisu-docs"

  let { data } = $props()
</script>

<DocsLayout config={data.config} {sidebar} headings={data.headings}>
  <DocPage meta={data.meta}>
    <svelte:component this={data.component} />
  </DocPage>
</DocsLayout>
```

**Step 4: Commit**

```bash
git add packages/kit && git commit -m "feat(kit): add SvelteKit route templates and virtual module integration"
```

---

### Task 9: Create-Tiramisu-Docs — CLI Scaffolder

**Files:**
- Create: `packages/create-tiramisu-docs/src/index.ts`
- Create: `packages/create-tiramisu-docs/src/templates/` (template files)
- Test: `packages/create-tiramisu-docs/tests/scaffold.test.ts`

**Step 1: Write the failing test**

Create `packages/create-tiramisu-docs/tests/scaffold.test.ts`:

```ts
import { describe, expect, it } from "bun:test"
import { generateProjectFiles } from "../src/scaffold"

describe("generateProjectFiles", () => {
  it("generates the expected file list", () => {
    const files = generateProjectFiles({ name: "my-docs", theme: "default" })
    const paths = files.map(f => f.path)

    expect(paths).toContain("package.json")
    expect(paths).toContain("svelte.config.js")
    expect(paths).toContain("vite.config.ts")
    expect(paths).toContain("tiramisu.config.ts")
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
```

**Step 2: Run test to verify it fails**

```bash
cd packages/create-tiramisu-docs && bun test
```

**Step 3: Implement scaffold logic**

Create `packages/create-tiramisu-docs/src/scaffold.ts`:

```ts
export interface ScaffoldOptions {
  name: string
  theme: "default" | "minimal"
}

export interface GeneratedFile {
  path: string
  content: string
}

export function generateProjectFiles(options: ScaffoldOptions): GeneratedFile[] {
  return [
    { path: "package.json", content: packageJson(options) },
    { path: "svelte.config.js", content: svelteConfig() },
    { path: "vite.config.ts", content: viteConfig() },
    { path: "tiramisu.config.ts", content: tiramisuConfig(options) },
    { path: "src/app.html", content: appHtml() },
    { path: "src/app.css", content: appCss(options) },
    { path: "src/docs/index.tiramisu", content: indexDoc(options) },
    { path: "src/docs/getting-started.tiramisu", content: gettingStartedDoc() },
    { path: "src/routes/+layout.svelte", content: rootLayout() },
    { path: "src/routes/docs/[...slug]/+page.ts", content: docsPageTs() },
    { path: "src/routes/docs/[...slug]/+page.svelte", content: docsPageSvelte() },
    { path: "tsconfig.json", content: tsconfig() },
    { path: ".gitignore", content: gitignore() },
  ]
}

function packageJson(opts: ScaffoldOptions): string {
  return JSON.stringify({
    name: opts.name,
    version: "0.0.1",
    private: true,
    type: "module",
    scripts: {
      dev: "vite dev",
      build: "vite build",
      preview: "vite preview",
    },
    dependencies: {
      "@tiramisu-docs/kit": "^0.1.0",
      "@timeleap/tiramisu": "^1.6.0",
    },
    devDependencies: {
      "@sveltejs/adapter-static": "^3.0.0",
      "@sveltejs/kit": "^2.0.0",
      "svelte": "^5.0.0",
      "vite": "^6.0.0",
      "tailwindcss": "^4.0.0",
      "typescript": "^5.4.5",
    },
  }, null, 2)
}

function svelteConfig(): string {
  return `import adapter from "@sveltejs/adapter-static"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
  },
}

export default config
`
}

function viteConfig(): string {
  return `import { sveltekit } from "@sveltejs/kit/vite"
import { tiramisuPlugin } from "@tiramisu-docs/kit/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [tiramisuPlugin(), sveltekit()],
})
`
}

function tiramisuConfig(opts: ScaffoldOptions): string {
  return `import { defineConfig } from "@tiramisu-docs/kit"

export default defineConfig({
  title: "${opts.name}",
  description: "Documentation for ${opts.name}",
  nav: [
    { label: "Docs", href: "/docs" },
  ],
})
`
}

function appHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
`
}

function appCss(opts: ScaffoldOptions): string {
  return `@import "tailwindcss";
`
}

function indexDoc(opts: ScaffoldOptions): string {
  return `meta { title = Welcome, order = 1, group = Getting Started }

h1 { Welcome to ${opts.name} }

This is your documentation site powered by bold { Tiramisu Docs }.

Get started by editing the files in code { src/docs/ }.
`
}

function gettingStartedDoc(): string {
  return `meta { title = Getting Started, order = 2, group = Getting Started }

h2 { Installation }

codeblock { language = bash, "bun add my-package" }

h2 { Usage }

Import and use the package in your project:

codeblock { language = typescript, "import { something } from 'my-package'" }
`
}

function rootLayout(): string {
  return `<script>
  import "../app.css"
  let { children } = $props()
</script>

{@render children()}
`
}

function docsPageTs(): string {
  return `import { error } from "@sveltejs/kit"

export async function load({ params }) {
  const slug = params.slug || "index"
  const { docImports, docs } = await import("virtual:tiramisu-docs")
  const importFn = docImports[slug]
  if (!importFn) throw error(404, "Page not found")

  const component = await importFn()
  const doc = docs.find((d) => d.slug === slug)

  return {
    component: component.default,
    meta: doc?.meta ?? {},
    headings: doc?.headings ?? [],
  }
}
`
}

function docsPageSvelte(): string {
  return `<script>
  import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
  import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
  import { sidebar } from "virtual:tiramisu-docs"
  import config from "../../../../tiramisu.config"

  let { data } = $props()
</script>

<DocsLayout {config} {sidebar} headings={data.headings}>
  <DocPage meta={data.meta}>
    <svelte:component this={data.component} />
  </DocPage>
</DocsLayout>
`
}

function tsconfig(): string {
  return JSON.stringify({
    extends: "./.svelte-kit/tsconfig.json",
    compilerOptions: {
      allowJs: true,
      checkJs: true,
      esModuleInterop: true,
      forceConsistentCasingInFileNames: true,
      resolveJsonModule: true,
      skipLibCheck: true,
      sourceMap: true,
      strict: true,
      moduleResolution: "bundler",
    },
  }, null, 2)
}

function gitignore(): string {
  return `node_modules
.svelte-kit
build
dist
.env
.env.*
`
}
```

**Step 4: Implement the CLI entry point**

Create `packages/create-tiramisu-docs/src/index.ts`:

```ts
#!/usr/bin/env node

import * as p from "@clack/prompts"
import { mkdirSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { execSync } from "child_process"
import { generateProjectFiles } from "./scaffold"

async function main() {
  p.intro("Create Tiramisu Docs")

  const options = await p.group({
    name: () => p.text({
      message: "Project name:",
      placeholder: "my-docs",
      defaultValue: "my-docs",
    }),
    packageManager: () => p.select({
      message: "Package manager:",
      options: [
        { value: "bun", label: "bun" },
        { value: "npm", label: "npm" },
        { value: "pnpm", label: "pnpm" },
      ],
    }),
    theme: () => p.select({
      message: "Theme:",
      options: [
        { value: "default", label: "Default" },
        { value: "minimal", label: "Minimal" },
      ],
    }),
  }, {
    onCancel: () => {
      p.cancel("Cancelled.")
      process.exit(0)
    },
  })

  const projectDir = join(process.cwd(), options.name)
  const files = generateProjectFiles({
    name: options.name,
    theme: options.theme as "default" | "minimal",
  })

  const spinner = p.spinner()
  spinner.start("Scaffolding project...")

  for (const file of files) {
    const fullPath = join(projectDir, file.path)
    mkdirSync(dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, file.content)
  }

  spinner.stop("Project created!")

  spinner.start("Installing dependencies...")
  try {
    execSync(`${options.packageManager} install`, { cwd: projectDir, stdio: "ignore" })
    spinner.stop("Dependencies installed!")
  } catch {
    spinner.stop("Failed to install dependencies. Run install manually.")
  }

  p.outro(`Done! Run:\n  cd ${options.name}\n  ${options.packageManager} run dev`)
}

main()
```

**Step 5: Run tests**

```bash
cd packages/create-tiramisu-docs && bun test
```

**Step 6: Commit**

```bash
git add packages/create-tiramisu-docs && git commit -m "feat(create-tiramisu-docs): implement CLI scaffolder with clack prompts"
```

---

### Task 10: Integration Test — End to End

**Files:**
- Create: `tests/integration/e2e.test.ts`

**Step 1: Write an integration test**

This test scaffolds a project into a temp directory, writes a `.tiramisu` file, and verifies the Vite plugin compiles it correctly.

```ts
import { describe, expect, it } from "bun:test"
import { generateProjectFiles } from "../../packages/create-tiramisu-docs/src/scaffold"
import { compileTiramisu } from "../../packages/core/src/compiler"

describe("end-to-end", () => {
  it("scaffolded project has valid tiramisu files that compile", () => {
    const files = generateProjectFiles({ name: "test-docs", theme: "default" })
    const tiramisuFiles = files.filter(f => f.path.endsWith(".tiramisu"))

    expect(tiramisuFiles.length).toBeGreaterThan(0)

    for (const file of tiramisuFiles) {
      const result = compileTiramisu(file.content)
      expect(result.svelte).toBeTruthy()
      expect(result.meta.title).toBeTruthy()
    }
  })

  it("compiles a complex doc with custom components", () => {
    const source = `meta { title = API Reference, order = 1, group = API }

h1 { API Reference }

This page uses a custom component:

chart { type = bar, data = [1, 2, 3] }

And a callout { type = warning, Be careful with this API. }
`
    const result = compileTiramisu(source)
    expect(result.meta.title).toBe("API Reference")
    expect(result.svelte).toContain("Chart")
    expect(result.svelte).toContain("import Chart from")
    expect(result.headings).toHaveLength(1)
  })
})
```

**Step 2: Run integration tests**

```bash
cd /Users/pouya/Projects/tiramisu-docs && bun test tests/integration/
```

**Step 3: Commit**

```bash
git add tests && git commit -m "test: add integration tests for scaffold + compile pipeline"
```

---

### Task 11: Polish & Documentation

**Files:**
- Update: `packages/core/src/index.ts` (ensure all exports)
- Update: `packages/kit/src/index.ts` (ensure all exports)
- Update: root `package.json` (add useful scripts)

**Step 1: Ensure all packages build**

```bash
cd /Users/pouya/Projects/tiramisu-docs && bun run build
```

Fix any TypeScript errors.

**Step 2: Ensure all tests pass**

```bash
bun run test
```

**Step 3: Add virtual module type declarations**

Create `packages/kit/src/virtual.d.ts`:

```ts
declare module "virtual:tiramisu-docs" {
  export const sidebar: {
    label: string
    items: { title: string; slug: string; order: number }[]
  }[]
  export const docs: {
    slug: string
    meta: { title?: string; description?: string; order?: number; group?: string }
    headings: { level: number; text: string; id: string }[]
  }[]
  export const docImports: Record<string, () => Promise<{ default: any }>>
}
```

**Step 4: Final commit**

```bash
git add -A && git commit -m "chore: polish exports, type declarations, and build scripts"
```
