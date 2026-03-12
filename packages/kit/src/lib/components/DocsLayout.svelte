<script lang="ts">
  import "iconify-icon"
  import TopBar from "./TopBar.svelte"
  import Navbar from "./Navbar.svelte"
  import Sidebar from "./Sidebar.svelte"
  import TableOfContents from "./TableOfContents.svelte"
  import SearchDialog from "./SearchDialog.svelte"
  import PageFooter from "./PageFooter.svelte"
  import { SheetContent } from "$lib/components/ui/sheet/index.js"
  import { ScrollArea } from "$lib/components/ui/scroll-area/index.js"
  import { onMount } from "svelte"
  import type { ResolvedConfig, LocaleConfig } from "../../config.js"
  import type { SidebarGroup, SidebarEntry, ResolvedSection } from "../../types.js"
  import type { Heading } from "@tiramisu-docs/core"
  import type { Snippet } from "svelte"

  let {
    config,
    sidebar,
    headings,
    children,
    sections,
    locale,
    locales,
    showFallbackBanner = false,
  }: { config: ResolvedConfig; sidebar: SidebarGroup[]; headings: Heading[]; children: Snippet; sections?: ResolvedSection[]; locale?: string; locales?: LocaleConfig[]; showFallbackBanner?: boolean } = $props()

  let searchOpen = $state(false)
  let mobileOpen = $state(false)

  const hasSections = $derived(sections != null && sections.length > 0)

  function docHref(slug: string): string {
    const prefix = locale ? `/docs/${locale}` : "/docs"
    if (slug === "index") return prefix
    const clean = slug.replace(/\/index$/, "")
    return `${prefix}/${clean}`
  }

  onMount(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchOpen = !searchOpen
      }
    }
    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  })
</script>

<div class="flex min-h-screen flex-col bg-background text-foreground">
  {#if hasSections}
    <TopBar
      {config}
      {sections}
      {locale}
      {locales}
      onSearchClick={() => (searchOpen = true)}
      onMenuClick={() => (mobileOpen = !mobileOpen)}
    />
  {:else}
    <!-- Legacy mobile navbar -->
    <Navbar {config} {sidebar} onSearchClick={() => (searchOpen = true)} {locale} />
  {/if}

  {#if showFallbackBanner}
    <div class="border-b bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
      This page is not available in the selected language. Showing the default version.
    </div>
  {/if}

  <div class="mx-auto flex w-full flex-1 max-w-[90rem]">
    <!-- Sidebar (desktop) -->
    <aside class="relative hidden w-[15rem] shrink-0 border-r lg:block">
      <div class="absolute inset-0 bg-card" style="left: -100vw; width: calc(100% + 100vw);"></div>
      <div class="relative sticky top-0 h-screen" style:top={hasSections ? "6rem" : "0"} style:height={hasSections ? "calc(100vh - 6rem)" : "100vh"}>
        <Sidebar {config} groups={sidebar} onSearchClick={() => (searchOpen = true)} {hasSections} {locale} {locales} />
      </div>
    </aside>

    <!-- Main content + footer column -->
    <div class="flex min-w-0 flex-1 flex-col">
      <main class="flex-1 px-6 py-10 lg:px-10 xl:px-14">
        <div class="mx-auto max-w-3xl">
          {@render children()}
        </div>
      </main>
      <PageFooter {config} />
    </div>

    <!-- Table of contents -->
    {#if headings?.length}
      <aside class="hidden w-[13rem] shrink-0 xl:block">
        <div class="sticky overflow-y-auto overscroll-contain py-10 pr-6" style:top={hasSections ? "6rem" : "0"} style:height={hasSections ? "calc(100vh - 6rem)" : "100vh"}>
          <TableOfContents {headings} />
        </div>
      </aside>
    {/if}
  </div>
</div>

<SearchDialog bind:open={searchOpen} {locale} />

<!-- Mobile sidebar sheet (used when TopBar is active) -->
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
    {:else if entry.type === "subgroup"}
      <div class="mt-2 mb-1">
        <h5
          class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
          style:padding-left="{0.5 + depth * 0.75}rem"
        >
          {#if entry.icon}
            <iconify-icon icon={entry.icon.includes(":") ? entry.icon : `lucide:${entry.icon}`} width="14" height="14" class="shrink-0"></iconify-icon>
          {/if}
          {entry.label}
        </h5>
        <div class="mt-0.5 space-y-0.5">
          {@render renderMobileEntries(entry.items, depth + 1)}
        </div>
      </div>
    {/if}
  {/each}
{/snippet}

{#if hasSections}
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
{/if}
