export interface DocMeta {
  title?: string
  description?: string
  order?: number
  group?: string
}

export interface CompileResult {
  meta: DocMeta
  svelte: string
  headings: Heading[]
}

export interface Heading {
  level: number
  text: string
  id: string
}
