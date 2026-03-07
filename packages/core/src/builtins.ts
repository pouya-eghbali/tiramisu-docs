import {
  type Node,
  FunctionCall,
  Parameter,
  NamedParameter,
  ArrayValue,
  ArrayItem,
} from "@timeleap/tiramisu/types/nodes"
import type { Heading } from "./types.js"

/** Context passed to built-in handlers so they can collect headings / imports */
export interface EmitContext {
  headings: Heading[]
  customImports: Set<string>
  scriptVars: string[]
  emitNode: (node: Node) => string
}

export type BuiltinHandler = (fc: FunctionCall, ctx: EmitContext) => string

/** Slugify a heading text for use as an HTML id / anchor */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

/** Escape HTML special characters */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

/** Extract the text content from a FunctionCall's positional parameters */
function getPositionalText(fc: FunctionCall, ctx: EmitContext): string {
  const params = fc.parameters?.parameters ?? []
  const parts: string[] = []

  for (const p of params) {
    if (p instanceof Parameter) {
      if (Array.isArray(p.value)) {
        parts.push(p.value.map((v) => ctx.emitNode(v)).join(""))
      } else {
        parts.push(p.value.toString())
      }
    }
  }

  return parts.join(", ").trim()
}

/** Get a named parameter value as string */
function getNamedParam(fc: FunctionCall, name: string, ctx: EmitContext): string | undefined {
  const params = fc.parameters?.parameters ?? []
  for (const p of params) {
    if (p instanceof NamedParameter && p.name === name) {
      if (Array.isArray(p.value)) {
        return p.value.map((v) => ctx.emitNode(v)).join("").trim()
      }
      return p.value.toString().trim()
    }
  }
  return undefined
}

/** Get all positional parameters as individual strings */
function getPositionalParams(fc: FunctionCall, ctx: EmitContext): string[] {
  const params = fc.parameters?.parameters ?? []
  const result: string[] = []

  for (const p of params) {
    if (p instanceof Parameter) {
      if (Array.isArray(p.value)) {
        result.push(p.value.map((v) => ctx.emitNode(v)).join("").trim())
      } else {
        result.push(p.value.toString().trim())
      }
    }
  }

  return result
}

/** Get all named parameters with a specific name (for repeated keys like row) */
function getAllNamedParams(fc: FunctionCall, name: string): NamedParameter[] {
  const params = fc.parameters?.parameters ?? []
  return params.filter(
    (p): p is NamedParameter => p instanceof NamedParameter && p.name === name
  )
}

/** Find all FunctionCall nodes nested inside a positional parameter's value */
function findNestedCalls(param: Parameter): FunctionCall[] {
  const results: FunctionCall[] = []
  function walk(node: unknown) {
    if (node == null || typeof node !== "object") return
    if (node instanceof FunctionCall) {
      results.push(node)
      return
    }
    if ("shards" in node && Array.isArray((node as any).shards)) {
      for (const s of (node as any).shards) walk(s)
    }
  }
  if (Array.isArray(param.value)) {
    for (const v of param.value) walk(v)
  }
  return results
}

/** Collect all nested FunctionCalls from all positional params of a parent */
function getChildCalls(fc: FunctionCall): FunctionCall[] {
  const params = fc.parameters?.parameters ?? []
  const results: FunctionCall[] = []
  for (const p of params) {
    if (p instanceof Parameter) {
      results.push(...findNestedCalls(p))
    }
  }
  return results
}

function makeHeadingHandler(level: number): BuiltinHandler {
  return (fc, ctx) => {
    const text = getPositionalText(fc, ctx)
    const id = slugify(text)
    ctx.headings.push({ level, text, id })
    return `<h${level} id="${id}"><a href="#${id}">${text}</a></h${level}>`
  }
}

