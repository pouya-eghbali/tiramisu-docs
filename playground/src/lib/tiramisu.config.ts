import { defineConfig } from "@tiramisu-docs/kit";

export default defineConfig({
  title: "Tiramisu Docs",
  description: "Documentation for the Tiramisu markup language and Tiramisu Docs framework",
  logo: { light: "/logo.svg", dark: "/logo-dark.svg" },
  url: "https://tiramisudocs.com",
  nav: [{ label: "Docs", href: "/docs" }],
  github: {
    repo: "pouya-eghbali/tiramisu-docs",
    branch: "main",
    dir: "src/docs",
  },
  sidebar: {
    groupOrder: ["Getting Started", "Writing", "Content", "Configuration", "Customization", "Integrations", "Basics", "Internals", "Tooling"],
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
  },
  footer: {
    socials: {
      github: "https://github.com/pouya-eghbali/tiramisu-docs",
      x: "https://x.com/pouyae",
    },
    copyright: "© 2026 Tiramisu Docs",
  },
});
