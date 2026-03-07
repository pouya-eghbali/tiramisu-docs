<script lang="ts">
  import { cn } from "../../../utils.js"
  import type { BadgeVariant } from "./index.js"
  import type { Snippet } from "svelte"

  let {
    variant = "default",
    class: className,
    children,
    ...restProps
  }: {
    variant?: BadgeVariant
    class?: string
    children?: Snippet
  } = $props()

  const variants: Record<BadgeVariant, string> = {
    default: "border-transparent bg-primary text-primary-foreground shadow",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-destructive text-white shadow",
    outline: "text-foreground",
  }
</script>

<span
  class={cn(
    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    variants[variant],
    className
  )}
  {...restProps}
>
  {#if children}{@render children()}{/if}
</span>
