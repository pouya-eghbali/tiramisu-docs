# Landing Page Design

## Goal

Build a product landing page for Tiramisu Docs at the playground root (`/`). Developer-friendly tone, inspired by Fumadocs' landing page. Sells Tiramisu Docs as a documentation framework to adopt.

## Assets Required

1. **Hero background image** — tiramisu/dessert photo, dark-toned preferred
2. **Docs screenshot** — screenshot of the playground docs site (perspective-tilted in the hero)

Use placeholder paths until provided: `/hero-bg.jpg`, `/docs-screenshot.png`

## Sections (8 total)

### 1. Hero

- Full-width tiramisu background photo with dark overlay (70-80% opacity)
- Left-aligned content within max-width container:
  - Pill badge: "The docs framework you'll love"
  - Headline: **"A delightful language for documentation"**
  - Subtitle: "Write docs in Tiramisu markup, get a beautiful site powered by SvelteKit. No MDX, no config files, no friction."
  - Two CTAs: "Get Started" (primary → /docs) + "GitHub" (outline → repo)
- Docs screenshot below, centered, perspective-tilted with shadow, overlapping into next section
- Navbar: logo + "Tiramisu Docs" left, "Documentation" + "GitHub" + dark mode toggle right

### 2. Intro Blurb

- Centered large-font paragraph with key terms bolded:
  > Tiramisu Docs is a **SvelteKit** documentation framework built around the **Tiramisu markup language**. A clean syntax with no angle brackets, no closing tags, and no import hell. Just write — and get beautiful, fast documentation.
- Generous whitespace above and below

### 3. Quick Start

- Centered heading: "Get started in seconds"
- Terminal-style card with `bun create tiramisu-docs`
- Monospace font, dark background, copy button on hover

### 4. No MDX Hell

- Heading: **"No MDX Hell"**
- Intro: "Other tools make you fight your markup. Tiramisu stays out of your way."
- Before/after code blocks stacked vertically:
  - **Before (MDX)** — red/muted accent label, shows imports + JSX + nested components
  - **After (Tiramisu)** — green/primary accent label, shows same content in clean Tiramisu syntax
- 3 bullet points below:
  - No imports — built-in functions just work
  - No JSX — no angle brackets, no closing tags
  - No config — components resolve by convention

### 5. Features Grid

- Heading: "Everything you need"
- 3x2 grid (2x3 on mobile), 6 cards:

| Icon | Title | Description |
|------|-------|-------------|
| `lucide:folder-tree` | File-Based Routing | Drop a `.tiramisu` file in `src/docs/` and it becomes a page. |
| `lucide:search` | Built-In Search | Full-text search across all your docs, zero config. |
| `lucide:paintbrush` | Syntax Highlighting | Powered by Shiki with dual themes and 100+ languages. |
| `lucide:moon` | Dark Mode | Light and dark themes out of the box. |
| `lucide:globe` | Sections & i18n | Split docs into sections. Add translations with a folder per locale. |
| `lucide:bot` | AI-Ready | Built-in MCP server and llms.txt for AI assistants. |

- Cards: bordered, subtle background, icon + title + description, no links

### 6. How It Works

- Heading: "Three steps to docs"
- Horizontal 3-step layout (vertical on mobile):
  1. **Create** — `bun create tiramisu-docs` — One command to scaffold your project.
  2. **Write** — Small inline Tiramisu snippet showing a few lines of markup.
  3. **Ship** — Your docs are live. Routing, search, navigation — all automatic.
- Oversized number badges, clean and minimal

### 7. Built with SvelteKit

- Heading: "Powered by SvelteKit"
- Centered paragraph: "Built on Svelte 5 and Vite. Fast builds, instant HMR, and the full power of SvelteKit when you need it. Every component is overridable — swap any built-in with your own."
- 3 items in a row (icon + label): Svelte 5, Vite, Tailwind CSS
- Iconify devicon icons: `devicon-plain:svelte`, `devicon-plain:vitejs`, `devicon-plain:tailwindcss`

### 8. CTA Footer

- Subtle darker background or gradient
- Centered: heading "Build your docs", subtitle "Get started with Tiramisu Docs in minutes."
- Two buttons: "Get Started" (primary → /docs) + "GitHub" (outline)
- "Powered by Tiramisu" footer element below

## Technical Approach

- Single Svelte component: `playground/src/routes/+page.svelte`
- Uses `iconify-icon` for all icons (already available)
- Reuses existing theme toggle logic and CSS variables from the docs theme
- Imports `../app.css` via the existing root layout
- Responsive: all sections stack on mobile, grids collapse
- Dark mode support throughout via existing CSS custom properties
- No new dependencies needed

## Visual Style

- Color palette: inherit from existing theme (CSS variables)
- Typography: Geist font family (already loaded)
- Code blocks: same dark style as docs code blocks
- Cards: bordered with subtle muted background, like existing NavCard
- Spacing: generous — each section has significant vertical padding
- Dark mode: full support, backgrounds and overlays adapt
