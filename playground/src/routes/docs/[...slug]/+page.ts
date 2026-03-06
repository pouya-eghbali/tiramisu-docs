import { error } from "@sveltejs/kit"

export async function load({ params }) {
  const slug = params.slug || "index"
  const { docImports, docs } = await import("virtual:tiramisu-docs")
  const importFn = docImports[slug]
  if (!importFn) throw error(404, "Page not found")

  const component = await importFn()
  const doc = docs.find((d) => d.slug === slug)

  return {
    component: component.default ?? component,
    meta: doc?.meta ?? {},
    headings: doc?.headings ?? [],
  }
}
