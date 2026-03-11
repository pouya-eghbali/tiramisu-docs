# Component Re-Export Pattern Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Route all component imports in generated code through a user-controlled barrel file at `$lib/components/index.ts`, so users can swap any component by editing one line.

**Architecture:** `builtins.ts` emits named imports from `$lib/components` instead of deep kit paths. The scaffolder generates a barrel file that re-exports kit defaults. The kit itself gets a barrel file for its fallback route.

**Tech Stack:** TypeScript, Svelte 5, Bun test

---

### Task 1: Update compiler test for new import path

**Files:**
- Modify: `packages/core/tests/compiler.test.ts:29`

**Step 1: Update the existing test assertion**

Change line 29 from:
```ts
    expect(result.svelte).toContain("@tiramisu-docs/kit/components/tiramisu/CodeBlock.svelte")
```
to:
```ts
    expect(result.svelte).toContain('import { CodeBlock } from "$lib/components"')
```

**Step 2: Add a test for custom component imports (unchanged path)**

Add after the code blocks test:
```ts
  it("imports custom components from $lib/components/tiramisu", () => {
    const result = compileTiramisu("MyWidget { hello = world, content }")
    expect(result.svelte).toContain('import MyWidget from "$lib/components/tiramisu/MyWidget.svelte"')
  })
```

**Step 3: Run tests to verify they fail**

Run: `cd packages/core && bun test`
Expected: 1 failure (codeblock test — old import path still in builtins.ts)

---

### Task 2: Update builtins.ts import paths

**Files:**
- Modify: `packages/core/src/builtins.ts`

**Step 1: Change all 13 `ctx.customImports.add()` calls**

Each import changes from a default import to a named import from `$lib/components`. The exact replacements:

| Line | Old | New |
|------|-----|-----|
| 186-187 | `import ZoomImage from "@tiramisu-docs/kit/components/tiramisu/ZoomImage.svelte"` | `import { ZoomImage } from "$lib/components"` |
| 197-198 | `import CodeBlock from "@tiramisu-docs/kit/components/tiramisu/CodeBlock.svelte"` | `import { CodeBlock } from "$lib/components"` |
| 209-210 | `import CodeTabs from "@tiramisu-docs/kit/components/tiramisu/CodeTabs.svelte"` | `import { CodeTabs } from "$lib/components"` |
| 279-280 | `import Callout from "@tiramisu-docs/kit/components/tiramisu/Callout.svelte"` | `import { Callout } from "$lib/components"` |
| 286-287 | `import Tabs from "@tiramisu-docs/kit/components/tiramisu/Tabs.svelte"` | `import { Tabs } from "$lib/components"` |
| 294-295 | `import Steps from "@tiramisu-docs/kit/components/tiramisu/Steps.svelte"` | `import { Steps } from "$lib/components"` |
| 304-305 | `import Demo from "@tiramisu-docs/kit/components/tiramisu/Demo.svelte"` | `import { Demo } from "$lib/components"` |
| 313-314 | `import Badge from "@tiramisu-docs/kit/components/ui/badge/badge.svelte"` | `import { Badge } from "$lib/components"` |
| 356-357 | `import Accordion from "@tiramisu-docs/kit/components/tiramisu/Accordion.svelte"` | `import { Accordion } from "$lib/components"` |
| 363-364 | `import NavCard from "@tiramisu-docs/kit/components/tiramisu/NavCard.svelte"` | `import { NavCard } from "$lib/components"` |
| 376-377 | (same NavCard, duplicate in `card` handler) | `import { NavCard } from "$lib/components"` |
| 387-388 | `import FileTree from "@tiramisu-docs/kit/components/tiramisu/FileTree.svelte"` | `import { FileTree } from "$lib/components"` |
| 408-409 | `import MathBlock from "@tiramisu-docs/kit/components/tiramisu/MathBlock.svelte"` | `import { MathBlock } from "$lib/components"` |
| 419-420 | `import Mermaid from "@tiramisu-docs/kit/components/tiramisu/Mermaid.svelte"` | `import { Mermaid } from "$lib/components"` |

**Step 2: Run core tests**

Run: `cd packages/core && bun test`
Expected: All pass (test from Task 1 now matches)

**Step 3: Build core**

Run: `cd packages/core && bun run build`
Expected: Clean compile

---

### Task 3: Create kit barrel file

**Files:**
- Create: `packages/kit/src/lib/components/index.ts`

**Step 1: Create the barrel file**

```ts
// Layout
export { default as DocsLayout } from "./DocsLayout.svelte"
export { default as DocPage } from "./DocPage.svelte"
export { default as PrevNextNav } from "./PrevNextNav.svelte"

// Tiramisu built-ins
export { default as Accordion } from "./tiramisu/Accordion.svelte"
export { default as Badge } from "./ui/badge/badge.svelte"
export { default as Callout } from "./tiramisu/Callout.svelte"
export { default as CodeBlock } from "./tiramisu/CodeBlock.svelte"
export { default as CodeTabs } from "./tiramisu/CodeTabs.svelte"
export { default as Demo } from "./tiramisu/Demo.svelte"
export { default as FileTree } from "./tiramisu/FileTree.svelte"
export { default as MathBlock } from "./tiramisu/MathBlock.svelte"
export { default as Mermaid } from "./tiramisu/Mermaid.svelte"
export { default as NavCard } from "./tiramisu/NavCard.svelte"
export { default as Steps } from "./tiramisu/Steps.svelte"
export { default as Tabs } from "./tiramisu/Tabs.svelte"
export { default as ZoomImage } from "./tiramisu/ZoomImage.svelte"
```

