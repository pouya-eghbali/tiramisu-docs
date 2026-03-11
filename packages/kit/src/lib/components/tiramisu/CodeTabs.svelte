<script lang="ts">
  import { fly } from "svelte/transition"
  import { getLangIcon } from "./lang-icons.js"

  interface TabMeta {
    label: string
    icon?: string
    language?: string
  }

  let {
    group = "",
    tabs = [],
    codes = [],
    langMap = [],
  }: { group?: string; tabs?: TabMeta[]; codes?: string[]; langMap?: string[] } = $props()

  const storageKey = $derived(group ? `codetabs:${group}` : "")

  function getInitial() {
    const key = group ? `codetabs:${group}` : ""
    if (key && typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem(key)
      if (saved && tabs.some((t: TabMeta) => t.label === saved)) return saved
    }
    return tabs[0]?.label ?? ""
  }

  let active = $state(getInitial())

  function select(label: string) {
    if (label === active) return
    active = label
    if (storageKey && typeof localStorage !== "undefined") {
      localStorage.setItem(storageKey, label)
      window.dispatchEvent(new CustomEvent("codetabs-sync", { detail: { group, label } }))
    }
  }

  $effect(() => {
    if (!storageKey || typeof window === "undefined") return

    function onSync(e: Event) {
      const detail = (e as CustomEvent<{ group: string; label: string }>).detail
      if (detail?.group === group && detail?.label !== active) {
        select(detail.label)
      }
    }

    function onStorage(e: StorageEvent) {
      if (e.key === storageKey && e.newValue && e.newValue !== active) {
        select(e.newValue)
      }
    }

    window.addEventListener("codetabs-sync", onSync)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("codetabs-sync", onSync)
      window.removeEventListener("storage", onStorage)
    }
  })

  let copied = $state(false)

  function copyActive() {
    const idx = tabs.findIndex((t: TabMeta) => t.label === active)
    if (idx === -1) return
    const raw = (codes[idx] ?? "").replace(/<[^>]*>/g, "")
    navigator.clipboard.writeText(raw)
    copied = true
    setTimeout(() => (copied = false), 2000)
  }

  function tabIcon(tab: TabMeta): string | undefined {
    if (tab.icon) return tab.icon
    return getLangIcon(tab.label) || getLangIcon(tab.language || "")
  }
</script>

<div class="group relative my-4 overflow-hidden rounded-lg border border-border">
  <div class="flex items-center border-b border-border bg-muted/50">
    <div class="flex overflow-x-auto">
      {#each tabs as tab, i}
        {@const icon = tabIcon(tab)}
        <button
          onclick={() => select(tab.label)}
          class="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap {active === tab.label ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}"
        >
          {#if icon}
            <iconify-icon icon={icon} width="14" height="14" class="shrink-0"></iconify-icon>
          {/if}
          {tab.label}
          {#if active === tab.label}
            <span class="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"></span>
          {/if}
        </button>
      {/each}
    </div>
    <div class="ml-auto pr-2">
      <button
        onclick={copyActive}
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
  </div>
  {#each tabs as tab, i}
    {#if active === tab.label}
      <div in:fly={{ y: 6, duration: 200 }}>
        <pre class="overflow-x-auto p-4 text-sm leading-relaxed"><code>{@html codes[i] ?? ""}</code></pre>
      </div>
    {/if}
  {/each}
</div>
