import { sveltekit } from "@sveltejs/kit/vite"
import { tiramisuPlugin } from "@tiramisu-docs/kit/vite"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [tiramisuPlugin(), sveltekit()],
})
