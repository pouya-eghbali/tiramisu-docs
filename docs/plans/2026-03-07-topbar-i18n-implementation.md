# Top-bar Sections & i18n Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add opt-in top-bar section navigation (GitBook-style) and multi-language documentation support.

**Architecture:** Config-driven. The Vite plugin scans docs per-section and per-locale at build time, producing a virtual module that exports locale-keyed, section-grouped data. A new TopBar component renders section tabs and language switcher. Sidebar receives only the active section's tree. Routing adds optional locale prefix. Everything is backwards-compatible — no sections/i18n config means identical behavior to today.

**Tech Stack:** SvelteKit 5, Vite plugin, existing shadcn-svelte UI components (Collapsible, ScrollArea)

**Design doc:** `docs/plans/2026-03-07-topbar-i18n-design.md`

---

## Phase 1: Top-bar Sections Navigation

### Task 1: Extend config types for sections

**Files:**
- Modify: `packages/kit/src/config.ts`
- Test: `packages/kit/tests/config.test.ts`

**Step 1: Write the failing test**

In `packages/kit/tests/config.test.ts`, add:

```ts
it("resolves sections config", () => {
  const config = resolveConfig({
    sections: [
      { label: "Guides", path: "guides" },
      { label: "Reference", children: [
        { label: "API", path: "api" },
        { label: "CLI", path: "cli" },
      ]},
      { label: "Blog", href: "https://blog.example.com" },
    ],
  })
  expect(config.sections).toHaveLength(3)
  expect(config.sections![0].label).toBe("Guides")
  expect(config.sections![1].children).toHaveLength(2)
  expect(config.sections![2].href).toBe("https://blog.example.com")
})

it("resolves undefined sections as undefined", () => {
  const config = resolveConfig({})
  expect(config.sections).toBeUndefined()
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/kit && bun test tests/config.test.ts`
Expected: FAIL — `sections` doesn't exist on types

**Step 3: Write minimal implementation**

In `packages/kit/src/config.ts`, add the types and update `resolveConfig`:

```ts
export interface SectionConfig {
  label: string
  path?: string
  href?: string
  children?: SectionConfig[]
}

// Add to TiramisuDocsConfig:
  sections?: SectionConfig[]

// Add to ResolvedConfig:
  sections?: SectionConfig[]

// In resolveConfig, add:
  sections: config.sections,
```

Also export `SectionConfig` from `packages/kit/src/index.ts`.

**Step 4: Run test to verify it passes**

Run: `cd packages/kit && bun test tests/config.test.ts`
Expected: PASS

**Step 5: Commit**

```
feat: add sections config type
```

---

### Task 2: Build per-section sidebar trees in Vite plugin

**Files:**
- Modify: `packages/kit/src/vite.ts`
- Test: `packages/kit/tests/vite.test.ts`

**Step 1: Write the failing tests**

In `packages/kit/tests/vite.test.ts`, add:

```ts
import { buildSectionSidebars } from "../src/vite"

describe("buildSectionSidebars", () => {
  it("groups docs by section path", () => {
    const docs = [
      { slug: "guides/intro", meta: { title: "Intro", order: 1 } },
      { slug: "guides/advanced", meta: { title: "Advanced", order: 2 } },
      { slug: "api/endpoints", meta: { title: "Endpoints", order: 1 } },
    ]
    const sections = [
      { label: "Guides", path: "guides" },
      { label: "API", path: "api" },
    ]
    const result = buildSectionSidebars(docs, sections)
    expect(result).toHaveLength(2)
    expect(result[0].label).toBe("Guides")
    expect(result[0].sidebar).toHaveLength(1) // one group
    expect(result[0].sidebar![0].items).toHaveLength(2)
    expect(result[1].label).toBe("API")
    expect(result[1].sidebar).toHaveLength(1)
  })

  it("root-level docs go into implicit section", () => {
    const docs = [
      { slug: "index", meta: { title: "Home", order: 1 } },
      { slug: "guides/intro", meta: { title: "Intro", order: 1 } },
    ]
    const sections = [{ label: "Guides", path: "guides" }]
    const result = buildSectionSidebars(docs, sections, "My Docs")
    // Implicit section comes first
    expect(result[0].label).toBe("My Docs")
    expect(result[0].sidebar).toHaveLength(1)
    expect(result[1].label).toBe("Guides")
  })

  it("dropdown sections pass through with children sidebars", () => {
    const docs = [
      { slug: "api/endpoints", meta: { title: "Endpoints", order: 1 } },
      { slug: "cli/commands", meta: { title: "Commands", order: 1 } },
    ]
    const sections = [
      { label: "Reference", children: [
        { label: "API", path: "api" },
        { label: "CLI", path: "cli" },
      ]},
    ]
    const result = buildSectionSidebars(docs, sections)
    expect(result).toHaveLength(1)
    expect(result[0].label).toBe("Reference")
    expect(result[0].children).toHaveLength(2)
    expect(result[0].children![0].sidebar).toHaveLength(1)
    expect(result[0].children![1].sidebar).toHaveLength(1)
  })

  it("external href sections have no sidebar", () => {
    const docs = []
    const sections = [{ label: "Blog", href: "https://blog.example.com" }]
    const result = buildSectionSidebars(docs, sections)
    expect(result).toHaveLength(1)
    expect(result[0].href).toBe("https://blog.example.com")
    expect(result[0].sidebar).toBeUndefined()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/kit && bun test tests/vite.test.ts`
Expected: FAIL — `buildSectionSidebars` doesn't exist

**Step 3: Write minimal implementation**

In `packages/kit/src/vite.ts`, add and export `buildSectionSidebars`:

