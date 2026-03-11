# Move "Open" Dropdown from Kit to Scaffolded Project

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix `lifecycle_outside_component` error by moving the shadcn DropdownMenu out of the kit package and into the user's scaffolded project, where bits-ui's `setContext` works correctly.

**Architecture:** The kit's `DocPage` becomes a pure layout component (title, description, body, lastEdited, JSON-LD). The "Open" dropdown with AI/GitHub links lives in the scaffolded `+page.svelte`, using the app's own shadcn components. The scaffolder generates the dropdown-menu shadcn files, a `utils.ts`, and an `OpenDropdown.svelte` wrapper component.

**Tech Stack:** SvelteKit 5, shadcn-svelte (bits-ui), Tailwind CSS 4

---

## Context for the implementer

- **Root cause:** bits-ui uses `setContext` internally. When shadcn components ship inside the `@tiramisu-docs/kit` package and are consumed by another app, Svelte's context system breaks with `lifecycle_outside_component` because the component initialization happens in the wrong package scope.
- **Solution:** shadcn components must live in the consumer app's `src/lib/` where `$lib` resolves correctly and Svelte's context works.
- **The kit already ships Tabs via shadcn/bits-ui** — those work because they're rendered inside doc content (always mounted). The dropdown fails because it's conditionally rendered in the page header. Regardless, the architectural fix is correct: shadcn interactive components belong in the app.

## Files overview

| Action | File |
|--------|------|
| Modify | `packages/kit/src/lib/components/DocPage.svelte` — remove dropdown, keep link-building helpers as exports |
| Create | `packages/kit/src/lib/open-links.ts` — extract link-building logic to a reusable module |
| Modify | `packages/kit/src/index.ts` — export `getOpenLinks` and `getGitHubEditUrl` |
| Delete | `packages/kit/src/lib/components/ui/dropdown-menu/` — remove from kit |
| Modify | `packages/create-tiramisu-docs/src/scaffold.ts` — generate dropdown-menu shadcn files, utils.ts, OpenDropdown.svelte, update +page.svelte |
| Modify | `packages/create-tiramisu-docs/tests/scaffold.test.ts` — add tests for new generated files |
| Modify | `playground/src/routes/docs/[...slug]/+page.svelte` — use local OpenDropdown |
| Create | `playground/src/lib/components/OpenDropdown.svelte` — playground's own dropdown |
| Move   | dropdown-menu shadcn files from kit to `playground/src/lib/components/ui/dropdown-menu/` |
| Create | `playground/src/lib/utils.ts` — cn() helper for playground |
| Modify | `playground/vite.config.ts` — remove `resolve.dedupe` hack |

---

### Task 1: Extract link-building logic to a shared module

**Files:**
- Create: `packages/kit/src/lib/open-links.ts`
- Modify: `packages/kit/src/index.ts`

**Step 1: Create the open-links module**

