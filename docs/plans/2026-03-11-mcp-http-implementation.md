# MCP HTTP Endpoint Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the local stdio MCP server with a hosted HTTP JSON-RPC endpoint deployed as a SvelteKit route.

**Architecture:** A pure `handleMcpRequest()` function in the kit handles JSON-RPC 2.0 dispatch. The scaffolder generates a `/mcp` route that wires it to `virtual:tiramisu-docs` data. Config `mcp` field becomes `boolean | string`.

**Tech Stack:** SvelteKit, JSON-RPC 2.0 (no SDK dependency)

---

### Task 1: Rewrite `mcp.ts` as pure JSON-RPC handler

**Files:**
- Rewrite: `packages/kit/src/mcp.ts`

**Step 1: Write the new `handleMcpRequest()` function**

Replace the entire file with a pure function that takes a JSON-RPC body and virtual module data:

```typescript
import type { VirtualDoc, SearchIndexEntry, SidebarGroup } from "./types.js"

export interface McpData {
  docs: VirtualDoc[]
  searchIndex: SearchIndexEntry[]
  sidebar: SidebarGroup[]
}

interface JsonRpcRequest {
  jsonrpc: "2.0"
  id?: string | number
  method: string
  params?: Record<string, unknown>
}

interface JsonRpcResponse {
  jsonrpc: "2.0"
  id?: string | number | null
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

const TOOL_DEFINITIONS = [
  {
    name: "search_docs",
    description: "Search documentation pages by keyword",
    inputSchema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results (default 10)" },
      },
      required: ["query"],
    },
  },
  {
    name: "read_doc",
    description: "Read a specific documentation page by slug",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Page slug" },
      },
      required: ["slug"],
    },
  },
  {
    name: "list_pages",
    description: "List documentation pages, optionally filtered by section",
    inputSchema: {
      type: "object" as const,
      properties: {
        section: { type: "string", description: "Filter by section name" },
      },
    },
  },
  {
    name: "list_sections",
    description: "List all documentation sections with page counts",
    inputSchema: { type: "object" as const, properties: {} },
  },
  {
    name: "get_table_of_contents",
    description: "Get headings for a documentation page",
    inputSchema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Page slug" },
      },
      required: ["slug"],
    },
  },
]

function toolResult(data: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
}

function toolError(message: string) {
  return { content: [{ type: "text", text: message }], isError: true }
}

function callTool(name: string, args: Record<string, unknown>, data: McpData) {
  switch (name) {
    case "search_docs": {
      const query = String(args.query ?? "")
      const limit = Number(args.limit ?? 10)
      const terms = query.toLowerCase().split(/\s+/)
      const scored = data.searchIndex
        .map((entry) => {
          const haystack = `${entry.title} ${entry.headings} ${entry.text}`.toLowerCase()
          const score = terms.reduce((s, t) => s + (haystack.includes(t) ? 1 : 0), 0)
          return { entry, score }
        })
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
      return toolResult(scored.map((r) => ({
        title: r.entry.title,
        slug: r.entry.slug,
        snippet: r.entry.text.slice(0, 200),
      })))
    }
    case "read_doc": {
      const slug = String(args.slug ?? "")
      const doc = data.docs.find((d) => d.slug === slug)
      const idx = data.searchIndex.find((e) => e.slug === slug)
      if (!doc || !idx) return toolError(`Page not found: ${slug}`)
      return toolResult({
        title: doc.meta.title ?? doc.slug,
        description: doc.meta.description ?? "",
        content: idx.text,
        headings: doc.headings,
      })
    }
    case "list_pages": {
      const section = args.section ? String(args.section).toLowerCase() : ""
      let filtered = data.searchIndex
      if (section) {
        filtered = filtered.filter((e) => e.group.toLowerCase().includes(section))
      }
      return toolResult(filtered.map((e) => ({
        title: e.title,
        slug: e.slug,
        description: data.docs.find((d) => d.slug === e.slug)?.meta.description ?? "",
      })))
    }
    case "list_sections": {
      const groups = new Map<string, number>()
      for (const entry of data.searchIndex) {
        groups.set(entry.group, (groups.get(entry.group) ?? 0) + 1)
      }
      return toolResult(Array.from(groups.entries()).map(([label, pageCount]) => ({
        label,
        path: label.toLowerCase().replace(/ > /g, "/").replace(/ /g, "-"),
        pageCount,
      })))
    }
    case "get_table_of_contents": {
      const slug = String(args.slug ?? "")
      const doc = data.docs.find((d) => d.slug === slug)
      if (!doc) return toolError(`Page not found: ${slug}`)
      return toolResult(doc.headings.map((h) => ({ level: h.level, text: h.text, id: h.id })))
    }
    default:
      return toolError(`Unknown tool: ${name}`)
  }
}

export function handleMcpRequest(body: JsonRpcRequest, data: McpData): JsonRpcResponse {
  const { method, id, params } = body

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "tiramisu-docs", version: "0.1.0" },
        },
      }
    case "notifications/initialized":
      return { jsonrpc: "2.0", id: id ?? null, result: {} }
    case "tools/list":
      return { jsonrpc: "2.0", id: id ?? null, result: { tools: TOOL_DEFINITIONS } }
    case "tools/call": {
      const name = String((params as any)?.name ?? "")
      const args = ((params as any)?.arguments ?? {}) as Record<string, unknown>
      return { jsonrpc: "2.0", id: id ?? null, result: callTool(name, args, data) }
    }
    default:
      return {
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${method}` },
      }
  }
}
```

**Step 2: Build kit**

Run: `cd packages/kit && bun run build`
Expected: Success (tsc compiles)

**Step 3: Commit**

```
feat: rewrite MCP as pure HTTP JSON-RPC handler
```

---

### Task 2: Remove old stdio server, CLI, and SDK dependency

**Files:**
- Delete: `packages/kit/src/bin/mcp.ts`
- Modify: `packages/kit/package.json` — remove `bin` field, remove `@modelcontextprotocol/sdk` and `zod` from dependencies
- Keep: `packages/kit/src/scan.ts` (still used by `vite.ts` for `findTiramisuFiles`, `extractPlainText`, `titleCase`)

**Step 1: Delete CLI entry point**

Delete `packages/kit/src/bin/mcp.ts`.

**Step 2: Update package.json**

Remove from `packages/kit/package.json`:
- The `"bin"` field entirely (lines 8-10)
- `"@modelcontextprotocol/sdk": "^1.12.1"` from dependencies (line 50)
- `"zod": "^3.24.0"` from dependencies (line 60) — only used by old mcp.ts

**Step 3: Build and test**

Run: `cd packages/kit && bun run build && bun test`
Expected: Build succeeds, tests pass (MCP test will fail — fix in next task)

**Step 4: Commit**

```
chore: remove stdio MCP server, CLI binary, and SDK dependency
```

---

### Task 3: Rewrite MCP tests

**Files:**
- Rewrite: `packages/kit/tests/mcp.test.ts`

**Step 1: Write tests for `handleMcpRequest`**

```typescript
import { describe, expect, it } from "bun:test"
import { handleMcpRequest } from "../src/mcp"
import type { McpData } from "../src/mcp"