```ts
export interface ResolvedSection {
  label: string
  path?: string
  href?: string
  children?: ResolvedSection[]
  sidebar?: SidebarGroup[]
}

export function buildSectionSidebars(
  docs: { slug: string; meta: DocMeta }[],
  sections: SectionConfig[],
  implicitLabel?: string
): ResolvedSection[] {
  // Find docs not belonging to any section path
  const allSectionPaths = flattenSectionPaths(sections)
  const rootDocs = docs.filter(
    (d) => !allSectionPaths.some((p) => d.slug === p || d.slug.startsWith(p + "/"))
  )

  const result: ResolvedSection[] = []

  // Add implicit section for root-level docs if any exist
  if (rootDocs.length > 0) {
    result.push({
      label: implicitLabel ?? "Docs",
      sidebar: buildSidebarTree(rootDocs),
    })
  }

  // Build each configured section
  for (const section of sections) {
    result.push(resolveSection(docs, section))
  }

  return result
}

function flattenSectionPaths(sections: SectionConfig[]): string[] {
  const paths: string[] = []
  for (const s of sections) {
    if (s.path) paths.push(s.path)
    if (s.children) paths.push(...flattenSectionPaths(s.children))
  }
  return paths
}

function resolveSection(
  docs: { slug: string; meta: DocMeta }[],
  section: SectionConfig
): ResolvedSection {
  if (section.href) {
    return { label: section.label, href: section.href }
  }
  if (section.children) {
    return {
      label: section.label,
      children: section.children.map((c) => resolveSection(docs, c)),
    }
  }
  // Path-based section: filter docs whose slug starts with section.path
  const sectionDocs = docs
    .filter((d) => d.slug === section.path || d.slug.startsWith(section.path + "/"))
    .map((d) => ({
      // Strip section prefix from slug for sidebar building
      slug: d.slug.startsWith(section.path + "/")
        ? d.slug.slice(section.path!.length + 1)
        : d.slug.split("/").pop()!,
      meta: d.meta,
    }))

  return {
    label: section.label,
    path: section.path,
    sidebar: buildSidebarTree(sectionDocs),
  }
}
```

Import `SectionConfig` from `./config.js` at the top of vite.ts.

**Step 4: Run test to verify it passes**

Run: `cd packages/kit && bun test tests/vite.test.ts`
Expected: PASS

**Step 5: Commit**

```
feat: build per-section sidebar trees in Vite plugin
```

---

### Task 3: Update virtual module to export sections

**Files:**
- Modify: `packages/kit/src/vite.ts` (the `buildVirtualModule` function)
- Modify: `packages/kit/src/virtual.d.ts`

**Step 1: Update `buildVirtualModule`**

In `packages/kit/src/vite.ts`, modify `buildVirtualModule()`:
- Accept the resolved config (or at least `sections` and `title`) as a parameter. The plugin options need to include the config, or the plugin reads it. Since config is currently user-side only, the plugin options need a new `sections` field and `title` field.
- Actually, looking at the architecture, `tiramisuPlugin` options should accept `sections` and `title`:

```ts
export interface TiramisuPluginOptions {
  docsDir?: string
  componentsDir?: string
  groupOrder?: string[]
  sections?: SectionConfig[]
  title?: string  // for implicit section label
}
```

Then in `buildVirtualModule`:

```ts
// After building docs array...
if (options.sections) {
  const resolvedSections = buildSectionSidebars(docs, options.sections, options.title)
  // Export sections instead of sidebar
  return [
    `export const sections = ${JSON.stringify(resolvedSections, null, 2)};`,
    `export const sidebar = [];`, // backwards compat empty
    `export const docs = ${JSON.stringify(docs, null, 2)};`,
    `export const searchIndex = ${JSON.stringify(searchIndex)};`,
    `export const docImports = {\n${importsEntries}\n};`,
  ].join("\n\n")
} else {
  // Current behavior unchanged
  return [
    `export const sections = undefined;`,
    `export const sidebar = ${JSON.stringify(sidebar, null, 2)};`,
    `export const docs = ${JSON.stringify(docs, null, 2)};`,
    `export const searchIndex = ${JSON.stringify(searchIndex)};`,
    `export const docImports = {\n${importsEntries}\n};`,
  ].join("\n\n")
}
```

**Step 2: Update virtual.d.ts**

```ts
declare module "virtual:tiramisu-docs" {
  export const sections: {
    label: string
    path?: string
    href?: string
    children?: typeof sections
    sidebar?: {
      label: string
      items: any[]
    }[]
  }[] | undefined

  export const sidebar: {
    label: string
    items: { title: string; slug: string; order: number }[]
  }[]

  export const docs: {
    slug: string
    meta: { title?: string; description?: string; order?: number; group?: string }
    headings: { level: number; text: string; id: string }[]
  }[]

  export const docImports: Record<string, () => Promise<{ default: any }>>
  export const searchIndex: any[]
}
```

**Step 3: Build and verify**

Run: `cd packages/kit && bun run build`
Expected: No errors

**Step 4: Commit**

```
feat: export sections from virtual module
```

---

### Task 4: Create TopBar component

**Files:**
- Create: `packages/kit/src/lib/components/TopBar.svelte`

**Step 1: Build the component**

