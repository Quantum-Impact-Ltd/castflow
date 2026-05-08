import axios from 'axios'

export const api = axios.create({
  baseURL: `${process.env['NEXT_PUBLIC_API_URL']}/api/v1`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res.data,
  (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    const error = axios.isAxiosError(err) ? err.response?.data?.error : err
    return Promise.reject(error)
  }
)
