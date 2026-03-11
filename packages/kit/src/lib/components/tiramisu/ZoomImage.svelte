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

<style>
  .zoom-figure {
    margin: 0;
  }

  .zoom-trigger {
    cursor: zoom-in;
    background: none;
    border: none;
    padding: 0;
    display: block;
  }

  .zoom-trigger img {
    max-width: 100%;
    height: auto;
    transition: opacity 0.15s;
  }

  .zoom-trigger:hover img {
    opacity: 0.85;
  }

  .zoom-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .zoom-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.8);
    border: none;
    cursor: zoom-out;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    backdrop-filter: blur(4px);
  }

  .zoom-image {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 0.5rem;
  }
</style>
