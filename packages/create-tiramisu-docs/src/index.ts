#!/usr/bin/env node

import * as p from "@clack/prompts"
import { mkdirSync, writeFileSync } from "fs"
import { join, dirname } from "path"
import { execSync } from "child_process"
import { generateProjectFiles } from "./scaffold"

async function main() {
  p.intro("Create Tiramisu Docs")

  const options = await p.group({
    name: () => p.text({
      message: "Project name:",
      placeholder: "my-docs",
      defaultValue: "my-docs",
    }),
    packageManager: () => p.select({
      message: "Package manager:",
      options: [
        { value: "bun", label: "bun" },
        { value: "npm", label: "npm" },
        { value: "pnpm", label: "pnpm" },
      ],
    }),
    sections: () => p.confirm({
      message: "Enable top navigation sections?",
      initialValue: false,
    }),
    i18n: () => p.confirm({
      message: "Enable translations (i18n)?",
      initialValue: false,
    }),
    defaultLocale: ({ results }) => {
      if (!results.i18n) return Promise.resolve("en")
      return p.text({
        message: "Default locale code:",
        placeholder: "en",
        defaultValue: "en",
      })
    },
    instantOg: () => p.confirm({
      message: "Enable InstantOG for automatic social images?",
      initialValue: false,
    }),
    instantOgSiteId: ({ results }) => {
      if (!results.instantOg) return Promise.resolve("")
      return p.text({
        message: "InstantOG site ID (from instantog.com/dashboard):",
        placeholder: "site_xxxxxxxx",
      })
    },
    instantOgTemplate: ({ results }) => {
      if (!results.instantOg) return Promise.resolve("")
      return p.select({
        message: "OG image template:",
        options: [
          { value: "generic/standard", label: "Standard — clean, all-purpose layout" },
          { value: "generic/minimal", label: "Minimal — stripped-down, text-focused" },
          { value: "article/blog-post", label: "Blog Post — article-style with author" },
          { value: "article/magazine", label: "Magazine — editorial layout" },
          { value: "article/newsletter", label: "Newsletter — email-style header" },
          { value: "news/headline", label: "Headline — bold news-style" },
          { value: "product/ecommerce", label: "E-commerce — product showcase" },
          { value: "product/luxury", label: "Luxury — premium feel" },
          { value: "product/bold", label: "Bold — high-contrast product" },
          { value: "product/playful", label: "Playful — fun, colorful product" },
        ],
      })
    },
    mcp: () => p.confirm({
      message: "Enable MCP server for AI assistants?",
      initialValue: false,
    }),
  }, {
    onCancel: () => {
      p.cancel("Cancelled.")
      process.exit(0)
    },
  })

  const projectDir = join(process.cwd(), options.name)
  const files = generateProjectFiles({
    name: options.name,
    sections: options.sections,
    i18n: options.i18n,
    defaultLocale: options.defaultLocale as string,
    locales: options.i18n
      ? [{ code: options.defaultLocale as string, label: options.defaultLocale === "en" ? "English" : options.defaultLocale as string }]
      : [],
    instantOg: options.instantOg
      ? { siteId: options.instantOgSiteId as string, template: options.instantOgTemplate as string }
      : undefined,
    mcp: options.mcp,
  })

  const spinner = p.spinner()
  spinner.start("Scaffolding project...")

  for (const file of files) {
    const fullPath = join(projectDir, file.path)
    mkdirSync(dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, file.content)
  }

  spinner.stop("Project created!")

  spinner.start("Installing dependencies...")
  try {
    execSync(`${options.packageManager} install`, { cwd: projectDir, stdio: "ignore" })
    spinner.stop("Dependencies installed!")
  } catch {
    spinner.stop("Failed to install dependencies. Run install manually.")
  }

  spinner.start("Adding shadcn components...")
  try {
    execSync("npx shadcn-svelte@latest add dropdown-menu card tabs badge button separator -y", { cwd: projectDir, stdio: "ignore" })
    spinner.stop("Components added!")
  } catch {
    spinner.stop("Failed to add shadcn components. Run: npx shadcn-svelte add dropdown-menu card tabs badge button separator")
  }

  p.outro(`Done! 🍰 Run:\n  cd ${options.name}\n  ${options.packageManager} run dev`)
}

main()
