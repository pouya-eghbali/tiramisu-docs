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
