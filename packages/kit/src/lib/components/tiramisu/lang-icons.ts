import { addIcon } from "iconify-icon"

// Register custom tiramisu icon
addIcon("custom:tiramisu", {
  body: '<rect x="3" y="16" width="18" height="3" rx="1" fill="currentColor"/><rect x="4" y="11" width="16" height="3" rx="1" fill="currentColor" opacity="0.7"/><rect x="5" y="6" width="14" height="3" rx="1" fill="currentColor" opacity="0.5"/><circle cx="8" cy="4" r="0.7" fill="currentColor" opacity="0.6"/><circle cx="12" cy="3.5" r="0.7" fill="currentColor" opacity="0.4"/><circle cx="16" cy="4" r="0.7" fill="currentColor" opacity="0.6"/>',
  width: 24,
  height: 24,
})

/** Map language/tool names to Iconify icon identifiers */
const icons: Record<string, string> = {
  // JS/TS
  typescript: "devicon-plain:typescript",
  javascript: "devicon-plain:javascript",
  tsx: "devicon-plain:typescript",
  jsx: "devicon-plain:javascript",
  // Web
  html: "devicon-plain:html5",
  css: "devicon-plain:css3",
  svelte: "devicon-plain:svelte",
  react: "devicon-plain:react",
  vue: "devicon-plain:vuejs",
  angular: "devicon-plain:angularjs",
  // Shell
  bash: "devicon-plain:bash",
  shell: "devicon-plain:bash",
  zsh: "devicon-plain:bash",
  // Languages
  python: "devicon-plain:python",
  rust: "devicon-plain:rust",
  go: "devicon-plain:go",
  java: "devicon-plain:java",
  csharp: "devicon-plain:csharp",
  ruby: "devicon-plain:ruby",
  php: "devicon-plain:php",
  swift: "devicon-plain:swift",
  kotlin: "devicon-plain:kotlin",
  dart: "devicon-plain:dart",
  c: "devicon-plain:c",
  cpp: "devicon-plain:cplusplus",
  // Data/Config
  json: "devicon-plain:json",
  yaml: "devicon-plain:yaml",
  markdown: "devicon-plain:markdown",
  graphql: "devicon-plain:graphql",
  // Tools/Runtimes
  docker: "devicon-plain:docker",
  git: "devicon-plain:git",
  nginx: "devicon-plain:nginx-original",
  redis: "devicon-plain:redis",
  postgresql: "devicon-plain:postgresql",
  mongodb: "devicon-plain:mongodb",
  // Package managers / runtimes
  npm: "devicon-plain:npm",
  yarn: "devicon-plain:yarn",
  pnpm: "devicon-plain:pnpm",
  bun: "devicon-plain:bun",
  deno: "devicon-plain:denojs",
  node: "devicon-plain:nodejs",
  nodejs: "devicon-plain:nodejs",
  // Custom
  tiramisu: "custom:tiramisu",
}

// Aliases
icons.ts = icons.typescript
icons.js = icons.javascript
icons.sh = icons.bash
icons.py = icons.python
icons.rs = icons.rust
icons.md = icons.markdown
icons.yml = icons.yaml
icons["c++"] = icons.cpp
icons["c#"] = icons.csharp

/**
 * Get an Iconify icon name for a language, or empty string if unknown.
 */
export function getLangIcon(language: string): string {
  return icons[language.toLowerCase()] ?? ""
}
