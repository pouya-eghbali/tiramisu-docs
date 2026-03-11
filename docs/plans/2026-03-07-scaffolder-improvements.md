# Scaffolder Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add sections (TopBar) and i18n prompts to the scaffolding CLI, and update all generated files to support these features.

**Architecture:** The `+page.ts` and `+page.svelte` are updated to the full-featured versions that auto-detect sections/i18n from the virtual module at runtime. This means all scaffolded projects get the same route files regardless of options. Only `vite.config.ts`, `tiramisu.config.ts`, and the docs folder structure change based on user choices. The theme prompt is removed since it was never wired up.

**Tech Stack:** TypeScript, @clack/prompts, bun test

---

### Task 1: Update ScaffoldOptions and add new prompts to CLI

**Files:**
- Modify: `packages/create-tiramisu-docs/src/scaffold.ts:1-4`
- Modify: `packages/create-tiramisu-docs/src/index.ts:12-38`

**Step 1: Update ScaffoldOptions interface**

Replace the interface in `scaffold.ts`:

```typescript
export interface ScaffoldOptions {
  name: string
  sections: boolean
  i18n: boolean
  defaultLocale: string
  locales: { code: string; label: string }[]
}
```

**Step 2: Update CLI prompts**

Replace the `p.group` call in `index.ts`:

```typescript
const options = await p.group({
  name: () => p.text({
    message: "Project name:",
    placeholder: "my-docs",
    defaultValue: "my-docs",
  }),
  packageManager: () => p.select({
    message: "Package manager:",
    options: [
      { value: "bun", label: "bun" },
      { value: "npm", label: "npm" },
      { value: "pnpm", label: "pnpm" },
    ],
  }),
  sections: () => p.confirm({
    message: "Enable top navigation sections?",
    initialValue: false,
  }),
  i18n: () => p.confirm({
    message: "Enable translations (i18n)?",
    initialValue: false,
  }),
  defaultLocale: ({ results }) => {
    if (!results.i18n) return Promise.resolve("en")
    return p.text({
      message: "Default locale code:",
      placeholder: "en",
      defaultValue: "en",
    })
  },
}, {
  onCancel: () => {
    p.cancel("Cancelled.")
    process.exit(0)
  },
})
```

**Step 3: Update generateProjectFiles call**

Replace the call site in `index.ts`:

```typescript
const files = generateProjectFiles({
  name: options.name,
  sections: options.sections,
  i18n: options.i18n,
  defaultLocale: options.defaultLocale as string,
  locales: options.i18n
    ? [{ code: options.defaultLocale as string, label: options.defaultLocale === "en" ? "English" : options.defaultLocale as string }]
    : [],
})
```

**Step 4: Run build to verify types**

Run: `cd packages/create-tiramisu-docs && bun run build`
Expected: PASS (tsc compiles)

**Step 5: Commit**

```
feat(scaffolder): add sections and i18n prompts, remove unused theme option
```

---

### Task 2: Update viteConfig and tiramisuConfig generators

**Files:**
- Modify: `packages/create-tiramisu-docs/src/scaffold.ts` (viteConfig + tiramisuConfig functions)

**Step 1: Update viteConfig to accept options and generate conditional config**

Replace the `viteConfig` function:

```typescript
function viteConfig(options: ScaffoldOptions): GeneratedFile {
  const pluginArgs: string[] = []

  if (options.sections) {
    pluginArgs.push(`      sections: [
        { label: "Guide", path: "guide" },
        { label: "API", path: "api" },
      ]`)
  }

  if (options.i18n) {
    pluginArgs.push(`      i18n: {
        defaultLocale: "${options.defaultLocale}",
        locales: [
          { code: "${options.defaultLocale}", label: "${options.defaultLocale === "en" ? "English" : options.defaultLocale}" },
        ],
      }`)
  }

  if (options.sections || options.i18n) {
    pluginArgs.push(`      title: "${options.name}"`)
  }

  const pluginCall = pluginArgs.length > 0
    ? `tiramisuPlugin({\n${pluginArgs.join(",\n")},\n    })`
    : "tiramisuPlugin()"

  return {
    path: "vite.config.ts",
    content: `import { sveltekit } from "@sveltejs/kit/vite"
import { tiramisuPlugin } from "@tiramisu-docs/kit/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    ${pluginCall},
    tailwindcss(),
    sveltekit(),
  ],
})
`,
  }
}
```

**Step 2: Update tiramisuConfig to accept options**

