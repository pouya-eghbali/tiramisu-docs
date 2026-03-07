<script lang="ts">
  import { onMount } from "svelte"

  let { formula = "" }: { formula?: string } = $props()
  let container: HTMLElement
  let html = $state("")

  onMount(async () => {
    const katex = await import("katex")
    html = katex.default.renderToString(formula, {
      throwOnError: false,
      displayMode: true,
    })
  })
</script>

<svelte:head>
  <link
    rel="stylesheet"
    href="https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/katex.min.css"
  />
</svelte:head>

<div bind:this={container} class="math-block my-4 overflow-x-auto">
  {@html html}
</div>
