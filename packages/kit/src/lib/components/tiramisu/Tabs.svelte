<script>
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs/index.js"

  let { tabs = [], children } = $props()
</script>

<Tabs value={tabs[0]?.label ?? ""} class="my-4">
  <TabsList>
    {#each tabs as tab}
      <TabsTrigger value={tab.label}>{tab.label}</TabsTrigger>
    {/each}
  </TabsList>
  {#each tabs as tab}
    <TabsContent value={tab.label}>
      {@html tab.content}
    </TabsContent>
  {/each}
  {#if children}
    {@render children()}
  {/if}
</Tabs>
