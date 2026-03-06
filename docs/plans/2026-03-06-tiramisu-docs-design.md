# Tiramisu Docs — Design Document

## Overview

A documentation generator for library/tool authors, powered by SvelteKit 5, shadcn-svelte, and the Tiramisu markup language. Users write `.tiramisu` files, get a full docs site with `bun run dev`.

## Architecture: SvelteKit Vite Plugin

The core approach is a Vite plugin that transforms `.tiramisu` files into Svelte components at build time, integrated into SvelteKit's routing and build pipeline.

### Compilation Pipeline

```
.tiramisu file
    → Vite plugin intercepts import
    → tiramisu parser → AST
    → Core compiler → Svelte component source
    → Vite passes to Svelte compiler
    → Rendered page
```

## Monorepo Structure (bun workspace)

```
tiramisu-docs/
├── packages/
│   ├── create-tiramisu-docs/     # CLI scaffolder
│   ├── @tiramisu-docs/core/      # Parser bridge + .tiramisu → Svelte compiler
│   └── @tiramisu-docs/kit/       # Vite plugin, layouts, components, theme
├── package.json                  # bun workspace root
└── bun.lock
```

### Package Responsibilities

- **`create-tiramisu-docs`** — CLI scaffolder. Prompts: project name, package manager (bun/npm/pnpm), theme (default/minimal). Generates a SvelteKit project with kit as a dependency.
- **`@tiramisu-docs/core`** — Wraps the `tiramisu` parser. Compiles AST → Svelte component source using a built-in translation map. Handles component resolution logic.
- **`@tiramisu-docs/kit`** — Vite plugin, default layouts (sidebar, nav, doc page), default theme via shadcn-svelte, file-based routing glue.

## User's Project Structure (after scaffolding)

```
my-docs/
├── src/
│   ├── docs/                          # .tiramisu content (file-based routing)
│   │   ├── getting-started.tiramisu
│   │   ├── guides/
│   │   │   ├── installation.tiramisu
│   │   │   └── configuration.tiramisu
│   │   └── api/
│   │       └── reference.tiramisu
│   ├── lib/
│   │   └── components/
│   │       └── tiramisu/              # Custom component overrides
│   │           └── Chart.svelte       # chart { } resolves here
│   ├── routes/                        # SvelteKit routes (user overrides)
│   │   └── +page.svelte              # Custom landing page
│   └── app.html
├── tiramisu.config.ts
├── svelte.config.js
├── vite.config.ts
└── package.json
```

### Routing

- `src/docs/` is the content directory
- File paths map to routes: `src/docs/guides/installation.tiramisu` → `/docs/guides/installation`
- The Vite plugin generates a virtual module (`virtual:tiramisu-docs`) exporting the sidebar tree and route manifest
- Kit's `src/routes/docs/[...slug]/+page.svelte` catch-all route consumes this

### Metadata via Frontmatter

Each `.tiramisu` file can declare metadata:

```
meta { title = Getting Started, order = 1, group = Basics, description = "Learn the basics" }
```

Extracted at compile time, used to build the sidebar tree automatically.

## Built-in Functions

| Function | Renders as |
|---|---|
| `meta { ... }` | Page metadata (not rendered) |
| `h1 { }` – `h6 { }` | Heading with anchor link |
| `bold { }`, `italic { }`, `code { }` | Inline formatting |
| `link { url = ..., text }` | Anchor tag |
| `image { src = ..., alt = ... }` | Image with optional caption |
| `codeblock { language = ..., "..." }` | Syntax-highlighted code (shiki) |
| `list { }` / `list { type = ordered }` | Unordered/ordered list |
| `table { row = [...], ... }` | Table |
| `callout { type = warning, ... }` | Alert (shadcn-svelte Alert) |
| `tabs { tab = [...], ... }` | Tabbed content (shadcn-svelte Tabs) |
| `steps { step = ..., ... }` | Step-by-step guide |
| `badge { variant = ..., text }` | Inline badge |

## Component Resolution

Order of precedence:

1. User's `src/lib/components/tiramisu/FunctionName.svelte`
2. Kit's built-in component
3. Not found → compile-time warning + plain text with debug border in dev

### Custom Component Contract

```svelte
<!-- src/lib/components/tiramisu/Chart.svelte -->
<script>
  // chart { type = bar, data = [1, 2, 3] }
  let { type, data, children } = $props()
</script>
```

Named params → props. Positional params → `children`.

## Customization: Override by Convention

- **Components:** Place `FunctionName.svelte` in `src/lib/components/tiramisu/` to override any built-in
- **Layout components:** Place `Sidebar.svelte`, `Navbar.svelte`, etc. in the same path to override kit defaults
- **Pages:** Standard SvelteKit — `src/routes/+page.svelte` overrides the default landing page. Users can add any routes.

## Config (`tiramisu.config.ts`)

```ts
import { defineConfig } from '@tiramisu-docs/kit'

export default defineConfig({
  title: 'My Project',
  description: 'Documentation for My Project',
  logo: '/logo.svg',
  nav: [
    { label: 'Docs', href: '/docs' },
    { label: 'GitHub', href: 'https://github.com/...' },
  ],
  sidebar: {
    groupOrder: ['Getting Started', 'Guides', 'API'],
  },
  theme: {
    primary: 'hsl(262, 83%, 58%)',
    radius: '0.5rem',
  },
})
```

## Theme System

Uses shadcn-svelte's CSS variable approach. Kit ships a default theme. Users override via `theme` in config or their own `app.css`.

### Default Layout Components (from kit)

- `DocsLayout` — sidebar + main content + table of contents
- `Navbar` — top navigation
- `Sidebar` — auto-generated from sidebar tree
- `DocPage` — single doc page with prev/next navigation
- `TableOfContents` — extracted from heading nodes

## CLI Scaffolder

```
$ bun create tiramisu-docs

◆ Project name: my-docs
◆ Package manager: bun / npm / pnpm
◆ Theme: default / minimal

Scaffolding my-docs...
✓ Created project
✓ Installed dependencies
✓ Done! Run:
  cd my-docs
  bun run dev
```

Dev/build commands are standard SvelteKit: `bun run dev`, `bun run build`, `bun run preview`.

## Key Decisions

| Decision | Choice |
|---|---|
| Audience | Library/tool authors |
| Architecture | SvelteKit Vite plugin |
| Packages | `create-tiramisu-docs` + `@tiramisu-docs/core` + `@tiramisu-docs/kit` |
| Routing | File-based from `src/docs/` |
| Metadata | `meta {}` frontmatter in `.tiramisu` files |
| Built-ins | Rich set + custom Svelte components by convention |
| Customization | Override by convention (user files win) |
| CLI | Minimal choices (name, pkg manager, theme) |
| Theme | shadcn-svelte CSS variables |
