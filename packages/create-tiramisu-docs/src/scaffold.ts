export interface ScaffoldOptions {
  name: string;
  sections: boolean;
  i18n: boolean;
  defaultLocale: string;
  locales: { code: string; label: string }[];
  instantOg?: { siteId: string; template: string };
  mcp?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export function generateProjectFiles(
  options: ScaffoldOptions,
): GeneratedFile[] {
  const { name } = options;

  const files = [
    packageJson(name),
    svelteConfig(),
    viteConfig(options),
    tiramisuConfig(options),
    componentsJson(),
    utilsTs(),
    appHtml(),
    appCss(),
    indexTiramisu(options),
    gettingStartedTiramisu(options),
    homePage(),
    layoutSvelte(),
    errorSvelte(),
    pageTs(),
    pageSvelte(),
    componentsBarrel(),
    openDropdownSvelte(),
    sitemapRoute(),
    llmsTxtRoute(),
    llmsFullTxtRoute(),
    skillMdRoute(),
    virtualDts(),
    tsconfig(),
    gitignore(),
    ...alertFiles(),
    ...collapsibleFiles(),
    ...sheetFiles(),
    ...scrollAreaFiles(),
  ];

  if (options.sections) {
    files.push(apiTiramisu(options));
  }

  if (options.mcp) {
    files.push(mcpRoute());
  }

  return files;
}

function packageJson(name: string): GeneratedFile {
  const pkg = {
    name,
    version: "0.0.1",
    private: true,
    type: "module",
    scripts: {
      dev: "vite dev",
      build: "vite build",
      preview: "vite preview",
      check: "svelte-check --tsconfig ./tsconfig.json",
    },
    dependencies: {
      "@tiramisu-docs/kit": "^0.1.11",
      "@timeleap/tiramisu": "^1.9.0",
      "bits-ui": "^2.16.0",
      clsx: "^2.1.0",
      "tailwind-merge": "^3.0.0",
      "tailwind-variants": "^3.2.0",
    },
    devDependencies: {
      "@sveltejs/adapter-auto": "^7.0.1",
      "@sveltejs/kit": "^2.53.4",
      svelte: "^5.0.0",
      vite: "^7.3.1",
      tailwindcss: "^4.0.0",
      "@tailwindcss/vite": "^4.2.1",
      "svelte-check": "^4.4.5",
      typescript: "^5.4.0",
    },
  };

  return {
    path: "package.json",
    content: JSON.stringify(pkg, null, 2) + "\n",
  };
}

function svelteConfig(): GeneratedFile {
  return {
    path: "svelte.config.js",
    content: `import adapter from "@sveltejs/adapter-auto"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
  },
}

export default config
`,
  };
}

function viteConfig(_options: ScaffoldOptions): GeneratedFile {
  return {
    path: "vite.config.ts",
    content: `import { sveltekit } from "@sveltejs/kit/vite"
import { tiramisuPlugin } from "@tiramisu-docs/kit/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import config from "./src/lib/tiramisu.config"

export default defineConfig({
  plugins: [tiramisuPlugin({ config }), tailwindcss(), sveltekit()],
})
`,
  };
}

function tiramisuConfig(options: ScaffoldOptions): GeneratedFile {
  const configLines: string[] = [];
  configLines.push(`  title: "${options.name}",`);
  configLines.push(`  description: "Documentation powered by Tiramisu Docs",`);
  configLines.push(`  // url: "https://example.com",`);
  configLines.push(`  nav: [`);
  configLines.push(`    { label: "Docs", href: "/docs" },`);
  configLines.push(`  ],`);

  if (options.sections) {
    configLines.push(`  sections: [`);
    configLines.push(`    { label: "Guide", path: "guide" },`);
    configLines.push(`    { label: "API", path: "api" },`);
    configLines.push(`  ],`);
  }

  if (options.i18n) {
    configLines.push(`  i18n: {`);
    configLines.push(`    defaultLocale: "${options.defaultLocale}",`);
    configLines.push(`    locales: [`);
    for (const locale of options.locales) {
      configLines.push(
        `      { code: "${locale.code}", label: "${locale.label}" },`,
      );
    }
    configLines.push(`    ],`);
    configLines.push(`  },`);
  }

  if (options.instantOg) {
    configLines.push(`  instantOg: {`);
    configLines.push(`    siteId: "${options.instantOg.siteId}",`);
    configLines.push(`    template: "${options.instantOg.template}",`);
    configLines.push(`  },`);
  }

  if (options.mcp) {
    configLines.push(`  mcp: true,`);
  }

  return {
    path: "src/lib/tiramisu.config.ts",
    content: `import { defineConfig } from "@tiramisu-docs/kit"

export default defineConfig({
${configLines.join("\n")}
})
`,
  };
}

function appHtml(): GeneratedFile {
  return {
    path: "src/app.html",
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Geist+Mono:wght@100..900&display=swap" rel="stylesheet" />
    <script>
      (function(){var t=localStorage.getItem("theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")})()
    </script>
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
`,
  };
}

function appCss(): GeneratedFile {
  return {
    path: "src/app.css",
    content: `@import "@tiramisu-docs/kit/styles/theme.css";
@import "tailwindcss";

@source "../node_modules/@tiramisu-docs/kit";

@theme {
  --font-sans: 'Geist', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
}
`,
  };
}

function docBasePath(options: ScaffoldOptions, section?: string): string {
  const parts: string[] = ["src/docs"];
  if (options.i18n) parts.push(options.defaultLocale);
  if (section) parts.push(section);
  return parts.join("/");
}

function indexTiramisu(options: ScaffoldOptions): GeneratedFile {
  const section = options.sections ? "guide" : undefined;
  const base = docBasePath(options, section);
  const group = options.sections ? "Guide" : "Getting Started";

  return {
    path: `${base}/index.tiramisu`,
    content: `meta { title = Welcome, order = 1, group = ${group} }

This is your documentation site powered by bold { Tiramisu Docs }.

Get started by editing the files in code { src/docs/ }.
`,
  };
}

function gettingStartedTiramisu(options: ScaffoldOptions): GeneratedFile {
  const section = options.sections ? "guide" : undefined;
  const base = docBasePath(options, section);
  const group = options.sections ? "Guide" : "Getting Started";

  return {
    path: `${base}/getting-started.tiramisu`,
    content: `meta { title = Getting Started, order = 2, group = ${group} }

h2 { Installation }

codeblock { language = bash, "bun add my-package" }

h2 { Usage }

Import and use the package in your project:

codeblock { language = typescript, "import { something } from 'my-package'" }
`,
  };
}

function apiTiramisu(options: ScaffoldOptions): GeneratedFile {
  const base = docBasePath(options, "api");

  return {
    path: `${base}/index.tiramisu`,
    content: `meta { title = API Reference, order = 1, group = API }

Document your API here.
`,
  };
}

function homePage(): GeneratedFile {
  return {
    path: "src/routes/+page.svelte",
    content: `<script lang="ts">
  import "../app.css"
</script>

<div class="min-h-screen bg-background text-foreground">
  <!-- Hero -->
  <section class="relative overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--secondary),transparent)]"></div>
    <div class="relative mx-auto max-w-5xl px-6 py-24 text-center lg:py-32">
      <h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        Beautiful docs,<br />effortlessly
      </h1>
      <p class="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
        Write documentation in Tiramisu markup and get a polished, modern documentation site powered by SvelteKit.
      </p>
      <div class="mt-10 flex items-center justify-center gap-4">
        <a
          href="/docs"
          class="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          Get Started
        </a>
        <a
          href="https://github.com"
          class="inline-flex h-11 items-center justify-center rounded-lg border bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          GitHub
        </a>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section class="mx-auto max-w-5xl px-6 py-20">
    <div class="grid gap-6 md:grid-cols-3">
      <div class="rounded-xl border bg-card p-6">
        <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        </div>
        <h3 class="mb-2 font-semibold">Simple Markup</h3>
        <p class="text-sm text-muted-foreground">Write docs in Tiramisu's intuitive markup language. No complex syntax to learn.</p>
      </div>
      <div class="rounded-xl border bg-card p-6">
        <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
        </div>
        <h3 class="mb-2 font-semibold">SvelteKit Powered</h3>
        <p class="text-sm text-muted-foreground">Built on SvelteKit for blazing fast performance and seamless developer experience.</p>
      </div>
      <div class="rounded-xl border bg-card p-6">
        <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        <h3 class="mb-2 font-semibold">Fully Customizable</h3>
        <p class="text-sm text-muted-foreground">Override any component, extend the theme, and make the docs truly yours.</p>
      </div>
    </div>
  </section>

  <!-- Code Preview -->
  <section class="mx-auto max-w-3xl px-6 pb-20">
    <div class="overflow-hidden rounded-xl border">
      <div class="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
        <div class="h-3 w-3 rounded-full bg-red-500/80"></div>
        <div class="h-3 w-3 rounded-full bg-yellow-500/80"></div>
        <div class="h-3 w-3 rounded-full bg-green-500/80"></div>
        <span class="ml-2 text-xs text-muted-foreground">intro.tiramisu</span>
      </div>
      <pre class="overflow-x-auto p-6 text-sm leading-relaxed"><code>meta &lbrace; title = Welcome, group = Guide &rbrace;

h1 &lbrace; Hello, Tiramisu &rbrace;

This is your first doc page.

callout &lbrace; type = info,
  Getting started is easy!
&rbrace;

codeblock &lbrace; language = bash,
  "bun create tiramisu-docs my-docs"
&rbrace;</code></pre>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t py-12 text-center text-sm text-muted-foreground">
    Built with Tiramisu Docs
  </footer>
</div>
`,
  };
}

function layoutSvelte(): GeneratedFile {
  return {
    path: "src/routes/+layout.svelte",
    content: `<script lang="ts">
  import "../app.css"
  import type { Snippet } from "svelte"

  let { children }: { children: Snippet } = $props()
</script>

{@render children()}
`,
  };
}

function errorSvelte(): GeneratedFile {
  return {
    path: "src/routes/+error.svelte",
    content: `<script lang="ts">
  import { page } from "$app/stores"
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-foreground">
  <p class="text-8xl font-bold tracking-tighter text-muted-foreground/50">{$page.status}</p>
  <h1 class="mt-1 text-xl font-semibold">{$page.error?.message ?? "Something went wrong"}</h1>
  <a
    href="/docs"
    class="mt-12 inline-flex h-10 items-center justify-center rounded-lg border px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
  >
    Back to docs
  </a>
</div>
`,
  };
}

function pageTs(): GeneratedFile {
  return {
    path: "src/routes/docs/[...slug]/+page.ts",
    content: `import { error, redirect } from "@sveltejs/kit"
import type { VirtualModule, LocaleData, ResolvedSection, SidebarGroup } from "@tiramisu-docs/kit"

export async function load({ params }: { params: { slug?: string } }) {
  const rawSlug = params.slug || "index"
  const mod: VirtualModule = await import("virtual:tiramisu-docs")

  if (mod.locales && mod.defaultLocale) {
    const segments = rawSlug.split("/")
    const possibleLocale = segments[0]
    const localeData = mod.locales[possibleLocale]

    if (localeData) {
      const locale = possibleLocale
      const slug = segments.slice(1).join("/") || "index"
      return loadDoc(localeData, slug, locale, mod)
    } else {
      throw redirect(302, \`/docs/\${mod.defaultLocale}/\${rawSlug}\`)
    }
  }

  return loadLegacy(mod, rawSlug)
}

function loadLegacy(mod: VirtualModule, slug: string) {
  let importFn = mod.docImports[slug] ?? mod.docImports[slug + "/index"]

  // Root /docs with no page — redirect to first section
  if (!importFn && slug === "index" && mod.sections) {
    const firstSection = mod.sections.find((s) => s.path)
    if (firstSection) throw redirect(302, \`/docs/\${firstSection.path}\`)
  }

  if (!importFn) throw error(404, "Page not found")
  if (!mod.docImports[slug]) slug = slug + "/index"

  return importFn().then((c) => {
    const doc = mod.docs.find((d) => d.slug === slug)
    let activeSidebar: SidebarGroup[] = mod.sidebar
    if (mod.sections) {
      activeSidebar = findActiveSectionSidebar(mod.sections, slug) ?? mod.sidebar
    }
    return {
      component: c.default ?? c,
      meta: doc?.meta ?? {},
      headings: doc?.headings ?? [],
      lastEdited: doc?.lastEdited,
      markdown: doc?.markdown,
      slug,
      sections: mod.sections ?? undefined,
      activeSidebar,
    }
  })
}

async function loadDoc(localeData: LocaleData, slug: string, locale: string, mod: VirtualModule) {
  type ImportFn = () => Promise<{ default: any }>
  let importFn: ImportFn | undefined = localeData.docImports[slug] ?? localeData.docImports[slug + "/index"]
  if (!localeData.docImports[slug] && localeData.docImports[slug + "/index"]) slug = slug + "/index"
  let showFallbackBanner = false

  if (!importFn) {
    const defaultData = mod.locales?.[mod.defaultLocale!]
    importFn = defaultData?.docImports[slug] ?? defaultData?.docImports[slug + "/index"]
    if (!defaultData?.docImports[slug] && defaultData?.docImports[slug + "/index"]) slug = slug + "/index"
    if (!importFn) {
      // Root /docs/<locale> with no index page — redirect to first section
      if (slug === "index" && localeData.sections) {
        const firstSection = localeData.sections.find((s) => s.path)
        if (firstSection) throw redirect(302, \`/docs/\${locale}/\${firstSection.path}\`)
      }
      throw error(404, "Page not found")
    }
    showFallbackBanner = true
  }

  const component = await importFn()
  const doc = localeData.docs.find((d) => d.slug === slug)
    ?? mod.locales?.[mod.defaultLocale!]?.docs.find((d) => d.slug === slug)

  const sections = localeData.sections
  let activeSidebar: SidebarGroup[] = localeData.sidebar
  if (sections) {
    activeSidebar = findActiveSectionSidebar(sections, slug) ?? localeData.sidebar
  }

  return {
    component: component.default ?? component,
    meta: doc?.meta ?? {},
    headings: doc?.headings ?? [],
    lastEdited: doc?.lastEdited,
    markdown: doc?.markdown,
    slug,
    locale,
    locales: Object.keys(mod.locales!),
    sections,
    activeSidebar,
    showFallbackBanner,
  }
}

function findActiveSectionSidebar(sections: ResolvedSection[], slug: string): SidebarGroup[] | null {
  for (const section of sections) {
    if (section.path && (slug === section.path || slug.startsWith(section.path + "/"))) {
      return section.sidebar ?? null
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
`,
  };
}

function componentsBarrel(): GeneratedFile {
  return {
    path: "src/lib/components/index.ts",
    content: `// Layout
export { default as DocsLayout } from "@tiramisu-docs/kit/components/DocsLayout.svelte"
export { default as DocPage } from "@tiramisu-docs/kit/components/DocPage.svelte"
export { default as PrevNextNav } from "@tiramisu-docs/kit/components/PrevNextNav.svelte"

// Tiramisu built-ins
export { default as Accordion } from "@tiramisu-docs/kit/components/tiramisu/Accordion.svelte"
export { default as Badge } from "@tiramisu-docs/kit/components/tiramisu/Badge.svelte"
export { default as Callout } from "@tiramisu-docs/kit/components/tiramisu/Callout.svelte"
export { default as CodeBlock } from "@tiramisu-docs/kit/components/tiramisu/CodeBlock.svelte"
export { default as CodeTabs } from "@tiramisu-docs/kit/components/tiramisu/CodeTabs.svelte"
export { default as Demo } from "@tiramisu-docs/kit/components/tiramisu/Demo.svelte"
export { default as FileTree } from "@tiramisu-docs/kit/components/tiramisu/FileTree.svelte"
export { default as MathBlock } from "@tiramisu-docs/kit/components/tiramisu/MathBlock.svelte"
export { default as Mermaid } from "@tiramisu-docs/kit/components/tiramisu/Mermaid.svelte"
export { default as NavCard } from "@tiramisu-docs/kit/components/tiramisu/NavCard.svelte"
export { default as Steps } from "@tiramisu-docs/kit/components/tiramisu/Steps.svelte"
export { default as Tabs } from "@tiramisu-docs/kit/components/tiramisu/Tabs.svelte"
export { default as ZoomImage } from "@tiramisu-docs/kit/components/tiramisu/ZoomImage.svelte"
`,
  };
}

function pageSvelte(): GeneratedFile {
  return {
    path: "src/routes/docs/[...slug]/+page.svelte",
    content: `<script lang="ts">
  import { DocsLayout, DocPage, PrevNextNav } from "$lib/components"
  import OpenDropdown from "$lib/components/OpenDropdown.svelte"
  import config from "$lib/tiramisu.config"
  import { resolveConfig, getOpenLinks } from "@tiramisu-docs/kit"
  import type { LocaleConfig } from "@tiramisu-docs/kit"

  let { data }: { data: Record<string, any> } = $props()

  const resolved = resolveConfig(config)
  const links = $derived(
    resolved.url && data.slug
      ? getOpenLinks({ baseUrl: resolved.url, slug: data.slug, locale: data.locale, github: resolved.github, mcp: resolved.mcp, title: resolved.title })
      : []
  )
</script>

<DocsLayout
  config={resolved}
  sidebar={data.activeSidebar}
  headings={data.headings}
  sections={data.sections}
  locale={data.locale}
  locales={data.locales ? resolved.i18n?.locales?.filter((l: LocaleConfig) => data.locales.includes(l.code)) : undefined}
  showFallbackBanner={data.showFallbackBanner}
>
  <DocPage meta={data.meta} lastEdited={data.lastEdited} slug={data.slug} baseUrl={resolved.url} sidebar={data.activeSidebar} siteName={resolved.title} instantOg={resolved.instantOg}>
    {#snippet headerActions()}
      <OpenDropdown {links} markdown={data.markdown} />
    {/snippet}
    {#if data.component}
      {@const Component = data.component}
      <Component />
    {/if}
  </DocPage>
  <PrevNextNav sidebar={data.activeSidebar} currentSlug={data.slug} locale={data.locale} />
</DocsLayout>
`,
  };
}

function componentsJson(): GeneratedFile {
  return {
    path: "components.json",
    content:
      JSON.stringify(
        {
          $schema: "https://shadcn-svelte.com/schema.json",
          style: "new-york",
          tailwind: {
            config: "",
            css: "src/app.css",
            baseColor: "zinc",
          },
          aliases: {
            components: "$lib/components/ui",
            utils: "$lib/utils",
            lib: "$lib",
          },
        },
        null,
        2,
      ) + "\n",
  };
}

function utilsTs(): GeneratedFile {
  return {
    path: "src/lib/utils.ts",
    content: `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type { WithElementRef, WithoutChild, WithoutChildrenOrChild } from "bits-ui"
`,
  };
}

function openDropdownSvelte(): GeneratedFile {
  return {
    path: "src/lib/components/OpenDropdown.svelte",
    content: `<script lang="ts">
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu"
  import type { OpenLink } from "@tiramisu-docs/kit"

  let { links = [], markdown = undefined }: { links?: OpenLink[]; markdown?: string } = $props()

  const openLinks = $derived(links.filter((l: OpenLink) => l.type === "open"))
  const editLinks = $derived(links.filter((l: OpenLink) => l.type === "edit"))
  const mcpLinks = $derived(links.filter((l: OpenLink) => l.type === "mcp"))

  let copied = $state(false)
  let mdCopied = $state(false)

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text)
    copied = true
    setTimeout(() => (copied = false), 2000)
  }

  async function copyMarkdown() {
    if (!markdown) return
    await navigator.clipboard.writeText(markdown)
    mdCopied = true
    setTimeout(() => (mdCopied = false), 2000)
  }
</script>

{#snippet icon(name: string)}
  {#if name === "chatgpt"}
    <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>
  {:else if name === "claude"}
    <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z"/></svg>
  {:else if name === "cursor"}
    <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"/></svg>
  {:else if name === "github"}
    <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
  {:else if name === "mcp"}
    <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
  {:else if name === "vscode"}
    <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/></svg>
  {/if}
{/snippet}

{#if links.length > 0 || markdown}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger class="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      Open
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" class="opacity-60">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      {#each openLinks as link}
        <DropdownMenu.Item>
          <a href={link.href} target="_blank" rel="noopener noreferrer" class="flex w-full items-center gap-2">
            {@render icon(link.icon)}
            {link.label}
          </a>
        </DropdownMenu.Item>
      {/each}
      {#if editLinks.length > 0}
        <DropdownMenu.Separator />
        {#each editLinks as link}
          <DropdownMenu.Item>
            <a href={link.href} target="_blank" rel="noopener noreferrer" class="flex w-full items-center gap-2">
              {@render icon(link.icon)}
              {link.label}
            </a>
          </DropdownMenu.Item>
        {/each}
      {/if}
      {#if mcpLinks.length > 0}
        <DropdownMenu.Separator />
        {#each mcpLinks as link}
          <DropdownMenu.Item>
            {#if link.copy}
              <button onclick={(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(link.copy!); }} class="flex w-full items-center gap-2">
                {#if copied}
                  <svg class="size-4 shrink-0 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                  Copied!
                {:else}
                  {@render icon(link.icon)}
                  {link.label}
                {/if}
              </button>
            {:else}
              <a href={link.href} class="flex w-full items-center gap-2">
                {@render icon(link.icon)}
                {link.label}
                <svg class="size-3 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>
              </a>
            {/if}
          </DropdownMenu.Item>
        {/each}
      {/if}
      {#if markdown}
        <DropdownMenu.Separator />
        <DropdownMenu.Item>
          <button
            onclick={(e: MouseEvent) => { e.preventDefault(); e.stopPropagation(); copyMarkdown(); }}
            class="flex w-full items-center gap-2"
          >
            {#if mdCopied}
              <svg class="size-4 shrink-0 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              Copied!
            {:else}
              <svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
              Copy as Markdown
            {/if}
          </button>
        </DropdownMenu.Item>
      {/if}
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{/if}
`,
  };
}

function sitemapRoute(): GeneratedFile {
  return {
    path: "src/routes/sitemap.xml/+server.ts",
    content: `import { generateSitemap } from "@tiramisu-docs/kit/seo"
import { docs, locales } from "virtual:tiramisu-docs"
import config from "$lib/tiramisu.config"
import { resolveConfig } from "@tiramisu-docs/kit"

export const prerender = true

export function GET() {
  const resolved = resolveConfig(config)
  const baseUrl = resolved.url ?? "https://example.com"
  const allDocs = locales
    ? Object.entries(locales).flatMap(([code, data]) =>
        data.docs.map((d) => ({ ...d, slug: \`\${code}/\${d.slug}\` }))
      )
    : docs
  const xml = generateSitemap(allDocs, {
    baseUrl,
    locales: resolved.i18n?.locales,
    defaultLocale: resolved.i18n?.defaultLocale,
  })
  return new Response(xml, { headers: { "Content-Type": "application/xml" } })
}
`,
  };
}

function mcpRoute(): GeneratedFile {
  return {
    path: "src/routes/mcp/+server.ts",
    content: `import { handleMcpRequest } from "@tiramisu-docs/kit/mcp"
import { docs, searchIndex, sidebar } from "virtual:tiramisu-docs"

export async function POST({ request }) {
  const body = await request.json()
  const result = handleMcpRequest(body, { docs, searchIndex, sidebar })
  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  })
}
`,
  };
}

function llmsTxtRoute(): GeneratedFile {
  return {
    path: "src/routes/llms.txt/+server.ts",
    content: `import { generateLlmsTxt } from "@tiramisu-docs/kit/seo"
import { docs, locales } from "virtual:tiramisu-docs"
import config from "$lib/tiramisu.config"
import { resolveConfig } from "@tiramisu-docs/kit"

export const prerender = true

export function GET() {
  const resolved = resolveConfig(config)
  const baseUrl = resolved.url ?? "https://example.com"
  if (locales) {
    const parts = Object.entries(locales).map(([code, data]) =>
      generateLlmsTxt(data.docs, {
        title: resolved.title,
        description: resolved.description,
        baseUrl,
        basePath: \`/docs/\${code}\`,
      })
    )
    return new Response(parts.join("\\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
  const txt = generateLlmsTxt(docs, {
    title: resolved.title,
    description: resolved.description,
    baseUrl,
  })
  return new Response(txt, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
`,
  };
}

function llmsFullTxtRoute(): GeneratedFile {
  return {
    path: "src/routes/llms-full.txt/+server.ts",
    content: `import { generateLlmsFullTxt } from "@tiramisu-docs/kit/seo"
import { searchIndex, locales } from "virtual:tiramisu-docs"
import config from "$lib/tiramisu.config"
import { resolveConfig } from "@tiramisu-docs/kit"

export const prerender = true

export function GET() {
  const resolved = resolveConfig(config)
  const baseUrl = resolved.url ?? "https://example.com"
  if (locales) {
    const parts = Object.entries(locales).map(([code, data]) =>
      generateLlmsFullTxt(data.searchIndex, {
        title: resolved.title,
        description: resolved.description,
        baseUrl,
        basePath: \`/docs/\${code}\`,
      })
    )
    return new Response(parts.join("\\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  }
  const txt = generateLlmsFullTxt(searchIndex, {
    title: resolved.title,
    description: resolved.description,
    baseUrl,
  })
  return new Response(txt, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
`,
  };
}

function skillMdRoute(): GeneratedFile {
  return {
    path: "src/routes/skill.md/+server.ts",
    content: `import { generateSkillMd } from "@tiramisu-docs/kit/seo"
import { docs, locales } from "virtual:tiramisu-docs"
import config from "$lib/tiramisu.config"
import { resolveConfig } from "@tiramisu-docs/kit"

export const prerender = true

export function GET() {
  const resolved = resolveConfig(config)
  if (locales) {
    const parts = Object.entries(locales).map(([code, data]) =>
      generateSkillMd(data.docs, {
        title: \`\${resolved.title} (\${code})\`,
        description: resolved.description,
      })
    )
    return new Response(parts.join("\\n\\n---\\n\\n"), {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    })
  }
  const md = generateSkillMd(docs, {
    title: resolved.title,
    description: resolved.description,
  })
  return new Response(md, { headers: { "Content-Type": "text/markdown; charset=utf-8" } })
}
`,
  };
}

function alertFiles(): GeneratedFile[] {
  return [
    {
      path: "src/lib/components/ui/alert/alert.svelte",
      content: `<script lang="ts" module>
  import { type VariantProps, tv } from "tailwind-variants";

  export const alertVariants = tv({
    base: "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-red-400/80 bg-card [&>svg]:text-red-400 *:data-[slot=alert-description]:text-muted-foreground",
        info: "text-blue-400/80 bg-card [&>svg]:text-blue-400 *:data-[slot=alert-description]:text-muted-foreground",
        warning:
          "text-amber-400/80 bg-card [&>svg]:text-amber-400 *:data-[slot=alert-description]:text-muted-foreground",
        success:
          "text-emerald-400/80 bg-card [&>svg]:text-emerald-400 *:data-[slot=alert-description]:text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
</script>

<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn, type WithElementRef } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    variant = "default",
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    variant?: AlertVariant;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="alert"
  role="alert"
  class={cn(alertVariants({ variant }), className)}
  {...restProps}
>
  {@render children?.()}
</div>
`,
    },
    {
      path: "src/lib/components/ui/alert/alert-title.svelte",
      content: `<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn, type WithElementRef } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="alert-title"
  class={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
  {...restProps}
>
  {@render children?.()}
</div>
`,
    },
    {
      path: "src/lib/components/ui/alert/alert-description.svelte",
      content: `<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn, type WithElementRef } from "$lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
  bind:this={ref}
  data-slot="alert-description"
  class={cn(
    "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
    className
  )}
  {...restProps}
>
  {@render children?.()}
</div>
`,
    },
    {
      path: "src/lib/components/ui/alert/index.ts",
      content: `import Root from "./alert.svelte";
import Description from "./alert-description.svelte";
import Title from "./alert-title.svelte";
export { alertVariants, type AlertVariant } from "./alert.svelte";

export {
  Root,
  Description,
  Title,
  //
  Root as Alert,
  Description as AlertDescription,
  Title as AlertTitle,
};
`,
    },
  ];
}

function collapsibleFiles(): GeneratedFile[] {
  return [
    {
      path: "src/lib/components/ui/collapsible/collapsible.svelte",
      content: `<script lang="ts">
  import { cn } from "$lib/utils.js"
  import { slide } from "svelte/transition"
  import type { Snippet } from "svelte"

  let {
    open = $bindable(true),
    href,
    class: className,
    trigger,
    children,
  }: {
    open?: boolean
    href?: string
    class?: string
    trigger?: Snippet
    children?: Snippet
  } = $props()
</script>

<div class={cn(className)}>
  {#if href}
    <a
      {href}
      onclick={() => (open = !open)}
      class="flex w-full items-center justify-between"
      aria-expanded={open}
    >
      {#if trigger}{@render trigger()}{/if}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 {open ? 'rotate-90' : ''}"
      >
        <path d="m9 18 6-6-6-6"></path>
      </svg>
    </a>
  {:else}
    <button
      onclick={() => (open = !open)}
      class="flex w-full items-center justify-between"
      aria-expanded={open}
    >
      {#if trigger}{@render trigger()}{/if}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 {open ? 'rotate-90' : ''}"
      >
        <path d="m9 18 6-6-6-6"></path>
      </svg>
    </button>
  {/if}
  {#if open}
    <div transition:slide={{ duration: 200 }}>
      {#if children}{@render children()}{/if}
    </div>
  {/if}
</div>
`,
    },
    {
      path: "src/lib/components/ui/collapsible/index.ts",
      content: `export { default as Collapsible } from "./collapsible.svelte"
`,
    },
  ];
}

function sheetFiles(): GeneratedFile[] {
  return [
    {
      path: "src/lib/components/ui/sheet/sheet.svelte",
      content: `<script lang="ts">
  import type { Snippet } from "svelte"

  let {
    open = $bindable(false),
    children,
  }: {
    open?: boolean
    children?: Snippet
  } = $props()
</script>

{#if children}{@render children()}{/if}
`,
    },
    {
      path: "src/lib/components/ui/sheet/sheet-content.svelte",
      content: `<script lang="ts">
  import { cn } from "$lib/utils.js"
  import { fly, fade } from "svelte/transition"
  import type { Snippet } from "svelte"

  let {
    open = false,
    onclose,
    side = "left",
    class: className,
    children,
  }: {
    open?: boolean
    onclose?: () => void
    side?: "left" | "right" | "top" | "bottom"
    class?: string
    children?: Snippet
  } = $props()

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") onclose?.()
  }

  const sideStyles: Record<string, string> = {
    left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r",
    right: "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l",
    top: "inset-x-0 top-0 w-full border-b",
    bottom: "inset-x-0 bottom-0 w-full border-t",
  }

  const flyParams: Record<string, { x?: number; y?: number }> = {
    left: { x: -300 },
    right: { x: 300 },
    top: { y: -300 },
    bottom: { y: 300 },
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50" onkeydown={handleKeydown}>
    <button
      class="fixed inset-0 bg-background/80 backdrop-blur-sm"
      onclick={onclose}
      aria-label="Close"
      transition:fade={{ duration: 200 }}
    ></button>
    <div
      class={cn(
        "fixed z-50 gap-4 bg-background p-6 shadow-lg",
        sideStyles[side],
        className
      )}
      transition:fly={{ ...flyParams[side], duration: 250, opacity: 1 }}
    >
      <button
        onclick={onclose}
        class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
      {#if children}{@render children()}{/if}
    </div>
  </div>
{/if}
`,
    },
    {
      path: "src/lib/components/ui/sheet/sheet-trigger.svelte",
      content: `<script lang="ts">
  import type { Snippet } from "svelte"

  let {
    onclick,
    class: className,
    children,
    ...restProps
  }: {
    onclick?: () => void
    class?: string
    children?: Snippet
  } = $props()
</script>

<button onclick={onclick} class={className} {...restProps}>
  {#if children}{@render children()}{/if}
</button>
`,
    },
    {
      path: "src/lib/components/ui/sheet/index.ts",
      content: `export { default as Sheet } from "./sheet.svelte"
export { default as SheetContent } from "./sheet-content.svelte"
export { default as SheetTrigger } from "./sheet-trigger.svelte"
`,
    },
  ];
}

function scrollAreaFiles(): GeneratedFile[] {
  return [
    {
      path: "src/lib/components/ui/scroll-area/scroll-area.svelte",
      content: `<script lang="ts">
  import { cn } from "$lib/utils.js"
  import type { Snippet } from "svelte"

  let {
    class: className,
    children,
    ...restProps
  }: {
    class?: string
    children?: Snippet
  } = $props()
</script>

<div class={cn("relative overflow-hidden", className)} {...restProps}>
  <div class="h-full w-full overflow-y-auto overscroll-contain [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent">
    {#if children}{@render children()}{/if}
  </div>
</div>
`,
    },
    {
      path: "src/lib/components/ui/scroll-area/index.ts",
      content: `export { default as ScrollArea } from "./scroll-area.svelte"
`,
    },
  ];
}

function virtualDts(): GeneratedFile {
  return {
    path: "src/virtual.d.ts",
    content: `declare module "virtual:tiramisu-docs" {
  import type { VirtualDoc, SidebarGroup, ResolvedSection, SearchIndexEntry, LocaleData } from "@tiramisu-docs/kit"

  export const docs: VirtualDoc[]
  export const sidebar: SidebarGroup[]
  export const sections: ResolvedSection[] | undefined
  export const docImports: Record<string, () => Promise<{ default: any }>>
  export const searchIndex: SearchIndexEntry[]
  export const locales: Record<string, LocaleData> | undefined
  export const defaultLocale: string | undefined
}
`,
  };
}

function tsconfig(): GeneratedFile {
  return {
    path: "tsconfig.json",
    content: `{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
`,
  };
}

function gitignore(): GeneratedFile {
  return {
    path: ".gitignore",
    content: `node_modules
.svelte-kit
build
dist
`,
  };
}