```svelte
<script>
  import { page } from "$app/stores"

  let { config, sections = [], locale, locales, onSearchClick, onMenuClick } = $props()

  let dark = $state(false)

  function initTheme() {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("theme")
    dark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", dark)
  }

  function toggleTheme() {
    dark = !dark
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
  }

  function isActiveSection(section, pathname) {
    if (section.path) {
      // Check if current path is within this section
      const prefix = locale ? `/docs/${locale}/${section.path}` : `/docs/${section.path}`
      return pathname.startsWith(prefix)
    }
    if (section.children) {
      return section.children.some((c) => isActiveSection(c, pathname))
    }
    return false
  }

  function sectionHref(section) {
    if (section.href) return section.href
    if (section.path) {
      return locale ? `/docs/${locale}/${section.path}` : `/docs/${section.path}`
    }
    return locale ? `/docs/${locale}` : "/docs"
  }

  $effect(() => {
    initTheme()
  })

  let openDropdown = $state(null)
</script>

<!-- Row 1: logo, hamburger (mobile), search, theme, language -->
<header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="mx-auto flex h-14 max-w-[90rem] items-center gap-4 px-4">
    <!-- Hamburger (mobile only) -->
    <button
      onclick={onMenuClick}
      class="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
      aria-label="Toggle menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" x2="20" y1="12" y2="12"></line>
        <line x1="4" x2="20" y1="6" y2="6"></line>
        <line x1="4" x2="20" y1="18" y2="18"></line>
      </svg>
    </button>

    <!-- Logo + title -->
    <a href="/" class="flex items-center gap-2">
      {#if config.logo.light || config.logo.dark}
        <img src={config.logo.light} alt="" class="h-5 w-5 dark:hidden" />
        <img src={config.logo.dark || config.logo.light} alt="" class="hidden h-5 w-5 dark:block" />
      {/if}
      <span class="text-sm font-bold">{config.title}</span>
    </a>

    <div class="flex-1"></div>

    <!-- Right side: search, language, theme -->
    <button
      onclick={onSearchClick}
      class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      aria-label="Search"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </svg>
    </button>

    {#if locales?.length > 1}
      <div class="relative">
        <button
          onclick={() => (openDropdown = openDropdown === "lang" ? null : "lang")}
          class="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {#each locales as loc}
            {#if loc.code === locale}
              {loc.flag ?? ""} {loc.label}
            {/if}
          {/each}
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
        </button>
        {#if openDropdown === "lang"}
          <div class="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-md border bg-popover p-1 shadow-md">
            {#each locales as loc}
              {@const currentPath = $page.url.pathname}
              {@const newPath = currentPath.replace(`/docs/${locale}`, `/docs/${loc.code}`)}
              <a
                href={newPath}
                onclick={() => (openDropdown = null)}
                class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent
                  {loc.code === locale ? 'font-medium text-foreground' : 'text-muted-foreground'}"
              >
                {#if loc.flag}<span>{loc.flag}</span>{/if}
                {loc.label}
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <button
      onclick={toggleTheme}
      class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle dark mode"
    >
      <svg class="h-4 w-4 dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path><path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path><path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>
      </svg>
      <svg class="hidden h-4 w-4 dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    </button>
  </div>

  <!-- Row 2: section tabs (scrollable) -->
  {#if sections?.length > 0}
    <nav class="scrollbar-none mx-auto flex max-w-[90rem] items-center gap-1 overflow-x-auto px-4">
      {#each sections as section}
        {#if section.children}
          <!-- Dropdown section -->
          <div class="relative">
            <button
              onclick={() => (openDropdown = openDropdown === section.label ? null : section.label)}
              class="flex shrink-0 items-center gap-1 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors
                {isActiveSection(section, $page.url.pathname)
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'}"
            >
              {section.label}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
            </button>
            {#if openDropdown === section.label}
              <div class="absolute left-0 top-full z-50 mt-0.5 min-w-[10rem] rounded-md border bg-popover p-1 shadow-md">
                {#each section.children as child}
                  <a
                    href={sectionHref(child)}
                    onclick={() => (openDropdown = null)}
                    class="block rounded-sm px-3 py-1.5 text-sm hover:bg-accent
                      {isActiveSection(child, $page.url.pathname) ? 'font-medium text-foreground' : 'text-muted-foreground'}"
                  >
                    {child.label}
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {:else if section.href}
          <!-- External link -->
          <a
            href={section.href}
            target="_blank"
            rel="noopener noreferrer"
            class="flex shrink-0 items-center gap-1 border-b-2 border-transparent px-3 py-2 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            {section.label}
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>
          </a>
        {:else}
          <!-- Path section -->
          <a
            href={sectionHref(section)}
            class="shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors
              {isActiveSection(section, $page.url.pathname)
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'}"
          >
            {section.label}
          </a>
        {/if}
      {/each}
    </nav>
  {/if}
</header>

<svelte:window onclick={(e) => {
  if (openDropdown && !e.target.closest('.relative')) openDropdown = null
}} />

<style>
  .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
</style>
```

**Step 2: Build kit to verify no compile errors**

Run: `cd packages/kit && bun run build`
Expected: PASS

**Step 3: Commit**

```
feat: add TopBar component with sections and language switcher
```

---

### Task 5: Update Sidebar — remove logo, title, and theme toggle

**Files:**
- Modify: `packages/kit/src/lib/components/Sidebar.svelte`

**Step 1: Modify Sidebar**

When sections are enabled, the TopBar owns logo/title/theme. The Sidebar should:
- Accept a new optional `hasSections` prop (defaults to `false`)
- When `hasSections` is true: hide the logo header (h-14 block) and the bottom theme toggle bar
- When `hasSections` is false: current behavior unchanged (backwards compat)
- Remove the theme toggle `$effect` and `initTheme`/`toggleTheme` functions only when `hasSections` is true — actually, just always keep them for backwards compat. The TopBar will also have them; only one will render.

Changes to the template:

```svelte
let { config, groups, onSearchClick, hasSections = false } = $props()
```

- Wrap the header block (`h-14`) in `{#if !hasSections}...{/if}`
- Wrap the bottom bar (theme toggle) in `{#if !hasSections}...{/if}`

**Step 2: Build and verify**

Run: `cd packages/kit && bun run build`
Expected: PASS

**Step 3: Commit**

```
refactor: make Sidebar header/footer conditional for sections mode
```

---

### Task 6: Update DocsLayout to use TopBar when sections are configured

**Files:**
- Modify: `packages/kit/src/lib/components/DocsLayout.svelte`

**Step 1: Modify DocsLayout**

Add new optional props: `sections`, `locale`, `locales`, `showFallbackBanner`.

