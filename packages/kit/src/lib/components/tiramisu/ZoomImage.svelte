<script lang="ts">
  import { fade } from "svelte/transition"

  let { src = "", alt = "", caption = "" }: { src?: string; alt?: string; caption?: string } = $props()
  let zoomed = $state(false)

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") zoomed = false
  }

  function scaleIn(node: Element) {
    return {
      duration: 250,
      css: (t: number) => {
        const ease = 1 - Math.pow(1 - t, 3)
        return `opacity: ${ease}; transform: scale(${0.85 + 0.15 * ease})`
      },
    }
  }

  function scaleOut(node: Element) {
    return {
      duration: 200,
      css: (t: number) => {
        const ease = t * t
        return `opacity: ${ease}; transform: scale(${0.85 + 0.15 * ease})`
      },
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<figure class="zoom-figure">
  <button type="button" class="zoom-trigger" onclick={() => (zoomed = true)}>
    <img {src} {alt} class="rounded-lg" />
  </button>
  {#if caption}
    <figcaption class="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption>
  {/if}
</figure>

{#if zoomed}
  <div class="zoom-overlay" role="dialog" aria-modal="true">
    <button
      type="button"
      class="zoom-backdrop"
      onclick={() => (zoomed = false)}
      in:fade={{ duration: 250 }}
      out:fade={{ duration: 200 }}
    >
      <img
        {src}
        {alt}
        class="zoom-image"
        in:scaleIn
        out:scaleOut
      />
    </button>
  </div>
{/if}
