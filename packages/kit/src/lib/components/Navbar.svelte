<script>
  let { config } = $props()
</script>

<header class="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
  <nav class="container mx-auto flex h-14 items-center gap-6 px-4">
    <a href="/" class="flex items-center gap-2 font-semibold">
      {#if config.logo}
        <img src={config.logo} alt="" class="h-6 w-6" />
      {/if}
      {config.title}
    </a>
    <div class="flex-1"></div>
    {#each config.nav as link}
      <a href={link.href} class="text-sm text-muted-foreground hover:text-foreground transition-colors">
        {link.label}
      </a>
    {/each}
  </nav>
</header>
