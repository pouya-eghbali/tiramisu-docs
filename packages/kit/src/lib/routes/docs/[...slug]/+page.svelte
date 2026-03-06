<script>
  import DocsLayout from "$lib/components/DocsLayout.svelte";
  import DocPage from "$lib/components/DocPage.svelte";
  import { sidebar } from "virtual:tiramisu-docs";

  let { data } = $props();
</script>

<DocsLayout config={data.config} {sidebar} headings={data.headings}>
  <DocPage meta={data.meta}>
    <svelte:component this={data.component} />
  </DocPage>
</DocsLayout>
