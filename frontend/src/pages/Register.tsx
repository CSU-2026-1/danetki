import axios from 'axios'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/services'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { decodeJwtRole } from '../lib/utils'
import { useAuthStore } from '../store/authStore'

export function Register() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов')
      return
    }

    setIsLoading(true)

    try {
      const response = await register(email, password, username)
      const role = decodeJwtRole(response.token)
      setAuth(response.token, role)
      navigate(role === 'Admin' ? '/admin/puzzles' : '/dashboard')
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        setError('Этот email уже зарегистрирован')
        return
      }

      setError('Не удалось создать аккаунт. Проверьте данные и попробуйте снова.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Danetka</h1>
          <p className="mt-2 text-sm text-zinc-500">Регистрация — 5 токенов на Trial бесплатно</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-zinc-300">
                Имя
              </label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Контент-мейкер"
                required
              />
            </div>

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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="минимум 8 символов"
                minLength={8}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Создать аккаунт
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-zinc-500">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
              Войти
            </Link>
          </p>
        </Card>
      </div>
    </div>
  )
}
