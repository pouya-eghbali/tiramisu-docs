# Documentation Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace proof-of-concept playground docs with real documentation organized into Framework and Language sections.

**Architecture:** Delete all existing docs, update config with new sections, create fresh content files in `src/docs/en/framework/` and `src/docs/en/language/`. Each doc uses Tiramisu markup with `meta {}` for title/order/group.

**Tech Stack:** Tiramisu markup language, `@tiramisu-docs/kit` config system

---

### Task 1: Clean up and reconfigure

**Files:**
- Delete: `playground/src/docs/en/**/*.tiramisu` (all existing docs)
- Delete: `playground/src/docs/fr/` (French locale — no i18n for now)
- Modify: `playground/src/lib/tiramisu.config.ts`

**Step 1: Delete existing docs**

```bash
rm -rf playground/src/docs/en/*
rm -rf playground/src/docs/fr
```

**Step 2: Update tiramisu.config.ts**

Replace sections and remove i18n:

```ts
import { defineConfig } from "@tiramisu-docs/kit";

export default defineConfig({
  title: "Tiramisu Docs",
  description: "Documentation for the Tiramisu markup language and Tiramisu Docs framework",
  logo: { light: "/logo.svg", dark: "/logo-dark.svg" },
  url: "https://tiramisu-docs.dev",
  nav: [{ label: "Docs", href: "/docs" }],
  github: {
    repo: "user/tiramisu-docs",
    branch: "main",
    dir: "src/docs",
  },
  sidebar: {
    groupOrder: ["Getting Started", "Writing", "Content", "Configuration", "Customization", "Integrations", "Basics", "Internals"],
  },
  sections: [
    { label: "Framework", path: "framework" },
    { label: "Language", path: "language" },
  ],
  mcp: "https://example.com/mcp",
  footer: {
    socials: {
      github: "https://github.com/user/tiramisu-docs",
      x: "https://x.com/tiramisudocs",
      discord: "https://discord.gg/tiramisudocs",
    },
    copyright: "© 2026 Tiramisu Docs",
  },
});
```

**Step 3: Create directory structure**

```bash
mkdir -p playground/src/docs/en/framework/getting-started
mkdir -p playground/src/docs/en/framework/writing/content
mkdir -p playground/src/docs/en/framework/configuration
mkdir -p playground/src/docs/en/framework/customization
mkdir -p playground/src/docs/en/framework/integrations
mkdir -p playground/src/docs/en/language/basics
mkdir -p playground/src/docs/en/language/internals
```

**Step 4: Verify dev server starts**

```bash
cd playground && bun run dev
```

Expected: Server starts (may show empty sidebar since no docs exist yet).

---

### Task 2: Framework — Getting Started (3 files)

**Files:**
- Create: `playground/src/docs/en/framework/getting-started/index.tiramisu`
- Create: `playground/src/docs/en/framework/getting-started/installation.tiramisu`
- Create: `playground/src/docs/en/framework/getting-started/quick-start.tiramisu`

**Content guidelines:**
- `index.tiramisu`: Introduction to Tiramisu Docs. What it is (a documentation framework powered by SvelteKit and the Tiramisu markup language). Key features: file-based routing, built-in search, syntax highlighting, dark mode, i18n support, MCP server, SEO (llms.txt, sitemap, skill.md). Order 1.
- `installation.tiramisu`: Prerequisites (Node.js, bun/npm/pnpm). Scaffolder: `bun create tiramisu-docs my-docs`. Manual setup: install deps, svelte.config.js, vite.config.ts with tiramisuPlugin, app.css with theme import, tiramisu.config.ts with defineConfig. Order 2.
- `quick-start.tiramisu`: Create your first doc page in `src/docs/`. Explain `meta {}` block basics. Show a minimal page with title, heading, paragraph, code block. Run dev server, see it in browser. Order 3.

**Tiramisu syntax notes for content author:**
- Use `codeblock { language = tiramisu, "..." }` for Tiramisu examples (quote content)
- Use `codeblock { language = bash, "..." }` for shell commands
- Use `codeblock { language = typescript, "..." }` for TS config examples
- Use `callout { type = info, ... }` for tips
- Use `bold { }`, `code { }`, `link { url = ..., text }` for inline formatting
- Escape commas with `\,` or quote strings containing commas
- Escape `=` by quoting: `""name = value""`
- Use `steps { }` for numbered instructions

---

### Task 3: Framework — Writing (3 files)

**Files:**
- Create: `playground/src/docs/en/framework/writing/index.tiramisu`
- Create: `playground/src/docs/en/framework/writing/markup-basics.tiramisu`
- Create: `playground/src/docs/en/framework/writing/page-meta.tiramisu`

**Content guidelines:**
- `index.tiramisu`: Overview of writing docs. Files live in `src/docs/`, use `.tiramisu` extension. File-based routing: `src/docs/getting-started.tiramisu` → `/docs/getting-started`. Folder structure creates sidebar groups. Order 1.
- `markup-basics.tiramisu`: Tiramisu syntax within the docs context. Function call syntax `name { }`. Paragraphs separated by blank lines. Inline formatting: `bold`, `italic`, `code`. Links: `link { url = ..., text }`. Nesting function calls. How plain text works (outside function calls = paragraph). Order 2.
- `page-meta.tiramisu`: The `meta {}` block. Fields: title, description, order, group, lastEdited. How title appears in sidebar. How order controls sorting (lower = higher). How group works for root-level files. How folder structure auto-creates groups for nested files. Order 3.

