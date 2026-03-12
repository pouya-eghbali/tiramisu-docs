import { compile } from "@timeleap/tiramisu"
import {
  type Node,
  FunctionCall,
  MixedText,
  PureText,
  Paragraph,
  Parameter,
  NamedParameter,
  ArrayValue,
  ArrayItem,
} from "@timeleap/tiramisu/types/nodes"
import { extractMeta } from "./meta.js"

/**
 * Convert a Tiramisu source string to GitHub-Flavored Markdown.
 */
export function toMarkdown(source: string): string {
  const ast = compile(source)
  const { meta, contentNodes } = extractMeta(ast)

  const parts: string[] = []

  // Emit meta title as h1
  if (meta.title) {
    parts.push(`# ${meta.title}`)
  }

  // Emit meta description as paragraph after h1
  if (meta.description) {
    parts.push(meta.description)
  }

  for (const node of contentNodes) {
    const content = emitNode(node).trim()
    if (content) {
      parts.push(content)
    }
  }

  return parts.join("\n\n") + "\n"
}

/** Extract text from a node tree, producing Markdown output */
function emitNode(node: Node): string {
  if (node instanceof FunctionCall) {
    return emitFunctionCall(node)
  }

  if (node instanceof Paragraph) {
    return node.children.map((child) => emitNode(child)).join("")
  }

  if (node instanceof MixedText) {
    return node.shards.map((shard) => emitNode(shard)).join("")
  }

  if (node instanceof PureText) {
    return node.shards
      .map((s) => (typeof s === "string" ? s : emitNode(s)))
      .join("")
  }

  if (node instanceof ArrayItem) {
    return node.value.map((v) => emitNode(v)).join("")
  }

  if (node instanceof ArrayValue) {
    return node.values.map((v) => emitNode(v)).join("")
  }

  if (node instanceof Parameter) {
    if (Array.isArray(node.value)) {
      return node.value.map((v) => emitNode(v)).join("")
    }
    return emitNode(node.value)
  }

  if (node instanceof NamedParameter) {
    if (Array.isArray(node.value)) {
      return node.value.map((v) => emitNode(v)).join("")
    }
    return emitNode(node.value)
  }

  if (typeof node === "string") {
    return node
  }

  return node?.toString() ?? ""
}

/** Get positional text content from a FunctionCall */
function getPositionalText(fc: FunctionCall): string {
  const params = fc.parameters?.parameters ?? []
  const parts: string[] = []

  for (const p of params) {
    if (p instanceof Parameter) {
      if (Array.isArray(p.value)) {
        parts.push(p.value.map((v) => emitNode(v)).join(""))
      } else {
        parts.push(p.value.toString())
      }
    }
  }

  return parts.join(", ").trim()
}

/** Get a named parameter value as string */
function getNamedParam(fc: FunctionCall, name: string): string | undefined {
  const params = fc.parameters?.parameters ?? []
  for (const p of params) {
    if (p instanceof NamedParameter && p.name === name) {
      if (Array.isArray(p.value)) {
        return p.value.map((v) => emitNode(v)).join("").trim()
      }
      return p.value.toString().trim()
    }
  }
  return undefined
}

/** Find all FunctionCall nodes nested inside positional parameters */
function getChildCalls(fc: FunctionCall): FunctionCall[] {
  const params = fc.parameters?.parameters ?? []
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

  for (const p of params) {
    if (p instanceof Parameter) {
      if (Array.isArray(p.value)) {
        for (const v of p.value) walk(v)
      }
    }
  }

  return results
}