Replace the `tiramisuConfig` function:

```typescript
function tiramisuConfig(options: ScaffoldOptions): GeneratedFile {
  const configProps: string[] = [
    `  title: "${options.name}",`,
    `  description: "Documentation powered by Tiramisu Docs",`,
    `  nav: [\n    { label: "Docs", href: "/docs" },\n  ],`,
  ]

  if (options.sections) {
    configProps.push(`  sections: [
    { label: "Guide", path: "guide" },
    { label: "API", path: "api" },
  ],`)
  }

  if (options.i18n) {
    configProps.push(`  i18n: {
    defaultLocale: "${options.defaultLocale}",
    locales: [
      { code: "${options.defaultLocale}", label: "${options.defaultLocale === "en" ? "English" : options.defaultLocale}" },
    ],
  },`)
  }

  return {
    path: "src/lib/tiramisu.config.ts",
    content: `import { defineConfig } from "@tiramisu-docs/kit"

export default defineConfig({
${configProps.join("\n")}
})
`,
  }
}
```

**Step 3: Update the generateProjectFiles calls to pass options**

In the `generateProjectFiles` function, change:
- `viteConfig()` → `viteConfig(options)`
- `tiramisuConfig(name)` → `tiramisuConfig(options)`

**Step 4: Run build to verify types**

Run: `cd packages/create-tiramisu-docs && bun run build`
Expected: PASS

**Step 5: Commit**

```
feat(scaffolder): generate sections and i18n config when enabled
```

---

### Task 3: Update docs file generators for sections and i18n

**Files:**
- Modify: `packages/create-tiramisu-docs/src/scaffold.ts` (indexTiramisu, gettingStartedTiramisu, generateProjectFiles)

**Step 1: Update indexTiramisu and gettingStartedTiramisu to support locale prefix**

The docs path changes based on options:
- Default: `src/docs/index.tiramisu`
- Sections only: `src/docs/guide/index.tiramisu` (first section)
- i18n only: `src/docs/en/index.tiramisu`
- Both: `src/docs/en/guide/index.tiramisu`

Replace `indexTiramisu`:

```typescript
function indexTiramisu(options: ScaffoldOptions): GeneratedFile {
  const pathParts = ["src/docs"]
  if (options.i18n) pathParts.push(options.defaultLocale)
  if (options.sections) pathParts.push("guide")
  pathParts.push("index.tiramisu")

  return {
    path: pathParts.join("/"),
    content: `meta { title = Welcome, order = 1, group = Guide }

h1 { Welcome to ${options.name} }

This is your documentation site powered by bold { Tiramisu Docs }.

Get started by editing the files in code { src/docs/ }.
`,
  }
}
```

Replace `gettingStartedTiramisu`:

```typescript
function gettingStartedTiramisu(options: ScaffoldOptions): GeneratedFile {
  const pathParts = ["src/docs"]
  if (options.i18n) pathParts.push(options.defaultLocale)
  if (options.sections) pathParts.push("guide")
  pathParts.push("getting-started.tiramisu")

  return {
    path: pathParts.join("/"),
    content: `meta { title = Getting Started, order = 2, group = Guide }

h2 { Installation }

codeblock { language = bash, "bun add my-package" }

h2 { Usage }

Import and use the package in your project:

codeblock { language = typescript, "import { something } from 'my-package'" }
`,
  }
}
```

Also add an API section placeholder when sections are enabled:

```typescript
function apiTiramisu(options: ScaffoldOptions): GeneratedFile {
  const pathParts = ["src/docs"]
  if (options.i18n) pathParts.push(options.defaultLocale)
  pathParts.push("api/index.tiramisu")

  return {
    path: pathParts.join("/"),
    content: `meta { title = Overview, order = 1, group = API }

h1 { API Reference }

Document your API here.
`,
  }
}
```

**Step 2: Update generateProjectFiles to use new signatures**

```typescript
export function generateProjectFiles(options: ScaffoldOptions): GeneratedFile[] {
  const files = [
    packageJson(options.name),
    svelteConfig(),
    viteConfig(options),
    tiramisuConfig(options),
    appHtml(),
    appCss(),
    indexTiramisu(options),
    gettingStartedTiramisu(options),
    homePage(),
    layoutSvelte(),
    pageTs(),
    pageSvelte(),
    tsconfig(),
    gitignore(),
  ]

  if (options.sections) {
    files.push(apiTiramisu(options))
  }

  return files
}
```

**Step 3: Run build**

