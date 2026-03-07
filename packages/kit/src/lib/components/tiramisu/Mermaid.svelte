<script lang="ts">
  import { onMount } from "svelte"

  let { chart = "" }: { chart?: string } = $props()
  let container: HTMLElement
  let id = `mermaid-${Math.random().toString(36).slice(2, 9)}`

  onMount(async () => {
    const mermaid = (await import("mermaid")).default
    mermaid.initialize({ startOnLoad: false, theme: "default" })
    const { svg } = await mermaid.render(id, chart)
    container.innerHTML = svg
  })
</script>

<div bind:this={container} class="mermaid-block my-4 flex justify-center">
  <pre class="text-sm text-muted-foreground">{chart}</pre>
</div>