const mockData: McpData = {
  docs: [
    {
      slug: "getting-started",
      meta: { title: "Getting Started", description: "How to begin" },
      headings: [
        { level: 2, text: "Installation", id: "installation" },
        { level: 2, text: "Usage", id: "usage" },
      ],
    },
    {
      slug: "api/auth",
      meta: { title: "Authentication", description: "Auth docs" },
      headings: [{ level: 2, text: "Tokens", id: "tokens" }],
    },
  ],
  searchIndex: [
    { id: "1", title: "Getting Started", group: "Guide", slug: "getting-started", headings: "Installation Usage", text: "Welcome to the docs. Install the package and get started." },
    { id: "2", title: "Authentication", group: "API", slug: "api/auth", headings: "Tokens", text: "Authentication uses bearer tokens." },
  ],
  sidebar: [],
}

describe("handleMcpRequest", () => {
  it("handles initialize", () => {
    const res = handleMcpRequest({ jsonrpc: "2.0", id: 1, method: "initialize" }, mockData)
    expect(res.result).toBeDefined()
    expect((res.result as any).serverInfo.name).toBe("tiramisu-docs")
    expect((res.result as any).capabilities.tools).toBeDefined()
  })

  it("handles tools/list", () => {
    const res = handleMcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list" }, mockData)
    const tools = (res.result as any).tools
    expect(tools).toHaveLength(5)
    expect(tools.map((t: any) => t.name)).toContain("search_docs")
    expect(tools.map((t: any) => t.name)).toContain("read_doc")
  })

  it("search_docs finds matching pages", () => {
    const res = handleMcpRequest({
      jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "search_docs", arguments: { query: "install" } },
    }, mockData)
    const content = JSON.parse((res.result as any).content[0].text)
    expect(content).toHaveLength(1)
    expect(content[0].slug).toBe("getting-started")
  })

  it("read_doc returns page content", () => {
    const res = handleMcpRequest({
      jsonrpc: "2.0", id: 4, method: "tools/call",
      params: { name: "read_doc", arguments: { slug: "getting-started" } },
    }, mockData)
    const content = JSON.parse((res.result as any).content[0].text)
    expect(content.title).toBe("Getting Started")
    expect(content.content).toContain("Install the package")
  })

  it("read_doc returns error for missing page", () => {
    const res = handleMcpRequest({
      jsonrpc: "2.0", id: 5, method: "tools/call",
      params: { name: "read_doc", arguments: { slug: "nonexistent" } },
    }, mockData)
    expect((res.result as any).isError).toBe(true)
  })

  it("list_pages returns all pages", () => {
    const res = handleMcpRequest({
      jsonrpc: "2.0", id: 6, method: "tools/call",
      params: { name: "list_pages", arguments: {} },
    }, mockData)
    const content = JSON.parse((res.result as any).content[0].text)
    expect(content).toHaveLength(2)
  })

  it("list_pages filters by section", () => {
    const res = handleMcpRequest({
      jsonrpc: "2.0", id: 7, method: "tools/call",
      params: { name: "list_pages", arguments: { section: "API" } },
    }, mockData)
    const content = JSON.parse((res.result as any).content[0].text)
    expect(content).toHaveLength(1)
    expect(content[0].slug).toBe("api/auth")
  })

  it("list_sections groups pages", () => {
    const res = handleMcpRequest({
      jsonrpc: "2.0", id: 8, method: "tools/call",
      params: { name: "list_sections", arguments: {} },
    }, mockData)
    const content = JSON.parse((res.result as any).content[0].text)
    expect(content).toHaveLength(2)
    expect(content.find((s: any) => s.label === "Guide").pageCount).toBe(1)
  })

  it("get_table_of_contents returns headings", () => {
    const res = handleMcpRequest({
      jsonrpc: "2.0", id: 9, method: "tools/call",
      params: { name: "get_table_of_contents", arguments: { slug: "getting-started" } },
    }, mockData)
    const content = JSON.parse((res.result as any).content[0].text)
    expect(content).toHaveLength(2)
    expect(content[0].text).toBe("Installation")
  })

  it("returns error for unknown method", () => {
    const res = handleMcpRequest({ jsonrpc: "2.0", id: 10, method: "unknown/method" }, mockData)
    expect(res.error).toBeDefined()
    expect(res.error!.code).toBe(-32601)
  })
})
```

**Step 2: Run tests**

Run: `cd packages/kit && bun test`
Expected: All tests pass

**Step 3: Commit**

```
test: add comprehensive tests for HTTP MCP handler
```

---

### Task 4: Update config types

**Files:**
- Modify: `packages/kit/src/config.ts` — lines 73, 91, 117

**Step 1: Change `mcp` type in `TiramisuDocsConfig` (line 73)**

```typescript
// Before:
mcp?: string
// After:
mcp?: boolean | string
```

**Step 2: Change `mcp` type in `ResolvedConfig` (line 91)**

```typescript
// Before:
mcp?: string
// After:
mcp?: boolean | string
```

**Step 3: Resolve `mcp` URL in `resolveConfig` (line 117)**

The `mcp` field passes through unchanged — resolution to URL happens in `open-links.ts`.

**Step 4: Build**

Run: `cd packages/kit && bun run build`
Expected: Success

**Step 5: Commit**

```
feat: update mcp config type to boolean | string
```

---

### Task 5: Update open-links to handle `boolean | string`

**Files:**
- Modify: `packages/kit/src/lib/open-links.ts`

**Step 1: Change `mcp` type in `OpenLinkOptions` (line 6)**

```typescript
// Before:
mcp?: string
// After:
mcp?: boolean | string
```

**Step 2: Update `getOpenLinks` to derive URL (around line 41)**

```typescript
// Before:
if (opts.mcp) {
  links.push({ label: "Connect with MCP", copy: opts.mcp, icon: "mcp", type: "mcp" })
  const mcpMeta = JSON.stringify({ name: opts.title ?? "Documentation", url: opts.mcp })
  links.push({ label: "Connect to VSCode", href: `vscode:mcp/install?${encodeURIComponent(mcpMeta)}`, icon: "vscode", type: "mcp" })
}