```svelte
<script>
  import TopBar from "./TopBar.svelte"
  import Navbar from "./Navbar.svelte"
  import Sidebar from "./Sidebar.svelte"
  import TableOfContents from "./TableOfContents.svelte"
  import SearchDialog from "./SearchDialog.svelte"
  import { onMount } from "svelte"

  let {
    config,
    sidebar,
    headings,
    children,
    sections,          // new — optional
    locale,            // new — optional
    locales,           // new — optional
    showFallbackBanner = false,  // new
  } = $props()

  let searchOpen = $state(false)
  let mobileOpen = $state(false)

  const hasSections = $derived(sections != null && sections.length > 0)

  onMount(() => {
    function handleKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchOpen = !searchOpen
      }
    }
    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  })
</script>

<div class="min-h-screen bg-background text-foreground">
  {#if hasSections}
    <TopBar
      {config}
      {sections}
      {locale}
      {locales}
      onSearchClick={() => (searchOpen = true)}
      onMenuClick={() => (mobileOpen = !mobileOpen)}
    />
  {:else}
    <!-- Legacy mobile navbar -->
    <Navbar {config} {sidebar} onSearchClick={() => (searchOpen = true)} />
  {/if}

  {#if showFallbackBanner}
    <div class="border-b bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
      This page is not available in the selected language. Showing the default version.
    </div>
  {/if}

  <div class="mx-auto flex max-w-[90rem]">
    <aside class="relative hidden w-[15rem] shrink-0 border-r lg:block">
      <div class="absolute inset-0 bg-card" style="left: -100vw; width: calc(100% + 100vw);"></div>
      <div class="relative sticky top-0 h-screen" style:top={hasSections ? "calc(var(--topbar-height, 3.5rem))" : "0"}>
        <Sidebar {config} groups={sidebar} onSearchClick={() => (searchOpen = true)} {hasSections} />
      </div>
    </aside>

    <main class="min-w-0 flex-1 px-6 py-10 lg:px-10 xl:px-14">
      <div class="mx-auto max-w-3xl">
        {@render children()}
      </div>
    </main>

    {#if headings?.length}
      <aside class="hidden w-[13rem] shrink-0 xl:block">
        <div class="sticky overflow-y-auto overscroll-contain py-10 pr-6" style:top={hasSections ? "calc(var(--topbar-height, 3.5rem))" : "0"} style:height={hasSections ? "calc(100vh - var(--topbar-height, 3.5rem))" : "100vh"}>
          <TableOfContents {headings} />
        </div>
      </aside>
    {/if}
  </div>
</div>

<SearchDialog bind:open={searchOpen} />
```

Note: The sticky positioning needs to account for the TopBar height. We use a CSS variable `--topbar-height` that TopBar sets on the header element, or we just use a known value. The TopBar has two rows when sections are present: row 1 is h-14 (3.5rem), row 2 is ~2.5rem, total ~6rem. Without sections row 2 is hidden, so just h-14.

Actually, simpler approach: the TopBar is `sticky top-0`, so the sidebar just needs `top: 0` as well since it's below the TopBar in the DOM flow. But actually the sidebar is `position: sticky` within a flex container. The correct approach is to set the sidebar's `top` to the height of the TopBar.

We'll handle this by having the sidebar's sticky `top` and `height` adapt. Use a CSS custom property set in DocsLayout:

In the TopBar, set height via a CSS variable on the root:
```
style="--topbar-height: {sections?.length ? '6rem' : '3.5rem'}"
```

This needs careful testing. For now, use explicit rem values.

**Step 2: Build and verify**

Run: `cd packages/kit && bun run build`
Expected: PASS

**Step 3: Commit**

```
feat: integrate TopBar into DocsLayout when sections configured
```

---

### Task 7: Update Navbar for sections mode (mobile sidebar)

**Files:**
- Modify: `packages/kit/src/lib/components/Navbar.svelte`

The Navbar currently handles the mobile sheet sidebar. When sections are enabled, TopBar replaces the Navbar entirely. The mobile sheet is triggered by TopBar's hamburger button via `onMenuClick`. We need to extract the mobile sidebar sheet into DocsLayout so both TopBar and legacy Navbar can trigger it.

**Step 1: Move mobile sheet to DocsLayout**

In `DocsLayout.svelte`, add the SheetContent import and render it there, controlled by `mobileOpen` state (already added in Task 6). The Navbar and TopBar both set `mobileOpen` via callbacks.

In `Navbar.svelte`, remove the SheetContent rendering. Instead, accept and call `onMenuClick` prop.

```svelte
<!-- In Navbar.svelte, remove the SheetContent block and mobileOpen state -->
<!-- Add onMenuClick prop, wire hamburger to it -->
let { config, sidebar = [], onSearchClick, onMenuClick } = $props()
```

In `DocsLayout.svelte`, add after SearchDialog:

```svelte
<SheetContent open={mobileOpen} onclose={() => (mobileOpen = false)} side="left">
  <div class="mt-6">
    <ScrollArea class="h-[calc(100vh-8rem)]">
      {#each sidebar as group}
        <div class="mb-4">
          <h4 class="mb-1 px-2 text-sm font-semibold text-foreground">{group.label}</h4>
          <!-- render entries recursively -->
        </div>
      {/each}
    </ScrollArea>
  </div>
</SheetContent>
```

Actually, this is complex — the mobile sidebar snippets live in Navbar.svelte currently. The cleanest approach: keep the mobile sheet in Navbar for legacy mode, and have TopBar trigger a separate mobile sheet via DocsLayout. But this duplicates code.

Better approach: Create a shared `MobileSidebar.svelte` component that both Navbar and DocsLayout can use. But this is getting complex.

Simplest approach for now: When sections mode is active, Navbar is not rendered at all. The mobile sheet is rendered in DocsLayout, controlled by `mobileOpen` which TopBar sets. We move the mobile sidebar rendering snippet to DocsLayout.

This task is getting large. Let's keep it simple:

- DocsLayout imports SheetContent, ScrollArea
- When `hasSections`, DocsLayout renders the mobile sheet itself using the sidebar data
- When `!hasSections`, Navbar renders as before (it has its own mobile sheet)
- The renderMobileEntries snippet is duplicated — acceptable for now

