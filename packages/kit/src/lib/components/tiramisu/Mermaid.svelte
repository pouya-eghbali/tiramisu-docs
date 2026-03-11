<script lang="ts">
  import { onMount } from "svelte"

  let { chart = "" }: { chart?: string } = $props()
  let container: HTMLElement
  let idBase = `mermaid-${Math.random().toString(36).slice(2, 9)}`
  let renderCount = 0

  onMount(async () => {
    const mermaid = (await import("mermaid")).default

    async function render() {
      const isDark = document.documentElement.classList.contains("dark")
      mermaid.initialize({ startOnLoad: false, theme: isDark ? "dark" : "default" })
      const rid = `${idBase}-${renderCount++}`
      const { svg } = await mermaid.render(rid, chart)
      container.innerHTML = svg
    }

    await render()

    const observer = new MutationObserver(() => render())
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  })
</script>

<div bind:this={container} class="mermaid-block my-4 flex justify-center">
  <pre class="text-sm text-muted-foreground">{chart}</pre>
</div>