// After:
if (opts.mcp) {
  const mcpUrl = typeof opts.mcp === "string" ? opts.mcp : `${opts.baseUrl}/mcp`
  links.push({ label: "Connect with MCP", copy: mcpUrl, icon: "mcp", type: "mcp" })
  const mcpMeta = JSON.stringify({ name: opts.title ?? "Documentation", url: mcpUrl })
  links.push({ label: "Connect to VSCode", href: `vscode:mcp/install?${encodeURIComponent(mcpMeta)}`, icon: "vscode", type: "mcp" })
}
```

**Step 3: Build and run all tests**

Run: `cd packages/kit && bun run build && cd ../.. && bun test`
Expected: All pass

**Step 4: Commit**

```
feat: derive MCP URL from baseUrl when mcp is true
```

---

### Task 6: Add `/mcp` route to playground

**Files:**
- Create: `playground/src/routes/mcp/+server.ts`

**Step 1: Create the route**

```typescript
import { handleMcpRequest } from "@tiramisu-docs/kit/mcp"
import { docs, searchIndex, sidebar } from "virtual:tiramisu-docs"

export async function POST({ request }) {
  const body = await request.json()
  const result = handleMcpRequest(body, { docs, searchIndex, sidebar })
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  })
}
```

**Step 2: Update playground config to enable MCP**

In `playground/src/lib/tiramisu.config.ts`, add `mcp: true`.

**Step 3: Build playground**

Run: `cd playground && bun run build`
Expected: Success

**Step 4: Commit**

```
feat: add /mcp HTTP endpoint to playground
```

---

### Task 7: Update scaffolder

**Files:**
- Modify: `packages/create-tiramisu-docs/src/scaffold.ts`
- Modify: `packages/create-tiramisu-docs/src/index.ts`

**Step 1: Remove `mcp` script from package.json template (line 69)**

Remove `mcp: "tiramisu-docs-mcp",` from the scripts object.

**Step 2: Add `mcpRoute()` function to scaffold.ts**

Add before `sitemapRoute()`:

```typescript
function mcpRoute(): GeneratedFile {
  return {
    path: "src/routes/mcp/+server.ts",
    content: `import { handleMcpRequest } from "@tiramisu-docs/kit/mcp"
import { docs, searchIndex, sidebar } from "virtual:tiramisu-docs"

export async function POST({ request }) {
  const body = await request.json()
  const result = handleMcpRequest(body, { docs, searchIndex, sidebar })
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  })
}
`,
  }
}
```

**Step 3: Add `mcp` option to `ScaffoldOptions`**

```typescript
export interface ScaffoldOptions {
  name: string
  sections: boolean
  i18n: boolean
  defaultLocale: string
  locales: { code: string; label: string }[]
  instantOg?: { siteId: string; template: string }
  mcp: boolean  // NEW
}
```

**Step 4: Conditionally include MCP route and config in `generateProjectFiles`**

In the `files` array, after `...scrollAreaFiles()`:
```typescript
if (options.mcp) {
  files.push(mcpRoute())
}
```

**Step 5: Add `mcp: true` to config when enabled**

In `tiramisuConfig()`, after the instantOg block:
```typescript
if (options.mcp) {
  configLines.push(`  mcp: true,`)
}
```

**Step 6: Update CLI prompts in `index.ts`**

Add after the `instantOgTemplate` prompt:
```typescript
mcp: () => p.confirm({
  message: "Enable MCP server for AI assistants?",
  initialValue: false,
}),
```

Pass to `generateProjectFiles`:
```typescript
mcp: options.mcp,
```

**Step 7: Build and test scaffolder**

Run: `cd packages/create-tiramisu-docs && bun run build && bun test`
Expected: All pass

**Step 8: Commit**

```
feat: scaffolder generates /mcp route when MCP is enabled
```

---

### Task 8: Update MCP documentation

**Files:**
- Rewrite: `playground/src/docs/framework/integrations/mcp-server.tiramisu`

**Step 1: Rewrite the docs page**

Replace with content explaining:
- MCP server is a hosted HTTP endpoint at `/mcp`
- Deployed automatically with the site (SvelteKit route)
- Enable with `mcp: true` in config
- Or point to a custom server with `mcp: "https://..."`
- How to connect: Claude Code `.mcp.json` example, Cursor, VSCode button
- Available tools table (5 tools)
- The "Connect with MCP" UI buttons

**Step 2: Build playground**

Run: `cd playground && bun run build`
Expected: Success

**Step 3: Commit**

```
docs: rewrite MCP docs for hosted HTTP endpoint
```

---

### Task 9: Final verification

**Step 1: Run all tests**

Run: `cd /Users/pouya/Projects/tiramisu-docs && bun test`
Expected: All tests pass

**Step 2: Build playground**

Run: `cd playground && bun run build`
Expected: Success

**Step 3: Verify MCP endpoint works (manual)**

Run playground dev server and test with curl:
```bash
curl -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
Expected: JSON response with 5 tool definitions
