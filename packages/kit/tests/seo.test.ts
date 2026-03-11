import { describe, expect, it } from "bun:test"
import { generateSitemap, generateLlmsTxt, generateLlmsFullTxt, generateSkillMd, buildCanonicalUrl, buildPageJsonLd } from "../src/seo"

describe("generateSitemap", () => {
  it("generates valid XML with doc URLs", () => {
    const docs = [{ slug: "index" }, { slug: "getting-started" }]
    const xml = generateSitemap(docs, { baseUrl: "https://example.com" })
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain("<urlset")
    expect(xml).toContain("<loc>https://example.com/docs</loc>")
    expect(xml).toContain("<loc>https://example.com/docs/getting-started</loc>")
    expect(xml).toContain("<lastmod>")
  })

  it("strips trailing slash from baseUrl", () => {
    const docs = [{ slug: "intro" }]
    const xml = generateSitemap(docs, { baseUrl: "https://example.com/" })
    expect(xml).toContain("<loc>https://example.com/docs/intro</loc>")
  })

  it("adds xhtml:link alternates for i18n", () => {
    const docs = [{ slug: "index" }]
    const xml = generateSitemap(docs, {
      baseUrl: "https://example.com",
      locales: [{ code: "en" }, { code: "fr" }],
      defaultLocale: "en",
    })
    expect(xml).toContain('hreflang="en"')
    expect(xml).toContain('hreflang="fr"')
  })
})

describe("generateLlmsTxt", () => {
  it("produces llms.txt format", () => {
    const docs = [
      { slug: "intro", meta: { title: "Introduction", description: "Getting started", group: "Guide" } },
      { slug: "api", meta: { title: "API Reference", group: "Reference" } },
    ]
    const txt = generateLlmsTxt(docs, {
      title: "My Docs",
      description: "Project documentation",
      baseUrl: "https://example.com",
    })
    expect(txt).toContain("# My Docs")
    expect(txt).toContain("> Project documentation")
    expect(txt).toContain("## Guide")
    expect(txt).toContain("- [Introduction](https://example.com/docs/intro): Getting started")
    expect(txt).toContain("## Reference")
    expect(txt).toContain("- [API Reference](https://example.com/docs/api)")
  })

  it("defaults group to Docs", () => {
    const docs = [{ slug: "readme", meta: { title: "README" } }]
    const txt = generateLlmsTxt(docs, {
      title: "T",
      description: "D",
      baseUrl: "https://example.com",
    })
    expect(txt).toContain("## Docs")
  })
})

describe("generateLlmsFullTxt", () => {
  it("includes full text content", () => {
    const searchIndex = [
      { slug: "intro", title: "Intro", group: "Guide", text: "Full content of the intro page." },
    ]
    const txt = generateLlmsFullTxt(searchIndex, {
      title: "My Docs",
      description: "Docs",
      baseUrl: "https://example.com",
    })
    expect(txt).toContain("# My Docs")
    expect(txt).toContain("---")
    expect(txt).toContain("## Intro")
    expect(txt).toContain("URL: https://example.com/docs/intro")
    expect(txt).toContain("Full content of the intro page.")
  })
})

describe("buildCanonicalUrl", () => {
  it("builds a canonical URL from baseUrl and slug", () => {
    expect(buildCanonicalUrl("https://example.com", "getting-started")).toBe(
      "https://example.com/docs/getting-started"
    )
  })

  it("strips trailing slash from baseUrl", () => {
    expect(buildCanonicalUrl("https://example.com/", "intro")).toBe(
      "https://example.com/docs/intro"
    )
  })
})

describe("buildPageJsonLd", () => {
  it("returns valid JSON with required fields", () => {
    const json = buildPageJsonLd({
      title: "Getting Started",
      slug: "getting-started",
      baseUrl: "https://example.com",
    })
    const ld = JSON.parse(json)
    expect(ld["@context"]).toBe("https://schema.org")
    expect(ld["@type"]).toBe("TechArticle")
    expect(ld.headline).toBe("Getting Started")
    expect(ld.url).toBe("https://example.com/docs/getting-started")
    expect(ld.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": "https://example.com/docs/getting-started",
    })
    expect(ld.isPartOf).toEqual({ "@type": "WebSite", url: "https://example.com" })
  })

  it("includes optional description and dateModified", () => {
    const json = buildPageJsonLd({
      title: "API",
      slug: "api",
      baseUrl: "https://example.com",
      description: "API reference",
      lastEdited: "2026-03-01T00:00:00Z",
    })
    const ld = JSON.parse(json)
    expect(ld.description).toBe("API reference")
    expect(ld.dateModified).toBe("2026-03-01T00:00:00Z")
  })

  it("includes image when provided", () => {
    const json = buildPageJsonLd({
      title: "Intro",
      slug: "intro",
      baseUrl: "https://example.com",
      image: "https://example.com/images/intro.png",
    })
    const ld = JSON.parse(json)
    expect(ld.image).toBe("https://example.com/images/intro.png")
  })

  it("omits image when not provided", () => {
    const json = buildPageJsonLd({
      title: "Intro",
      slug: "intro",
      baseUrl: "https://example.com",
    })
    const ld = JSON.parse(json)
    expect(ld.image).toBeUndefined()
  })

  it("includes siteName in isPartOf when provided", () => {
    const json = buildPageJsonLd({
      title: "Intro",
      slug: "intro",
      baseUrl: "https://example.com",
      siteName: "My Docs",
    })
    const ld = JSON.parse(json)
    expect(ld.isPartOf.name).toBe("My Docs")
  })
})

describe("generateSkillMd", () => {
  it("generates skill.md with sections and MCP reference", () => {
    const docs = [
      { slug: "intro", meta: { title: "Intro", group: "Guide" } },
      { slug: "api", meta: { title: "API", group: "Reference" } },
    ]
    const md = generateSkillMd(docs, { title: "My Docs", description: "Project docs" })
    expect(md).toContain("name: my-docs-docs")
    expect(md).toContain("# My Docs Documentation")
    expect(md).toContain("**Guide** (1 pages)")
    expect(md).toContain("**Reference** (1 pages)")
    expect(md).toContain("`search_docs`")
    expect(md).toContain("`read_doc`")
  })
})
