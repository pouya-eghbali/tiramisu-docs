export interface OpenLinkOptions {
  baseUrl: string
  slug: string
  locale?: string
  github?: { repo: string; branch?: string; dir?: string }
  mcp?: boolean | string
  title?: string
}

export interface OpenLink {
  label: string
  href?: string
  copy?: string
  icon: "chatgpt" | "claude" | "cursor" | "github" | "mcp" | "vscode"
  type: "open" | "edit" | "mcp"
}

export function getPageUrl(opts: OpenLinkOptions): string {
  const localePart = opts.locale ? `${opts.locale}/` : ""
  const slug = opts.slug === "index" ? "" : opts.slug.replace(/\/index$/, "")
  return `${opts.baseUrl}/docs/${localePart}${slug}`
}

export function getGitHubEditUrl(opts: OpenLinkOptions): string | null {
  if (!opts.github) return null
  const branch = opts.github.branch ?? "main"
  const dir = opts.github.dir ?? "src/docs"
  const localePart = opts.locale ? `${opts.locale}/` : ""
  return `https://github.com/${opts.github.repo}/edit/${branch}/${dir}/${localePart}${opts.slug}.tiramisu`
}

export function getOpenLinks(opts: OpenLinkOptions): OpenLink[] {
  const pageUrl = getPageUrl(opts)
  const prompt = encodeURIComponent(`Read ${pageUrl} and answer questions about the content.`)
  const cursorPrompt = encodeURIComponent(`Read ${pageUrl}, I want to ask questions about it.`)
  const links: OpenLink[] = [
    { label: "Open in ChatGPT", href: `https://chat.openai.com/?q=${prompt}`, icon: "chatgpt", type: "open" },
    { label: "Open in Claude", href: `https://claude.ai/new?q=${prompt}`, icon: "claude", type: "open" },
    { label: "Open in Cursor", href: `https://cursor.com/link/prompt?text=${cursorPrompt}`, icon: "cursor", type: "open" },
  ]
  if (opts.mcp) {
    const mcpUrl = typeof opts.mcp === "string" ? opts.mcp : `${opts.baseUrl}/mcp`
    links.push({ label: "Connect with MCP", copy: mcpUrl, icon: "mcp", type: "mcp" })
    const mcpMeta = JSON.stringify({ name: opts.title ?? "Documentation", url: mcpUrl })
    links.push({ label: "Connect to VSCode", href: `vscode:mcp/install?${encodeURIComponent(mcpMeta)}`, icon: "vscode", type: "mcp" })
  }
  const ghUrl = getGitHubEditUrl(opts)
  if (ghUrl) links.push({ label: "Edit on GitHub", href: ghUrl, icon: "github", type: "edit" })
  return links
}
