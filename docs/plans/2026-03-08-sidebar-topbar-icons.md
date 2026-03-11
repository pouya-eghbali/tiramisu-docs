# Sidebar & TopBar Icons Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add optional Lucide icons to sidebar groups, subgroups, items, and TopBar section tabs, resolved at build time for tree-shaking.

**Architecture:** Icon names (kebab-case, e.g. `book-open`) are specified in `meta { icon = book-open }` for docs and `icon: "book-open"` in section config. The Vite plugin collects all used icon names at build time, generates per-icon imports from `@lucide/svelte/icons/<name>`, and exports an `iconMap` in the virtual module. Sidebar and TopBar components import the map and render icons via `<svelte:component>`.

**Tech Stack:** @lucide/svelte, TypeScript, Svelte 5, Vite plugin

---

### Task 1: Add `icon` to DocMeta and extractMeta

**Files:**
- Modify: `packages/core/src/types.ts:1-7`
- Modify: `packages/core/src/meta.ts:80-98`
- Modify: `packages/core/tests/meta.test.ts`

**Step 1: Add icon to DocMeta**

In `packages/core/src/types.ts`, add `icon` to DocMeta:

```ts
export interface DocMeta {
  title?: string
  description?: string
  order?: number
  group?: string
  lastEdited?: string
  icon?: string
}
```

**Step 2: Handle icon in extractMeta**

In `packages/core/src/meta.ts`, add a case in the switch at line ~80:

```ts
case "icon":
  meta.icon = rawValue
  break
```

**Step 3: Add test**

In `packages/core/tests/meta.test.ts`, add:

```ts
it("extracts icon from meta block", () => {
  const ast = compile("meta { title = My Page, icon = book-open }\n\nContent")
  const { meta } = extractMeta(ast)
  expect(meta.icon).toBe("book-open")
})
```

**Step 4: Run tests**

```bash
cd /Users/pouya/Projects/tiramisu-docs/packages/core && bun test
```

---

### Task 2: Add `icon` to config and sidebar types

**Files:**
- Modify: `packages/kit/src/config.ts:6-11`
- Modify: `packages/kit/src/vite.ts` (type definitions at lines 32-53 and 197-203)

**Step 1: Add icon to SectionConfig**

In `packages/kit/src/config.ts`:

```ts
export interface SectionConfig {
  label: string
  path?: string
  href?: string
  icon?: string
  children?: SectionConfig[]
}
```

**Step 2: Add icon to sidebar types and ResolvedSection**

In `packages/kit/src/vite.ts`:

```ts
export interface SidebarItem {
  type: "item"
  title: string
  slug: string
  order: number
  icon?: string
}

export interface SidebarSubgroup {
  type: "subgroup"
  key: string
  label: string
  slug?: string
  items: SidebarEntry[]
  order: number
  icon?: string
}

export interface SidebarGroup {
  label: string
  items: SidebarEntry[]
  icon?: string
}

export interface ResolvedSection {
  label: string
  path?: string
  href?: string
  icon?: string
  children?: ResolvedSection[]
  sidebar?: SidebarGroup[]
}
```

---

### Task 3: Propagate icons through buildSidebarTree and resolveSection

**Files:**
- Modify: `packages/kit/src/vite.ts` (buildSidebarTree ~110-153, resolveSection ~240-263)
- Modify: `packages/kit/tests/vite.test.ts`

**Step 1: Propagate meta.icon in buildSidebarTree**

In the item creation (~line 112), add icon:

```ts
const item: SidebarItem = {
  type: "item",
  title: doc.meta.title ?? doc.slug,
  slug: doc.slug,
  order: doc.meta.order ?? 999,
  icon: doc.meta.icon,
}
```

In the folder index handling (~line 139), propagate icon to subgroup:

```ts
if (fileName === "index" && lastSub) {
  lastSub.slug = item.slug
  if (item.order < lastSub.order) lastSub.order = item.order
  if (item.title !== item.slug) lastSub.label = item.title
  if (doc.meta.icon) lastSub.icon = doc.meta.icon
} else if (fileName === "index" && !lastSub) {
  if (item.title !== item.slug) {
    group.label = item.title
  }
  if (doc.meta.icon) group.icon = doc.meta.icon
} else {
  parent.push(item)
}
```

**Step 2: Propagate icon in resolveSection**

In the `resolveSection` function (~line 240), pass through icon:

