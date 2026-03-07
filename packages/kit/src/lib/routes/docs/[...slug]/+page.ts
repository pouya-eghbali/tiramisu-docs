import { error } from "@sveltejs/kit";

export async function load({ params }: { params: { slug?: string } }) {
  const slug = params.slug || "index";
  const { docImports, docs, sections, sidebar } = await import("virtual:tiramisu-docs");
  const importFn = docImports[slug];
  if (!importFn) throw error(404, "Page not found");

  const component = await importFn();
  const doc = (docs as any[]).find((d) => d.slug === slug);

  // Determine active section sidebar
  let activeSidebar = sidebar;
  if (sections) {
    activeSidebar = findActiveSectionSidebar(sections, slug) ?? sidebar;
  }

  return {
    component: component.default ?? component,
    meta: doc?.meta ?? {},
    headings: doc?.headings ?? [],
    slug,
    sections: sections ?? undefined,
    activeSidebar,
  };
}

function findActiveSectionSidebar(sections: any[], slug: string): any[] | null {
  for (const section of sections) {
    if (section.path && (slug === section.path || slug.startsWith(section.path + "/"))) {
      return section.sidebar;
    }
    if (section.children) {
      const found = findActiveSectionSidebar(section.children, slug);
      if (found) return found;
    }
  }
  // Fallback to implicit section (first section without a path)
  if (sections.length > 0 && sections[0].sidebar && !sections[0].path) {
    return sections[0].sidebar;
  }
  return null;
}
