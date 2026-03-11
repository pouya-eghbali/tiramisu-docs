import type { DocMeta, Heading } from "@tiramisu-docs/core"
import type { SvelteComponent } from "svelte"

export interface SidebarItem {
  type: "item"
  title: string
  slug: string
  order: number
  icon?: string
}

export interface SidebarSubgroup {
  type: "subgroup"
  key: string
  label: string
  slug?: string
  items: SidebarEntry[]
  order: number
  icon?: string
}

export type SidebarEntry = SidebarItem | SidebarSubgroup

export interface SidebarGroup {
  label: string
  items: SidebarEntry[]
  icon?: string
}

export interface VirtualDoc {
  slug: string
  meta: DocMeta
  headings: Heading[]
  lastEdited?: string
}

export interface SearchIndexEntry {
  id: string
  title: string
  group: string
  slug: string
  headings: string
  text: string
}

export interface ResolvedSection {
  label: string
  path?: string
  href?: string
  icon?: string
  children?: ResolvedSection[]
  sidebar?: SidebarGroup[]
}

export interface LocaleData {
  sections?: ResolvedSection[]
  sidebar: SidebarGroup[]
  docs: VirtualDoc[]
  searchIndex: SearchIndexEntry[]
  docImports: Record<string, () => Promise<{ default: typeof SvelteComponent }>>
}

export interface VirtualModule {
  docs: VirtualDoc[]
  sidebar: SidebarGroup[]
  sections?: ResolvedSection[]
  docImports: Record<string, () => Promise<{ default: typeof SvelteComponent }>>
  searchIndex: SearchIndexEntry[]
  locales?: Record<string, LocaleData>
  defaultLocale?: string
}
