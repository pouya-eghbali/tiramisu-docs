<script>
  import DocsLayout from "@tiramisu-docs/kit/components/DocsLayout.svelte"
  import DocPage from "@tiramisu-docs/kit/components/DocPage.svelte"
  import { sidebar } from "virtual:tiramisu-docs"
  import config from "../../tiramisu.config"
  import { resolveConfig } from "@tiramisu-docs/kit"

  let { data } = $props()

  const resolved = resolveConfig(config)
  const Component = data.component
</script>

<DocsLayout config={resolved} {sidebar} headings={data.headings}>
  <DocPage meta={data.meta}>
    <Component />
  </DocPage>
</DocsLayout>
