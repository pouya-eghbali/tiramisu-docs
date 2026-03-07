<script>
  import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
  import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
  import PrevNextNav from "@tiramisu-docs/kit/components/PrevNextNav.svelte"
  import config from "$lib/tiramisu.config"
  import { resolveConfig } from "@tiramisu-docs/kit"

  let { data } = $props()

  const resolved = resolveConfig(config)
</script>

<DocsLayout
  config={resolved}
  sidebar={data.activeSidebar}
  headings={data.headings}
  sections={data.sections}
  locale={data.locale}
  locales={data.locales ? resolved.i18n?.locales?.filter(l => data.locales.includes(l.code)) : undefined}
  showFallbackBanner={data.showFallbackBanner}
>
  <DocPage meta={data.meta}>
    {#if data.component}
      {@const Component = data.component}
      <Component />
    {/if}
  </DocPage>
  <PrevNextNav sidebar={data.activeSidebar} currentSlug={data.slug} locale={data.locale} />
</DocsLayout>
