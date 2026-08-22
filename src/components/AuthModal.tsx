import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/providers/AuthProvider'
import Logo from '@/components/Logo'

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, login, register } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'login' | 'register'>('login')

  // Login form
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginRole, setLoginRole] = useState<'teacher' | 'student'>('teacher')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Register form
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regRole, setRegRole] = useState<'teacher' | 'student'>('student')
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const resetForms = () => {
    setLoginEmail(''); setLoginPassword(''); setLoginError('')
    setRegName(''); setRegEmail(''); setRegPassword(''); setRegConfirmPassword(''); setRegError('')
  }

  const handleClose = () => {
    resetForms()
    setTab('login')
    closeAuthModal()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    if (!loginEmail.trim()) {
      setLoginError('Please enter your email address.')
      return
    }
    if (!loginPassword) {
      setLoginError('Please enter your password.')
      return
    }
    setLoginLoading(true)
    console.log('[AuthModal] Login form submitted for:', loginEmail)
    const result = await login(loginEmail, loginPassword, loginRole)
    console.log('[AuthModal] Login result:', result.error ? `ERROR: ${result.error}` : 'SUCCESS')
    if (result.error) {
      setLoginError(result.error)
      setLoginLoading(false)
      return
    }
    handleClose()
    navigate('/', { replace: true })
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError('')
    if (!regName.trim()) {
      setRegError('Please enter your name.')
      return
    }
    if (!regEmail.trim()) {
      setRegError('Please enter your email address.')
      return
    }
    if (!regPassword || !regConfirmPassword) {
      setRegError('Please fill in both password fields.')
      return
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.')
      return
    }
    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.')
      return
    }
    setRegLoading(true)
    console.log('[AuthModal] Register form submitted for:', regEmail)
    const result = await register(regEmail, regPassword, regName, regRole)
    console.log('[AuthModal] Register result:', result.error ? `ERROR: ${result.error}` : 'SUCCESS')
    if (result.error) {
      setRegError(result.error)
      setRegLoading(false)
      return
    }
    handleClose()
    navigate('/', { replace: true })
  }

  if (!authModalOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-8 pt-8 pb-2 text-center">
          <div className="mb-3">
            <Logo size="sm" showText={false} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            {tab === 'login' ? 'Welcome back' : 'Create Account'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {tab === 'login' ? 'Log in to use all features' : 'Join EchoBody'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex mx-8 mt-4 border-b border-gray-100">
          <button
            onClick={() => { setTab('login'); setLoginError(''); setRegError('') }}
            className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-all ${
              tab === 'login' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => { setTab('register'); setLoginError(''); setRegError('') }}
            className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-all ${
              tab === 'register' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Sign up
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-5 max-h-[60vh] overflow-y-auto">
          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['teacher', 'student'] as const).map(r => (
                    <button key={r} type="button" onClick={() => setLoginRole(r)}
                      className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        loginRole === r ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {r === 'teacher' ? 'Teacher' : 'Student'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-gray-900"
                  placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-gray-900"
                  placeholder="Enter your password" />
              </div>
              {loginError && <p className="text-sm text-red-500">{loginError}</p>}
              <button type="submit" disabled={loginLoading} className="w-full btn-primary py-3 text-base">
                {loginLoading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input type="text" value={regName} onChange={e => setRegName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-gray-900"
                  placeholder="Enter your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-gray-900"
                  placeholder="your@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-gray-900"
                  placeholder="At least 6 characters" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input type="password" value={regConfirmPassword} onChange={e => setRegConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-gray-900"
                  placeholder="Re-enter your password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Register as</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['student', 'teacher'] as const).map(r => (
                    <button key={r} type="button" onClick={() => setRegRole(r)}
                      className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        regRole === r ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}>
                      {r === 'student' ? 'Student' : 'Teacher'}
                    </button>
                  ))}
                </div>
              </div>
              {regError && <p className="text-sm text-red-500">{regError}</p>}
              <button type="submit" disabled={regLoading} className="w-full btn-primary py-3 text-base">
                {regLoading ? 'Creating account...' : 'Register & Log in'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
