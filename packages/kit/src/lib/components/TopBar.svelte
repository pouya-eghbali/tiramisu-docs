<script>
  import { page } from "$app/stores"

  let { config, sections = [], locale, locales, onSearchClick, onMenuClick } = $props()

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

  function isActiveSection(section, pathname) {
    if (section.path) {
      const prefix = locale ? `/docs/${locale}/${section.path}` : `/docs/${section.path}`
      return pathname.startsWith(prefix)
    }
    if (section.children) {
      return section.children.some((c) => isActiveSection(c, pathname))
    }
    return false
  }

  function sectionHref(section) {
    if (section.href) return section.href
    if (section.path) {
      return locale ? `/docs/${locale}/${section.path}` : `/docs/${section.path}`
    }
    return locale ? `/docs/${locale}` : "/docs"
  }

  $effect(() => {
    initTheme()
  })

  let openDropdown = $state(null)
</script>

<!-- Row 1: logo, hamburger (mobile), search, theme, language -->
<header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="mx-auto flex h-14 max-w-[90rem] items-center gap-4 px-4">
    <!-- Hamburger (mobile only) -->
    <button
      onclick={onMenuClick}
      class="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden"
      aria-label="Toggle menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" x2="20" y1="12" y2="12"></line>
        <line x1="4" x2="20" y1="6" y2="6"></line>
        <line x1="4" x2="20" y1="18" y2="18"></line>
      </svg>
    </button>

    <!-- Logo + title -->
    <a href="/" class="flex items-center gap-2">
      {#if config.logo.light || config.logo.dark}
        <img src={config.logo.light} alt="" class="h-5 w-5 dark:hidden" />
        <img src={config.logo.dark || config.logo.light} alt="" class="hidden h-5 w-5 dark:block" />
      {/if}
      <span class="text-sm font-bold">{config.title}</span>
    </a>

    <div class="flex-1"></div>

    <!-- Right side: search, language, theme -->
    <button
      onclick={onSearchClick}
      class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      aria-label="Search"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.3-4.3"></path>
      </svg>
    </button>

    {#if locales?.length > 1}
      <div class="relative">
        <button
          onclick={() => (openDropdown = openDropdown === "lang" ? null : "lang")}
          class="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          {#each locales as loc}
            {#if loc.code === locale}
              {loc.flag ?? ""} {loc.label}
            {/if}
          {/each}
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
        </button>
        {#if openDropdown === "lang"}
          <div class="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-md border bg-popover p-1 shadow-md">
            {#each locales as loc}
              {@const currentPath = $page.url.pathname}
              {@const newPath = currentPath.replace(`/docs/${locale}`, `/docs/${loc.code}`)}
              <a
                href={newPath}
                onclick={() => (openDropdown = null)}
                class="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent
                  {loc.code === locale ? 'font-medium text-foreground' : 'text-muted-foreground'}"
              >
                {#if loc.flag}<span>{loc.flag}</span>{/if}
                {loc.label}
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <button
      onclick={toggleTheme}
      class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      aria-label="Toggle dark mode"
    >
      <svg class="h-4 w-4 dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2"></path><path d="M12 20v2"></path>
        <path d="m4.93 4.93 1.41 1.41"></path><path d="m17.66 17.66 1.41 1.41"></path>
        <path d="M2 12h2"></path><path d="M20 12h2"></path>
        <path d="m6.34 17.66-1.41 1.41"></path><path d="m19.07 4.93-1.41 1.41"></path>
      </svg>
      <svg class="hidden h-4 w-4 dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
    </button>
  </div>

  <!-- Row 2: section tabs (scrollable) -->
  {#if sections?.length > 0}
    <nav class="scrollbar-none mx-auto flex max-w-[90rem] items-center gap-1 overflow-x-auto px-4">
      {#each sections as section}
        {#if section.children}
          <!-- Dropdown section -->
          <div class="relative">
            <button
              onclick={() => (openDropdown = openDropdown === section.label ? null : section.label)}
              class="flex shrink-0 items-center gap-1 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors
                {isActiveSection(section, $page.url.pathname)
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'}"
            >
              {section.label}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
            </button>
            {#if openDropdown === section.label}
              <div class="absolute left-0 top-full z-50 mt-0.5 min-w-[10rem] rounded-md border bg-popover p-1 shadow-md">
                {#each section.children as child}
                  <a
                    href={sectionHref(child)}
                    onclick={() => (openDropdown = null)}
                    class="block rounded-sm px-3 py-1.5 text-sm hover:bg-accent
                      {isActiveSection(child, $page.url.pathname) ? 'font-medium text-foreground' : 'text-muted-foreground'}"
                  >
                    {child.label}
                  </a>
                {/each}
              </div>
            {/if}
          </div>
        {:else if section.href}
          <!-- External link -->
          <a
            href={section.href}
            target="_blank"
            rel="noopener noreferrer"
            class="flex shrink-0 items-center gap-1 border-b-2 border-transparent px-3 py-2 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground"
          >
            {section.label}
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" x2="21" y1="14" y2="3"></line></svg>
          </a>
        {:else}
          <!-- Path section -->
          <a
            href={sectionHref(section)}
            class="shrink-0 border-b-2 px-3 py-2 text-sm whitespace-nowrap transition-colors
              {isActiveSection(section, $page.url.pathname)
                ? 'border-primary text-foreground font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'}"
          >
            {section.label}
          </a>
        {/if}
      {/each}
    </nav>
  {/if}
</header>

<svelte:window onclick={(e) => {
  if (openDropdown && !e.target.closest('.relative')) openDropdown = null
}} />

<style>
  .scrollbar-none {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
</style>
