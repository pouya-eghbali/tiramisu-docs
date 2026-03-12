<script lang="ts">
  import { page } from "$app/stores"
  import { Collapsible } from "$lib/components/ui/collapsible/index.js"
  import type { ResolvedConfig, LocaleConfig } from "../../config.js"
  import type { SidebarGroup, SidebarEntry, SidebarSubgroup } from "../../types.js"

  let { config, groups, onSearchClick, hasSections = false, locale, locales }: { config: ResolvedConfig; groups: SidebarGroup[]; onSearchClick: () => void; hasSections?: boolean; locale?: string; locales?: LocaleConfig[] } = $props()

  let dark = $state(false)
  let navEl: HTMLElement | null = $state(null)
  let canScrollUp = $state(false)
  let canScrollDown = $state(false)

  function updateScroll() {
    if (!navEl) return
    const threshold = 4
    canScrollUp = navEl.scrollTop > threshold
    canScrollDown = navEl.scrollTop + navEl.clientHeight < navEl.scrollHeight - threshold
  }

  function docHref(slug: string): string {
    const prefix = locale ? `/docs/${locale}` : "/docs"
    if (slug === "index") return prefix
    const clean = slug.replace(/\/index$/, "")
    return `${prefix}/${clean}`
  }

  function initTheme() {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("theme")
    dark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    document.documentElement.classList.toggle("dark", dark)
  }

  function toggleTheme() {
    if (typeof window === "undefined") return
    dark = !dark
    document.documentElement.classList.toggle("dark", dark)
    window.localStorage.setItem("theme", dark ? "dark" : "light")
  }

  function isSubgroupActive(entry: SidebarSubgroup, pathname: string): boolean {
    if (entry.slug) {
      const href = docHref(entry.slug)
      if (pathname === href) return true
    }
    return hasActiveDescendant(entry.items, pathname)
  }

  function hasActiveDescendant(items: SidebarEntry[], pathname: string): boolean {
    for (const entry of items) {
      if (entry.type === "item") {
        const href = docHref(entry.slug)
        if (pathname === href) return true
      } else if (entry.type === "subgroup") {
        if (isSubgroupActive(entry, pathname)) return true
      }
    }
    return false
  }

  $effect(() => {
    initTheme()
    updateScroll()
  })
</script>

{#snippet renderEntries(entries: SidebarEntry[], depth: number)}
  {#each entries as entry}
    {#if entry.type === "item"}
      {@const href = docHref(entry.slug)}
      {@const active = $page.url.pathname === href}
      <a
        {href}
        class="flex items-center gap-1.5 rounded-md py-[5px] text-[13px] transition-colors
          {active
            ? 'font-medium text-primary bg-primary/10'
            : 'text-muted-foreground hover:text-foreground'}"
        style:padding-left="{0.5 + depth * 0.75}rem"
      >
        {#if entry.icon}
          <iconify-icon icon={entry.icon.includes(":") ? entry.icon : `lucide:${entry.icon}`} width="14" height="14" class="shrink-0"></iconify-icon>
        {/if}
        {entry.title}
      </a>
    {:else}
      {@const subActive = entry.slug && $page.url.pathname === docHref(entry.slug)}
      <Collapsible
        open={isSubgroupActive(entry, $page.url.pathname)}
        href={entry.slug ? docHref(entry.slug) : undefined}
        class="mt-0.5"
        triggerClass="rounded-md py-[5px] pr-2 transition-colors {subActive ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}"
      >
        {#snippet trigger()}
          <span
            class="flex w-full items-center gap-1.5 text-[13px] font-medium"
            style:padding-left="{0.5 + depth * 0.75}rem"
          >
            {#if entry.icon}
              <iconify-icon icon={entry.icon.includes(":") ? entry.icon : `lucide:${entry.icon}`} width="14" height="14" class="shrink-0"></iconify-icon>
            {/if}
            {entry.label}
          </span>
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
  <div class="flex h-14 shrink-0 items-center px-4">
    <a href="/" class="flex items-center gap-2">
      {#if config.logo.light || config.logo.dark}
        <img src={config.logo.light} alt="" class="h-5 w-5 dark:hidden" />
        <img src={config.logo.dark || config.logo.light} alt="" class="hidden h-5 w-5 dark:block" />
      {/if}
      <span class="text-sm font-semibold">{config.title}</span>
    </a>
  </div>
  {/if}

  <!-- Search (hidden when TopBar has it) -->
  {#if !hasSections}
  <div class="px-4 pb-4">
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
  {/if}

  <!-- Nav groups -->
  <div class="relative flex-1 overflow-hidden">
    <nav
      bind:this={navEl}
      onscroll={updateScroll}
      class="h-full overflow-y-auto overscroll-contain px-4 pt-4 pb-4"
    >
      {#each groups as group}
        <div class="mb-5">
          {#if group.slug}
            {@const href = docHref(group.slug)}
            {@const active = $page.url.pathname === href}
            <a {href} class="flex items-center gap-1.5 pl-2 text-[11px] font-semibold uppercase tracking-wider transition-colors
              {active ? 'text-primary' : 'text-muted-foreground/70 hover:text-muted-foreground'}">
              {#if group.icon}
                <iconify-icon icon={group.icon.includes(":") ? group.icon : `lucide:${group.icon}`} width="14" height="14" class="shrink-0"></iconify-icon>
              {/if}
              {group.label}
            </a>
          {:else}
            <h4 class="flex items-center gap-1.5 pl-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {#if group.icon}
                <iconify-icon icon={group.icon.includes(":") ? group.icon : `lucide:${group.icon}`} width="14" height="14" class="shrink-0"></iconify-icon>
              {/if}
              {group.label}
            </h4>
          {/if}
          <div class="mt-1 space-y-0.5">
            {@render renderEntries(group.items, 0)}
          </div>
        </div>
      {/each}
    </nav>

    {#if canScrollUp}
      <div class="pointer-events-none absolute inset-x-0 top-0 flex justify-center items-center h-12 bg-gradient-to-b from-background to-transparent">
        <button
          onclick={() => navEl?.scrollTo({ top: 0, behavior: "smooth" })}
          class="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </button>
      </div>
    {/if}

    {#if canScrollDown}
      <div class="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center items-center h-12 bg-gradient-to-t from-background to-transparent">
        <button
          onclick={() => navEl?.scrollTo({ top: navEl.scrollHeight, behavior: "smooth" })}
          class="pointer-events-auto flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Scroll to bottom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>
    {/if}
  </div>

  <!-- Bottom bar (hidden when TopBar handles theme toggle) -->
  {#if !hasSections}
  <div class="flex shrink-0 items-center gap-2 border-t px-4 py-3">
    {#if locales?.length > 1}
      <select
        class="h-7 rounded-md border bg-background px-1.5 text-xs text-muted-foreground"
        onchange={(e: Event & { currentTarget: HTMLSelectElement }) => {
          const loc = e.currentTarget.value
          const currentPath = window.location.pathname
          const newPath = locale
            ? currentPath.replace(`/docs/${locale}`, `/docs/${loc}`)
            : currentPath.replace("/docs", `/docs/${loc}`)
          window.location.href = newPath
        }}
      >
        {#each locales as loc}
          <option value={loc.code} selected={loc.code === locale}>
            {loc.flag ? loc.flag + " " : ""}{loc.label}
          </option>
        {/each}
      </select>
    {/if}
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