/** Convert a FunctionCall to Markdown */
function emitFunctionCall(fc: FunctionCall): string {
  const name = fc.functionName

  switch (name) {
    case "h1": return `# ${getPositionalText(fc)}`
    case "h2": return `## ${getPositionalText(fc)}`
    case "h3": return `### ${getPositionalText(fc)}`
    case "h4": return `#### ${getPositionalText(fc)}`
    case "h5": return `##### ${getPositionalText(fc)}`
    case "h6": return `###### ${getPositionalText(fc)}`

    case "bold":
      return `**${getPositionalText(fc)}**`

    case "italic":
      return `*${getPositionalText(fc)}*`

    case "code":
      return `\`${getPositionalText(fc)}\``

    case "link": {
      const url = getNamedParam(fc, "url") ?? "#"
      const text = getPositionalText(fc) || url
      return `[${text}](${url})`
    }

    case "image": {
      const src = getNamedParam(fc, "src") ?? ""
      const alt = getNamedParam(fc, "alt") ?? ""
      return `![${alt}](${src})`
    }

    case "codeblock": {
      const language = getNamedParam(fc, "language") ?? ""
      const code = getPositionalText(fc)
      return `\`\`\`${language}\n${code}\n\`\`\``
    }

    case "list": {
      const children = getChildCalls(fc)
      const items: string[] = []
      for (const child of children) {
        if (child.functionName === "item") {
          items.push(`- ${getPositionalText(child)}`)
        }
      }
      return items.join("\n")
    }

    case "callout": {
      const type = getNamedParam(fc, "type") ?? "info"
      const text = getPositionalText(fc)
      const label = type.charAt(0).toUpperCase() + type.slice(1)
      return `> **${label}:** ${text}`
    }

    case "blockquote":
    case "quote": {
      const text = getPositionalText(fc)
      return `> ${text}`
    }

    case "table": {
      const children = getChildCalls(fc)
      const rows = children.filter((c) => c.functionName === "row")
      if (rows.length === 0) return ""

      const getRowCells = (row: FunctionCall): string[] => {
        const rowChildren = getChildCalls(row)
        return rowChildren
          .filter((c) => c.functionName === "cell")
          .map((c) => getPositionalText(c))
      }

      const headerCells = getRowCells(rows[0])
      const header = `| ${headerCells.join(" | ")} |`
      const separator = `| ${headerCells.map(() => "---").join(" | ")} |`

      const bodyRows = rows.slice(1).map((row) => {
        const cells = getRowCells(row)
        return `| ${cells.join(" | ")} |`
      })

      return [header, separator, ...bodyRows].join("\n")
    }

    case "tabs": {
      const children = getChildCalls(fc)
      const parts: string[] = []
      for (const child of children) {
        if (child.functionName === "tab") {
          const label = getNamedParam(child, "label") ?? ""
          const content = getPositionalText(child)
          parts.push(`#### ${label}`)
          if (content) parts.push(content)
        }
      }
      return parts.join("\n\n")
    }

    case "steps": {
      const children = getChildCalls(fc)
      const items: string[] = []
      let i = 1
      for (const child of children) {
        if (child.functionName === "step") {
          const title = getNamedParam(child, "title") ?? ""
          const content = getPositionalText(child)
          const line = title
            ? `${i}. **${title}** ${content}`.trim()
            : `${i}. ${content}`
          items.push(line)
          i++
        }
      }
      return items.join("\n")
    }

    case "cards": {
      const children = getChildCalls(fc)
      const items: string[] = []
      for (const child of children) {
        if (child.functionName === "card") {
          const title = getNamedParam(child, "title") ?? ""
          const description = getNamedParam(child, "description") ?? ""
          const href = getNamedParam(child, "href") ?? ""
          let line = `- **${title}**`
          if (description) line += ` — ${description}`
          if (href) line += ` [→](${href})`
          items.push(line)
        }
      }
      return items.join("\n")
    }

    case "codetabs": {
      const children = getChildCalls(fc)
      const parts: string[] = []
      for (const child of children) {
        if (child.functionName === "codetab") {
          const label = getNamedParam(child, "label") ?? ""
          const language = getNamedParam(child, "language") ?? ""
          const code = getPositionalText(child)
          if (label) parts.push(`**${label}**`)
          parts.push(`\`\`\`${language}\n${code}\n\`\`\``)
        }
      }
      return parts.join("\n\n")
    }

    default: {
      // Unknown functions: emit positional text content
      return getPositionalText(fc)
    }
  }
}
