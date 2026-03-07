import { sveltekit } from "@sveltejs/kit/vite"
import { tiramisuPlugin } from "@tiramisu-docs/kit/vite"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    tiramisuPlugin({
      groupOrder: ["Getting Started", "Writing", "Customization"],
      sections: [
        { label: "Getting Started", path: "getting-started" },
        { label: "Writing", path: "writing" },
        { label: "Customization", path: "customization" },
      ],
      title: "Tiramisu Docs",
    }),
    tailwindcss(),
    sveltekit(),
  ],
})