**Step 2: Build and verify**

Run: `cd packages/kit && bun run build`
Expected: PASS

**Step 3: Commit**

```
feat: mobile sidebar sheet in DocsLayout for sections mode
```

---

### Task 8: Update page routing to derive active section

**Files:**
- Modify: `packages/kit/src/lib/routes/docs/[...slug]/+page.ts`
- Modify: `packages/kit/src/lib/routes/docs/[...slug]/+page.svelte`

**Step 1: Update +page.ts**

The page loader needs to pass `sections` data through. Since sections come from the virtual module:

```ts
import { error } from "@sveltejs/kit"

export const ssr = false

export async function load({ params }) {
  const slug = params.slug || "index"
  const { docImports, docs, sections, sidebar } = await import("virtual:tiramisu-docs")
  const importFn = docImports[slug]
  if (!importFn) throw error(404, "Page not found")

  const component = await importFn()
  const doc = docs.find((d) => d.slug === slug)

  // Determine active section sidebar
  let activeSidebar = sidebar // default: legacy flat sidebar
  if (sections) {
    activeSidebar = findActiveSectionSidebar(sections, slug) ?? sidebar
  }

  return {
    component: component.default ?? component,
    meta: doc?.meta ?? {},
    headings: doc?.headings ?? [],
    slug,
    sections: sections ?? undefined,
    activeSidebar,
  }
}

function findActiveSectionSidebar(sections, slug) {
  for (const section of sections) {
    if (section.path && (slug === section.path || slug.startsWith(section.path + "/"))) {
      return section.sidebar
    }
    if (section.children) {
      const found = findActiveSectionSidebar(section.children, slug)
      if (found) return found
    }
    // Implicit section (no path) — for root-level docs
    if (!section.path && !section.href && !section.children) {
      // This is the implicit section; check if slug doesn't match any other section
      // Actually handled by: if no other section matches, fall back to implicit
    }
  }
  // Return the first section's sidebar (implicit section) as fallback
  if (sections.length > 0 && sections[0].sidebar && !sections[0].path) {
    return sections[0].sidebar
  }
  return null
}
```

**Step 2: Update +page.svelte**

```svelte
<script>
  import DocsLayout from "$lib/components/DocsLayout.svelte"
  import DocPage from "$lib/components/DocPage.svelte"
  import PrevNextNav from "$lib/components/PrevNextNav.svelte"
  import config from "$lib/tiramisu.config"
  import { resolveConfig } from "@tiramisu-docs/kit"

  let { data } = $props()
  const resolved = resolveConfig(config)
</script>

<DocsLayout
  config={resolved}
  sidebar={data.activeSidebar ?? data.sidebar}
  headings={data.headings}
  sections={data.sections}
>
  <DocPage meta={data.meta}>
    {#if data.component}
      {@const Component = data.component}
      <Component />
    {/if}
  </DocPage>
  <PrevNextNav sidebar={data.activeSidebar ?? data.sidebar} currentSlug={data.slug} />
</DocsLayout>
```

Note: These files are in both the kit package (as templates) and the playground (as actual routes). The kit versions are at `packages/kit/src/lib/routes/docs/[...slug]/` and the playground copies them. Update both.

**Step 3: Build playground and verify**

Run: `cd playground && bun run build`
Expected: PASS (no sections configured, backwards compat)

**Step 4: Commit**

```
feat: derive active section sidebar from URL slug
```

---

### Task 9: Update PrevNextNav and SearchDialog for sections

**Files:**
- Modify: `packages/kit/src/lib/components/PrevNextNav.svelte`
- Modify: `packages/kit/src/lib/components/SearchDialog.svelte`

**Step 1: PrevNextNav**

PrevNextNav already receives `sidebar` as a prop, which we now pass the active section's sidebar. The only issue is the href generation — it uses `/docs/${entry.slug}`. When sections are active, the slug already includes the section prefix (e.g., `guides/intro`), so `/docs/guides/intro` is correct. No changes needed for PrevNextNav.

When i18n is added later (Phase 2), we'll need to prefix with locale — but not yet.

**Step 2: SearchDialog**

SearchDialog imports `searchIndex` directly from the virtual module. For now (Phase 1, no i18n), the search index includes all docs across all sections. This is correct behavior (search across all sections, as per design). Results already show `group` labels. No changes needed for Phase 1.

**Step 3: Commit (if any changes)**

Skip if no changes needed.

---

### Task 10: End-to-end test with playground

**Files:**
- Modify: `playground/src/lib/tiramisu.config.ts`
- Modify: `playground/vite.config.ts`

**Step 1: Add sections to playground config**

Update `playground/src/lib/tiramisu.config.ts`:

```ts
import { defineConfig } from "@tiramisu-docs/kit"

export default defineConfig({
  title: "Tiramisu Docs",
  description: "Documentation powered by Tiramisu Docs",
  logo: { light: "/logo.svg", dark: "/logo-dark.svg" },
  sections: [
    { label: "Getting Started", path: "getting-started" },
    { label: "Writing", path: "writing" },
    { label: "Customization", path: "customization" },
  ],
  sidebar: {
    groupOrder: ["Getting Started", "Writing", "Customization"],
  },
})
```

Update `playground/vite.config.ts` to pass sections to the plugin:

```ts
tiramisuPlugin({
  sections: [
    { label: "Getting Started", path: "getting-started" },
    { label: "Writing", path: "writing" },
    { label: "Customization", path: "customization" },
  ],
  title: "Tiramisu Docs",
})
```

**Step 2: Rebuild core & kit**

Run: `cd packages/core && bun run build && cd ../kit && bun run build`

**Step 3: Build playground**

Run: `cd playground && bun run build`
Expected: PASS

**Step 4: Run all tests**

Run: `bun test`
Expected: All pass

**Step 5: Visual verification**

