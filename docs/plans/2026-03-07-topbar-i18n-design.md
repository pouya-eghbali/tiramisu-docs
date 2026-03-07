# Design: Top-bar Sections Navigation & i18n

**Date:** 2026-03-07

## Overview

Two features inspired by GitBook:

1. **Top-bar sections navigation** — A persistent top bar where major doc sections (e.g. "Guides", "API Reference") appear as tabs. Clicking a section replaces the sidebar tree. Supports dropdowns and external links.
2. **i18n / translations** — Multi-language docs with a language switcher, locale-prefixed URLs, and configurable fallback behavior.

Both are opt-in via config. Existing projects are unaffected.

---

## Config

```ts
interface TiramisuDocsConfig {
  // ... existing fields (title, description, logo, sidebar, theme)

  sections?: SectionConfig[]

  i18n?: {
    defaultLocale: string
    locales: LocaleConfig[]
    fallback?: "default-language" | "404"  // default: "default-language"
  }
}

interface SectionConfig {
  label: string
  path?: string              // maps to src/docs/{path}/
  href?: string              // external URL
  children?: SectionConfig[] // dropdown group
}

interface LocaleConfig {
  code: string   // "en", "fr"
  label: string  // "English", "Français"
  flag?: string  // "🇺🇸", "🇫🇷"
}
```

- `sections` undefined → no top bar, current behavior
- `sections` defined → top bar rendered, each `path` gets its own sidebar tree
- `i18n` undefined → no language support, routes stay `/docs/[...slug]`
- `i18n` defined → routes become `/docs/[locale]/[...slug]`, language switcher appears

---

## File Structure & Routing

### Without i18n, with sections

```
src/docs/
  index.tiramisu              → implicit section (site title)
  guides/
    getting-started.tiramisu  → "Guides" section
  api/
    endpoints.tiramisu        → "API" section
```

Routes: `/docs/guides/getting-started`, `/docs/api/endpoints`

### With i18n and sections

```
src/docs/
  en/
    index.tiramisu
    guides/getting-started.tiramisu
    api/endpoints.tiramisu
  fr/
    index.tiramisu
    guides/getting-started.tiramisu
```

Routes: `/docs/en/guides/getting-started`, `/docs/fr/guides/getting-started`

### Routing logic

- With i18n: first URL segment is locale, rest is slug. If first segment isn't a known locale, treat as slug with default locale (backwards compat redirect).
- Section derived from slug: first segment (after locale) matched against `sections[].path`.
- `/docs/` (no locale) redirects to `/docs/{defaultLocale}/`.

### Root-level docs (implicit section)

Files directly in `src/docs/` (or `src/docs/{locale}/`) that don't belong to any section folder get grouped under an implicit section labeled with `config.title`. Appears first in the top bar.

### Fallback behavior (i18n)

- `"default-language"`: serve default locale version with a banner: "This page is not available in {language}. Showing the {default} version."
- `"404"`: standard 404 page.

---

## Virtual Module

### New shape

```ts
// With sections configured
sections: Section[]

interface Section {
  label: string
  path?: string
  href?: string
  children?: Section[]
  sidebar?: SidebarGroup[]  // built per section path
}

// With i18n, everything keyed by locale
locales: {
  [code: string]: {
    sections: Section[]
    docs: DocMeta[]
    docImports: Record<string, () => Promise<...>>
    searchIndex: SearchEntry[]
  }
}

// Without sections or i18n: flat exports (backwards compat)
sidebar: SidebarGroup[]
docs: DocMeta[]
docImports: Record<string, () => Promise<...>>
searchIndex: SearchEntry[]
```

### Vite plugin changes

- `sections` configured: scan each `path` folder, build sidebar tree per section
- `i18n` configured: scan each `src/docs/{locale}/` folder, repeat per locale
- Neither: current behavior, flat exports
- Per-locale data loaded via dynamic import (not all locales shipped at once)

---

## Components

### TopBar (new)

- Persistent top bar, above everything, full width
- Height ~3rem, `bg-card`, bottom border
- **Desktop:** logo + title left, section items center-left, language switcher + search + theme toggle right
- **Mobile:** two rows:
  - Row 1: hamburger + logo/title + search icon
  - Row 2: section items, horizontally scrollable (no visible scrollbar)
- Section items: buttons for `path` sections (navigate + swap sidebar), links for `href` sections
- Active section highlighted
- Dropdown sections: hover (desktop) / tap (mobile) shows popover with children
- External links open in new tab

### Sidebar changes

- No longer renders logo/title (moved to TopBar)
- No longer renders theme toggle (moved to TopBar)
- Search button stays
- Receives only active section's sidebar tree
- Otherwise identical

### Navbar → replaced by TopBar

Current mobile Navbar absorbed into TopBar's mobile layout (hamburger + logo row + scrollable sections row). Hamburger opens sidebar sheet scoped to active section.

### LanguageSwitcher (new)

- Dropdown in TopBar, right side
- Shows current flag + label (e.g. "🇺🇸 English")
- Lists all locales, clicking navigates to same page in new locale
- Fallback handled at page level

### FallbackBanner (new)

- Banner above page content
- "This page is not available in {language}. Showing the {default} version."
- Only rendered when serving a fallback page

### DocsLayout changes

- Adds TopBar above current layout
- Derives active section + locale from URL
- Passes active section's sidebar to Sidebar
- Passes locale context to children

---

## Data Flow

```
URL: /docs/fr/api/endpoints

+page.ts parses:
  locale = "fr"
  section = "api"
  pageSlug = "endpoints"

loads from virtual module:
  locales.fr.sections → find section path "api" → sidebar
  locales.fr.docImports["api/endpoints"] → component

if import missing & fallback = "default-language":
  locales.en.docImports["api/endpoints"] → fallback
  showFallbackBanner = true

returns to +page.svelte:
  { component, meta, headings, sections, activeSection, locale, showFallbackBanner }

DocsLayout distributes:
  sections → TopBar
  activeSection.sidebar → Sidebar
  locale → LanguageSwitcher
  headings → TableOfContents
```

### Search scoping

- Searches within current locale only
- Searches across all sections (results show section label)

---

## Edge Cases

- Section `path` with no matching folder: section appears in top bar, empty sidebar. No build error.
- Folder exists but not in `sections` config: docs built and accessible by URL, but not in navigation.
- Empty locale folder: valid. Language switcher still shows it.
- Missing default locale folder: build error.
- URL with no locale prefix and i18n enabled: redirect to `/docs/{defaultLocale}/{slug}`.
- Sections config shared across locales. A section's sidebar may be empty for a given locale.
- Existing projects (no `sections`, no `i18n`): zero breaking changes.
