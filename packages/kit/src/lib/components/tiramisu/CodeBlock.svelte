<script lang="ts">
  import type { Snippet } from "svelte";
  import { getLangIcon } from "./lang-icons.js"

  let { language = "", icon = "", code = "", children }: { language?: string; icon?: string; code?: string; children?: Snippet } = $props()
  let copied = $state(false)

  const langIcon = $derived(icon || getLangIcon(language))

  async function copyCode() {
    const text = code.replace(/<[^>]*>/g, "")
    await navigator.clipboard.writeText(text)
    copied = true
    setTimeout(() => (copied = false), 2000)
  }
</script>

<div class="group relative my-4 overflow-hidden rounded-lg border border-border">
  {#if language}
    <div class="flex items-center justify-between border-b border-border bg-muted/50 px-3 py-1.5">
      <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
        {#if langIcon}
          <iconify-icon icon={langIcon} width="14" height="14" class="shrink-0"></iconify-icon>
        {/if}
        {language}
      </span>
      <button
        onclick={copyCode}
        class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        aria-label="Copy code"
      >
        {#if copied}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          Copied
        {:else}
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copy
        {/if}
      </button>
    </div>
  {/if}
  <pre class="overflow-x-auto p-4 text-sm leading-relaxed"><code>{@html code}</code></pre>
  {#if !language}
    <button
      onclick={copyCode}
      class="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
      aria-label="Copy code"
    >
      {#if copied}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      {/if}
    </button>
  {/if}
</div>
