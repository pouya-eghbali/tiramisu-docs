<script>
  import TopBar from "./TopBar.svelte"
  import Navbar from "./Navbar.svelte"
  import Sidebar from "./Sidebar.svelte"
  import TableOfContents from "./TableOfContents.svelte"
  import SearchDialog from "./SearchDialog.svelte"
  import { SheetContent } from "./ui/sheet/index.js"
  import { ScrollArea } from "./ui/scroll-area/index.js"
  import { onMount } from "svelte"

  let {
    config,
    sidebar,
    headings,
    children,
    sections,
    locale,
    locales,
    showFallbackBanner = false,
  } = $props()

  let searchOpen = $state(false)
  let mobileOpen = $state(false)

  const hasSections = $derived(sections != null && sections.length > 0)

  onMount(() => {
    function handleKeydown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        searchOpen = !searchOpen
      }
    }
    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  })
</script>

<div class="min-h-screen bg-background text-foreground">
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

  <div class="mx-auto flex max-w-[90rem]">
    <!-- Sidebar (desktop) -->
    <aside class="relative hidden w-[15rem] shrink-0 border-r lg:block">
      <div class="absolute inset-0 bg-card" style="left: -100vw; width: calc(100% + 100vw);"></div>
      <div class="relative sticky top-0 h-screen" style:top={hasSections ? "6rem" : "0"} style:height={hasSections ? "calc(100vh - 6rem)" : "100vh"}>
        <Sidebar {config} groups={sidebar} onSearchClick={() => (searchOpen = true)} {hasSections} {locale} />
      </div>
    </aside>

    <!-- Main content area -->
    <main class="min-w-0 flex-1 px-6 py-10 lg:px-10 xl:px-14">
      <div class="mx-auto max-w-3xl">
        {@render children()}
      </div>
    </main>

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
{#if hasSections}
  <SheetContent open={mobileOpen} onclose={() => (mobileOpen = false)} side="left">
    <div class="mt-6">
      <ScrollArea class="h-[calc(100vh-8rem)]">
        {#each sidebar as group}
          <div class="mb-4">
            <h4 class="mb-1 px-2 text-sm font-semibold text-foreground">{group.label}</h4>
            <div class="space-y-0.5">
              {#each group.items as entry}
                {#if entry.type === "item"}
                  <a
                    href={entry.slug === "index" ? (locale ? `/docs/${locale}` : "/docs") : (locale ? `/docs/${locale}/${entry.slug}` : `/docs/${entry.slug}`)}
                    onclick={() => (mobileOpen = false)}
                    class="block rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {entry.title}
                  </a>
                {/if}
              {/each}
            </div>
          </div>
        {/each}
      </ScrollArea>
    </div>
  </SheetContent>
{/if}