**Step 2: Update kit's default +page.svelte**

Change `packages/kit/src/lib/routes/docs/[...slug]/+page.svelte` imports from:
```svelte
import DocsLayout from "$lib/components/DocsLayout.svelte";
import DocPage from "$lib/components/DocPage.svelte";
```
to:
```svelte
import { DocsLayout, DocPage } from "$lib/components";
```

**Step 3: Build kit**

Run: `cd packages/kit && bun run build`
Expected: Clean compile

**Step 4: Run kit tests**

Run: `cd packages/kit && bun test`
Expected: All pass

---

### Task 4: Create playground barrel file and update route

**Files:**
- Create: `playground/src/lib/components/index.ts`
- Modify: `playground/src/routes/docs/[...slug]/+page.svelte`

**Step 1: Create playground barrel file**

```ts
// Layout
export { default as DocsLayout } from "@tiramisu-docs/kit/components/DocsLayout.svelte"
export { default as DocPage } from "@tiramisu-docs/kit/components/DocPage.svelte"
export { default as PrevNextNav } from "@tiramisu-docs/kit/components/PrevNextNav.svelte"

// Tiramisu built-ins
export { default as Accordion } from "@tiramisu-docs/kit/components/tiramisu/Accordion.svelte"
export { default as Badge } from "@tiramisu-docs/kit/components/ui/badge/badge.svelte"
export { default as Callout } from "@tiramisu-docs/kit/components/tiramisu/Callout.svelte"
export { default as CodeBlock } from "@tiramisu-docs/kit/components/tiramisu/CodeBlock.svelte"
export { default as CodeTabs } from "@tiramisu-docs/kit/components/tiramisu/CodeTabs.svelte"
export { default as Demo } from "@tiramisu-docs/kit/components/tiramisu/Demo.svelte"
export { default as FileTree } from "@tiramisu-docs/kit/components/tiramisu/FileTree.svelte"
export { default as MathBlock } from "@tiramisu-docs/kit/components/tiramisu/MathBlock.svelte"
export { default as Mermaid } from "@tiramisu-docs/kit/components/tiramisu/Mermaid.svelte"
export { default as NavCard } from "@tiramisu-docs/kit/components/tiramisu/NavCard.svelte"
export { default as Steps } from "@tiramisu-docs/kit/components/tiramisu/Steps.svelte"
export { default as Tabs } from "@tiramisu-docs/kit/components/tiramisu/Tabs.svelte"
export { default as ZoomImage } from "@tiramisu-docs/kit/components/tiramisu/ZoomImage.svelte"
```

**Step 2: Update playground +page.svelte**

Change imports from:
```svelte
import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
import PrevNextNav from "@tiramisu-docs/kit/components/PrevNextNav.svelte"
```
to:
```svelte
import { DocsLayout, DocPage, PrevNextNav } from "$lib/components"
```

**Step 3: Dev server smoke test**

Run: `cd playground && bun run dev`
- Visit `/docs/framework` — page renders with layout, sidebar, content
- Visit `/docs/framework/getting-started/installation` — codetabs render, tabs switch
- Visit `/docs/language/basics/syntax` — filetree and code blocks render

---

### Task 5: Update scaffolder template

**Files:**
- Modify: `packages/create-tiramisu-docs/src/scaffold.ts`

**Step 1: Add barrel file to scaffolder output**

Find the `generateProjectFiles` function. Add a new file generator that creates `src/lib/components/index.ts` with the same content as the playground barrel (Task 4 Step 1).

**Step 2: Update pageSvelte() template (line 503-545)**

Change the imports in the template from:
```ts
  import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
  import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
  import PrevNextNav from "@tiramisu-docs/kit/components/PrevNextNav.svelte"
```
to:
```ts
  import { DocsLayout, DocPage, PrevNextNav } from "$lib/components"
```

**Step 3: Run scaffolder tests**

Run: `cd packages/create-tiramisu-docs && bun test`
Expected: All pass (or update test assertions if they check for old import paths)

**Step 4: Build scaffolder**

Run: `cd packages/create-tiramisu-docs && bun run build`
Expected: Clean compile

---

### Task 6: Update highlight.ts regex

**Files:**
- Modify: `packages/kit/src/highlight.ts:42-43`

**Step 1: Update CodeBlock regex**

The current regex matches:
```
<CodeBlock language="..." code={__code_N} />
```

Since builtins now emit named imports (`import { CodeBlock } from "$lib/components"`), the component tag name stays the same — `<CodeBlock ... />` — so the regex still works. **No change needed here.**

Verify by checking the compiled output of a `.tiramisu` file still contains `<CodeBlock language="..." code={__code_N} />` (only the import line changed, not the component usage).

**Step 2: Run full test suite**

Run: `cd /Users/pouya/Projects/tiramisu-docs && bun test --recursive`
Expected: All tests pass across all packages
