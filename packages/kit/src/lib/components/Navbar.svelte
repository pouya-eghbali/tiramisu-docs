<script>
  import { page } from "$app/stores"
  import { SheetContent } from "./ui/sheet/index.js"
  import { ScrollArea } from "./ui/scroll-area/index.js"
  import { Collapsible } from "./ui/collapsible/index.js"

  let { config, sidebar = [], onSearchClick, locale } = $props()
  let mobileOpen = $state(false)

  function docHref(slug) {
    const prefix = locale ? `/docs/${locale}` : "/docs"
    return slug === "index" ? prefix : `${prefix}/${slug}`
  }

  function isSubgroupActive(entry, pathname) {
    if (entry.slug) {
      const href = docHref(entry.slug)
      if (pathname === href) return true
    }
    return hasActiveDescendant(entry.items, pathname)
  }

  function hasActiveDescendant(items, pathname) {
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

{#snippet renderMobileEntries(entries, depth)}
  {#each entries as entry}
    {#if entry.type === "item"}
      <a
        href={docHref(entry.slug)}
        onclick={() => (mobileOpen = false)}
        class="block rounded-md py-1.5 text-sm text-muted-foreground hover:text-foreground"
        style:padding-left="{0.5 + depth * 0.75}rem"
      >
        {entry.title}
      </a>
    {:else}
      {@const subActive = entry.slug && $page.url.pathname === docHref(entry.slug)}
      <Collapsible open={isSubgroupActive(entry, $page.url.pathname)} class="mt-0.5">
        {#snippet trigger()}
          {#if entry.slug}
            <a
              href={docHref(entry.slug)}
              class="text-sm font-medium transition-colors
                {subActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
              style:padding-left="{0.5 + depth * 0.75}rem"
              onclick={(e) => { e.stopPropagation(); mobileOpen = false; }}
            >
              {entry.label}
            </a>
          {:else}
            <span
              class="text-sm font-medium text-muted-foreground"
              style:padding-left="{0.5 + depth * 0.75}rem"
            >
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
          <h4 class="mb-1 px-2 text-sm font-semibold text-foreground">{group.label}</h4>
          <div class="space-y-0.5">
            {@render renderMobileEntries(group.items, 0)}
          </div>
        </div>
      {/each}
    </ScrollArea>
  </div>
</SheetContent>
