import axios from 'axios'
import { useAuthStore } from '../store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const { token, currentOrg } = useAuthStore.getState()
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (currentOrg) config.headers['x-org-id'] = currentOrg.id
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { refreshToken, setAuth, user } = useAuthStore.getState()
        if (!refreshToken) {
          useAuthStore.getState().logout()
          window.location.href = '/login'
          return Promise.reject(error)
        }
        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken }
        )
        setAuth(user!, data.data.token, data.data.refreshToken)
        original.headers.Authorization = `Bearer ${data.data.token}`
        return apiClient(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient