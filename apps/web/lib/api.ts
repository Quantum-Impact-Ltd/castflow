import axios, { type AxiosResponse } from 'axios'

interface ApiErrorEnvelope {
  error?: { code: string; message: string; fields?: Record<string, string[]> }
}

export const api = axios.create({
  baseURL: `${process.env['NEXT_PUBLIC_API_URL']}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Unwrap the API envelope so callers receive `data` directly, not the AxiosResponse.
// Axios's typed interceptor expects an AxiosResponse return shape; cast through `never`
// because we are intentionally short-circuiting that contract at runtime.
api.interceptors.response.use(
  (res: AxiosResponse<unknown>) => res.data as never,
  (err: unknown) => {
    if (axios.isAxiosError<ApiErrorEnvelope>(err) && err.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    const error = axios.isAxiosError<ApiErrorEnvelope>(err) ? err.response?.data?.error : err
    return Promise.reject(error)
  }
)
