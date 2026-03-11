<script lang="ts">
  import { DocsLayout, DocPage } from "$lib/components";

  let { data }: { data: Record<string, any> } = $props();
</script>

<DocsLayout
  config={data.config}
  sidebar={data.activeSidebar}
  headings={data.headings}
  sections={data.sections}
  locale={data.locale}
  locales={data.locales}
  showFallbackBanner={data.showFallbackBanner}
>
  <DocPage
    meta={data.meta}
    lastEdited={data.lastEdited}
    slug={data.slug}
    baseUrl={data.config?.url}
    sidebar={data.activeSidebar}
    siteName={data.config?.title}
  >
    <svelte:component this={data.component} />
  </DocPage>
</DocsLayout>
