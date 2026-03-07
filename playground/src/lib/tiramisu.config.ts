import { defineConfig } from "@tiramisu-docs/kit"

export default defineConfig({
  title: "Tiramisu Docs",
  description: "Documentation powered by Tiramisu Docs",
  logo: { light: "/logo.svg", dark: "/logo-dark.svg" },
  nav: [
    { label: "Docs", href: "/docs" },
  ],
  sidebar: {
    groupOrder: ["Getting Started", "Writing", "Customization"],
  },
  sections: [
    { label: "Getting Started", path: "getting-started" },
    { label: "Writing", path: "writing" },
    { label: "Customization", path: "customization" },
  ],
})
