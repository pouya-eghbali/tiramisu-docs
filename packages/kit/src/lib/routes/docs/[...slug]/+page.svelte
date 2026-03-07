<script>
  import DocsLayout from "$lib/components/DocsLayout.svelte";
  import DocPage from "$lib/components/DocPage.svelte";

  let { data } = $props();
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
  <DocPage meta={data.meta}>
    <svelte:component this={data.component} />
  </DocPage>
</DocsLayout>
