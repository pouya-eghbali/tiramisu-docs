<script lang="ts">
  let { src = "", alt = "" }: { src?: string; alt?: string } = $props()
  let zoomed = $state(false)

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") zoomed = false
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<button type="button" class="zoom-trigger" onclick={() => (zoomed = true)}>
  <img {src} {alt} class="rounded-lg" />
</button>

{#if zoomed}
  <div class="zoom-overlay" role="dialog" aria-modal="true">
    <button type="button" class="zoom-backdrop" onclick={() => (zoomed = false)}>
      <img {src} {alt} class="zoom-image" />
    </button>
  </div>
{/if}

<style>
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
  }

  .zoom-image {
    max-width: 90vw;
    max-height: 90vh;
    object-fit: contain;
    border-radius: 0.5rem;
  }
</style>
