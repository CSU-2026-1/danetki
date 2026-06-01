import { BookOpen, LogOut, ScanSearch, Shuffle } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAuthStore } from '../store/authStore'
import { Button } from '../components/ui/Button'

const adminItems = [
  { to: '/puzzles', label: 'Все данетки', icon: BookOpen },
  { to: '/parser', label: 'Парсер', icon: ScanSearch },
]

const userItems = [
  { to: '/puzzles', label: 'Все данетки', icon: BookOpen },
  { to: '/random', label: 'Случайная данетка', icon: Shuffle },
]

export function DashboardLayout() {
  const navigate = useNavigate()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const email = useAuthStore((s) => s.email)
  const role = useAuthStore((s) => s.role)

  const navItems = role === 'admin' ? adminItems : userItems

  function handleLogout() {
    clearAuth()
    navigate('/auth')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-zinc-950/80 backdrop-blur">
        <div className="border-b border-white/5 px-6 py-5">
          <h1 className="text-lg font-semibold tracking-tight text-white">Danetka</h1>
          <p className="mt-1 text-xs text-zinc-500">
            {role === 'admin' ? 'Admin Console' : 'Личный кабинет'}
          </p>
          {email && (
            <p className="mt-1 truncate text-xs text-zinc-600">{email}</p>
          )}
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/5 p-4">
          <Button variant="secondary" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Выход
          </Button>
        </div>
      </aside>

      <main className="relative min-h-0 flex-1 overflow-y-auto p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.12),_transparent_55%)]"
        />
        <div className="relative">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
