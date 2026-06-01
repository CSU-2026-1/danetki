import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { Auth } from './pages/Auth'
import { DashboardLayout } from './pages/DashboardLayout'
import { ParserPage } from './pages/ParserPage'
import { PuzzlesPage } from './pages/PuzzlesPage'
import { RandomPuzzlePage } from './pages/RandomPuzzlePage'
import { useAuthStore } from './store/authStore'

function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)

  if (!token) {
    return <Navigate to="/auth" replace />
  }

  return <Outlet />
}

function AdminRoute() {
  const role = useAuthStore((s) => s.role)

  if (role !== 'admin') {
    return <Navigate to="/puzzles" replace />
  }

  return <Outlet />
}

function AuthRoute() {
  const token = useAuthStore((s) => s.token)

  if (token) {
    return <Navigate to="/puzzles" replace />
  }

  return <Auth />
}

function RootRedirect() {
  const token = useAuthStore((s) => s.token)

  return <Navigate to={token ? '/puzzles' : '/auth'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/auth" element={<AuthRoute />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/puzzles" element={<PuzzlesPage />} />
            <Route path="/random" element={<RandomPuzzlePage />} />
            <Route element={<AdminRoute />}>
              <Route path="/parser" element={<ParserPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
