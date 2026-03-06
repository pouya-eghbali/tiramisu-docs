import {
  type Node,
  FunctionCall,
  Parameter,
  NamedParameter,
  ArrayValue,
  ArrayItem,
} from "@timeleap/tiramisu/src/types/nodes"
import type { Heading } from "./types"

/** Context passed to built-in handlers so they can collect headings / imports */
export interface EmitContext {
  headings: Heading[]
  customImports: Set<string>
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
    return `<img src="${src}" alt="${alt}" />`
  },

  codeblock(fc, ctx) {
    const language = getNamedParam(fc, "language", ctx) ?? ""
    const code = getPositionalText(fc, ctx)
    const langClass = language ? ` class="language-${language}"` : ""
    return `<pre><code${langClass}>${escapeHtml(code)}</code></pre>`
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
    return `<div class="callout callout-${type}">${text}</div>`
  },

  tabs(fc, ctx) {
    return `<div class="tabs">${getPositionalText(fc, ctx)}</div>`
  },

  steps(fc, ctx) {
    const items = getPositionalParams(fc, ctx)
    const lis = items.map((item) => `<li class="step">${item}</li>`).join("")
    return `<ol class="steps">${lis}</ol>`
  },

  badge(fc, ctx) {
    const variant = getNamedParam(fc, "variant", ctx) ?? "default"
    const text = getPositionalText(fc, ctx)
    return `<span class="badge badge-${variant}">${text}</span>`
  },
}

export { builtins }
