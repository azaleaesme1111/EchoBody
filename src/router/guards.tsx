import { Outlet } from 'react-router-dom'

/**
 * Route guard - currently allows all access (guest mode).
 * Auth checks are handled at the action level via `requireAuth()` from AuthProvider.
 * This component is kept for potential future use if route-level guards are needed.
 */
export default function RequireAuth() {
  return <Outlet />
}
