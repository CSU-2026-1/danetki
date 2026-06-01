import axios from 'axios'
import { getAuthToken } from '../store/authStore'

/** Пустая строка + proxy в vite.config — локальная разработка; prod — через .env.production */
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
