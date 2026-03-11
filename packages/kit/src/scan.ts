import { compileTiramisu } from "@tiramisu-docs/core"
import type { DocMeta, Heading } from "@tiramisu-docs/core"
import fs from "node:fs"
import path from "node:path"

export interface ScannedDoc {
  slug: string
  meta: DocMeta
  headings: Heading[]
}

import type { SearchIndexEntry } from "./types.js"
export type { SearchIndexEntry } from "./types.js"

export function findTiramisuFiles(dir: string): string[] {
  const results: string[] = []
  if (!fs.existsSync(dir)) return results

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findTiramisuFiles(fullPath))
    } else if (entry.name.endsWith(".tiramisu")) {
      results.push(fullPath)
    }
  }
  return results
}

export function extractPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim()
}

export function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function resolveSearchGroup(slug: string, meta: DocMeta): string {
  const segments = slug.split("/")
  if (segments.length === 1) return meta.group ?? "Docs"
  return segments
    .slice(0, -1)
    .map(titleCase)
    .join(" > ")
}

export function scanDocs(docsDir: string): {
  docs: ScannedDoc[]
  searchIndex: SearchIndexEntry[]
} {
  const absDocsDir = path.resolve(docsDir)
  const files = findTiramisuFiles(absDocsDir)

  const docs: ScannedDoc[] = []

  for (const file of files) {
    const source = fs.readFileSync(file, "utf-8")
    const { meta, headings } = compileTiramisu(source)
    const relativePath = path.relative(absDocsDir, file)
    const slug = relativePath.replace(/\.tiramisu$/, "").replace(/\\/g, "/")
    docs.push({ slug, meta, headings })
  }

  const searchIndex: SearchIndexEntry[] = docs.map((doc) => {
    const file = path.resolve(absDocsDir, doc.slug + ".tiramisu")
    const source = fs.readFileSync(file, "utf-8")
    const { svelte } = compileTiramisu(source)
    const text = extractPlainText(svelte)
    return {
      id: doc.slug,
      title: doc.meta.title ?? doc.slug,
      group: resolveSearchGroup(doc.slug, doc.meta),
      slug: doc.slug,
      headings: doc.headings.map((h) => h.text).join(" "),
      text,
    }
  })

  return { docs, searchIndex }
}
