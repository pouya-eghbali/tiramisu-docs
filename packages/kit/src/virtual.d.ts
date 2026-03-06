declare module "virtual:tiramisu-docs" {
  export const sidebar: {
    label: string
    items: { title: string; slug: string; order: number }[]
  }[]
  export const docs: {
    slug: string
    meta: { title?: string; description?: string; order?: number; group?: string }
    headings: { level: number; text: string; id: string }[]
  }[]
  export const docImports: Record<string, () => Promise<{ default: any }>>
}