Run: `cd playground && bun run preview`
Verify:
- TopBar appears with section tabs
- Clicking a section navigates and swaps sidebar
- Mobile: hamburger opens sidebar scoped to active section
- Mobile: section tabs scroll horizontally
- Theme toggle works from TopBar
- Search still works

**Step 6: Commit**

```
feat: enable sections in playground for end-to-end testing
```

---

## Phase 2: i18n / Translations

### Task 11: Extend config types for i18n

**Files:**
- Modify: `packages/kit/src/config.ts`
- Test: `packages/kit/tests/config.test.ts`

**Step 1: Write the failing test**

```ts
it("resolves i18n config", () => {
  const config = resolveConfig({
    i18n: {
      defaultLocale: "en",
      locales: [
        { code: "en", label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
        { code: "fr", label: "Fran\u00e7ais", flag: "\u{1F1EB}\u{1F1F7}" },
      ],
    },
  })
  expect(config.i18n).toBeDefined()
  expect(config.i18n!.defaultLocale).toBe("en")
  expect(config.i18n!.locales).toHaveLength(2)
  expect(config.i18n!.fallback).toBe("default-language")
})

it("resolves undefined i18n as undefined", () => {
  const config = resolveConfig({})
  expect(config.i18n).toBeUndefined()
})
```

**Step 2: Run test to verify it fails**

Run: `cd packages/kit && bun test tests/config.test.ts`

**Step 3: Write minimal implementation**

Add to `packages/kit/src/config.ts`:

```ts
export interface LocaleConfig {
  code: string
  label: string
  flag?: string
}

export interface I18nConfig {
  defaultLocale: string
  locales: LocaleConfig[]
  fallback?: "default-language" | "404"
}

// Add to TiramisuDocsConfig:
  i18n?: I18nConfig

// Add to ResolvedConfig:
  i18n?: ResolvedI18nConfig

export interface ResolvedI18nConfig {
  defaultLocale: string
  locales: LocaleConfig[]
  fallback: "default-language" | "404"
}

// In resolveConfig:
  i18n: config.i18n ? {
    defaultLocale: config.i18n.defaultLocale,
    locales: config.i18n.locales,
    fallback: config.i18n.fallback ?? "default-language",
  } : undefined,
```

Export `LocaleConfig`, `I18nConfig` from `packages/kit/src/index.ts`.

**Step 4: Run test to verify it passes**

**Step 5: Commit**

```
feat: add i18n config types
```

---

### Task 12: Locale-aware doc scanning in Vite plugin

**Files:**
- Modify: `packages/kit/src/vite.ts`
- Test: `packages/kit/tests/vite.test.ts`

**Step 1: Write the failing test**

This test uses the filesystem, so we'll test the `buildVirtualModule` output shape rather than scanning. Instead, test a new `buildLocaleData` function:

```ts
describe("buildLocaleData", () => {
  it("groups docs by locale prefix", () => {
    const allDocs = [
      { slug: "en/intro", meta: { title: "Intro" } },
      { slug: "en/guide", meta: { title: "Guide" } },
      { slug: "fr/intro", meta: { title: "Introduction" } },
    ]
    const locales = [
      { code: "en", label: "English" },
      { code: "fr", label: "Fran\u00e7ais" },
    ]
    const result = buildLocaleData(allDocs, locales)
    expect(result.en.docs).toHaveLength(2)
    expect(result.en.docs[0].slug).toBe("intro") // locale prefix stripped
    expect(result.fr.docs).toHaveLength(1)
  })
})
```

**Step 2: Run test to verify it fails**

**Step 3: Write minimal implementation**

```ts
export function buildLocaleData(
  allDocs: { slug: string; meta: DocMeta }[],
  locales: { code: string }[]
): Record<string, { docs: { slug: string; meta: DocMeta }[] }> {
  const result: Record<string, { docs: { slug: string; meta: DocMeta }[] }> = {}
  for (const locale of locales) {
    const prefix = locale.code + "/"
    const docs = allDocs
      .filter((d) => d.slug.startsWith(prefix))
      .map((d) => ({ slug: d.slug.slice(prefix.length), meta: d.meta }))
    result[locale.code] = { docs }
  }
  return result
}
```

**Step 4: Run test to verify it passes**

**Step 5: Commit**

```
feat: locale-aware doc grouping in Vite plugin
```

---

### Task 13: Update virtual module for i18n exports

**Files:**
- Modify: `packages/kit/src/vite.ts` (`buildVirtualModule`)
- Modify: `packages/kit/src/virtual.d.ts`

**Step 1: Update buildVirtualModule**

When i18n is configured (plugin options have `i18n`), the virtual module exports `locales` instead of flat data:

Add `i18n` to `TiramisuPluginOptions`:

```ts
export interface TiramisuPluginOptions {
  docsDir?: string
  componentsDir?: string
  groupOrder?: string[]
  sections?: SectionConfig[]
  title?: string
  i18n?: { defaultLocale: string; locales: { code: string; label: string; flag?: string }[] }
}
```

In `buildVirtualModule`, when `i18n` is configured:

