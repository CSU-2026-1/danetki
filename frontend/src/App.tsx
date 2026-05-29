import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './pages/AdminLayout'
import { Login } from './pages/Login'
import { ParserControl } from './pages/ParserControl'
import { PuzzlesList } from './pages/PuzzlesList'
import { useAuthStore } from './store/authStore'

function AdminRoute() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.role)

  if (!token || role !== 'Admin') {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="puzzles" replace />} />
            <Route path="puzzles" element={<PuzzlesList />} />
            <Route path="parser" element={<ParserControl />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/admin/puzzles" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
