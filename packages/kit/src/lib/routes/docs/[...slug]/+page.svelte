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
>
  <DocPage meta={data.meta}>
    <svelte:component this={data.component} />
  </DocPage>
</DocsLayout>
