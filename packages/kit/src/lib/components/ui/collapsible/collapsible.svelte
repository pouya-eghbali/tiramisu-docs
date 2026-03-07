<script lang="ts">
  import { cn } from "../../../utils.js"
  import { slide } from "svelte/transition"
  import type { Snippet } from "svelte"

  let {
    open = $bindable(true),
    class: className,
    trigger,
    children,
  }: {
    open?: boolean
    class?: string
    trigger?: Snippet
    children?: Snippet
  } = $props()
</script>

<div class={cn(className)}>
  <button
    onclick={() => (open = !open)}
    class="flex w-full items-center justify-between"
    aria-expanded={open}
  >
    {#if trigger}{@render trigger()}{/if}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 {open ? 'rotate-180' : ''}"
    >
      <path d="m6 9 6 6 6-6"></path>
    </svg>
  </button>
  {#if open}
    <div transition:slide={{ duration: 200 }}>
      {#if children}{@render children()}{/if}
    </div>
  {/if}
</div>
