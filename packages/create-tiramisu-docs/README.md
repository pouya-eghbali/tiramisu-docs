# create-tiramisu-docs

CLI scaffolder for creating new Tiramisu Docs projects. Generates a complete SvelteKit project with docs layout, theme, configuration, and optional features.

## Usage

```bash
bun create tiramisu-docs my-docs
# or
npx create-tiramisu-docs my-docs
# or
pnpm create tiramisu-docs my-docs
```

The CLI walks you through:

1. **Project name** — Directory name and package name
2. **Package manager** — bun, npm, or pnpm
3. **Sections** — Multi-section docs (e.g. Guide + API)
4. **Internationalization** — Multi-language support with locale selection
5. **Instant OG** — Open Graph image generation via [InstantOG](https://instantog.com)
6. **MCP server** — AI-accessible documentation endpoint

## Generated Project

```
my-docs/
├── src/
│   ├── docs/              # Your .tiramisu documentation files
│   ├── lib/
│   │   ├── tiramisu.config.ts
│   │   └── components/
│   │       └── ui/        # shadcn-svelte components
│   └── routes/
│       ├── docs/[...slug]/ # Doc page route
│       ├── sitemap.xml/    # Auto-generated sitemap
│       ├── llms.txt/       # LLM-friendly index
│       ├── llms-full.txt/  # Full-text LLM index
│       ├── skill.md/       # MCP skill definition
│       └── mcp/            # MCP endpoint (if enabled)
├── svelte.config.js
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

## Programmatic API

```typescript
import { generateProjectFiles } from "create-tiramisu-docs/scaffold"

const files = generateProjectFiles({
  name: "my-docs",
  sections: true,
  i18n: false,
  defaultLocale: "en",
  locales: [],
  mcp: true,
})

// files: Array<{ path: string, content: string }>
```
