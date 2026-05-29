import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const TOKEN_STORAGE_KEY = 'danetka_auth_token'

type AuthState = {
  token: string | null
  role: string | null
  setAuth: (token: string, role: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      setAuth: (token, role) => set({ token, role }),
      clearAuth: () => set({ token: null, role: null }),
    }),
    {
      name: TOKEN_STORAGE_KEY,
      partialize: (state) => ({ token: state.token, role: state.role }),
    },
  ),
)

export function getAuthToken(): string | null {
  return useAuthStore.getState().token
}
