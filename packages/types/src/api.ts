export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    fields?: Record<string, string[]>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  hasNext: boolean
}

export interface PresignedUrlResponse {
  uploadUrl: string
  publicUrl: string
  key: string
}

// Talent search query params
export interface TalentSearchParams {
  category?: string
  gender?: string
  ageMin?: number
  ageMax?: number
  city?: string
  heightMin?: number
  heightMax?: number
  skinTone?: string
  hairColour?: string
  eyeColour?: string
  skills?: string[]
  experienceLevel?: string
  ratingMin?: number
  sortBy?: 'rating' | 'jobs_completed' | 'newest'
  page?: number
  limit?: number
}

// Job search query params
export interface JobSearchParams {
  category?: string
  city?: string
  dateFrom?: string
  dateTo?: string
  rateMin?: number
  rateMax?: number
  paymentType?: 'fixed' | 'hourly'
  page?: number
  limit?: number
}
