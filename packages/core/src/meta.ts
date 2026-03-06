import type { DocMeta } from "./types"
import type { Node, Tiramisu } from "@timeleap/tiramisu/src/types/nodes"

export interface ExtractMetaResult {
  meta: DocMeta
  contentNodes: Node[]
}

/**
 * Walk the Tiramisu AST and extract the `meta {}` frontmatter block.
 * Returns the extracted DocMeta and the remaining content nodes.
 */
export function extractMeta(ast: Tiramisu): ExtractMetaResult {
  const meta: DocMeta = {}
  const contentNodes: Node[] = []

  for (const child of ast.children) {
    const fc = findMetaFunctionCall(child)
    if (fc) {
      extractMetaFromFunctionCall(fc, meta)
    } else {
      contentNodes.push(child)
    }
  }

  return { meta, contentNodes }
}

/**
 * Recursively search a node for a FunctionCall with functionName === "meta".
 * The meta call can appear as:
 * - Paragraph.children[i] -> MixedText.shards[0] -> FunctionCall
 * - MixedText.shards[0] -> MixedText.shards[0] -> FunctionCall
 */
function findMetaFunctionCall(node: any): any | null {
  if (node.constructor.name === "FunctionCall" && node.functionName === "meta") {
    return node
  }

  // Check Paragraph.children
  if (node.constructor.name === "Paragraph" && node.children) {
    for (const child of node.children) {
      const result = findMetaFunctionCall(child)
      if (result) return result
    }
  }

  // Check MixedText.shards
  if (node.constructor.name === "MixedText" && node.shards) {
    for (const shard of node.shards) {
      const result = findMetaFunctionCall(shard)
      if (result) return result
    }
  }

  return null
}

/**
 * Extract named parameters from a meta FunctionCall and populate DocMeta.
 */
function extractMetaFromFunctionCall(fc: any, meta: DocMeta): void {
  const params = fc.parameters?.parameters
  if (!params) return

  for (const param of params) {
    if (param.constructor.name !== "NamedParameter") continue

    const name: string = param.name
    const rawValue = extractParamValue(param.value)

    switch (name) {
      case "title":
        meta.title = rawValue
        break
      case "description":
        meta.description = rawValue
        break
      case "order":
        meta.order = parseInt(rawValue, 10)
        break
      case "group":
        meta.group = rawValue
        break
    }
  }
}

/**
 * Extract a string value from a NamedParameter's value field.
 * value is Node[] | ArrayValue. For meta fields we expect Node[].
 */
function extractParamValue(value: any): string {
  if (Array.isArray(value)) {
    return value.map((v: any) => v.toString()).join("").trim()
  }
  return String(value).trim()
}
