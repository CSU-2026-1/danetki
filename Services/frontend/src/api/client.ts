import axios from 'axios'
import { getAuthToken, useAuthStore } from '../store/authStore'

function redirectToAuth() {
  useAuthStore.getState().clearAuth()
  if (window.location.pathname !== '/auth') {
    window.location.assign('/auth')
  }
}

const baseURL = import.meta.env.VITE_API_GATEWAY_URL ?? ''

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      redirectToAuth()
    }
    return Promise.reject(error)
  },
)