```ts
if (options.i18n) {
  const localeData = buildLocaleData(docs, options.i18n.locales)
  const localeExports: Record<string, any> = {}

  for (const locale of options.i18n.locales) {
    const localeDocs = localeData[locale.code].docs
    const localeSidebar = options.sections
      ? buildSectionSidebars(localeDocs, options.sections, options.title)
      : undefined
    const flatSidebar = buildSidebarTree(localeDocs, groupOrder)

    // Build locale-specific imports
    const localeImportsEntries = localeDocs
      .map((doc) => {
        const fullSlug = `${locale.code}/${doc.slug}`
        const absPath = path.resolve(absDocsDir, fullSlug + ".tiramisu").replace(/\\/g, "/")
        return `    "${doc.slug}": () => import("${absPath}")`
      })
      .join(",\n")

    // Build locale-specific search index
    const localeSearchIndex = localeDocs.map((doc) => {
      const fullSlug = `${locale.code}/${doc.slug}`
      const file = path.resolve(absDocsDir, fullSlug + ".tiramisu")
      const source = fs.readFileSync(file, "utf-8")
      const { svelte } = compileTiramisu(source)
      const text = extractPlainText(svelte)
      return {
        id: doc.slug,
        title: doc.meta.title ?? doc.slug,
        group: resolveSearchGroup(doc.slug, doc.meta),
        slug: doc.slug,
        headings: docs.find(d => d.slug === fullSlug)?.headings.map(h => h.text).join(" ") ?? "",
        text,
      }
    })

    localeExports[locale.code] = {
      sections: localeSidebar,
      sidebar: flatSidebar,
      searchIndex: localeSearchIndex,
    }
  }

  // Generate code that lazily loads per-locale data
  const localeBlocks = options.i18n.locales.map((locale) => {
    const data = localeExports[locale.code]
    const localeDocs = localeData[locale.code].docs
    const importsEntries = localeDocs
      .map((doc) => {
        const fullSlug = `${locale.code}/${doc.slug}`
        const absPath = path.resolve(absDocsDir, fullSlug + ".tiramisu").replace(/\\/g, "/")
        return `    "${doc.slug}": () => import("${absPath}")`
      })
      .join(",\n")

    return `  "${locale.code}": {
    sections: ${JSON.stringify(data.sections, null, 2)},
    sidebar: ${JSON.stringify(data.sidebar, null, 2)},
    docs: ${JSON.stringify(localeDocs, null, 2)},
    searchIndex: ${JSON.stringify(data.searchIndex)},
    docImports: {\n${importsEntries}\n    },
  }`
  }).join(",\n")

  return [
    `export const locales = {\n${localeBlocks}\n};`,
    `export const defaultLocale = "${options.i18n.defaultLocale}";`,
    // Backwards compat: also export flat versions using default locale
    `export const sidebar = locales["${options.i18n.defaultLocale}"].sidebar;`,
    `export const sections = locales["${options.i18n.defaultLocale}"].sections;`,
    `export const docs = locales["${options.i18n.defaultLocale}"].docs;`,
    `export const searchIndex = locales["${options.i18n.defaultLocale}"].searchIndex;`,
    `export const docImports = locales["${options.i18n.defaultLocale}"].docImports;`,
  ].join("\n\n")
}
```

**Step 2: Update virtual.d.ts**

Add to the module declaration:

```ts
export const locales: Record<string, {
  sections?: typeof sections
  sidebar: typeof sidebar
  docs: typeof docs
  searchIndex: any[]
  docImports: typeof docImports
}> | undefined

export const defaultLocale: string | undefined
```

**Step 3: Build and verify**

Run: `cd packages/kit && bun run build`

**Step 4: Commit**

```
feat: locale-keyed exports in virtual module
```

---

### Task 14: Update routing for locale prefix

**Files:**
- Modify: `packages/kit/src/lib/routes/docs/[...slug]/+page.ts`

**Step 1: Update the load function**

```ts
import { error, redirect } from "@sveltejs/kit"

export const ssr = false

export async function load({ params }) {
  const rawSlug = params.slug || "index"
  const mod = await import("virtual:tiramisu-docs")

  // If i18n is enabled, parse locale from slug
  if (mod.locales && mod.defaultLocale) {
    const segments = rawSlug.split("/")
    const possibleLocale = segments[0]
    const localeData = mod.locales[possibleLocale]

    if (localeData) {
      // Valid locale prefix
      const locale = possibleLocale
      const slug = segments.slice(1).join("/") || "index"
      return loadDoc(localeData, slug, locale, mod)
    } else {
      // No locale prefix — redirect to default locale
      throw redirect(302, `/docs/${mod.defaultLocale}/${rawSlug}`)
    }
  }

  // No i18n — legacy behavior
  return loadLegacy(mod, rawSlug)
}

function loadLegacy(mod, slug) {
  const importFn = mod.docImports[slug]
  if (!importFn) throw error(404, "Page not found")

  const component = importFn()
  const doc = mod.docs.find((d) => d.slug === slug)

  let activeSidebar = mod.sidebar
  if (mod.sections) {
    activeSidebar = findActiveSectionSidebar(mod.sections, slug) ?? mod.sidebar
  }

  return component.then((c) => ({
    component: c.default ?? c,
    meta: doc?.meta ?? {},
    headings: doc?.headings ?? [],
    slug,
    sections: mod.sections ?? undefined,
    activeSidebar,
  }))
}

async function loadDoc(localeData, slug, locale, mod) {
  let importFn = localeData.docImports[slug]
  let showFallbackBanner = false

  if (!importFn) {
    // Try fallback to default locale
    const defaultData = mod.locales[mod.defaultLocale]
    importFn = defaultData?.docImports[slug]
    if (!importFn) throw error(404, "Page not found")
    showFallbackBanner = true
  }

  const component = await importFn()
  const doc = localeData.docs.find((d) => d.slug === slug)
    ?? mod.locales[mod.defaultLocale]?.docs.find((d) => d.slug === slug)

  const sections = localeData.sections
  let activeSidebar = localeData.sidebar
  if (sections) {
    activeSidebar = findActiveSectionSidebar(sections, slug) ?? localeData.sidebar
  }

  return {
    component: component.default ?? component,
    meta: doc?.meta ?? {},
    headings: doc?.headings ?? [],
    slug,
    locale,
    locales: mod.locales ? Object.keys(mod.locales) : undefined,
    sections,
    activeSidebar,
    showFallbackBanner,
  }
}

function findActiveSectionSidebar(sections, slug) {
  for (const section of sections) {
    if (section.path && (slug === section.path || slug.startsWith(section.path + "/"))) {
      return section.sidebar
    }
    if (section.children) {
      const found = findActiveSectionSidebar(section.children, slug)
      if (found) return found
    }
  }
  // Fallback to implicit section (first section with no path)
  const implicit = sections.find((s) => !s.path && !s.href && !s.children)
  return implicit?.sidebar ?? null
}
```

