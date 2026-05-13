// Lightweight shared shapes for service-layer pagination + meta.

export interface PaginatedMeta {
  nextCursor?: string | null
  total?: number
  page?: number
  limit?: number
  hasNext?: boolean
}

export interface Init {
  signal?: AbortSignal
}
