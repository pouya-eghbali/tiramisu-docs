export function generateSitemap(
  docs: { slug: string }[],
  options: { baseUrl: string; basePath?: string; locales?: { code: string }[]; defaultLocale?: string }
): string {
  const base = options.baseUrl.replace(/\/+$/, "")
  const basePath = options.basePath ?? "/docs"
  const buildDate = new Date().toISOString().split("T")[0]

  const hasI18n = options.locales && options.locales.length > 0 && options.defaultLocale

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  if (hasI18n) {
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/TR/xhtml11/xhtml11_schema.html">\n`
  } else {
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
  }

  for (const doc of docs) {
    const slug = doc.slug === "index" ? "" : `/${doc.slug}`
    const url = `${base}${basePath}${slug}`
    xml += `  <url>\n`
    xml += `    <loc>${escapeXml(url)}</loc>\n`
    xml += `    <lastmod>${buildDate}</lastmod>\n`
    if (hasI18n) {
      for (const locale of options.locales!) {
        const localeUrl = `${base}${basePath}/${locale.code}${slug}`
        xml += `    <xhtml:link rel="alternate" hreflang="${locale.code}" href="${escapeXml(localeUrl)}" />\n`
      }
    }
    xml += `  </url>\n`
  }

  xml += `</urlset>\n`
  return xml
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

export function generateLlmsTxt(
  docs: { slug: string; meta: { title?: string; description?: string; group?: string } }[],
  options: { title: string; description: string; baseUrl: string; basePath?: string }
): string {
  const base = options.baseUrl.replace(/\/+$/, "")
  const basePath = options.basePath ?? "/docs"

  const lines: string[] = []
  lines.push(`# ${options.title}`)
  lines.push(`> ${options.description}`)
  lines.push("")

  const groups = new Map<string, typeof docs>()
  for (const doc of docs) {
    const group = doc.meta.group ?? "Docs"
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(doc)
  }

  for (const [group, groupDocs] of groups) {
    lines.push(`## ${group}`)
    for (const doc of groupDocs) {
      const slug = doc.slug === "index" ? "" : `/${doc.slug}`
      const url = `${base}${basePath}${slug}`
      const title = doc.meta.title ?? doc.slug
      const desc = doc.meta.description ? `: ${doc.meta.description}` : ""
      lines.push(`- [${title}](${url})${desc}`)
    }
    lines.push("")
  }

  return lines.join("\n")
}

export function generateLlmsFullTxt(
  searchIndex: { slug: string; title: string; group: string; text: string }[],
  options: { title: string; description: string; baseUrl: string; basePath?: string }
): string {
  const base = options.baseUrl.replace(/\/+$/, "")
  const basePath = options.basePath ?? "/docs"

  const lines: string[] = []
  lines.push(`# ${options.title}`)
  lines.push(`> ${options.description}`)
  lines.push("")

  for (const entry of searchIndex) {
    const slug = entry.slug === "index" ? "" : `/${entry.slug}`
    const url = `${base}${basePath}${slug}`
    lines.push(`---`)
    lines.push(`## ${entry.title}`)
    lines.push(`URL: ${url}`)
    lines.push(`Group: ${entry.group}`)
    lines.push("")
    lines.push(entry.text)
    lines.push("")
  }

  return lines.join("\n")
}

export function buildInstantOgUrl(pageUrl: string, options: { siteId: string; template?: string; theme?: "light" | "dark"; accentColor?: string; gradientBg?: boolean }): string {
  const params = new URLSearchParams({ site: options.siteId, url: pageUrl })
  if (options.template) params.set("template", options.template)
  if (options.theme) params.set("theme", options.theme)
  if (options.accentColor) params.set("accentColor", options.accentColor)
  if (options.gradientBg) params.set("gradientBg", "true")
  return `https://instantog.com/api/og?${params.toString()}`
}

export function buildCanonicalUrl(baseUrl: string, slug: string): string {
  const cleanSlug = slug.replace(/\/index$/, "")
  return `${baseUrl.replace(/\/+$/, "")}/docs/${cleanSlug}`
}

export function buildPageJsonLd(options: {
  title: string
  slug: string
  baseUrl: string
  description?: string
  lastEdited?: string
  siteName?: string
  image?: string
  author?: string
}): string {
  const url = buildCanonicalUrl(options.baseUrl, options.slug)
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: options.title,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@type": "WebSite", name: options.siteName ?? undefined, url: options.baseUrl.replace(/\/+$/, "") },
  }
  if (options.description) ld.description = options.description
  if (options.lastEdited) ld.dateModified = options.lastEdited
  if (options.image) ld.image = options.image
  if (options.author) ld.author = { "@type": "Person", name: options.author }
  return JSON.stringify(ld)
}

export function generateSkillMd(
  docs: { slug: string; meta: { title?: string; description?: string; group?: string } }[],
  options: { title: string; description: string }
): string {
  const lines: string[] = []
  lines.push(`---`)
  lines.push(`name: ${options.title.toLowerCase().replace(/\s+/g, "-")}-docs`)
  lines.push(`description: ${options.description}`)
  lines.push(`---`)
  lines.push("")
  lines.push(`# ${options.title} Documentation`)
  lines.push("")
  lines.push(options.description)
  lines.push("")

  // Structure by groups
  const groups = new Map<string, typeof docs>()
  for (const doc of docs) {
    const group = doc.meta.group ?? "Docs"
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push(doc)
  }

  lines.push(`## Sections`)
  lines.push("")
  for (const [group, groupDocs] of groups) {
    lines.push(`- **${group}** (${groupDocs.length} pages)`)
  }
  lines.push("")

  lines.push(`## Key Pages`)
  lines.push("")
  for (const [group, groupDocs] of groups) {
    lines.push(`### ${group}`)
    for (const doc of groupDocs) {
      const title = doc.meta.title ?? doc.slug
      const desc = doc.meta.description ? ` - ${doc.meta.description}` : ""
      lines.push(`- **${title}** (\`${doc.slug}\`)${desc}`)
    }
    lines.push("")
  }

  lines.push(`## MCP Integration`)
  lines.push("")
  lines.push(`This documentation is available via MCP server. Tools:`)
  lines.push(`- \`search_docs\`: Search documentation by keyword`)
  lines.push(`- \`read_doc\`: Read a specific documentation page`)
  lines.push(`- \`list_sections\`: List all documentation sections`)
  lines.push(`- \`list_pages\`: List pages, optionally filtered by section`)
  lines.push(`- \`get_table_of_contents\`: Get headings for a page`)

  return lines.join("\n") + "\n"
}
