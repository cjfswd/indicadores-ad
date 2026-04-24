import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('session_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('session_token')
      window.location.href = '/login'
    }
    const message = error.response?.data?.error ?? 'Erro de conexão com o servidor'
    return Promise.reject(new Error(message))
  },
)
