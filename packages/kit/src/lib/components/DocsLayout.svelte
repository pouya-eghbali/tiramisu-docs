<script>
  import Navbar from "./Navbar.svelte"
  import Sidebar from "./Sidebar.svelte"
  import TableOfContents from "./TableOfContents.svelte"

  let { config, sidebar, headings, children } = $props()
</script>

<div class="min-h-screen bg-background text-foreground">
  <Navbar {config} />
  <div class="container mx-auto flex gap-8 px-4 py-8">
    <aside class="hidden w-64 shrink-0 lg:block">
      <Sidebar groups={sidebar} />
    </aside>
    <main class="min-w-0 flex-1">
      {@render children()}
    </main>
    {#if headings?.length}
      <aside class="hidden w-48 shrink-0 xl:block">
        <TableOfContents {headings} />
      </aside>
    {/if}
  </div>
</div>
