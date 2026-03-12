<script lang="ts">
  import { DocsLayout, DocPage, PrevNextNav } from "$lib/components"
  import OpenDropdown from "$lib/components/OpenDropdown.svelte"
  import config from "$lib/tiramisu.config"
  import { resolveConfig, getOpenLinks } from "@tiramisu-docs/kit"
  import type { LocaleConfig } from "@tiramisu-docs/kit"

  let { data }: { data: Record<string, any> } = $props()

  let mdCopied = $state(false)

  async function copyMarkdown() {
    if (!data.markdown) return
    await navigator.clipboard.writeText(data.markdown)
    mdCopied = true
    setTimeout(() => (mdCopied = false), 2000)
  }

  const resolved = resolveConfig(config)
  const links = $derived(
    resolved.url && data.slug
      ? getOpenLinks({ baseUrl: resolved.url, slug: data.slug, locale: data.locale, github: resolved.github, mcp: resolved.mcp, title: resolved.title })
      : []
  )
</script>

<DocsLayout
  config={resolved}
  sidebar={data.activeSidebar}
  headings={data.headings}
  sections={data.sections}
  locale={data.locale}
  locales={data.locales ? resolved.i18n?.locales?.filter((l: LocaleConfig) => data.locales.includes(l.code)) : undefined}
  showFallbackBanner={data.showFallbackBanner}
>
  <DocPage meta={data.meta} lastEdited={data.lastEdited} slug={data.slug} baseUrl={resolved.url} sidebar={data.activeSidebar} siteName={resolved.title} instantOg={resolved.instantOg}>
    {#snippet headerActions()}
      <div class="flex items-center gap-2">
        {#if data.markdown}
          <button
            onclick={copyMarkdown}
            class="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Copy page as Markdown"
          >
            {#if mdCopied}
              <iconify-icon icon="lucide:check" width="14" height="14" class="text-green-500"></iconify-icon>
              Copied
            {:else}
              <iconify-icon icon="lucide:clipboard" width="14" height="14"></iconify-icon>
              Copy MD
            {/if}
          </button>
        {/if}
        <OpenDropdown {links} />
      </div>
    {/snippet}
    {#if data.component}
      {@const Component = data.component}
      <Component />
    {/if}
  </DocPage>
  <PrevNextNav sidebar={data.activeSidebar} currentSlug={data.slug} locale={data.locale} />
</DocsLayout>
