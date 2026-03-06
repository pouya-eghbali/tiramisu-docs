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
    theme: () => p.select({
      message: "Theme:",
      options: [
        { value: "default", label: "Default" },
        { value: "minimal", label: "Minimal" },
      ],
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
    theme: options.theme as "default" | "minimal",
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

  p.outro(`Done! Run:\n  cd ${options.name}\n  ${options.packageManager} run dev`)
}

main()