---

### Task 4: Framework — Writing/Content (6 files)

**Files:**
- Create: `playground/src/docs/en/framework/writing/content/index.tiramisu`
- Create: `playground/src/docs/en/framework/writing/content/code-blocks.tiramisu`
- Create: `playground/src/docs/en/framework/writing/content/rich-content.tiramisu`
- Create: `playground/src/docs/en/framework/writing/content/visual-elements.tiramisu`
- Create: `playground/src/docs/en/framework/writing/content/layout.tiramisu`
- Create: `playground/src/docs/en/framework/writing/content/diagrams-math.tiramisu`

**Content guidelines:**
- `index.tiramisu`: Overview of content components available. Brief list linking to sub-pages. Order 1.
- `code-blocks.tiramisu`: `codeblock { language = ..., "code" }`. Supported languages (via Shiki). Syntax highlighting. How to include special characters (use quotes). Order 2.
- `rich-content.tiramisu`: Callouts (`callout { type = info|warning|error|success, text }`). Tabs (`tabs { }`). Steps (`steps { step1, step2 }`). Task lists (`tasklist { "[x] done", "[ ] todo" }`). Accordion (`accordion { title = ..., content }`). Blockquotes (`quote { text, author = ... }`). Badges (`badge { variant = ..., text }`). Show demos of each. Order 3.
- `visual-elements.tiramisu`: Images (`image { src = ..., alt = ... }` with zoom). Tables (`table { row = [...], row = [...] }`). Lists (`list { }` ordered/unordered). Cards (`cards { card { title = ..., description = ..., href = ... } }`). File trees (`filetree { folder { name, file { }, folder { } } }`). Order 4.
- `layout.tiramisu`: Columns layout (`columns { col { }, col { } }`). Demo component (`demo { title = ..., content }`). Order 5.
- `diagrams-math.tiramisu`: Mermaid diagrams (`mermaid { """graph TD...""" }`). Math formulas (`math { "E = mc^2" }`). Note: math content with `=` must be quoted. Mermaid content with special chars should use triple quotes. Both render client-side. Order 6.

---

### Task 5: Framework — Configuration (6 files)

**Files:**
- Create: `playground/src/docs/en/framework/configuration/index.tiramisu`
- Create: `playground/src/docs/en/framework/configuration/sections.tiramisu`
- Create: `playground/src/docs/en/framework/configuration/sidebar.tiramisu`
- Create: `playground/src/docs/en/framework/configuration/i18n.tiramisu`
- Create: `playground/src/docs/en/framework/configuration/footer.tiramisu`
- Create: `playground/src/docs/en/framework/configuration/theme.tiramisu`

**Content guidelines:**
- `index.tiramisu`: Config file at `src/lib/tiramisu.config.ts`. Uses `defineConfig()`. Show full example config. Explain `resolveConfig()` for use in components. Vite plugin reads config via `tiramisuPlugin({ config })`. Order 1.
- `sections.tiramisu`: `sections` array. Each section: label + path (folder in docs) or href (external link). Children for dropdown sections. How sections map to navbar tabs. Each section gets its own sidebar. Order 2.
- `sidebar.tiramisu`: `sidebar.groupOrder` array. How folder-based grouping works. How `meta.group` works for root-level files. Subgroups from nested folders. Index files set group/subgroup labels. Sorting by `meta.order`. Order 3.
- `i18n.tiramisu`: `i18n` config: defaultLocale, locales array (code, label, flag). Folder structure: `src/docs/en/`, `src/docs/fr/`. Fallback behavior. Locale switcher in sidebar. URL structure: `/docs/en/page`. Order 4.
- `footer.tiramisu`: `footer` config. Socials: github, x, discord, bluesky, mastodon, youtube, linkedin — each a URL. Copyright string. Footer renders at bottom of page with social icons and "Powered by Tiramisu" pill. Order 5.
- `theme.tiramisu`: `theme` config. Primary color (HSL string). Border radius. Logo config (string or { light, dark }). Nav links. GitHub integration for edit links. MCP server URL. Order 6.

---

### Task 6: Framework — Customization (3 files)

**Files:**
- Create: `playground/src/docs/en/framework/customization/index.tiramisu`
- Create: `playground/src/docs/en/framework/customization/custom-components.tiramisu`
- Create: `playground/src/docs/en/framework/customization/project-structure.tiramisu`

