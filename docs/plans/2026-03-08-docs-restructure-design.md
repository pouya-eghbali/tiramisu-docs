# Documentation Restructure Design

## Context

The playground docs were proof-of-concept content. We need real documentation organized into two top-level sections: **Framework** (Tiramisu Docs with SvelteKit) and **Language** (Tiramisu markup language itself).

Tiramisu the language has no built-in functions — it's a parser. All built-in functions (h1, bold, codeblock, callout, etc.) are defined by Tiramisu Docs, so they belong in the Framework section.

## Sections

1. **Framework** (`path: "framework"`) — first in navbar
2. **Language** (`path: "language"`)

## File Structure

```
src/docs/en/
├── framework/
│   ├── getting-started/
│   │   ├── index.tiramisu          (Introduction)
│   │   ├── installation.tiramisu
│   │   └── quick-start.tiramisu
│   ├── writing/
│   │   ├── index.tiramisu          (Overview)
│   │   ├── markup-basics.tiramisu
│   │   ├── page-meta.tiramisu
│   │   └── content/
│   │       ├── index.tiramisu      (Content overview)
│   │       ├── code-blocks.tiramisu
│   │       ├── rich-content.tiramisu
│   │       ├── visual-elements.tiramisu
│   │       ├── layout.tiramisu
│   │       └── diagrams-math.tiramisu
│   ├── configuration/
│   │   ├── index.tiramisu          (Config file overview)
│   │   ├── sections.tiramisu
│   │   ├── sidebar.tiramisu
│   │   ├── i18n.tiramisu
│   │   ├── footer.tiramisu
│   │   └── theme.tiramisu
│   ├── customization/
│   │   ├── index.tiramisu
│   │   ├── custom-components.tiramisu
│   │   └── project-structure.tiramisu
│   └── integrations/
│       ├── index.tiramisu
│       ├── seo.tiramisu
│       ├── mcp-server.tiramisu
│       └── llms-txt.tiramisu
└── language/
    ├── basics/
    │   ├── index.tiramisu          (What is Tiramisu?)
    │   ├── syntax.tiramisu         (Function calls, nesting)
    │   ├── parameters.tiramisu     (Positional, named, arrays)
    │   └── strings.tiramisu        (Quoting, escaping, commas, special chars)
    └── internals/
        ├── index.tiramisu          (AST overview)
        └── custom-frontends.tiramisu (Writing a compiler front-end)
```

## Config Changes

```ts
sections: [
  { label: "Framework", path: "framework" },
  { label: "Language", path: "language" },
]
```

## Approach

- Delete all existing docs under `src/docs/en/` (proof-of-concept content)
- Delete French locale docs (`src/docs/fr/`)
- Create fresh content for all pages listed above
- Update `tiramisu.config.ts` with new sections, remove old groupOrder