```ts
function resolveSection(
  docs: { slug: string; meta: DocMeta }[],
  section: SectionConfig
): ResolvedSection {
  if (section.href) {
    return { label: section.label, href: section.href, icon: section.icon }
  }
  if (section.children) {
    return {
      label: section.label,
      icon: section.icon,
      children: section.children.map((c) => resolveSection(docs, c)),
    }
  }
  const sectionDocs = docs
    .filter((d) => d.slug === section.path || d.slug.startsWith(section.path + "/"))

  const sidebar = buildSidebarTree(sectionDocs)

  return {
    label: section.label,
    path: section.path,
    icon: section.icon,
    sidebar,
  }
}
```

**Step 3: Add tests**

In `packages/kit/tests/vite.test.ts`:

```ts
it("propagates icon from meta to sidebar items", () => {
  const docs = [
    { slug: "intro", meta: { title: "Intro", order: 1, group: "Guide", icon: "book-open" } },
  ]
  const result = buildSidebarTree(docs)
  expect((result[0].items[0] as SidebarItem).icon).toBe("book-open")
})

it("propagates icon from folder index to group", () => {
  const docs = [
    { slug: "guide/index", meta: { title: "Guide", order: 1, icon: "compass" } },
    { slug: "guide/setup", meta: { title: "Setup", order: 2 } },
  ]
  const result = buildSidebarTree(docs)
  expect(result[0].icon).toBe("compass")
})

it("propagates icon from subfolder index to subgroup", () => {
  const docs = [
    { slug: "guide/advanced/index", meta: { title: "Advanced", order: 1, icon: "zap" } },
    { slug: "guide/advanced/tips", meta: { title: "Tips", order: 2 } },
  ]
  const result = buildSidebarTree(docs)
  const subgroup = result[0].items[0] as SidebarSubgroup
  expect(subgroup.icon).toBe("zap")
})

it("items without icon have undefined icon", () => {
  const docs = [
    { slug: "readme", meta: { title: "README" } },
  ]
  const result = buildSidebarTree(docs)
  expect((result[0].items[0] as SidebarItem).icon).toBeUndefined()
})
```

**Step 4: Run tests**

```bash
cd /Users/pouya/Projects/tiramisu-docs/packages/kit && bun test
```

---

### Task 4: Generate icon imports in virtual module

**Files:**
- Modify: `packages/kit/src/vite.ts` (buildVirtualModule ~290-418)

**Step 1: Add helper to convert kebab-case to PascalCase**

Add before `buildVirtualModule`:

```ts
function kebabToPascal(name: string): string {
  return name.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join("")
}
```

**Step 2: Add helper to collect all icon names**

Add before `buildVirtualModule`:

```ts
function collectIconNames(
  docs: { meta: DocMeta }[],
  sections?: SectionConfig[]
): Set<string> {
  const icons = new Set<string>()
  for (const doc of docs) {
    if (doc.meta.icon) icons.add(doc.meta.icon)
  }
  if (sections) {
    for (const s of sections) {
      if (s.icon) icons.add(s.icon)
      if (s.children) {
        for (const c of s.children) {
          if (c.icon) icons.add(c.icon)
        }
      }
    }
  }
  return icons
}
```

**Step 3: Generate icon imports and iconMap export in buildVirtualModule**

After the `importsEntries` block (~line 338) and before the `if (config?.i18n)` check (~line 340), add:

```ts
// Collect icon names and generate imports
const iconNames = collectIconNames(docs, config?.sections)
const iconImports = [...iconNames]
  .map(name => `import ${kebabToPascal(name)} from "@lucide/svelte/icons/${name}"`)
  .join("\n")
const iconMapEntries = [...iconNames]
  .map(name => `  "${name}": ${kebabToPascal(name)}`)
  .join(",\n")
const iconMapExport = iconNames.size > 0
  ? `${iconImports}\n\nexport const iconMap = {\n${iconMapEntries}\n};`
  : `export const iconMap = {};`
```

**Step 4: Add iconMapExport to all three return paths**

In each of the three return arrays (i18n path ~line 384, sections path ~line 397, default path ~line 407), add `iconMapExport` as the first element:

For example, the sections path becomes:
```ts
return [
  iconMapExport,
  `export const locales = undefined;`,
  // ... rest unchanged
].join("\n\n")
```

Apply the same pattern to all three return paths.

**Step 5: Run tests**

```bash
cd /Users/pouya/Projects/tiramisu-docs && bun test
```

---

### Task 5: Render icons in Sidebar.svelte

**Files:**
- Modify: `packages/kit/src/lib/components/Sidebar.svelte`

**Step 1: Import iconMap**

Add to the `<script>` block:

```js
import { iconMap } from "virtual:tiramisu-docs"
```

