# Fix Playground Docs: Double h1, Wrong Titles, Bad Ordering

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three interacting issues in playground docs — duplicate h1 headings, wrong sidebar labels/page titles, and non-deterministic subgroup ordering.

**Architecture:** DocPage.svelte already renders `meta.title` as h1. Convention: content never uses `h1 { ... }` — starts at h2. Subgroup index pages need distinct `order` values for deterministic sidebar ordering. The scaffolder templates need the same h1 fix.

**Tech Stack:** Tiramisu markup files, TypeScript (scaffolder)

---

### Task 1: Fix `getting-started/index.tiramisu` title and remove h1

The title "Introduction" causes the sidebar subgroup to show "Introduction" instead of "Getting Started".

**Files:**
- Modify: `playground/src/docs/framework/getting-started/index.tiramisu`

**Step 1: Fix the file**

Change `title = Introduction` to `title = Getting Started` and remove the `h1 { Introduction }` line (DocPage renders the title).

Before:
```
meta { title = Introduction, order = 1 }

h1 { Introduction }

Tiramisu Docs is a documentation framework...
```

After:
```
meta { title = Getting Started, order = 1 }

Tiramisu Docs is a documentation framework...
```

### Task 2: Fix subgroup ordering — give each section index a unique order

All subgroup index pages (`getting-started`, `writing`, `configuration`, `customization`, `integrations`) have `order = 1`, causing non-deterministic sidebar order.

**Files:**
- Modify: `playground/src/docs/framework/getting-started/index.tiramisu` (order = 1, already correct)
- Modify: `playground/src/docs/framework/writing/index.tiramisu` (order 1 → 2)
- Modify: `playground/src/docs/framework/configuration/index.tiramisu` (order 1 → 3)
- Modify: `playground/src/docs/framework/customization/index.tiramisu` (order 1 → 4)
- Modify: `playground/src/docs/framework/integrations/index.tiramisu` (order 1 → 5)
- Modify: `playground/src/docs/language/internals/index.tiramisu` (order 1 → 2)

**Step 1: Update each file's meta order**

Only change the `order` value in the meta block. Leave everything else unchanged.

Also fix child item orders within each subgroup so they don't collide with sibling subgroups' orders — child orders are relative to siblings within the same parent, so they just need to be internally consistent (which they already are).

For language section: `basics/index` keeps order=1, `internals/index` gets order=2.

### Task 3: Remove h1 from all framework `.tiramisu` files

Remove `h1 { ... }` lines from all playground docs that have them. DocPage already renders `meta.title` as h1.

**Files (each has an `h1 { ... }` to remove):**
- `playground/src/docs/framework/index.tiramisu` — remove `h1 { Tiramisu Docs Framework }`
- `playground/src/docs/framework/getting-started/installation.tiramisu` — remove `h1 { Installation }`
- `playground/src/docs/framework/getting-started/quick-start.tiramisu` — remove `h1 { Quick Start }`
- `playground/src/docs/framework/writing/index.tiramisu` — remove `h1 { Writing Documentation }`
- `playground/src/docs/framework/writing/markup-basics.tiramisu` — remove `h1 { Markup Basics }`
- `playground/src/docs/framework/writing/page-meta.tiramisu` — remove `h1 { Page Meta }`
- `playground/src/docs/framework/writing/content/index.tiramisu` — remove `h1 { Content Components }`
- `playground/src/docs/framework/writing/content/code-blocks.tiramisu` — remove `h1 { Code Blocks }`
- `playground/src/docs/framework/writing/content/rich-content.tiramisu` — remove `h1 { Rich Content }`
- `playground/src/docs/framework/writing/content/visual-elements.tiramisu` — remove `h1 { Visual Elements }`
- `playground/src/docs/framework/writing/content/layout.tiramisu` — remove `h1 { Layout }`
- `playground/src/docs/framework/writing/content/diagrams-math.tiramisu` — remove `h1 { Diagrams & Math }`
- `playground/src/docs/language/index.tiramisu` — remove `h1 { The Tiramisu Language }`

**Step 1: For each file, remove the `h1 { ... }` line and its trailing blank line**

The content after the h1 remains. Example pattern:

Before:
```
meta { title = Installation, order = 2 }

h1 { Installation }

h2 { Scaffolder }
```

After:
```
meta { title = Installation, order = 2 }

h2 { Scaffolder }
```

**Note:** Do NOT remove h1 references that appear inside `codeblock { ... }` examples — those are documentation showing users how h1 works, not actual h1 renders.

### Task 4: Fix scaffolder template — remove h1 from indexTiramisu

**Files:**
- Modify: `packages/create-tiramisu-docs/src/scaffold.ts` (~line 220)

**Step 1: Remove h1 from the generated content**

In the `indexTiramisu()` function, remove the `h1 { Welcome to ${options.name} }` line:

Before:
```
content: `meta { title = Welcome, order = 1, group = ${group} }

h1 { Welcome to ${options.name} }

This is your documentation site...
```

After:
```
content: `meta { title = Welcome, order = 1, group = ${group} }

This is your documentation site...
```

### Task 5: Run tests and verify

**Step 1: Run all tests**

```bash
cd /Users/pouya/Projects/tiramisu-docs && bun test
```

Expected: All tests pass. The scaffolder test for `+page.ts` checks for `redirect` and `findActiveSectionSidebar` — unrelated to our changes.

**Step 2: Visual verification**

```bash
cd /Users/pouya/Projects/tiramisu-docs/playground && bun run dev
```

Check:
- `/docs/framework` — single h1 "Framework", cards visible
- `/docs/framework/getting-started` — title "Getting Started" (not "Introduction"), single h1
- Sidebar shows "Getting Started" subgroup (not "Introduction")
- Sidebar order: Getting Started → Writing → Configuration → Customization → Integrations
- `/docs/language` — single h1 "Language"
- No page has double h1 headings
