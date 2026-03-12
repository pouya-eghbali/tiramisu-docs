import { defineConfig } from "@tiramisu-docs/kit";

export default defineConfig({
  title: "Tiramisu Docs",
  description:
    "A SvelteKit documentation framework powered by the Tiramisu markup language. Clean syntax, file-based routing, built-in search, and zero configuration.",
  logo: { light: "/logo.svg", dark: "/logo-dark.svg" },
  url: "https://tiramisudocs.com",
  nav: [{ label: "Docs", href: "/docs" }],
  github: {
    repo: "pouya-eghbali/tiramisu-docs",
    branch: "main",
    dir: "src/docs",
  },
  sidebar: {
    groupOrder: [
      "Getting Started",
      "Writing",
      "Content",
      "Configuration",
      "Customization",
      "Integrations",
      "Basics",
      "Internals",
      "Tooling",
    ],
  },
  sections: [
    { label: "Framework", path: "framework", icon: "book-open" },
    { label: "Language", path: "language", icon: "code" },
  ],
  mcp: true,
  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", label: "English", flag: "🇬🇧" },
      { code: "fr", label: "Français", flag: "🇫🇷" },
      { code: "de", label: "Deutsch", flag: "🇩🇪" },
    ],
  },
  instantOg: {
    siteId: "site_b6bc4c3f",
    template: "generic/standard",
    theme: "dark",
  },
  footer: {
    socials: {
      github: "https://github.com/pouya-eghbali/tiramisu-docs",
      x: "https://x.com/pouyae",
    },
    copyright: "© 2026 Tiramisu Docs",
  },
});
