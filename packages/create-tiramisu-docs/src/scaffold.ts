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
      fallback: "404.html",
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
    content: `@import "tailwindcss";
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
`,
  }
}

function pageSvelte(): GeneratedFile {
  return {
    path: "src/routes/docs/[...slug]/+page.svelte",
    content: `<script>
  import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
  import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
  import { sidebar } from "virtual:tiramisu-docs"
  import config from "$lib/tiramisu.config"
  import { resolveConfig } from "@tiramisu-docs/kit"

  let { data } = $props()

  const resolved = resolveConfig(config)
  const Component = data.component
</script>

<DocsLayout config={resolved} {sidebar} headings={data.headings}>
  <DocPage meta={data.meta}>
    <Component />
  </DocPage>
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