const builtins: Record<string, BuiltinHandler> = {
  h1: makeHeadingHandler(1),
  h2: makeHeadingHandler(2),
  h3: makeHeadingHandler(3),
  h4: makeHeadingHandler(4),
  h5: makeHeadingHandler(5),
  h6: makeHeadingHandler(6),

  bold(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    return `<strong>${text}</strong>`
  },

  italic(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    return `<em>${text}</em>`
  },

  code(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    return `<code>${text}</code>`
  },

  link(fc, ctx) {
    const url = getNamedParam(fc, "url", ctx) ?? "#"
    const text = getPositionalText(fc, ctx) || url
    return `<a href="${url}">${text}</a>`
  },

  image(fc, ctx) {
    const src = getNamedParam(fc, "src", ctx) ?? ""
    const alt = getNamedParam(fc, "alt", ctx) ?? ""
    ctx.customImports.add(
      `import ZoomImage from "@tiramisu-docs/kit/components/tiramisu/ZoomImage.svelte"`
    )
    return `<ZoomImage src="${src}" alt="${alt}" />`
  },

  codeblock(fc, ctx) {
    const language = getNamedParam(fc, "language", ctx) ?? ""
    const code = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import CodeBlock from "@tiramisu-docs/kit/components/tiramisu/CodeBlock.svelte"`
    )
    const varName = `__code_${ctx.scriptVars.length}`
    ctx.scriptVars.push(`const ${varName} = ${JSON.stringify(escapeHtml(code))}`)
    return `<CodeBlock language="${language}" code={${varName}} />`
  },

  list(fc, ctx) {
    const listType = getNamedParam(fc, "type", ctx)
    const tag = listType === "ordered" ? "ol" : "ul"
    const items = getPositionalParams(fc, ctx)
    const lis = items.map((item) => `<li>${item}</li>`).join("")
    return `<${tag}>${lis}</${tag}>`
  },

  table(fc, ctx) {
    const rows = getAllNamedParams(fc, "row")
    if (rows.length === 0) return "<table></table>"

    const emitCells = (np: NamedParameter, cellTag: string): string => {
      if (np.value instanceof ArrayValue) {
        return np.value.values
          .map((item) => {
            if (item instanceof ArrayItem) {
              const text = item.value.map((v) => ctx.emitNode(v)).join("").trim()
              return `<${cellTag}>${text}</${cellTag}>`
            }
            return `<${cellTag}>${ctx.emitNode(item)}</${cellTag}>`
          })
          .join("")
      }
      return ""
    }

    const headerRow = rows[0]
    const thead = `<thead><tr>${emitCells(headerRow, "th")}</tr></thead>`

    let tbody = ""
    if (rows.length > 1) {
      const bodyRows = rows
        .slice(1)
        .map((r) => `<tr>${emitCells(r, "td")}</tr>`)
        .join("")
      tbody = `<tbody>${bodyRows}</tbody>`
    }

    return `<table>${thead}${tbody}</table>`
  },

  callout(fc, ctx) {
    const type = getNamedParam(fc, "type", ctx) ?? "info"
    const text = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import Callout from "@tiramisu-docs/kit/components/tiramisu/Callout.svelte"`
    )
    return `<Callout type="${type}">${text}</Callout>`
  },

  tabs(fc, ctx) {
    ctx.customImports.add(
      `import Tabs from "@tiramisu-docs/kit/components/tiramisu/Tabs.svelte"`
    )
    return `<Tabs>${getPositionalText(fc, ctx)}</Tabs>`
  },

  steps(fc, ctx) {
    const items = getPositionalParams(fc, ctx)
    ctx.customImports.add(
      `import Steps from "@tiramisu-docs/kit/components/tiramisu/Steps.svelte"`
    )
    const lis = items.map((item) => `<li class="step">${item}</li>`).join("")
    return `<Steps><ol>${lis}</ol></Steps>`
  },

  demo(fc, ctx) {
    const title = getNamedParam(fc, "title", ctx) ?? "Preview"
    const text = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import Demo from "@tiramisu-docs/kit/components/tiramisu/Demo.svelte"`
    )
    return `<Demo title="${title}">${text}</Demo>`
  },

  badge(fc, ctx) {
    const variant = getNamedParam(fc, "variant", ctx) ?? "default"
    const text = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import Badge from "@tiramisu-docs/kit/components/ui/badge/badge.svelte"`
    )
    return `<Badge variant="${variant}">${text}</Badge>`
  },

  quote(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    const author = getNamedParam(fc, "author", ctx)
    const cite = author ? `<footer><cite>— ${author}</cite></footer>` : ""
    return `<blockquote>${text}${cite}</blockquote>`
  },

  tasklist(fc, ctx) {
    const items = getPositionalParams(fc, ctx)
    const lis = items
      .map((item) => {
        const checked = item.startsWith("[x] ")
        const unchecked = item.startsWith("[ ] ")
        const label = checked || unchecked ? item.slice(4) : item
        const checkbox = checked
          ? `<span class="task-checkbox checked"></span>`
          : `<span class="task-checkbox"></span>`
        return `<li>${checkbox}${label}</li>`
      })
      .join("")
    return `<ul class="task-list">${lis}</ul>`
  },

  columns(fc, ctx) {
    const cols = getChildCalls(fc)
    const children = cols.map((c) => ctx.emitNode(c)).join("")
    return `<div class="columns">${children}</div>`
  },

  col(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    return `<div class="column">${text}</div>`
  },

  accordion(fc, ctx) {
    const title = getNamedParam(fc, "title", ctx) ?? "Details"
    const text = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import Accordion from "@tiramisu-docs/kit/components/tiramisu/Accordion.svelte"`
    )
    return `<Accordion title="${title}">${text}</Accordion>`
  },

  cards(fc, ctx) {
    ctx.customImports.add(
      `import NavCard from "@tiramisu-docs/kit/components/tiramisu/NavCard.svelte"`
    )
    const children = getChildCalls(fc).map((c) => ctx.emitNode(c)).join("")
    return `<div class="cards-grid">${children}</div>`
  },

  card(fc, ctx) {
    const title = getNamedParam(fc, "title", ctx) ?? ""
    const description = getNamedParam(fc, "description", ctx) ?? ""
    const href = getNamedParam(fc, "href", ctx) ?? "#"
    ctx.customImports.add(
      `import NavCard from "@tiramisu-docs/kit/components/tiramisu/NavCard.svelte"`
    )
    return `<NavCard title="${title}" description="${description}" href="${href}" />`
  },

  filetree(fc, ctx) {
    ctx.customImports.add(
      `import FileTree from "@tiramisu-docs/kit/components/tiramisu/FileTree.svelte"`
    )
    const children = getChildCalls(fc).map((c) => ctx.emitNode(c)).join("")
    return `<FileTree>${children}</FileTree>`
  },

  folder(fc, ctx) {
    const params = getPositionalParams(fc, ctx)
    const name = params[0] ?? "folder"
    const children = getChildCalls(fc).map((c) => ctx.emitNode(c)).join("")
    return `<div class="tree-folder" data-name="${name}">${children}</div>`
  },

  file(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    return `<div class="tree-file">${text}</div>`
  },

  math(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import MathBlock from "@tiramisu-docs/kit/components/tiramisu/MathBlock.svelte"`
    )
    const varName = `__math_${ctx.scriptVars.length}`
    ctx.scriptVars.push(`const ${varName} = ${JSON.stringify(text)}`)
    return `<MathBlock formula={${varName}} />`
  },

  mermaid(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import Mermaid from "@tiramisu-docs/kit/components/tiramisu/Mermaid.svelte"`
    )
    const varName = `__mermaid_${ctx.scriptVars.length}`
    ctx.scriptVars.push(`const ${varName} = ${JSON.stringify(text)}`)
    return `<Mermaid chart={${varName}} />`
  },
}

export { builtins }