**Step 2: Update +page.svelte**

Pass locale and locales to DocsLayout:

```svelte
<DocsLayout
  config={resolved}
  sidebar={data.activeSidebar}
  headings={data.headings}
  sections={data.sections}
  locale={data.locale}
  locales={data.locales ? resolved.i18n?.locales?.filter(l => data.locales.includes(l.code)) : undefined}
  showFallbackBanner={data.showFallbackBanner}
>
```

**Step 3: Build and verify**

Run: `cd packages/kit && bun run build`

**Step 4: Commit**

```
feat: locale-aware routing with fallback support
```

---

### Task 15: Update SearchDialog for locale-aware search

**Files:**
- Modify: `packages/kit/src/lib/components/SearchDialog.svelte`

**Step 1: Modify SearchDialog**

Accept an optional `locale` prop. When set, use the locale's search index instead of the global one:

```svelte
<script>
  import { goto } from "$app/navigation"
  import { fade, scale, fly } from "svelte/transition"
  import MiniSearch from "minisearch"
  import { searchIndex, locales, defaultLocale } from "virtual:tiramisu-docs"

  let { open = $bindable(false), locale } = $props()

  // Use locale-specific search index if available
  const activeIndex = $derived(
    locale && locales?.[locale]
      ? locales[locale].searchIndex
      : searchIndex
  )

  const miniSearch = $derived.by(() => {
    const ms = new MiniSearch({
      fields: ["title", "headings", "text"],
      storeFields: ["title", "group", "slug"],
      searchOptions: {
        boost: { title: 3, headings: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
    })
    ms.addAll(activeIndex)
    return ms
  })

  // ... rest stays the same except navigate():

  function navigate(result) {
    const prefix = locale ? `/docs/${locale}` : "/docs"
    const href = result.slug === "index" ? prefix : `${prefix}/${result.slug}`
    open = false
    goto(href)
  }
</script>
```

Pass `locale` from DocsLayout to SearchDialog.

**Step 2: Build and verify**

Run: `cd packages/kit && bun run build`

**Step 3: Commit**

```
feat: locale-aware search in SearchDialog
```

---

### Task 16: Update link generation for locale awareness

**Files:**
- Modify: `packages/kit/src/lib/components/Sidebar.svelte`
- Modify: `packages/kit/src/lib/components/Navbar.svelte`
- Modify: `packages/kit/src/lib/components/PrevNextNav.svelte`

**Step 1: Add locale prop to all components**

All components that generate `/docs/...` links need to support an optional `locale` prop. When set, links become `/docs/{locale}/...` instead of `/docs/...`.

Add to each component:

```svelte
let { ..., locale } = $props()
```

Create a helper used in each:

```js
function docHref(slug) {
  const prefix = locale ? `/docs/${locale}` : "/docs"
  return slug === "index" ? prefix : `${prefix}/${slug}`
}
```

Replace all instances of:
- `entry.slug === "index" ? "/docs" : `/docs/${entry.slug}`` → `docHref(entry.slug)`
- `/docs/${entry.slug}` → `docHref(entry.slug)`

In DocsLayout, pass `locale` to Sidebar, Navbar, PrevNextNav.

**Step 2: Build and verify**

Run: `cd packages/kit && bun run build`

**Step 3: Commit**

```
feat: locale-prefixed links across all nav components
```

---

### Task 17: End-to-end i18n test with playground

**Files:**
- Create: `playground/src/docs/en/` (move existing docs here)
- Create: `playground/src/docs/fr/` (add a few translated pages)
- Modify: `playground/src/lib/tiramisu.config.ts`
- Modify: `playground/vite.config.ts`

**Step 1: Restructure playground docs**

Move all files from `playground/src/docs/` into `playground/src/docs/en/`.

Create `playground/src/docs/fr/index.tiramisu`:

```tiramisu
meta { title = Accueil, description = Documentation propuls\u00e9e par Tiramisu Docs, order = 1 }

h2 { Bienvenue }

Ceci est la version fran\u00e7aise de la documentation.
```

**Step 2: Update config**

```ts
export default defineConfig({
  title: "Tiramisu Docs",
  description: "Documentation powered by Tiramisu Docs",
  logo: { light: "/logo.svg", dark: "/logo-dark.svg" },
  sections: [
    { label: "Getting Started", path: "getting-started" },
    { label: "Writing", path: "writing" },
    { label: "Customization", path: "customization" },
  ],
  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", label: "English", flag: "\u{1F1FA}\u{1F1F8}" },
      { code: "fr", label: "Fran\u00e7ais", flag: "\u{1F1EB}\u{1F1F7}" },
    ],
    fallback: "default-language",
  },
})
```

Update vite.config.ts to pass i18n to the plugin:

```ts
tiramisuPlugin({
  sections: [...],
  title: "Tiramisu Docs",
  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", label: "English" },
      { code: "fr", label: "Fran\u00e7ais" },
    ],
  },
})
```

**Step 3: Build and verify**

Run: `cd packages/core && bun run build && cd ../kit && bun run build && cd ../../playground && bun run build`
Expected: PASS

**Step 4: Run all tests**

Run: `bun test`
Expected: All pass

**Step 5: Visual verification**

Run: `cd playground && bun run preview`
Verify:
- `/docs/` redirects to `/docs/en/`
- Language switcher shows English / Fran\u00e7ais
- Switching to French shows French index page
- Pages not translated in French show fallback banner + English content
- Search works within current locale
- Section tabs + sidebar work per locale

**Step 6: Commit**

```
feat: enable i18n in playground for end-to-end testing
```

---

### Task 18: Run full test suite and final cleanup

**Step 1: Run all tests**

Run: `bun test`
Expected: All pass

**Step 2: Build everything**

Run:
```
cd packages/core && bun run build
cd ../kit && bun run build
cd ../../playground && bun run build
```
Expected: All pass

**Step 3: Final commit**

```
chore: i18n and top-bar sections implementation complete
```