Run: `cd packages/create-tiramisu-docs && bun run build`
Expected: PASS

**Step 4: Commit**

```
feat(scaffolder): generate docs in section/locale folders when enabled
```

---

### Task 4: Update +page.ts to the full-featured version

**Files:**
- Modify: `packages/create-tiramisu-docs/src/scaffold.ts` (pageTs function)

**Step 1: Replace the pageTs function**

The generated `+page.ts` should handle all three modes (flat, sections, i18n) by auto-detecting from the virtual module:

```typescript
function pageTs(): GeneratedFile {
  return {
    path: "src/routes/docs/[...slug]/+page.ts",
    content: `import { error, redirect } from "@sveltejs/kit"

export const ssr = false

export async function load({ params }) {
  const rawSlug = params.slug || "index"
  const mod = await import("virtual:tiramisu-docs")

  if (mod.locales && mod.defaultLocale) {
    const segments = rawSlug.split("/")
    const possibleLocale = segments[0]
    const localeData = mod.locales[possibleLocale]

    if (localeData) {
      const locale = possibleLocale
      const slug = segments.slice(1).join("/") || "index"
      return loadDoc(localeData, slug, locale, mod)
    } else {
      throw redirect(302, \`/docs/\${mod.defaultLocale}/\${rawSlug}\`)
    }
  }

  return loadLegacy(mod, rawSlug)
}

function loadLegacy(mod, slug) {
  let importFn = mod.docImports[slug] ?? mod.docImports[slug + "/index"]
  if (!importFn) throw error(404, "Page not found")
  if (!mod.docImports[slug]) slug = slug + "/index"

  return importFn().then((c) => {
    const doc = mod.docs.find((d) => d.slug === slug)
    let activeSidebar = mod.sidebar
    if (mod.sections) {
      activeSidebar = findActiveSectionSidebar(mod.sections, slug) ?? mod.sidebar
    }
    return {
      component: c.default ?? c,
      meta: doc?.meta ?? {},
      headings: doc?.headings ?? [],
      slug,
      sections: mod.sections ?? undefined,
      activeSidebar,
    }
  })
}

async function loadDoc(localeData, slug, locale, mod) {
  let importFn = localeData.docImports[slug] ?? localeData.docImports[slug + "/index"]
  if (!localeData.docImports[slug] && localeData.docImports[slug + "/index"]) slug = slug + "/index"
  let showFallbackBanner = false

  if (!importFn) {
    const defaultData = mod.locales[mod.defaultLocale]
    importFn = defaultData?.docImports[slug] ?? defaultData?.docImports[slug + "/index"]
    if (!defaultData?.docImports[slug] && defaultData?.docImports[slug + "/index"]) slug = slug + "/index"
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
    locales: Object.keys(mod.locales),
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
  if (sections.length > 0 && sections[0].sidebar && !sections[0].path) {
    return sections[0].sidebar
  }
  return null
}
`,
  }
}
```

**Step 2: Run build**

Run: `cd packages/create-tiramisu-docs && bun run build`
Expected: PASS

**Step 3: Commit**

```
feat(scaffolder): generate full-featured +page.ts with sections/i18n support
```

---

### Task 5: Update +page.svelte to the full-featured version

**Files:**
- Modify: `packages/create-tiramisu-docs/src/scaffold.ts` (pageSvelte function)

**Step 1: Replace the pageSvelte function**

```typescript
function pageSvelte(): GeneratedFile {
  return {
    path: "src/routes/docs/[...slug]/+page.svelte",
    content: `<script>
  import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
  import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
  import PrevNextNav from "@tiramisu-docs/kit/components/PrevNextNav.svelte"
  import config from "$lib/tiramisu.config"
  import { resolveConfig } from "@tiramisu-docs/kit"

  let { data } = $props()

  const resolved = resolveConfig(config)
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
  <DocPage meta={data.meta}>
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

**Step 2: Run build**

Run: `cd packages/create-tiramisu-docs && bun run build`
Expected: PASS

**Step 3: Commit**

```
feat(scaffolder): generate full-featured +page.svelte with sections/i18n support
```

---

### Task 6: Update tests

**Files:**
- Modify: `packages/create-tiramisu-docs/tests/scaffold.test.ts`

**Step 1: Update existing tests and add new ones**

```typescript
import { describe, expect, it } from "bun:test"
import { generateProjectFiles } from "../src/scaffold"

const baseOptions = { name: "my-docs", sections: false, i18n: false, defaultLocale: "en", locales: [] }

describe("generateProjectFiles", () => {
  it("generates the expected file list (flat mode)", () => {
    const files = generateProjectFiles(baseOptions)
    const paths = files.map(f => f.path)

    expect(paths).toContain("package.json")
    expect(paths).toContain("svelte.config.js")
    expect(paths).toContain("vite.config.ts")
    expect(paths).toContain("src/lib/tiramisu.config.ts")
    expect(paths).toContain("src/docs/index.tiramisu")
    expect(paths).toContain("src/docs/getting-started.tiramisu")
    expect(paths).toContain("src/app.html")
    expect(paths).not.toContain("src/docs/api/index.tiramisu")
  })

  it("includes project name in package.json", () => {
    const files = generateProjectFiles(baseOptions)
    const pkg = files.find(f => f.path === "package.json")!
    expect(pkg.content).toContain('"my-docs"')
  })

  it("generates section folders when sections enabled", () => {
    const files = generateProjectFiles({ ...baseOptions, sections: true })
    const paths = files.map(f => f.path)

    expect(paths).toContain("src/docs/guide/index.tiramisu")
    expect(paths).toContain("src/docs/guide/getting-started.tiramisu")
    expect(paths).toContain("src/docs/api/index.tiramisu")
    expect(paths).not.toContain("src/docs/index.tiramisu")
  })

  it("generates locale folders when i18n enabled", () => {
    const files = generateProjectFiles({ ...baseOptions, i18n: true, defaultLocale: "en", locales: [{ code: "en", label: "English" }] })
    const paths = files.map(f => f.path)

    expect(paths).toContain("src/docs/en/index.tiramisu")
    expect(paths).toContain("src/docs/en/getting-started.tiramisu")
    expect(paths).not.toContain("src/docs/index.tiramisu")
  })

  it("generates both section and locale folders when both enabled", () => {
    const files = generateProjectFiles({ ...baseOptions, sections: true, i18n: true, defaultLocale: "en", locales: [{ code: "en", label: "English" }] })
    const paths = files.map(f => f.path)

    expect(paths).toContain("src/docs/en/guide/index.tiramisu")
    expect(paths).toContain("src/docs/en/guide/getting-started.tiramisu")
    expect(paths).toContain("src/docs/en/api/index.tiramisu")
  })

  it("includes sections config in vite.config when sections enabled", () => {
    const files = generateProjectFiles({ ...baseOptions, sections: true })
    const vite = files.find(f => f.path === "vite.config.ts")!
    expect(vite.content).toContain("sections:")
  })

  it("includes i18n config in vite.config when i18n enabled", () => {
    const files = generateProjectFiles({ ...baseOptions, i18n: true, defaultLocale: "en", locales: [{ code: "en", label: "English" }] })
    const vite = files.find(f => f.path === "vite.config.ts")!
    expect(vite.content).toContain("i18n:")
    expect(vite.content).toContain("defaultLocale")
  })

  it("generates full-featured +page.ts with redirect support", () => {
    const files = generateProjectFiles(baseOptions)
    const pageTs = files.find(f => f.path === "src/routes/docs/[...slug]/+page.ts")!
    expect(pageTs.content).toContain("redirect")
    expect(pageTs.content).toContain("findActiveSectionSidebar")
  })
})
```

**Step 2: Run tests**

Run: `cd packages/create-tiramisu-docs && bun test`
Expected: All 8 tests PASS

**Step 3: Run build**

Run: `cd packages/create-tiramisu-docs && bun run build`
Expected: PASS

**Step 4: Commit**

```
test(scaffolder): update and expand tests for sections/i18n options
```

---

## Files Summary

| File | Changes |
|------|---------|
| `packages/create-tiramisu-docs/src/index.ts` | Replace theme prompt with sections/i18n confirms, update generateProjectFiles call |
| `packages/create-tiramisu-docs/src/scaffold.ts` | Update ScaffoldOptions, viteConfig, tiramisuConfig, docs generators, pageTs, pageSvelte; add apiTiramisu |
| `packages/create-tiramisu-docs/tests/scaffold.test.ts` | Rewrite tests for new options, add 6 new test cases |

## Verification

1. `cd packages/create-tiramisu-docs && bun run build` — no errors
2. `cd packages/create-tiramisu-docs && bun test` — all tests pass
3. Manual: `cd /tmp && node /path/to/dist/index.js` — run through all prompt combos, verify generated files look correct
