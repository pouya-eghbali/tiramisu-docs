<script lang="ts">
  import { cn } from "../../../utils.js"

  let {
    orientation = "horizontal",
    decorative = true,
    class: className,
    ...restProps
  }: {
    orientation?: "horizontal" | "vertical"
    decorative?: boolean
    class?: string
  } = $props()
</script>

<div
  role={decorative ? "none" : "separator"}
  aria-orientation={!decorative ? orientation : undefined}
  class={cn(
    "shrink-0 bg-border",
    orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
    className
  )}
  {...restProps}
></div>
