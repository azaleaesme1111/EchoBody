import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, ADMIN_ACCOUNTS } from '@/providers/AuthProvider'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'teacher' | 'student'>('teacher')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please fill in both email and password')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))

    // Admin account verification
    const adminUser = Object.keys(ADMIN_ACCOUNTS).find(k => k === email)
    if (adminUser && ADMIN_ACCOUNTS[adminUser] === password) {
      login(adminUser, 'admin')
      navigate('/', { replace: true })
      setLoading(false)
      return
    }

    // Simulate successful login
    login(email.split('@')[0], role)
    navigate('/', { replace: true })
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-violet-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600 text-white mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">EchoBody</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Log in</h2>

          {/* Role selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  role === 'teacher'
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  role === 'student'
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                Student
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Admin accounts are preset by the system — log in with admin email</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-gray-900"
                placeholder={role === 'teacher' ? 'teacher@example.com' : 'student@example.com'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-gray-900"
                placeholder="Enter your password"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?
            <Link to="/register" className="text-violet-600 font-medium hover:text-violet-700"> Sign up</Link>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button onClick={() => { login('Demo User', role); navigate('/') }} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Quick demo (skip login)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
