# Sidebar & TopBar Icons via Lucide

## Goal

Add optional Lucide icons to sidebar groups, subgroups, items, and TopBar section tabs.

## Icon Specification

Icons are optional at every level, specified by Lucide icon name (kebab-case):

- **Sections (TopBar):** `{ label: "Framework", path: "framework", icon: "book-open" }` in `tiramisu.config.ts`
- **Sidebar groups/subgroups:** `meta { icon = book-open }` in folder's `index.tiramisu`
- **Sidebar items:** `meta { icon = file-text }` in any `.tiramisu` file

## Data Flow

1. **Config** — `SectionConfig` gets `icon?: string`
2. **Core** — `DocMeta` gets `icon?: string`, `extractMeta()` parses it from meta blocks
3. **Vite plugin** — At build time, collects all icon names from docs meta + sections config. Generates explicit `import { BookOpen, FileText } from "lucide-svelte"` in the virtual module. Exports `iconComponents` map: `{ "book-open": BookOpen, "file-text": FileText }`
4. **Components** — `Sidebar.svelte` and `TopBar.svelte` look up icons from the map and render `<svelte:component this={icon} size={16} />` next to labels

## Type Changes

- `SectionConfig`: add `icon?: string`
- `DocMeta`: add `icon?: string`
- `SidebarItem`: add `icon?: string`
- `SidebarSubgroup`: add `icon?: string`
- `SidebarGroup`: add `icon?: string`
- `ResolvedSection`: add `icon?: string`

## Icon Name Convention

Users write kebab-case (`book-open`). The Vite plugin converts to PascalCase (`BookOpen`) for the import. `lucide-svelte` exports PascalCase component names.

## Dependencies

- `lucide-svelte` added to consumer apps (scaffolder generates it in `package.json`, playground gets it directly)
- Virtual module generates imports from `lucide-svelte` which resolve in the consumer's build context

## Documentation

New page: `playground/src/docs/framework/configuration/icons.tiramisu` covering usage and examples, linking to Lucide icon catalog.
