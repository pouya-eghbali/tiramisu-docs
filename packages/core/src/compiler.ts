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
import type { CompileResult, Heading } from "./types.js"
import { builtins, type EmitContext } from "./builtins.js"

/** Escape HTML special characters and Svelte expression delimiters in plain text */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
}

/**
 * Compile a tiramisu source string into a Svelte component.
 * Returns the compiled svelte markup, extracted meta, and headings for TOC.
 */
export interface CompileOptions {
  /** Resolve a file path relative to the current .tiramisu file. Used by readfile(). */
  resolveFile?: (src: string) => string
}

export function compileTiramisu(source: string, options?: CompileOptions): CompileResult {
  const ast = compile(source)
  const { meta, contentNodes } = extractMeta(ast)

  const headings: Heading[] = []
  const customImports = new Set<string>()
  const scriptVars: string[] = []

  const ctx: EmitContext = {
    headings,
    customImports,
    scriptVars,
    emitNode,
    resolveFile: options?.resolveFile,
  }

  function emitNode(node: Node): string {
    if (node instanceof FunctionCall) {
      return emitFunctionCall(node, ctx)
    }

    if (node instanceof Paragraph) {
      return node.children.map((child) => emitNode(child)).join("")
    }

    if (node instanceof MixedText) {
      return node.shards.map((shard) => emitNode(shard)).join("")
    }

    if (node instanceof PureText) {
      return node.shards
        .map((s) => (typeof s === "string" ? escapeHtml(s) : emitNode(s)))
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

    // Fallback: use toString
    if (typeof node === "string") {
      return escapeHtml(node)
    }

    const str = node?.toString() ?? ""
    return escapeHtml(str)
  }

  function emitFunctionCall(fc: FunctionCall, ctx: EmitContext): string {
    const name = fc.functionName

    // Check built-in handlers
    if (name in builtins) {
      return builtins[name](fc, ctx)
    }

    // Custom component: generate import and usage
    return emitCustomComponent(fc, ctx)
  }

  function emitCustomComponent(fc: FunctionCall, ctx: EmitContext): string {
    const componentName =
      fc.functionName.charAt(0).toUpperCase() + fc.functionName.slice(1)

    ctx.customImports.add(
      `import ${componentName} from "$lib/components/tiramisu/${componentName}.svelte"`
    )

    const params = fc.parameters?.parameters ?? []
    const props: string[] = []
    const children: string[] = []

    for (const p of params) {
      if (p instanceof NamedParameter) {
        const value = Array.isArray(p.value)
          ? p.value.map((v) => emitNode(v)).join("").trim()
          : emitNode(p.value).trim()
        props.push(`${p.name}="${value}"`)
      } else if (p instanceof Parameter) {
        const value = Array.isArray(p.value)
          ? p.value.map((v) => emitNode(v)).join("").trim()
          : emitNode(p.value).trim()
        if (value) children.push(value)
      }
    }

    const propsStr = props.length > 0 ? " " + props.join(" ") : ""

    if (children.length > 0) {
      return `<${componentName}${propsStr}>${children.join("")}</${componentName}>`
    }

    return `<${componentName}${propsStr} />`
  }

  // Emit all content nodes, wrapping top-level text in <p> tags
  const markupParts: string[] = []

  for (const node of contentNodes) {
    const content = emitNode(node).trim()
    if (!content) continue

    // Check if the content is a block-level element (starts with a block tag)
    if (isBlockElement(content)) {
      markupParts.push(content)
    } else {
      markupParts.push(`<p>${content}</p>`)
    }
  }

  const markup = markupParts.join("\n")

  // Build final svelte output
  let svelte = ""

  if (customImports.size > 0 || scriptVars.length > 0) {
    const lines: string[] = []
    if (customImports.size > 0) {
      lines.push(...Array.from(customImports).sort())
    }
    if (scriptVars.length > 0) {
      if (lines.length > 0) lines.push("")
      lines.push(...scriptVars)
    }
    svelte += `<script>\n  ${lines.join("\n  ")}\n</script>\n\n`
  }

  svelte += markup

  return { meta, svelte, headings }
}

/** Check if HTML content starts with a block-level element or Svelte component */
function isBlockElement(html: string): boolean {
  // Svelte components start with <Uppercase
  if (/^<[A-Z]/.test(html)) return true

  const blockTags = [
    "<h1", "<h2", "<h3", "<h4", "<h5", "<h6",
    "<div", "<pre", "<ul", "<ol", "<table",
    "<script",
  ]
  const lower = html.toLowerCase()
  return blockTags.some((tag) => lower.startsWith(tag))
}
