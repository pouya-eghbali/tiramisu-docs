import type { LanguageRegistration } from "shiki"

export const tiramisuGrammar: LanguageRegistration = {
  name: "tiramisu",
  scopeName: "source.tiramisu",
  patterns: [
    { include: "#string" },
    { include: "#function-call" },
  ],
  repository: {
    string: {
      patterns: [
        {
          name: "string.quoted.triple.tiramisu",
          begin: '"""',
          end: '"""',
          patterns: [{ include: "#string-escape" }],
        },
        {
          name: "string.quoted.double-double.tiramisu",
          begin: '""(?!")',
          end: '""',
          patterns: [{ include: "#string-escape" }],
        },
        {
          name: "string.quoted.double.tiramisu",
          begin: '"(?!")',
          end: '"',
          patterns: [{ include: "#string-escape" }],
        },
      ],
    },
    "string-escape": {
      name: "constant.character.escape.tiramisu",
      match: "\\\\[,{}\\[\\]\\\\]",
    },
    "function-call": {
      patterns: [
        {
          // Known built-in functions
          match:
            "\\b(meta|h[1-6]|bold|italic|code|link|image|codeblock|list|table|callout|tabs|steps|badge|quote|tasklist|columns|col|accordion|cards|card|filetree|folder|file|math|mermaid)\\s*(?=\\{)",
          captures: {
            1: { name: "support.function.builtin.tiramisu" },
          },
        },
        {
          // Custom/user functions
          match: "\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s*(?=\\{)",
          captures: {
            1: { name: "entity.name.function.tiramisu" },
          },
        },
        {
          // Named parameter keys
          match: "\\b([a-zA-Z_][a-zA-Z0-9_]*)\\s*(?==)",
          captures: {
            1: { name: "variable.parameter.tiramisu" },
          },
        },
        {
          name: "punctuation.section.braces.tiramisu",
          match: "[{}]",
        },
        {
          name: "punctuation.section.brackets.tiramisu",
          match: "[\\[\\]]",
        },
        {
          name: "punctuation.separator.comma.tiramisu",
          match: ",",
        },
        {
          name: "keyword.operator.assignment.tiramisu",
          match: "=",
        },
      ],
    },
  },
}
