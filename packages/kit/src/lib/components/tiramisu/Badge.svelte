<script lang="ts">
  import type { Snippet } from "svelte";

  let { variant = "default", children }: { variant?: string; children: Snippet } = $props()

  const variants = {
    default: "bg-primary/10 text-primary border-primary/20",
    secondary: "bg-muted text-muted-foreground border-border",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    outline: "bg-transparent text-foreground border-border",
  }
</script>

<span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors {variants[variant] ?? variants.default}">
  {@render children()}
</span>