**Step 2: Add icon rendering to items**

In the `renderEntries` snippet, modify the item link (~line 72-79) to include an icon before the title. Replace:

```svelte
<a
  {href}
  class="block rounded-md py-[5px] text-[13px] transition-colors
    {active
      ? 'font-medium text-primary bg-primary/10'
      : 'text-muted-foreground hover:text-foreground'}"
  style:padding-left="{0.5 + depth * 0.75}rem"
>
  {entry.title}
</a>
```

With:

```svelte
<a
  {href}
  class="flex items-center gap-1.5 rounded-md py-[5px] text-[13px] transition-colors
    {active
      ? 'font-medium text-primary bg-primary/10'
      : 'text-muted-foreground hover:text-foreground'}"
  style:padding-left="{0.5 + depth * 0.75}rem"
>
  {#if entry.icon && iconMap[entry.icon]}
    <svelte:component this={iconMap[entry.icon]} size={14} class="shrink-0" />
  {/if}
  {entry.title}
</a>
```

**Step 3: Add icon rendering to subgroups**

In the subgroup trigger snippet (~line 84-90), replace:

```svelte
<span
  class="text-[13px] font-medium transition-colors
    {subActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
  style:padding-left="{0.5 + depth * 0.75}rem"
>
  {entry.label}
</span>
```

With:

```svelte
<span
  class="flex items-center gap-1.5 text-[13px] font-medium transition-colors
    {subActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
  style:padding-left="{0.5 + depth * 0.75}rem"
>
  {#if entry.icon && iconMap[entry.icon]}
    <svelte:component this={iconMap[entry.icon]} size={14} class="shrink-0" />
  {/if}
  {entry.label}
</span>
```

**Step 4: Add icon rendering to group headers**

In the group header (~line 140-142), replace:

```svelte
<h4 class="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
  {group.label}
</h4>
```

With:

```svelte
<h4 class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
  {#if group.icon && iconMap[group.icon]}
    <svelte:component this={iconMap[group.icon]} size={12} class="shrink-0" />
  {/if}
  {group.label}
</h4>
```

---

### Task 6: Render icons in TopBar.svelte

**Files:**
- Modify: `packages/kit/src/lib/components/TopBar.svelte`

**Step 1: Import iconMap**

Add to the `<script>` block:

```js
import { iconMap } from "virtual:tiramisu-docs"
```

**Step 2: Add icons to path-based section tabs**

In the path section link (~line 197-206), replace:

```svelte
<a
  href={sectionHref(section)}
  class="shrink-0 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-all duration-150
    {isActiveSection(section, $page.url.pathname)
      ? 'text-foreground font-medium'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
>
  {section.label}
</a>
```

With:

```svelte
<a
  href={sectionHref(section)}
  class="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-all duration-150
    {isActiveSection(section, $page.url.pathname)
      ? 'text-foreground font-medium'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
>
  {#if section.icon && iconMap[section.icon]}
    <svelte:component this={iconMap[section.icon]} size={14} class="shrink-0" />
  {/if}
  {section.label}
</a>
```

**Step 3: Add icons to dropdown section buttons**

In the dropdown button (~line 162-168), add icon before label:

```svelte
<button
  onclick={() => (openDropdown = openDropdown === section.label ? null : section.label)}
  class="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-all duration-150
    {isActiveSection(section, $page.url.pathname)
      ? 'text-foreground font-medium'
      : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
>
  {#if section.icon && iconMap[section.icon]}
    <svelte:component this={iconMap[section.icon]} size={14} class="shrink-0" />
  {/if}
  {section.label}
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
</button>
```

**Step 4: Add icons to external href sections**

In the external link section (~line 187-195), add icon before label:

```svelte
<a
  href={section.href}
  target="_blank"
  rel="noopener noreferrer"
  class="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-accent"
>
  {#if section.icon && iconMap[section.icon]}
    <svelte:component this={iconMap[section.icon]} size={14} class="shrink-0" />
  {/if}
  {section.label}
  <svg ...></svg>
</a>
```

---

### Task 7: Add icons to playground config and docs

**Files:**
- Modify: `playground/src/lib/tiramisu.config.ts`
- Modify: `playground/src/docs/framework/index.tiramisu` (add icon to meta)
- Modify: `playground/src/docs/framework/getting-started/index.tiramisu`
- Modify: `playground/src/docs/framework/writing/index.tiramisu`
- Modify: `playground/src/docs/framework/configuration/index.tiramisu`
- Modify: `playground/src/docs/framework/customization/index.tiramisu`
- Modify: `playground/src/docs/framework/integrations/index.tiramisu`
- Modify: `playground/src/docs/language/index.tiramisu`
- Modify: `playground/src/docs/language/basics/index.tiramisu`
- Modify: `playground/src/docs/language/internals/index.tiramisu`