```ts
// packages/kit/src/lib/open-links.ts
export interface OpenLinkOptions {
  baseUrl: string
  slug: string
  locale?: string
  github?: { repo: string; branch?: string; dir?: string }
}

export interface OpenLink {
  label: string
  href: string
}

export function getPageUrl(opts: OpenLinkOptions): string {
  const localePart = opts.locale ? `${opts.locale}/` : ""
  return `${opts.baseUrl}/docs/${localePart}${opts.slug}`
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
    { label: "Open in ChatGPT", href: `https://chat.openai.com/?q=${prompt}` },
    { label: "Open in Claude", href: `https://claude.ai/new?q=${prompt}` },
    { label: "Open in Cursor", href: `https://cursor.com/link/prompt?text=${cursorPrompt}` },
    { label: "Open in Scira", href: `https://scira.ai/?q=${cursorPrompt}` },
  ]
  const ghUrl = getGitHubEditUrl(opts)
  if (ghUrl) links.push({ label: "Edit on GitHub", href: ghUrl })
  return links
}
```

**Step 2: Export from kit index**

In `packages/kit/src/index.ts`, add:
```ts
export { getOpenLinks, getGitHubEditUrl, getPageUrl } from "./lib/open-links.js"
export type { OpenLink, OpenLinkOptions } from "./lib/open-links.js"
```

**Step 3: Build kit and verify**

Run: `cd packages/kit && bun run build`
Expected: Compiles without errors.

**Step 4: Commit**

```bash
git add packages/kit/src/lib/open-links.ts packages/kit/src/index.ts
git commit -m "feat: extract open-links helpers to shared module"
```

---

### Task 2: Strip dropdown from DocPage

**Files:**
- Modify: `packages/kit/src/lib/components/DocPage.svelte`

**Step 1: Remove all dropdown code from DocPage**

Rewrite DocPage to remove: the `DropdownMenu` import, `getPageUrl`, `getGitHubEditUrl`, `getOpenLinks` functions, `openLinks` derived, `github`/`locale` props, and all dropdown template markup. Keep: `meta`, `children`, `slug`, `baseUrl`, `lastEdited` props, `timeAgo`, `formatDate`, `buildJsonLd`, JSON-LD head, title/description head tags, article with title/description header, `{#key}` body, lastEdited footer. Add a `{@render}` snippet slot called `headerActions` for the dropdown to be injected from outside.

The full component should be:

```svelte
<script>
  let {
    meta,
    children,
    slug = undefined,
    baseUrl = undefined,
    lastEdited = undefined,
    headerActions = undefined,
  } = $props()

  function timeAgo(iso) {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`
    const months = Math.floor(days / 30)
    if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`
    const years = Math.floor(months / 12)
    return `${years} year${years === 1 ? "" : "s"} ago`
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  function buildJsonLd(meta, slug, baseUrl, lastEdited) {
    if (!slug || !baseUrl) return null
    const url = `${baseUrl}/docs/${slug}`
    const ld = {
      "@context": "https://schema.org",
      "@type": "TechArticle",
      "headline": meta?.title ?? slug,
      "url": url,
      "isPartOf": { "@type": "WebSite", "url": baseUrl }
    }
    if (meta?.description) ld["description"] = meta.description
    if (lastEdited) ld["dateModified"] = lastEdited
    return JSON.stringify(ld)
  }

  const jsonLd = $derived(buildJsonLd(meta, slug, baseUrl, lastEdited))
</script>

<svelte:head>
  {#if meta?.title}
    <title>{meta.title}</title>
    <meta property="og:title" content={meta.title} />
  {/if}
  {#if meta?.description}
    <meta name="description" content={meta.description} />
    <meta property="og:description" content={meta.description} />
  {/if}
  {#if jsonLd}
    {@html `<script type="application/ld+json">${jsonLd}</script>`}
  {/if}
</svelte:head>

<article class="doc-content">
  {#if meta?.title}
    <div class="mb-10 border-b pb-8">
      <div class="flex items-start justify-between gap-4">
        <h1 class="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          {meta.title}
        </h1>
        {#if headerActions}
          {@render headerActions()}
        {/if}
      </div>
      {#if meta?.description}
        <p class="mt-3 text-lg text-muted-foreground">
          {meta.description}
        </p>
      {/if}
    </div>
  {/if}

  {#key meta?.title}
  <div class="doc-body doc-animate">
    {@render children()}
  </div>
  {/key}

  {#if lastEdited}
    <div class="mt-10 border-t pt-4">
      <time
        datetime={lastEdited}
        title={formatDate(lastEdited)}
        class="text-sm text-muted-foreground"
      >
        Last edited {timeAgo(lastEdited)}
      </time>
    </div>
  {/if}
</article>
```

Keep all existing `<style>` as-is.

**Step 2: Build kit and run tests**

Run: `cd packages/kit && bun run build && cd ../.. && bun test`
Expected: All tests pass. (Playground will be broken until Task 4.)

**Step 3: Commit**

```bash
git add packages/kit/src/lib/components/DocPage.svelte
git commit -m "refactor: remove dropdown from DocPage, add headerActions snippet slot"
```

---

### Task 3: Delete dropdown-menu from kit package

**Files:**
- Delete: `packages/kit/src/lib/components/ui/dropdown-menu/` (entire directory)

**Step 1: Delete the directory**

```bash
rm -rf packages/kit/src/lib/components/ui/dropdown-menu
```

**Step 2: Build kit**

Run: `cd packages/kit && bun run build`
Expected: Compiles (nothing imports dropdown-menu from kit anymore after Task 2).

**Step 3: Commit**

```bash
git add -A packages/kit/src/lib/components/ui/dropdown-menu
git commit -m "chore: remove dropdown-menu shadcn component from kit"
```

---

### Task 4: Create OpenDropdown component in playground

**Files:**
- Create: `playground/src/lib/components/OpenDropdown.svelte`
- Move: dropdown-menu shadcn files to `playground/src/lib/components/ui/dropdown-menu/`
- Create: `playground/src/lib/utils.ts` (if not exists)
- Modify: `playground/src/routes/docs/[...slug]/+page.svelte`
- Modify: `playground/vite.config.ts` — remove `resolve.dedupe`

**Step 1: Add shadcn dropdown-menu to playground**

```bash
cd playground && npx shadcn-svelte@latest add dropdown-menu
```

This will create `src/lib/components/ui/dropdown-menu/` and `src/lib/utils.ts` in the playground. Confirm the prompt.

**Step 2: Create OpenDropdown.svelte**

```svelte
<!-- playground/src/lib/components/OpenDropdown.svelte -->
<script>
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"

  let { links = [] } = $props()
</script>

{#if links.length > 0}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      Open
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="opacity-60">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      {#each links as link}
        <DropdownMenu.Item>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            class="flex w-full items-center"
          >
            {link.label}
          </a>
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
```

**Step 3: Update playground +page.svelte**

```svelte
<script>
  import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
  import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
  import PrevNextNav from "@tiramisu-docs/kit/components/PrevNextNav.svelte"
  import OpenDropdown from "$lib/components/OpenDropdown.svelte"
  import config from "$lib/tiramisu.config"
  import { resolveConfig, getOpenLinks } from "@tiramisu-docs/kit"

  let { data } = $props()

  const resolved = resolveConfig(config)
  const links = $derived(
    resolved.url && data.slug
      ? getOpenLinks({ baseUrl: resolved.url, slug: data.slug, locale: data.locale, github: resolved.github })
      : []
  )
</script>

<DocsLayout
  config={resolved}
  sidebar={data.activeSidebar}
  headings={data.headings}
  sections={data.sections}
  locale={data.locale}
  locales={data.locales ? resolved.i18n?.locales?.filter(l => data.locales.includes(l.code)) : undefined}
  showFallbackBanner={data.showFallbackBanner}
>
  <DocPage meta={data.meta} lastEdited={data.lastEdited} slug={data.slug} baseUrl={resolved.url}>
    {#snippet headerActions()}
      <OpenDropdown {links} />
    {/snippet}
    {#if data.component}
      {@const Component = data.component}
      <Component />
    {/if}
  </DocPage>
  <PrevNextNav sidebar={data.activeSidebar} currentSlug={data.slug} locale={data.locale} />
</DocsLayout>
```

**Step 4: Remove resolve.dedupe from playground vite config**

Remove the `resolve: { dedupe: ["svelte", "bits-ui"] }` block from `playground/vite.config.ts`.

**Step 5: Start playground dev server and verify**

Run: `cd playground && bun run dev`
Expected: No `lifecycle_outside_component` error. Dropdown renders and works.

**Step 6: Commit**

```bash
git add playground/src/lib/components/OpenDropdown.svelte playground/src/lib/components/ui/dropdown-menu playground/src/lib/utils.ts playground/src/routes/docs/[...slug]/+page.svelte playground/vite.config.ts
git commit -m "feat: move OpenDropdown to playground app context"
```

---

### Task 5: Update kit's +page.svelte route template

**Files:**
- Modify: `packages/kit/src/lib/routes/docs/[...slug]/+page.svelte`

**Step 1: Update the kit route template**

The kit's route template is a reference/fallback. Remove dropdown references, keep the `headerActions` snippet slot available but empty:

```svelte
<script>
  import DocsLayout from "$lib/components/DocsLayout.svelte";
  import DocPage from "$lib/components/DocPage.svelte";

  let { data } = $props();
</script>

<DocsLayout
  config={data.config}
  sidebar={data.activeSidebar}
  headings={data.headings}
  sections={data.sections}
  locale={data.locale}
  locales={data.locales}
  showFallbackBanner={data.showFallbackBanner}
>
  <DocPage
    meta={data.meta}
    lastEdited={data.lastEdited}
    slug={data.slug}
    baseUrl={data.config?.url}
  >
    <svelte:component this={data.component} />
  </DocPage>
</DocsLayout>
```

**Step 2: Build kit**

Run: `cd packages/kit && bun run build`
Expected: Compiles.

**Step 3: Commit**

```bash
git add packages/kit/src/lib/routes/docs/[...slug]/+page.svelte
git commit -m "refactor: simplify kit route template, remove dropdown"
```

---

### Task 6: Update scaffolder to generate OpenDropdown

**Files:**
- Modify: `packages/create-tiramisu-docs/src/scaffold.ts`

**Step 1: Add new generator functions**

Add these functions to `scaffold.ts`:

`utilsTs()` — generates `src/lib/utils.ts`:
```ts
function utilsTs(): GeneratedFile {
  return {
    path: "src/lib/utils.ts",
    content: `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`,
  }
}
```

`openDropdownSvelte()` — generates `src/lib/components/OpenDropdown.svelte`:
```ts
function openDropdownSvelte(): GeneratedFile {
  return {
    path: "src/lib/components/OpenDropdown.svelte",
    content: `<script>
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"

  let { links = [] } = $props()
</script>

{#if links.length > 0}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      Open
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="opacity-60">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      {#each links as link}
        <DropdownMenu.Item>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            class="flex w-full items-center"
          >
            {link.label}
          </a>
        </DropdownMenu.Item>
      {/each}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
`,
  }
}
```

`dropdownMenuFiles()` — generates all shadcn dropdown-menu component files. Read the current files from `packages/kit/src/lib/components/ui/dropdown-menu/` (before they were deleted in Task 3 — use the playground's copy as reference) and embed them as string literals. Each file goes to `src/lib/components/ui/dropdown-menu/<filename>`. The `$lib/utils.js` imports are correct here since these will be in the user's app.

> **Important:** The shadcn files use `$lib/utils.js` imports — this is CORRECT for the scaffolded project since the files live in the app's `src/lib/`.

**Step 2: Update `pageSvelte()` to include OpenDropdown**

Replace the current `pageSvelte()` function body with content that imports `OpenDropdown` and `getOpenLinks`, computes links, and passes them via the `headerActions` snippet:

```ts
function pageSvelte(): GeneratedFile {
  return {
    path: "src/routes/docs/[...slug]/+page.svelte",
    content: `<script>
  import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
  import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
  import PrevNextNav from "@tiramisu-docs/kit/components/PrevNextNav.svelte"
  import OpenDropdown from "$lib/components/OpenDropdown.svelte"
  import config from "$lib/tiramisu.config"
  import { resolveConfig, getOpenLinks } from "@tiramisu-docs/kit"

  let { data } = $props()

  const resolved = resolveConfig(config)
  const links = $derived(
    resolved.url && data.slug
      ? getOpenLinks({ baseUrl: resolved.url, slug: data.slug, locale: data.locale, github: resolved.github })
      : []
  )
</script>

<DocsLayout
  config={resolved}
  sidebar={data.activeSidebar}
  headings={data.headings}
  sections={data.sections}
  locale={data.locale}
  locales={data.locales ? resolved.i18n?.locales?.filter(l => data.locales.includes(l.code)) : undefined}
  showFallbackBanner={data.showFallbackBanner}
>
  <DocPage meta={data.meta} lastEdited={data.lastEdited} slug={data.slug} baseUrl={resolved.url}>
    {#snippet headerActions()}
      <OpenDropdown {links} />
    {/snippet}
    {#if data.component}
      {@const Component = data.component}
      <Component />
    {/if}
  </DocPage>
  <PrevNextNav sidebar={data.activeSidebar} currentSlug={data.slug} locale={data.locale} />
</DocsLayout>
`,
  }
}
```

**Step 3: Update `pageTs()` to include `lastEdited` in return data**

In both `loadLegacy` and `loadDoc` return objects, add `lastEdited: doc?.lastEdited,`.

**Step 4: Add `utilsTs`, `openDropdownSvelte`, and `dropdownMenuFiles` to `generateProjectFiles`**

In the `files` array in `generateProjectFiles`, add:
```ts
utilsTs(),
openDropdownSvelte(),
...dropdownMenuFiles(),
```

**Step 5: Update `packageJson` dependencies**

Add `clsx`, `tailwind-merge`, and `bits-ui` to the generated `package.json` dependencies:
```ts
dependencies: {
  "@tiramisu-docs/kit": "^0.1.0",
  "@timeleap/tiramisu": "^1.6.0",
  "bits-ui": "^2.16.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^3.0.0",
},
```

**Step 6: Build and run tests**

Run: `cd packages/create-tiramisu-docs && bun test`
Expected: Existing tests pass (some may need updates due to new files).

**Step 7: Commit**

```bash
git add packages/create-tiramisu-docs/src/scaffold.ts
git commit -m "feat: scaffolder generates OpenDropdown with shadcn dropdown-menu"
```

---

### Task 7: Update scaffolder tests

**Files:**
- Modify: `packages/create-tiramisu-docs/tests/scaffold.test.ts`

**Step 1: Add tests for new generated files**

```ts
it("generates OpenDropdown component", () => {
  const files = generateProjectFiles(baseOptions)
  const paths = files.map(f => f.path)
  expect(paths).toContain("src/lib/components/OpenDropdown.svelte")
})

it("generates dropdown-menu shadcn components", () => {
  const files = generateProjectFiles(baseOptions)
  const paths = files.map(f => f.path)
  expect(paths).toContain("src/lib/components/ui/dropdown-menu/index.ts")
  expect(paths).toContain("src/lib/components/ui/dropdown-menu/dropdown-menu.svelte")
  expect(paths).toContain("src/lib/components/ui/dropdown-menu/dropdown-menu-item.svelte")
})

it("generates utils.ts with cn helper", () => {
  const files = generateProjectFiles(baseOptions)
  const utils = files.find(f => f.path === "src/lib/utils.ts")!
  expect(utils.content).toContain("export function cn")
})

it("page.svelte imports OpenDropdown and getOpenLinks", () => {
  const files = generateProjectFiles(baseOptions)
  const page = files.find(f => f.path === "src/routes/docs/[...slug]/+page.svelte")!
  expect(page.content).toContain("OpenDropdown")
  expect(page.content).toContain("getOpenLinks")
  expect(page.content).toContain("headerActions")
})

it("page.ts includes lastEdited in return data", () => {
  const files = generateProjectFiles(baseOptions)
  const pageTs = files.find(f => f.path === "src/routes/docs/[...slug]/+page.ts")!
  expect(pageTs.content).toContain("lastEdited")
})

it("package.json includes bits-ui dependency", () => {
  const files = generateProjectFiles(baseOptions)
  const pkg = files.find(f => f.path === "package.json")!
  expect(pkg.content).toContain("bits-ui")
})
```

**Step 2: Update existing test for pageSvelte**

The existing test `passes slug and baseUrl to DocPage` should still pass since the new `pageSvelte()` still contains those strings.

**Step 3: Run all tests**

Run: `cd /Users/pouya/Projects/tiramisu-docs && bun test`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add packages/create-tiramisu-docs/tests/scaffold.test.ts
git commit -m "test: add scaffolder tests for OpenDropdown generation"
```

---

### Task 8: Final verification

**Step 1: Full build**

Run: `bun run build`
Expected: All packages build successfully.

**Step 2: Full test suite**

Run: `bun test`
Expected: All tests pass.

**Step 3: Playground dev server smoke test**

Run: `cd playground && bun run dev`
Expected:
- No `lifecycle_outside_component` error
- "Open" dropdown appears in page header top-right
- Dropdown opens, shows 5 links (ChatGPT, Claude, Cursor, Scira, Edit on GitHub)
- Links open in new tabs with correct URLs
- "Last edited X ago" appears at bottom of pages

**Step 4: Final commit**

If any fixups were needed, commit them. Then verify `bun test` one final time.
