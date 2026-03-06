import type { DocMeta } from "./types"
import type { Node } from "@timeleap/tiramisu/src/types/nodes"
import {
  ArrayValue,
  FunctionCall,
  Paragraph,
  MixedText,
  NamedParameter,
  Tiramisu,
} from "@timeleap/tiramisu/src/types/nodes"

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
function findMetaFunctionCall(node: Node): FunctionCall | null {
  if (node instanceof FunctionCall && node.functionName === "meta") {
    return node
  }

  // Check Paragraph.children
  if (node instanceof Paragraph) {
    for (const child of node.children) {
      const result = findMetaFunctionCall(child)
      if (result) return result
    }
  }

  // Check MixedText.shards
  if (node instanceof MixedText) {
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
function extractMetaFromFunctionCall(fc: FunctionCall, meta: DocMeta): void {
  const params = fc.parameters?.parameters
  if (!params) return

  for (const param of params) {
    if (!(param instanceof NamedParameter)) continue

    const name: string = param.name
    const rawValue = extractParamValue(param.value)

    switch (name) {
      case "title":
        meta.title = rawValue
        break
      case "description":
        meta.description = rawValue
        break
      case "order": {
        const n = parseInt(rawValue, 10)
        if (!isNaN(n)) meta.order = n
        break
      }
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
function extractParamValue(value: Node[] | ArrayValue): string {
  if (Array.isArray(value)) {
    return value.map((v) => v.toString()).join("").trim()
  }
  return String(value).trim()
}
