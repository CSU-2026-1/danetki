import { jwtDecode } from 'jwt-decode'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type UserRole } from '../lib/utils'

const STORAGE_KEY = 'danetka_token'

type JwtPayload = {
  sub?: string
  email?: string
  role?: string
  Role?: string
  exp?: number
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = jwtDecode<JwtPayload>(token)
    if (!payload.exp) return false
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

function readTokenClaims(token: string) {
  const payload = jwtDecode<JwtPayload>(token)
  return {
    userId: payload.sub ?? null,
    email: payload.email ?? null,
    role: parseRole(payload),
  }
}

function parseRole(payload: JwtPayload): UserRole {
  const raw =
    payload.role ??
    payload.Role ??
    payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
    'user'

  const normalized = String(raw).trim().toLowerCase()
  return normalized === 'admin' ? 'admin' : 'user'
}

type AuthState = {
  token: string | null
  userId: string | null
  email: string | null
  role: UserRole | null
  setToken: (token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      email: null,
      role: null,
      setToken: (token) => {
        if (isTokenExpired(token)) {
          set({ token: null, userId: null, email: null, role: null })
          return
        }
        set({ token, ...readTokenClaims(token) })
      },
      clearAuth: () =>
        set({
          token: null,
          userId: null,
          email: null,
          role: null,
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (!state?.token) return
        if (isTokenExpired(state.token)) {
          state.clearAuth()
          return
        }
        try {
          Object.assign(state, readTokenClaims(state.token))
        } catch {
          state.clearAuth()
        }
      },
    },
  ),
)

export function getAuthToken(): string | null {
  return useAuthStore.getState().token
}
