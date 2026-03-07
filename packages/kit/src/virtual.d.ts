declare module "virtual:tiramisu-docs" {
  export const sections: {
    label: string
    path?: string
    href?: string
    children?: typeof sections
    sidebar?: {
      label: string
      items: any[]
    }[]
  }[] | undefined

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
  export const searchIndex: any[]
}
