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
  /** Read a file relative to the current .tiramisu file. Provided by the host (Vite plugin). */
  resolveFile?: (src: string) => string
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

/** Undo HTML/Svelte escaping for content that goes into JS string variables */
function unescapeHtml(text: string): string {
  return text
    .replace(/&#123;/g, "{")
    .replace(/&#125;/g, "}")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
}

/** Parse CSV text into a 2D array of strings, handling quoted fields */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const cells: string[] = []
    let i = 0
    while (i < trimmed.length) {
      if (trimmed[i] === '"') {
        // Quoted field
        let value = ""
        i++ // skip opening quote
        while (i < trimmed.length) {
          if (trimmed[i] === '"' && trimmed[i + 1] === '"') {
            value += '"'
            i += 2
          } else if (trimmed[i] === '"') {
            i++ // skip closing quote
            break
          } else {
            value += trimmed[i]
            i++
          }
        }
        cells.push(value)
        if (trimmed[i] === ',') i++ // skip comma after quoted field
      } else {
        // Unquoted field
        const next = trimmed.indexOf(',', i)
        if (next === -1) {
          cells.push(trimmed.slice(i).trim())
          break
        }
        cells.push(trimmed.slice(i, next).trim())
        i = next + 1
      }
    }
    rows.push(cells)
  }
  return rows
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
    const isExternal = /^https?:\/\//.test(url)
    if (isExternal) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="external-link">${text}<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="external-link-icon"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg></a>`
    }
    return `<a href="${url}">${text}</a>`
  },

  image(fc, ctx) {
    const src = getNamedParam(fc, "src", ctx) ?? ""
    const alt = getNamedParam(fc, "alt", ctx) ?? ""
    const caption = getNamedParam(fc, "caption", ctx) ?? ""
    ctx.customImports.add(
      `import { ZoomImage } from "$lib/components"`
    )
    return caption
      ? `<ZoomImage src="${src}" alt="${alt}" caption="${caption}" />`
      : `<ZoomImage src="${src}" alt="${alt}" />`
  },

  codeblock(fc, ctx) {
    const language = getNamedParam(fc, "language", ctx) ?? ""
    const icon = getNamedParam(fc, "icon", ctx) ?? ""
    const code = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import { CodeBlock } from "$lib/components"`
    )
    const varName = `__code_${ctx.scriptVars.length}`
    const rawCode = unescapeHtml(code)
    ctx.scriptVars.push(`const ${varName} = ${JSON.stringify(rawCode)}`)
    let props = `language="${language}" code={${varName}}`
    if (icon) props += ` icon="${icon}"`
    return `<CodeBlock ${props} />`
  },

  codetabs(fc, ctx) {
    const group = getNamedParam(fc, "group", ctx) ?? ""
    const children = getChildCalls(fc)
    ctx.customImports.add(
      `import { CodeTabs } from "$lib/components"`
    )
    const tabs: { label: string; icon: string; language: string; varName: string }[] = []
    for (const child of children) {
      if (child.functionName !== "codetab") continue
      const label = getNamedParam(child, "label", ctx) ?? ""
      const icon = getNamedParam(child, "icon", ctx) ?? ""
      const language = getNamedParam(child, "language", ctx) ?? ""
      const code = getPositionalText(child, ctx)
      const varName = `__code_${ctx.scriptVars.length}`
      const rawCode = unescapeHtml(code)
      ctx.scriptVars.push(`const ${varName} = ${JSON.stringify(rawCode)}`)
      tabs.push({ label, icon, language, varName })
    }
    const tabsMeta = JSON.stringify(tabs.map(t => ({ label: t.label, icon: t.icon, language: t.language })))
    const codesArray = `[${tabs.map(t => t.varName).join(", ")}]`
    const langMap = JSON.stringify(tabs.map(t => t.language))
    return `<CodeTabs group="${group}" tabs={${tabsMeta}} codes={${codesArray}} langMap={${langMap}} />`
  },

  codetab(_fc, _ctx) {
    return ""
  },

  list(fc, ctx) {
    const listType = getNamedParam(fc, "type", ctx)
    const tag = listType === "ordered" ? "ol" : "ul"
    const items = getPositionalParams(fc, ctx)
    const lis = items.map((item) => `<li>${item}</li>`).join("")
    return `<${tag}>${lis}</${tag}>`
  },

  table(fc, ctx) {
    // CSV mode: parse CSV text into table
    const csv = getNamedParam(fc, "csv", ctx)
    if (csv) {
      const csvRows = parseCsv(csv)
      if (csvRows.length === 0) return "<table></table>"
      const thead = `<thead><tr>${csvRows[0].map(c => `<th>${escapeHtml(c)}</th>`).join("")}</tr></thead>`
      let tbody = ""
      if (csvRows.length > 1) {
        const bodyRows = csvRows.slice(1).map(r => `<tr>${r.map(c => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")
        tbody = `<tbody>${bodyRows}</tbody>`
      }
      return `<table>${thead}${tbody}</table>`
    }

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
      `import { Callout } from "$lib/components"`
    )
    return `<Callout type="${type}">${text}</Callout>`
  },

  tabs(fc, ctx) {
    const group = getNamedParam(fc, "group", ctx) ?? ""
    const children = getChildCalls(fc)
    ctx.customImports.add(
      `import { Tabs } from "$lib/components"`
    )
    const tabs: { label: string; icon: string; varName: string }[] = []
    for (const child of children) {
      if (child.functionName !== "tab") continue
      const label = getNamedParam(child, "label", ctx) ?? ""
      const icon = getNamedParam(child, "icon", ctx) ?? ""
      const content = getPositionalText(child, ctx)
      const varName = `__tab_${ctx.scriptVars.length}`
      ctx.scriptVars.push(`const ${varName} = ${JSON.stringify(content)}`)
      tabs.push({ label, icon, varName })
    }
    const tabsMeta = JSON.stringify(tabs.map(t => ({ label: t.label, icon: t.icon })))
    const contentsArray = `[${tabs.map(t => t.varName).join(", ")}]`
    return `<Tabs group="${group}" tabs={${tabsMeta}} contents={${contentsArray}} />`
  },

  tab(_fc, _ctx) {
    return ""
  },

  steps(fc, ctx) {
    const items = getPositionalParams(fc, ctx)
    ctx.customImports.add(
      `import { Steps } from "$lib/components"`
    )
    const lis = items.map((item) => `<li class="step">${item}</li>`).join("")
    return `<Steps><ol>${lis}</ol></Steps>`
  },

  demo(fc, ctx) {
    const title = getNamedParam(fc, "title", ctx) ?? "Preview"
    const text = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import { Demo } from "$lib/components"`
    )
    return `<Demo title="${title}">${text}</Demo>`
  },

  badge(fc, ctx) {
    const variant = getNamedParam(fc, "variant", ctx) ?? "default"
    const text = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import { Badge } from "$lib/components"`
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
      `import { Accordion } from "$lib/components"`
    )
    return `<Accordion title="${title}">${text}</Accordion>`
  },

  cards(fc, ctx) {
    ctx.customImports.add(
      `import { NavCard } from "$lib/components"`
    )
    const children = getChildCalls(fc).map((c) => ctx.emitNode(c)).join("")
    return `<div class="cards-grid">${children}</div>`
  },

  card(fc, ctx) {
    const title = getNamedParam(fc, "title", ctx) ?? ""
    const description = getNamedParam(fc, "description", ctx) ?? ""
    const href = getNamedParam(fc, "href", ctx) ?? ""
    const icon = getNamedParam(fc, "icon", ctx) ?? ""
    const image = getNamedParam(fc, "image", ctx) ?? ""
    ctx.customImports.add(
      `import { NavCard } from "$lib/components"`
    )
    let props = `title="${title}" description="${description}"`
    if (href) props += ` href="${href}"`
    if (icon) props += ` icon="${icon}"`
    if (image) props += ` image="${image}"`
    return `<NavCard ${props} />`
  },

  filetree(fc, ctx) {
    ctx.customImports.add(
      `import { FileTree } from "$lib/components"`
    )
    const children = getChildCalls(fc).map((c) => ctx.emitNode(c)).join("")
    return `<FileTree>${children}</FileTree>`
  },

  folder(fc, ctx) {
    const params = getPositionalParams(fc, ctx)
    const name = params[0] ?? "folder"
    const children = getChildCalls(fc).map((c) => ctx.emitNode(c)).join("")
    return `<div class="tree-folder"><span class="tree-folder-name">${name}</span>${children}</div>`
  },

  file(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    return `<div class="tree-file">${text}</div>`
  },

  readfile(fc, ctx) {
    const src = getNamedParam(fc, "src", ctx) ?? getPositionalText(fc, ctx)
    if (!src) return ""
    if (!ctx.resolveFile) {
      return `<!-- readfile: no file resolver available -->`
    }
    return ctx.resolveFile(src)
  },

  math(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import { MathBlock } from "$lib/components"`
    )
    const varName = `__math_${ctx.scriptVars.length}`
    const raw = unescapeHtml(text)
    ctx.scriptVars.push(`const ${varName} = ${JSON.stringify(raw)}`)
    return `<MathBlock formula={${varName}} />`
  },

  mermaid(fc, ctx) {
    const text = getPositionalText(fc, ctx)
    ctx.customImports.add(
      `import { Mermaid } from "$lib/components"`
    )
    const varName = `__mermaid_${ctx.scriptVars.length}`
    const raw = unescapeHtml(text)
    ctx.scriptVars.push(`const ${varName} = ${JSON.stringify(raw)}`)
    return `<Mermaid chart={${varName}} />`
  },
}

export { builtins }