**Content guidelines:**
- `index.tiramisu`: Tiramisu Docs is fully customizable. Override components, add custom functions, adapt the theme. Order 1.
- `custom-components.tiramisu`: Any unknown function call becomes a custom Svelte component. Convention: `myWidget { }` → imports `src/lib/components/tiramisu/MyWidget.svelte`. Named params become props. Positional content becomes children. Can override built-ins (e.g., create your own `Callout.svelte`). Show complete example: define a function in .tiramisu, create the .svelte component. Order 2.
- `project-structure.tiramisu`: Full project file tree. Explain each key file/folder: `src/docs/` (doc pages), `src/lib/tiramisu.config.ts` (config), `src/lib/components/tiramisu/` (custom components), `src/routes/docs/[...slug]/` (page route), `vite.config.ts` (plugin setup), `svelte.config.js`, `src/app.css` (theme import + tailwind). Order 3.

---

### Task 7: Framework — Integrations (4 files)

**Files:**
- Create: `playground/src/docs/en/framework/integrations/index.tiramisu`
- Create: `playground/src/docs/en/framework/integrations/seo.tiramisu`
- Create: `playground/src/docs/en/framework/integrations/mcp-server.tiramisu`
- Create: `playground/src/docs/en/framework/integrations/llms-txt.tiramisu`

**Content guidelines:**
- `index.tiramisu`: Tiramisu Docs integrates with SEO tools, AI assistants, and development workflows. Order 1.
- `seo.tiramisu`: Sitemap generation (`/sitemap.xml`). Meta tags from doc meta. URL configuration. The `generateSitemap()` function. Order 2.
- `mcp-server.tiramisu`: Built-in MCP server for AI-assisted doc browsing. Config: `mcp: "url"`. What tools it exposes. How to use with Claude, Cursor, etc. The `tiramisu-docs-mcp` CLI command. Order 3.
- `llms-txt.tiramisu`: `/llms.txt` and `/llms-full.txt` endpoints. What they contain. `/skill.md` for Claude Code skills. How these help AI assistants understand your docs. The `generateLlmsTxt()`, `generateLlmsFullTxt()`, `generateSkillMd()` functions. Order 4.

---

### Task 8: Language — Basics (4 files)

**Files:**
- Create: `playground/src/docs/en/language/basics/index.tiramisu`
- Create: `playground/src/docs/en/language/basics/syntax.tiramisu`
- Create: `playground/src/docs/en/language/basics/parameters.tiramisu`
- Create: `playground/src/docs/en/language/basics/strings.tiramisu`

**Content guidelines:**
- `index.tiramisu`: What is Tiramisu? A markup language based on function calls. Not tied to any specific output — the parser produces an AST that can be compiled to anything. Tiramisu Docs compiles it to Svelte, but you could compile to HTML, React, PDF, etc. Simple, consistent syntax. Order 1.
- `syntax.tiramisu`: Function call syntax: `name { content }`. Nesting: `bold { italic { text } }`. Paragraphs: text separated by blank lines. How plain text (outside function calls) becomes paragraph content. Function names: any text before `{`. Escaping function calls: `\bold { }` renders literally as `bold { }`. Order 2.
- `parameters.tiramisu`: Positional params: `func { a, b, c }`. Named params: `func { key = value }`. Mixed: `func { key = value, positional content }`. Arrays: `func { list = [a, b, c] }`. How commas separate parameters. How `=` creates named params. Order 3.
- `strings.tiramisu`: Quoting with `"`: `"text with, commas"`. Escaping quotes with multiple `"`: `""text with "quotes""`. Triple quotes: `"""text with ""double quotes"""`). Backslash escaping: `\,` for literal comma, `\=` for literal equals, `\{` `\}` `\[` `\]` for literal brackets. When to use quotes vs backslash escaping. Order 4.

---

### Task 9: Language — Internals (2 files)

**Files:**
- Create: `playground/src/docs/en/language/internals/index.tiramisu`
- Create: `playground/src/docs/en/language/internals/custom-frontends.tiramisu`

**Content guidelines:**
- `index.tiramisu`: Overview of Tiramisu internals. The parser (`@timeleap/tiramisu`) takes source text and produces an AST. AST node types: Tiramisu (root), Paragraph, MixedText, PureText, FunctionCall, Parameters, Parameter, NamedParameter, ArrayValue, ArrayItem. Brief description of each. Order 1.
- `custom-frontends.tiramisu`: How to write a custom compiler front-end. Install `@timeleap/tiramisu`. Parse source: `import { parse } from "@timeleap/tiramisu/src/index"`. Walk the AST using `instanceof` checks. Handle FunctionCall nodes — check functionName, extract parameters. Example: a minimal compiler that converts Tiramisu to plain HTML. Mention that Tiramisu Docs core (`@tiramisu-docs/core`) is an example of a full compiler front-end. Order 2.

---

### Task 10: Verify and test

**Step 1: Run dev server**

```bash
cd playground && bun run dev
```

Expected: All pages render, sidebar shows correct groups, sections work.

**Step 2: Run tests**

```bash
cd packages/core && bun test
cd packages/kit && bun test
cd packages/create-tiramisu-docs && bun test
```

Expected: All tests pass (doc content changes don't affect tests).

**Step 3: Spot-check pages**

- Navigate through Framework section: Getting Started → Writing → Configuration → Customization → Integrations
- Navigate through Language section: Basics → Internals
- Verify sidebar groups and ordering
- Verify section switching in navbar
- Verify code blocks render with syntax highlighting
- Check that demos/callouts/tables render correctly
