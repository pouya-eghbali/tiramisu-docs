<script lang="ts">
  import type { DocMeta } from "@tiramisu-docs/core"
  import type { Snippet } from "svelte"
  import type { SidebarGroup, SidebarEntry } from "../../types.js"
  import type { InstantOgConfig } from "../../config.js"

  let {
    meta,
    children,
    slug = undefined,
    baseUrl = undefined,
    lastEdited = undefined,
    headerActions = undefined,
    sidebar = [],
    siteName = undefined,
    instantOg = undefined,
  }: { meta: DocMeta; children: Snippet; slug?: string; baseUrl?: string; lastEdited?: string; headerActions?: Snippet; sidebar?: SidebarGroup[]; siteName?: string; instantOg?: InstantOgConfig } = $props();

  function findGroup(sidebar: SidebarGroup[], slug: string): string | null {
    for (const group of sidebar) {
      for (const entry of group.items) {
        if (entry.type === "item" && entry.slug === slug) return group.label;
        if (entry.type === "subgroup") {
          if (entry.slug === slug) return group.label;
          for (const child of entry.items) {
            if (child.type === "item" && child.slug === slug)
              return entry.label;
          }
        }
      }
    }
    return null;
  }

  const groupName = $derived(
    slug && sidebar.length ? findGroup(sidebar, slug) : null,
  );

  function timeAgo(iso: string): string {
    const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? "" : "s"} ago`;
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  import { buildPageJsonLd, buildCanonicalUrl, buildInstantOgUrl } from "../../seo.js";

  const canonicalUrl = $derived(slug && baseUrl ? buildCanonicalUrl(baseUrl, slug) : null);

  const explicitImage = $derived(
    meta?.image && baseUrl && !meta.image.startsWith("http")
      ? `${baseUrl.replace(/\/+$/, "")}${meta.image.startsWith("/") ? "" : "/"}${meta.image}`
      : meta?.image ?? null
  );

  const imageUrl = $derived(
    explicitImage
      ?? (instantOg && canonicalUrl
        ? buildInstantOgUrl(canonicalUrl, { siteId: instantOg.siteId, template: instantOg.template, theme: instantOg.theme, accentColor: instantOg.accentColor, gradientBg: instantOg.gradientBg })
        : null)
  );

  const jsonLd = $derived(
    slug && baseUrl
      ? buildPageJsonLd({
          title: meta?.title ?? slug,
          slug,
          baseUrl,
          description: meta?.description,
          lastEdited,
          siteName,
          image: imageUrl ?? undefined,
          author: meta?.author,
        })
      : null
  );
</script>

<svelte:head>
  {#if meta?.title}
    <title>{siteName ? `${meta.title} | ${siteName}` : meta.title}</title>
    <meta property="og:title" content={meta.title} />
    <meta name="twitter:title" content={meta.title} />
  {/if}
  {#if meta?.description}
    <meta name="description" content={meta.description} />
    <meta property="og:description" content={meta.description} />
    <meta name="twitter:description" content={meta.description} />
  {/if}
  {#if siteName}
    <meta property="og:site_name" content={siteName} />
  {/if}
  <meta property="og:type" content="article" />
  <meta name="twitter:card" content={imageUrl ? "summary_large_image" : "summary"} />
  {#if imageUrl}
    <meta property="og:image" content={imageUrl} />
    <meta name="twitter:image" content={imageUrl} />
  {/if}
  {#if canonicalUrl}
    <link rel="canonical" href={canonicalUrl} />
    <meta property="og:url" content={canonicalUrl} />
  {/if}
  {#if jsonLd}
    {@html `<script type="application/ld+json">${jsonLd}</script>`}
  {/if}
</svelte:head>

<article class="doc-content">
  {#if meta?.title}
    <div class="mb-10 border-b pb-8">
      {#if groupName}
        <p
          class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70"
        >
          {groupName}
        </p>
      {/if}
      <div class="flex items-start justify-between gap-4">
        <h1
          class="flex items-center gap-3 text-3xl font-bold tracking-tight text-foreground lg:text-4xl"
        >
          {#if meta.icon}
            <iconify-icon icon={meta.icon.includes(":") ? meta.icon : `lucide:${meta.icon}`} width="32" height="32" class="shrink-0 text-muted-foreground"></iconify-icon>
          {/if}
          {meta.title}
        </h1>
        {#if headerActions}
          {@render headerActions()}
        {/if}
      </div>
      {#if meta?.description}
        <p class="mt-3 text-lg text-muted-foreground">
          {meta.description}
        </p>
      {/if}
    </div>
  {/if}

  {#key meta?.title}
    <div class="doc-body doc-animate">
      {@render children()}
    </div>
  {/key}

  {#if lastEdited || meta?.author}
    <div class="mt-10 flex items-center gap-2 pt-4 text-sm text-muted-foreground">
      {#if meta?.author}
        <span>{meta.author}</span>
      {/if}
      {#if meta?.author && lastEdited}
        <span class="text-border">·</span>
      {/if}
      {#if lastEdited}
        <time
          datetime={lastEdited}
          title={formatDate(lastEdited)}
        >
          Last edited {timeAgo(lastEdited)}
        </time>
      {/if}
    </div>
  {/if}
</article>
