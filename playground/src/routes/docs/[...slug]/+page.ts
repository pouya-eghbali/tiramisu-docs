import { error, redirect } from "@sveltejs/kit"

export const ssr = false

export async function load({ params }) {
  const rawSlug = params.slug || "index"
  const mod = await import("virtual:tiramisu-docs")

  if (mod.locales && mod.defaultLocale) {
    const segments = rawSlug.split("/")
    const possibleLocale = segments[0]
    const localeData = mod.locales[possibleLocale]

    if (localeData) {
      const locale = possibleLocale
      const slug = segments.slice(1).join("/") || "index"
      return loadDoc(localeData, slug, locale, mod)
    } else {
      throw redirect(302, `/docs/${mod.defaultLocale}/${rawSlug}`)
    }
  }

  return loadLegacy(mod, rawSlug)
}

function loadLegacy(mod, slug) {
  let importFn = mod.docImports[slug] ?? mod.docImports[slug + "/index"]
  if (!importFn) throw error(404, "Page not found")
  if (!mod.docImports[slug]) slug = slug + "/index"

  return importFn().then((c) => {
    const doc = mod.docs.find((d) => d.slug === slug)
    let activeSidebar = mod.sidebar
    if (mod.sections) {
      activeSidebar = findActiveSectionSidebar(mod.sections, slug) ?? mod.sidebar
    }
    return {
      component: c.default ?? c,
      meta: doc?.meta ?? {},
      headings: doc?.headings ?? [],
      slug,
      sections: mod.sections ?? undefined,
      activeSidebar,
    }
  })
}

async function loadDoc(localeData, slug, locale, mod) {
  let importFn = localeData.docImports[slug] ?? localeData.docImports[slug + "/index"]
  if (!localeData.docImports[slug] && localeData.docImports[slug + "/index"]) slug = slug + "/index"
  let showFallbackBanner = false

  if (!importFn) {
    const defaultData = mod.locales[mod.defaultLocale]
    importFn = defaultData?.docImports[slug] ?? defaultData?.docImports[slug + "/index"]
    if (!defaultData?.docImports[slug] && defaultData?.docImports[slug + "/index"]) slug = slug + "/index"
    if (!importFn) throw error(404, "Page not found")
    showFallbackBanner = true
  }

  const component = await importFn()
  const doc = localeData.docs.find((d) => d.slug === slug)
    ?? mod.locales[mod.defaultLocale]?.docs.find((d) => d.slug === slug)

  const sections = localeData.sections
  let activeSidebar = localeData.sidebar
  if (sections) {
    activeSidebar = findActiveSectionSidebar(sections, slug) ?? localeData.sidebar
  }

  return {
    component: component.default ?? component,
    meta: doc?.meta ?? {},
    headings: doc?.headings ?? [],
    slug,
    locale,
    locales: Object.keys(mod.locales),
    sections,
    activeSidebar,
    showFallbackBanner,
  }
}

function findActiveSectionSidebar(sections, slug) {
  for (const section of sections) {
    if (section.path && (slug === section.path || slug.startsWith(section.path + "/"))) {
      return section.sidebar
    }
    if (section.children) {
      const found = findActiveSectionSidebar(section.children, slug)
      if (found) return found
    }
  }
  if (sections.length > 0 && sections[0].sidebar && !sections[0].path) {
    return sections[0].sidebar
  }
  return null
}
