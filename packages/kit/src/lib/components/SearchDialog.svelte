<script>
  import { goto } from "$app/navigation"
  import { fade, scale, fly } from "svelte/transition"
  import MiniSearch from "minisearch"
  import { searchIndex, locales, defaultLocale } from "virtual:tiramisu-docs"

  let { open = $bindable(false), locale } = $props()
  let query = $state("")
  let selectedIndex = $state(0)
  let inputEl = $state(null)

  const activeIndex = $derived(
    locale && locales?.[locale]
      ? locales[locale].searchIndex
      : searchIndex
  )

  const miniSearch = $derived.by(() => {
    const ms = new MiniSearch({
      fields: ["title", "headings", "text"],
      storeFields: ["title", "group", "slug"],
      searchOptions: {
        boost: { title: 3, headings: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
    })
    ms.addAll(activeIndex)
    return ms
  })

  const results = $derived(
    query.length > 0
      ? miniSearch.search(query).slice(0, 8)
      : []
  )

  $effect(() => {
    if (open) {
      query = ""
      selectedIndex = 0
      requestAnimationFrame(() => inputEl?.focus())
    }
  })

  $effect(() => {
    results;
    selectedIndex = 0
  })

  function handleKeydown(e) {
    if (e.key === "Escape") {
      open = false
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      selectedIndex = Math.min(selectedIndex + 1, results.length - 1)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      selectedIndex = Math.max(selectedIndex - 1, 0)
    } else if (e.key === "Enter" && results.length > 0) {
      e.preventDefault()
      navigate(results[selectedIndex])
    }
  }

  function navigate(result) {
    const prefix = locale ? `/docs/${locale}` : "/docs"
    const href = result.slug === "index" ? prefix : `${prefix}/${result.slug}`
    open = false
    goto(href)
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50" onkeydown={handleKeydown}>
    <button
      class="fixed inset-0 bg-background/80 backdrop-blur-sm"
      onclick={() => (open = false)}
      aria-label="Close search"
      transition:fade={{ duration: 150 }}
    ></button>

    <div
      class="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2 px-4"
      transition:scale={{ duration: 150, start: 0.96, opacity: 0 }}
    >
      <div class="overflow-hidden rounded-xl border bg-background shadow-2xl">
        <div class="flex items-center gap-3 border-b px-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 text-muted-foreground">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input
            bind:this={inputEl}
            bind:value={query}
            type="text"
            placeholder="Search documentation..."
            class="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd class="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
        </div>

        {#if results.length > 0}
          <ul class="max-h-80 overflow-y-auto p-2">
            {#each results as result, i (result.id)}
              <li in:fly={{ y: 8, duration: 150, delay: i * 30 }}>
                <button
                  class="flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors
                    {i === selectedIndex
                      ? 'bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:bg-muted'}"
                  onclick={() => navigate(result)}
                  onmouseenter={() => (selectedIndex = i)}
                >
                  <span class="text-[11px] text-muted-foreground">{result.group}</span>
                  <span class="text-sm font-medium">{result.title}</span>
                </button>
              </li>
            {/each}
          </ul>
        {:else if query.length > 0}
          <div class="px-4 py-8 text-center text-sm text-muted-foreground">
            No results found.
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
