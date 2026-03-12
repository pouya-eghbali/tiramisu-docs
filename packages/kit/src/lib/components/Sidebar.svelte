<script lang="ts">
  import { page } from "$app/stores"
  import { Collapsible } from "$lib/components/ui/collapsible/index.js"
  import type { ResolvedConfig, LocaleConfig } from "../../config.js"
  import type { SidebarGroup, SidebarEntry, SidebarSubgroup } from "../../types.js"

  let { config, groups, locale, locales }: { config: ResolvedConfig; groups: SidebarGroup[]; locale?: string; locales?: LocaleConfig[] } = $props()

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


</div>
