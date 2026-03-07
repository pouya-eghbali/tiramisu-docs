<script>
  import { page } from "$app/stores"
  import { Collapsible } from "./ui/collapsible/index.js"

  let { config, groups, onSearchClick, hasSections = false } = $props()

  let dark = $state(false)

  function initTheme() {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("theme")
    dark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", dark)
  }

  function toggleTheme() {
    dark = !dark
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
  }

  function isSubgroupActive(entry, pathname) {
    if (entry.slug) {
      const href = `/docs/${entry.slug}`
      if (pathname === href) return true
    }
    return hasActiveDescendant(entry.items, pathname)
  }

  function hasActiveDescendant(items, pathname) {
    for (const entry of items) {
      if (entry.type === "item") {
        const href = entry.slug === "index" ? "/docs" : `/docs/${entry.slug}`
        if (pathname === href) return true
      } else if (entry.type === "subgroup") {
        if (isSubgroupActive(entry, pathname)) return true
      }
    }
    return false
  }

  $effect(() => {
    initTheme()
  })
</script>

{#snippet renderEntries(entries, depth)}
  {#each entries as entry}
    {#if entry.type === "item"}
      {@const href = entry.slug === "index" ? "/docs" : `/docs/${entry.slug}`}
      {@const active = $page.url.pathname === href}
      <a
        {href}
        class="block rounded-md py-[5px] text-[13px] transition-colors
          {active
            ? 'font-medium text-primary bg-primary/10'
            : 'text-muted-foreground hover:text-foreground'}"
        style:padding-left="{0.5 + depth * 0.75}rem"
      >
        {entry.title}
      </a>
    {:else}
      {@const subActive = entry.slug && $page.url.pathname === `/docs/${entry.slug}`}
      <Collapsible open={isSubgroupActive(entry, $page.url.pathname)} class="mt-0.5">
        {#snippet trigger()}
          {#if entry.slug}
            <a
              href="/docs/{entry.slug}"
              class="text-[13px] font-medium transition-colors
                {subActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
              style:padding-left="{0.5 + depth * 0.75}rem"
              onclick={(e) => e.stopPropagation()}
            >
              {entry.label}
            </a>
          {:else}
            <span
              class="text-[13px] font-medium text-muted-foreground"
              style:padding-left="{0.5 + depth * 0.75}rem"
            >
              {entry.label}
            </span>
          {/if}
        {/snippet}
        <div class="mt-0.5">
          {@render renderEntries(entry.items, depth + 1)}
        </div>
      </Collapsible>
    {/if}
  {/each}
{/snippet}

<div class="flex h-full flex-col">
  <!-- Header: logo (hidden when TopBar handles it) -->
  {#if !hasSections}
  <div class="flex h-14 shrink-0 items-center px-4 lg:px-6">
    <a href="/" class="flex items-center gap-2">
      {#if config.logo.light || config.logo.dark}
        <img src={config.logo.light} alt="" class="h-5 w-5 dark:hidden" />
        <img src={config.logo.dark || config.logo.light} alt="" class="hidden h-5 w-5 dark:block" />
      {/if}
      <span class="text-sm font-semibold">{config.title}</span>
    </a>
  </div>
  {/if}

  <!-- Search -->
  <div class="px-4 pb-4 lg:px-6">
    <button onclick={onSearchClick} class="flex h-8 w-full items-center gap-2 rounded-md border bg-muted/40 px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 opacity-60">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </svg>
      <span class="flex-1 text-left">Search</span>
      <div class="flex items-center gap-0.5">
        <kbd class="rounded border bg-background px-1 font-mono text-[10px] text-muted-foreground">⌘</kbd>
        <kbd class="rounded border bg-background px-1 font-mono text-[10px] text-muted-foreground">K</kbd>
      </div>
    </button>
  </div>

  <!-- Nav groups -->
  <nav class="flex-1 overflow-y-auto overscroll-contain px-4 pb-4 lg:px-6">
    {#each groups as group}
      <Collapsible class="mb-5">
        {#snippet trigger()}
          <h4 class="text-sm font-medium text-foreground">
            {group.label}
          </h4>
        {/snippet}
        <div class="mt-1 space-y-0.5">
          {@render renderEntries(group.items, 0)}
        </div>
      </Collapsible>
    {/each}
  </nav>

  <!-- Bottom bar (hidden when TopBar handles theme toggle) -->
  {#if !hasSections}
  <div class="flex shrink-0 items-center gap-2 border-t px-4 py-3 lg:px-6">
    <div class="flex-1"></div>
    <button
      onclick={toggleTheme}
      class="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label="Toggle dark mode"
    >
      <svg class="h-3.5 w-3.5 dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path>
        <path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path>
        <path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path>
        <path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path>
        <path d="m19.07 4.93-1.41 1.41"></path>
      </svg>
      <svg class="hidden h-3.5 w-3.5 dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    </button>
  </div>
  {/if}
</div>
