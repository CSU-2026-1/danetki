import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/services'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'

type AuthMode = 'login' | 'register'

export function Auth() {
  const navigate = useNavigate()
  const setToken = useAuthStore((s) => s.setToken)

  const [mode, setMode] = useState<AuthMode>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response =
        mode === 'login'
          ? await login(email, password)
          : await register(email, password, username)

      setToken(response.token)
      navigate('/puzzles')
    } catch {
      setError(
        mode === 'login'
          ? 'Неверный email или пароль'
          : 'Не удалось зарегистрироваться. Проверьте данные.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.15),_transparent_55%)]"
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Danetka</h1>
          <p className="mt-2 text-sm text-zinc-500">
            {mode === 'login' ? 'Вход в личный кабинет' : 'Создание аккаунта'}
          </p>
        </div>

        <Card>
          <div className="mb-6 flex rounded-lg bg-zinc-950/60 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
              }}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                mode === 'login'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError(null)
              }}
              className={cn(
                'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                mode === 'register'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300',
              )}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-zinc-300">
                  Имя
                </label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ваше имя"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-zinc-300">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.ru"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-zinc-300">
                Пароль
              </label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                minLength={mode === 'register' ? 8 : undefined}
                required
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
