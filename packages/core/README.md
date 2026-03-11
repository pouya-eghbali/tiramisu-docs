# @tiramisu-docs/core

Compiler that transforms `.tiramisu` markup into Svelte components. Parses the Tiramisu AST, extracts metadata, and generates Svelte template code with headings for table-of-contents generation.

## Installation

```bash
bun add @tiramisu-docs/core
```

## API

### `compileTiramisu(source, options?)`

Compiles a `.tiramisu` source string into a Svelte component.

```typescript
import { compileTiramisu } from "@tiramisu-docs/core"

const result = compileTiramisu(source)
// result.meta     — { title, description, order, group, icon, ... }
// result.svelte   — Svelte component source code
// result.headings — [{ level, text, id }, ...]
```

**Options:**

- `customComponents?: string[]` — List of available custom component names. Unknown function calls matching these names generate `<ComponentName>` tags instead of treating them as errors.

### `extractMeta(ast)`

Extracts the `meta { ... }` block from a parsed Tiramisu AST, returning the metadata object and remaining content nodes.

```typescript
import { extractMeta } from "@tiramisu-docs/core"
import { parse } from "@timeleap/tiramisu/src/index"

const ast = parse(source)
const { meta, contentNodes } = extractMeta(ast)
```

## Types

```typescript
interface DocMeta {
  title?: string
  description?: string
  order?: number
  group?: string
  icon?: string
  [key: string]: unknown
}

interface Heading {
  level: number
  text: string
  id: string
}

interface CompileResult {
  meta: DocMeta
  svelte: string
  headings: Heading[]
}
```

## Built-in Functions

The compiler handles these Tiramisu functions out of the box:

`h1`–`h6`, `bold`, `italic`, `code`, `link`, `image`, `codeblock`, `codetabs`/`codetab`, `list`, `table`, `callout`, `tabs`/`tab`, `steps`, `badge`, `filetree`, `navcard`

Unknown function calls are treated as custom Svelte components imported from `$lib/components/tiramisu/`.
