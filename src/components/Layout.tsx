import { useState } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { MODULES } from '@/constants/modules'
import { useAuth } from '@/providers/AuthProvider'
import Logo from '@/components/Logo'

export default function Layout() {
  const location = useLocation()
  const { user, logout, openAuthModal } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const currentModule = MODULES.find(m => location.pathname.startsWith(m.path)) || MODULES[0]

  const handleLogout = () => {
    logout()
    navigate('.', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-violet-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="." className="flex items-center">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">
                  {user.name[0]}
                </div>
                <span className="text-sm text-gray-600 hidden sm:block">{user.name}</span>
                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Log out</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={openAuthModal} className="text-sm text-violet-600 font-medium hover:text-violet-700 px-3 py-1.5 rounded-lg hover:bg-violet-50 transition-all">Log in</button>
                <button onClick={openAuthModal} className="text-sm bg-violet-600 text-white font-medium px-4 py-1.5 rounded-lg hover:bg-violet-700 transition-all">Sign up</button>
              </div>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-violet-50 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {menuOpen
                  ? <path d="M18 6L6 18M6 6l12 12" />
                  : <><path d="M3 12h18M3 6h18M3 18h18" /></>
                }
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Module nav */}
      <nav className="bg-white border-b border-violet-50 overflow-x-auto">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 min-w-max">
          {MODULES.map(m => (
            <Link key={m.path} to={m.path}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                location.pathname.startsWith(m.path)
                  ? 'border-violet-600 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d={m.icon} />
              </svg>
              <span>{m.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1">
        {currentModule && (
          <div className="bg-gradient-to-r from-violet-50 to-pink-50 border-b border-violet-100">
            <div className="max-w-5xl mx-auto px-4 py-6">
              <h1 className="text-2xl font-bold text-gray-900">{currentModule.label}</h1>
              <p className="text-sm text-gray-500 mt-1">{currentModule.desc}</p>
            </div>
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav for mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-violet-100 z-50">
        <div className="flex justify-around py-2">
          {MODULES.map(m => (
            <Link key={m.path} to={m.path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
                location.pathname.startsWith(m.path) ? 'text-violet-700' : 'text-gray-400'
              }`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d={m.icon} />
              </svg>
              <span>{m.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
