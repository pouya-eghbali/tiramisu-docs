export interface ScaffoldOptions {
  name: string
  theme: "default" | "minimal"
}

export interface GeneratedFile {
  path: string
  content: string
}

export function generateProjectFiles(options: ScaffoldOptions): GeneratedFile[] {
  const { name } = options

  return [
    packageJson(name),
    svelteConfig(),
    viteConfig(),
    tiramisuConfig(name),
    appHtml(),
    appCss(),
    indexTiramisu(name),
    gettingStartedTiramisu(),
    homePage(),
    layoutSvelte(),
    pageTs(),
    pageSvelte(),
    tsconfig(),
    gitignore(),
  ]
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
    },
    dependencies: {
      "@tiramisu-docs/kit": "^0.1.0",
      "@timeleap/tiramisu": "^1.6.0",
    },
    devDependencies: {
      "@sveltejs/adapter-static": "^3.0.0",
      "@sveltejs/kit": "^2.0.0",
      "@sveltejs/vite-plugin-svelte": "^4.0.0",
      svelte: "^5.0.0",
      vite: "^6.0.0",
      tailwindcss: "^4.0.0",
      "@tailwindcss/vite": "^4.0.0",
      typescript: "^5.4.0",
    },
  }

  return {
    path: "package.json",
    content: JSON.stringify(pkg, null, 2) + "\n",
  }
}

function svelteConfig(): GeneratedFile {
  return {
    path: "svelte.config.js",
    content: `import adapter from "@sveltejs/adapter-static"

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      fallback: "index.html",
      precompress: false,
      strict: true,
    }),
  },
}

export default config
`,
  }
}

function viteConfig(): GeneratedFile {
  return {
    path: "vite.config.ts",
    content: `import { sveltekit } from "@sveltejs/kit/vite"
import { tiramisuPlugin } from "@tiramisu-docs/kit/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [tiramisuPlugin(), tailwindcss(), sveltekit()],
})
`,
  }
}

function tiramisuConfig(name: string): GeneratedFile {
  return {
    path: "src/lib/tiramisu.config.ts",
    content: `import { defineConfig } from "@tiramisu-docs/kit"

export default defineConfig({
  title: "${name}",
  description: "Documentation powered by Tiramisu Docs",
  nav: [
    { label: "Docs", href: "/docs" },
  ],
})
`,
  }
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
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
`,
  }
}

function appCss(): GeneratedFile {
  return {
    path: "src/app.css",
    content: `@import "@tiramisu-docs/kit/styles/theme.css";
@import "tailwindcss";

@source "../node_modules/@tiramisu-docs/kit/src/lib";

@theme {
  --font-sans: 'Geist', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;
}
`,
  }
}

function indexTiramisu(name: string): GeneratedFile {
  return {
    path: "src/docs/index.tiramisu",
    content: `meta { title = Welcome, order = 1, group = Getting Started }

h1 { Welcome to ${name} }

This is your documentation site powered by bold { Tiramisu Docs }.

Get started by editing the files in code { src/docs/ }.
`,
  }
}

function gettingStartedTiramisu(): GeneratedFile {
  return {
    path: "src/docs/getting-started.tiramisu",
    content: `meta { title = Getting Started, order = 2, group = Getting Started }

h2 { Installation }

codeblock { language = bash, "bun add my-package" }

h2 { Usage }

Import and use the package in your project:

codeblock { language = typescript, "import { something } from 'my-package'" }
`,
  }
}

function homePage(): GeneratedFile {
  return {
    path: "src/routes/+page.svelte",
    content: `<script>
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
  }
}

function layoutSvelte(): GeneratedFile {
  return {
    path: "src/routes/+layout.svelte",
    content: `<script>
  import "../app.css"

  let { children } = $props()
</script>

{@render children()}
`,
  }
}

function pageTs(): GeneratedFile {
  return {
    path: "src/routes/docs/[...slug]/+page.ts",
    content: `import { error } from "@sveltejs/kit"

export const ssr = false

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
    slug,
  }
}
`,
  }
}

function pageSvelte(): GeneratedFile {
  return {
    path: "src/routes/docs/[...slug]/+page.svelte",
    content: `<script>
  import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
  import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
  import PrevNextNav from "@tiramisu-docs/kit/components/PrevNextNav.svelte"
  import { sidebar } from "virtual:tiramisu-docs"
  import config from "$lib/tiramisu.config"
  import { resolveConfig } from "@tiramisu-docs/kit"

  let { data } = $props()

  const resolved = resolveConfig(config)
</script>

<DocsLayout config={resolved} {sidebar} headings={data.headings}>
  <DocPage meta={data.meta}>
    {#if data.component}
      {@const Component = data.component}
      <Component />
    {/if}
  </DocPage>
  <PrevNextNav {sidebar} currentSlug={data.slug} />
</DocsLayout>
`,
  }
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
  }
}

function gitignore(): GeneratedFile {
  return {
    path: ".gitignore",
    content: `node_modules
.svelte-kit
build
dist
`,
  }
}
