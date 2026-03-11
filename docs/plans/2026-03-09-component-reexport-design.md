# Component Re-Export Pattern Design

**Goal:** All component imports in generated code go through a user-controlled barrel file at `$lib/components/index.ts`, enabling easy component overrides.

## Architecture

The barrel file `src/lib/components/index.ts` becomes the single source of truth for all component imports. Three things change:

1. **`@tiramisu-docs/core` builtins** — all `ctx.customImports.add()` calls switch from `@tiramisu-docs/kit/components/tiramisu/X.svelte` to `import { X } from "$lib/components"`
2. **Scaffolder** — generates the barrel file with default re-exports from the kit, and the route `+page.svelte` imports layout components from `$lib/components` instead of `@tiramisu-docs/kit/components/...`
3. **Kit's default route files** — `packages/kit/src/lib/routes/docs/[...slug]/+page.svelte` switches to `$lib/components` imports (fallback when users don't have their own route files); kit itself gets a barrel file at `packages/kit/src/lib/components/index.ts`

## Override Flow

User wants a custom CodeBlock:
1. Creates `src/lib/components/CodeBlock.svelte`
2. Changes one line in `index.ts`: from kit re-export to `export { default as CodeBlock } from "./CodeBlock.svelte"`

The existing "magic override by convention" in the compiler stays for truly custom components (unknown function names → `$lib/components/tiramisu/`), but built-in overrides go through the barrel.

## Barrel File Contents

```ts
// Layout
export { default as DocsLayout } from "@tiramisu-docs/kit/components/DocsLayout.svelte"
export { default as DocPage } from "@tiramisu-docs/kit/components/DocPage.svelte"
export { default as PrevNextNav } from "@tiramisu-docs/kit/components/PrevNextNav.svelte"

// Tiramisu built-ins
export { default as CodeBlock } from "@tiramisu-docs/kit/components/tiramisu/CodeBlock.svelte"
export { default as CodeTabs } from "@tiramisu-docs/kit/components/tiramisu/CodeTabs.svelte"
export { default as Callout } from "@tiramisu-docs/kit/components/tiramisu/Callout.svelte"
export { default as Tabs } from "@tiramisu-docs/kit/components/tiramisu/Tabs.svelte"
export { default as Steps } from "@tiramisu-docs/kit/components/tiramisu/Steps.svelte"
export { default as Demo } from "@tiramisu-docs/kit/components/tiramisu/Demo.svelte"
export { default as Badge } from "@tiramisu-docs/kit/components/ui/badge/badge.svelte"
export { default as Accordion } from "@tiramisu-docs/kit/components/tiramisu/Accordion.svelte"
export { default as NavCard } from "@tiramisu-docs/kit/components/tiramisu/NavCard.svelte"
export { default as FileTree } from "@tiramisu-docs/kit/components/tiramisu/FileTree.svelte"
export { default as ZoomImage } from "@tiramisu-docs/kit/components/tiramisu/ZoomImage.svelte"
export { default as MathBlock } from "@tiramisu-docs/kit/components/tiramisu/MathBlock.svelte"
export { default as Mermaid } from "@tiramisu-docs/kit/components/tiramisu/Mermaid.svelte"
```

## Import Changes

### builtins.ts (before → after)
```ts
// Before
ctx.customImports.add(`import CodeBlock from "@tiramisu-docs/kit/components/tiramisu/CodeBlock.svelte"`)

// After
ctx.customImports.add(`import { CodeBlock } from "$lib/components"`)
```

### Kit default +page.svelte (before → after)
```svelte
<!-- Before -->
import DocsLayout from "$lib/components/DocsLayout.svelte"
import DocPage from "$lib/components/DocPage.svelte"

<!-- After -->
import { DocsLayout, DocPage } from "$lib/components"
```

### Scaffolder +page.svelte (before → after)
```svelte
<!-- Before -->
import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
import PrevNextNav from "@tiramisu-docs/kit/components/PrevNextNav.svelte"

<!-- After -->
import { DocsLayout, DocPage, PrevNextNav } from "$lib/components"
```

## Files Modified

1. `packages/core/src/builtins.ts` — change all 13 `ctx.customImports.add()` calls to named imports from `$lib/components`
2. `packages/kit/src/lib/components/index.ts` — new barrel file (kit's own, for default route fallback)
3. `packages/kit/src/lib/routes/docs/[...slug]/+page.svelte` — import from barrel
4. `packages/create-tiramisu-docs/src/scaffold.ts` — generate barrel file, update route template imports
5. `playground/src/lib/components/index.ts` — new barrel file for playground
6. `playground/src/routes/docs/[...slug]/+page.svelte` — import from barrel

## Testing

- Existing core and kit tests must pass (import paths change but not behavior)
- Add test to verify compiled output uses `$lib/components` imports
- Dev server smoke test: playground pages render correctly