**Step 1: Add icons to section config**

In `playground/src/lib/tiramisu.config.ts`, update sections:

```ts
sections: [
  { label: "Framework", path: "framework", icon: "book-open" },
  { label: "Language", path: "language", icon: "code" },
],
```

**Step 2: Add icons to framework subgroup index files**

Add `icon = <name>` to the meta block of each subgroup index:

- `framework/index.tiramisu`: `icon = layers` (the framework landing page / group)
- `framework/getting-started/index.tiramisu`: `icon = rocket`
- `framework/writing/index.tiramisu`: `icon = pen-line`
- `framework/configuration/index.tiramisu`: `icon = settings`
- `framework/customization/index.tiramisu`: `icon = palette`
- `framework/integrations/index.tiramisu`: `icon = plug`

**Step 3: Add icons to language subgroup index files**

- `language/index.tiramisu`: `icon = terminal` (the language landing page / group)
- `language/basics/index.tiramisu`: `icon = graduation-cap`
- `language/internals/index.tiramisu`: `icon = cpu`

---

### Task 8: Add `@lucide/svelte` to scaffolder output

**Files:**
- Modify: `packages/create-tiramisu-docs/src/scaffold.ts` (~line 51, packageJson function)

**Step 1: Add @lucide/svelte to devDependencies**

In the `packageJson` function, add to `devDependencies`:

```ts
devDependencies: {
  // ... existing deps
  "@lucide/svelte": "^0.561.0",
  // ... rest
}
```

**Step 2: Run tests**

```bash
cd /Users/pouya/Projects/tiramisu-docs && bun test
```

---

### Task 9: Add documentation page

**Files:**
- Create: `playground/src/docs/framework/configuration/icons.tiramisu`

**Step 1: Create the icons documentation page**

```tiramisu
meta { title = Icons, order = 7 }

h2 { Adding Icons }

Tiramisu Docs supports optional link { url = https://lucide.dev/icons, Lucide icons } in the sidebar and top bar. Icons are tree-shaken at build time — only the icons you use are included in the bundle.

h2 { Section Icons }

Add an code { icon } field to your section config in code { tiramisu.config.ts }:

codeblock { language = typescript, """sections: [
  { label: "Guide", path: "guide", icon: "book-open" },
  { label: "API", path: "api", icon: "code" },
]""" }

Section icons appear in the top bar next to the section label.

h2 { Page and Group Icons }

Add code { icon } to the code { meta } block of any code { .tiramisu } file:

codeblock { language = tiramisu, "meta { title = Getting Started, order = 1, icon = rocket }" }

For folder index pages (code { index.tiramisu })\, the icon is applied to the sidebar group or subgroup heading. For regular pages\, the icon appears next to the page title in the sidebar.

h2 { Available Icons }

Use any icon name from the link { url = https://lucide.dev/icons, Lucide icon catalog }. Names are in kebab-case:

table {
  row = [Icon Name, Description],
  row = [code { book-open }, Documentation / guides],
  row = [code { code }, Code / programming],
  row = [code { settings }, Configuration],
  row = [code { rocket }, Getting started],
  row = [code { palette }, Customization / themes],
  row = [code { plug }, Integrations / plugins],
  row = [code { terminal }, CLI / terminal],
  row = [code { zap }, Performance / quick actions],
  row = [code { shield }, Security],
  row = [code { database }, Data / storage]
}

callout { type = info, Icons are resolved at build time. If you use an icon name that doesn't exist in Lucide\, the build will fail with an import error. Check the link { url = https://lucide.dev/icons, Lucide catalog } to find the right name. }
```

---

### Task 10: Rebuild kit and verify

**Step 1: Run all tests**

```bash
cd /Users/pouya/Projects/tiramisu-docs && bun test
```

**Step 2: Rebuild kit**

```bash
cd /Users/pouya/Projects/tiramisu-docs/packages/kit && bun run build
```

**Step 3: Visual verification**

```bash
cd /Users/pouya/Projects/tiramisu-docs/playground && bun run dev
```

Check:
- TopBar section tabs show icons next to "Framework" and "Language"
- Sidebar subgroup headings show icons (Getting Started, Writing, etc.)
- Pages without icons render normally (no empty space)
- Icons adapt to dark/light mode (inherit currentColor)
- New icons documentation page at `/docs/framework/configuration/icons`
