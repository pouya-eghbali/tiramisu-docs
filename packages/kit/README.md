# @tiramisu-docs/kit

Vite plugin, layout components, and theme for building documentation sites with Tiramisu. Provides everything needed to turn a directory of `.tiramisu` files into a fully-featured docs site.

## Installation

```bash
bun add @tiramisu-docs/kit
```

**Peer dependencies:** `svelte ^5.0.0`, `@sveltejs/kit ^2.0.0`, `vite >=6.0.0`

## Setup

### Vite Plugin

```typescript
// vite.config.ts
import { tiramisuPlugin } from "@tiramisu-docs/kit/vite"

export default defineConfig({
  plugins: [tiramisuPlugin()],
})
```

The plugin scans `src/docs/` for `.tiramisu` files and exposes a `virtual:tiramisu-docs` module containing compiled docs, search index, and sidebar data.

### Config

```typescript
// src/lib/tiramisu.config.ts
import { defineConfig } from "@tiramisu-docs/kit"

export default defineConfig({
  title: "My Docs",
  url: "https://docs.example.com",
  mcp: true,
  // ...
})
```

## Exports

| Entry Point | Description |
|-------------|-------------|
| `@tiramisu-docs/kit` | Config helpers (`defineConfig`, `resolveConfig`), SEO generators, types |
| `@tiramisu-docs/kit/vite` | Vite plugin (`tiramisuPlugin`) |
| `@tiramisu-docs/kit/seo` | SEO helpers (sitemap, llms.txt, JSON-LD, Open Graph) |
| `@tiramisu-docs/kit/mcp` | MCP HTTP handler (`handleMcpRequest`) |
| `@tiramisu-docs/kit/components/*` | Svelte layout and UI components |
| `@tiramisu-docs/kit/styles/*` | CSS stylesheets |
| `@tiramisu-docs/kit/types` | TypeScript type definitions |
| `@tiramisu-docs/kit/utils` | Utility functions (cn, class merging) |

## Components

### Layout

- **DocsLayout** — Top-level shell with navbar, sidebar, and content area
- **Navbar** — Top navigation bar with logo, nav links, search, and theme toggle
- **Sidebar** — Collapsible sidebar with groups and items
- **DocPage** — Page wrapper with title, description, table of contents, and SEO tags
- **TableOfContents** — Scrollspy heading navigation

### Tiramisu Built-ins

Svelte components that render Tiramisu built-in functions: `Callout`, `Tabs`, `CodeBlock`, `CodeTabs`, `Steps`, `Badge`, `FileTree`, `NavCard`, `ZoomImage`

## MCP Server

The kit includes a hosted MCP (Model Context Protocol) server that runs as a SvelteKit POST route:

```typescript
// src/routes/mcp/+server.ts
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

Speaks JSON-RPC 2.0 with 5 tools: `search_docs`, `read_doc`, `list_pages`, `list_sections`, `get_table_of_contents`.

## SEO

Helpers for generating SEO routes:

```typescript
import {
  generateSitemap,
  generateLlmsTxt,
  generateLlmsFullTxt,
  generateSkillMd,
  buildCanonicalUrl,
  buildPageJsonLd,
  buildInstantOgUrl,
} from "@tiramisu-docs/kit/seo"
```
