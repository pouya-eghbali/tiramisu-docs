import { createHighlighter, type Highlighter } from "shiki"
import { tiramisuGrammar } from "./tiramisu-grammar.js"

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [
        "typescript",
        "javascript",
        "bash",
        "html",
        "css",
        "json",
        "svelte",
        "yaml",
        "markdown",
        "tsx",
        "jsx",
        "shell",
        tiramisuGrammar,
      ],
    })
  }
  return highlighterPromise
}

/**
 * Post-process compiled Svelte output to add syntax highlighting.
 *
 * Finds patterns like:
 *   const __code_0 = "escaped code"
 *   <CodeBlock language="typescript" code={__code_0} />
 *
 * Replaces the code string with Shiki-highlighted HTML.
 */
export async function highlightCodeBlocks(svelte: string): Promise<string> {
  // Find all CodeBlock usages to map varName -> language
  const langMap = new Map<string, string>()
  const codeBlockRegex =
    /<CodeBlock\s+language="([^"]*)"\s+code=\{(__code_\d+)\}\s*\/>/g
  let match
  while ((match = codeBlockRegex.exec(svelte)) !== null) {
    langMap.set(match[2], match[1])
  }

  // Find CodeTabs usages to map varName -> language
  const codeTabsRegex =
    /<CodeTabs\s[^>]*codes=\{\[([^\]]*)\]\}\s+langMap=\{\[([^\]]*)\]\}\s*\/>/g
  while ((match = codeTabsRegex.exec(svelte)) !== null) {
    const vars = match[1].split(/,\s*/).map(s => s.trim())
    const langs = match[2].split(/,\s*/).map(s => s.replace(/^"|"$/g, ""))
    for (let i = 0; i < vars.length; i++) {
      if (vars[i] && langs[i]) langMap.set(vars[i], langs[i])
    }
  }

  if (langMap.size === 0) return svelte

  const hl = await getHighlighter()
  const loadedLangs = hl.getLoadedLanguages()

  // Find and replace each __code_N declaration
  const codeVarRegex = /const (__code_\d+) = ("(?:[^"\\]|\\.)*")/g
  let result = svelte
  const replacements: [string, string][] = []

  while ((match = codeVarRegex.exec(svelte)) !== null) {
    const varName = match[1]
    const jsonStr = match[2]
    const language = langMap.get(varName)

    if (!language) continue

    // Decode the JSON string, then unescape HTML entities to get raw code
    const escapedHtml: string = JSON.parse(jsonStr)
    const rawCode = escapedHtml
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')

    const lang = loadedLangs.includes(language) ? language : "text"

    const highlighted = hl.codeToHtml(rawCode, {
      lang,
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    })

    // Extract just the inner content from shiki's <pre><code>...</code></pre>
    const innerMatch = highlighted.match(
      /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/
    )
    const inner = innerMatch ? innerMatch[1] : escapedHtml

    replacements.push([
      `const ${varName} = ${jsonStr}`,
      `const ${varName} = ${JSON.stringify(inner)}`,
    ])
  }

  for (const [from, to] of replacements) {
    result = result.replace(from, to)
  }

  return result
}
