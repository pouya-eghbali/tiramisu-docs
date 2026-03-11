<script lang="ts">
  import { fly } from "svelte/transition"

  interface TabMeta {
    label: string
    icon?: string
  }

  let {
    group = "",
    tabs = [],
    contents = [],
  }: { group?: string; tabs?: TabMeta[]; contents?: string[] } = $props()

  const storageKey = $derived(group ? `tabs:${group}` : "")

  function getInitial() {
    if (storageKey && typeof window !== "undefined" && window.localStorage) {
      const saved = window.localStorage.getItem(storageKey)
      if (saved && tabs.some((t: TabMeta) => t.label === saved)) return saved
    }
    return tabs[0]?.label ?? ""
  }

  let active = $state(getInitial())

  function select(label: string) {
    if (label === active) return
    active = label
    if (storageKey && typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(storageKey, label)
      window.dispatchEvent(new CustomEvent("tabs-sync", { detail: { group, label } }))
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

    window.addEventListener("tabs-sync", onSync)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener("tabs-sync", onSync)
      window.removeEventListener("storage", onStorage)
    }
  })
</script>

<div class="my-4 overflow-hidden rounded-lg border border-border">
  <div class="flex border-b border-border bg-muted/50">
    <div class="flex overflow-x-auto">
      {#each tabs as tab}
        <button
          onclick={() => select(tab.label)}
          class="relative flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap {active === tab.label ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/80'}"
        >
          {#if tab.icon}
            <iconify-icon icon={tab.icon.includes(":") ? tab.icon : `lucide:${tab.icon}`} width="14" height="14" class="shrink-0"></iconify-icon>
          {/if}
          {tab.label}
          {#if active === tab.label}
            <span class="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"></span>
          {/if}
        </button>
      {/each}
    </div>
  </div>
  {#each tabs as tab, i}
    {#if active === tab.label}
      <div class="p-4" in:fly={{ y: 6, duration: 200 }}>
        {@html contents[i] ?? ""}
      </div>
    {/if}
  {/each}
</div>
