<script lang="ts">
  import { page } from "$app/stores"
  import { SheetContent } from "$lib/components/ui/sheet/index.js"
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js"
  import { Collapsible } from "$lib/components/ui/collapsible/index.js"
  import type { ResolvedConfig } from "../../config.js"
  import type { SidebarGroup, SidebarEntry, SidebarSubgroup } from "../../types.js"

  let { config, sidebar = [], onSearchClick, locale }: { config: ResolvedConfig; sidebar?: SidebarGroup[]; onSearchClick: () => void; locale?: string } = $props()
  let mobileOpen = $state(false)

  function docHref(slug: string): string {
    const prefix = locale ? `/docs/${locale}` : "/docs"
    return slug === "index" ? prefix : `${prefix}/${slug}`
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
</script>

{#snippet renderMobileEntries(entries: SidebarEntry[], depth: number)}
  {#each entries as entry}
    {#if entry.type === "item"}
      <a
        href={docHref(entry.slug)}
        onclick={() => (mobileOpen = false)}
        class="flex items-center gap-1.5 rounded-md py-1.5 text-sm text-muted-foreground hover:text-foreground"
        style:padding-left="{0.5 + depth * 0.75}rem"
      >
        {#if entry.icon}
          <iconify-icon icon={entry.icon.includes(":") ? entry.icon : `lucide:${entry.icon}`} width="14" height="14" class="shrink-0"></iconify-icon>
        {/if}
        {entry.title}
      </a>
    {:else}
      {@const subActive = entry.slug && $page.url.pathname === docHref(entry.slug)}
      <Collapsible open={isSubgroupActive(entry, $page.url.pathname)} class="mt-0.5">
        {#snippet trigger()}
          {#if entry.slug}
            <a
              href={docHref(entry.slug)}
              class="flex items-center gap-1.5 text-sm font-medium transition-colors
                {subActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
              style:padding-left="{0.5 + depth * 0.75}rem"
              onclick={(e: MouseEvent) => { e.stopPropagation(); mobileOpen = false; }}
            >
              {#if entry.icon}
                <iconify-icon icon={entry.icon.includes(":") ? entry.icon : `lucide:${entry.icon}`} width="14" height="14" class="shrink-0"></iconify-icon>
              {/if}
              {entry.label}
            </a>
          {:else}
            <span
              class="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
              style:padding-left="{0.5 + depth * 0.75}rem"
            >
              {#if entry.icon}
                <iconify-icon icon={entry.icon.includes(":") ? entry.icon : `lucide:${entry.icon}`} width="14" height="14" class="shrink-0"></iconify-icon>
              {/if}
              {entry.label}
            </span>
          {/if}
        {/snippet}
        <div class="mt-0.5">
          {@render renderMobileEntries(entry.items, depth + 1)}
        </div>
      </Collapsible>
    {/if}
  {/each}
{/snippet}

<!-- Mobile-only top bar -->
<header class="sticky top-0 z-50 flex h-14 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
  <button
    onclick={() => (mobileOpen = true)}
    class="mr-3 inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    aria-label="Toggle menu"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"></line>
      <line x1="4" x2="20" y1="6" y2="6"></line>
      <line x1="4" x2="20" y1="18" y2="18"></line>
    </svg>
  </button>

  <a href="/" class="flex items-center gap-2">
    {#if config.logo.light || config.logo.dark}
      <img src={config.logo.light} alt="" class="h-5 w-5 dark:hidden" />
      <img src={config.logo.dark || config.logo.light} alt="" class="hidden h-5 w-5 dark:block" />
    {/if}
    <span class="text-sm font-bold">{config.title}</span>
  </a>
</header>

<!-- Mobile sheet -->
<SheetContent open={mobileOpen} onclose={() => (mobileOpen = false)} side="left">
  <div class="mt-6">
    <ScrollArea class="h-[calc(100vh-8rem)]">
      {#each sidebar as group}
        <div class="mb-4">
          {#if group.slug}
            <a
              href={docHref(group.slug)}
              onclick={() => (mobileOpen = false)}
              class="mb-1 block px-2 text-sm font-semibold text-foreground hover:text-primary transition-colors"
            >{group.label}</a>
          {:else}
            <h4 class="mb-1 px-2 text-sm font-semibold text-foreground">{group.label}</h4>
          {/if}
          <div class="space-y-0.5">
            {@render renderMobileEntries(group.items, 0)}
          </div>
        </div>
      {/each}
    </ScrollArea>
  </div>
</SheetContent>
