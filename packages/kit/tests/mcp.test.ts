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
