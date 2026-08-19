import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, ADMIN_ACCOUNTS } from '@/providers/AuthProvider'

type LoginRole = 'teacher' | 'student'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<LoginRole>('teacher')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('请填写邮箱和密码')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))

    // 管理员账号验证
    const adminUser = Object.keys(ADMIN_ACCOUNTS).find(k => k === email)
    if (adminUser && ADMIN_ACCOUNTS[adminUser] === password) {
      login(adminUser, 'admin')
      navigate('/', { replace: true })
      setLoading(false)
      return
    }

    // 模拟登录成功
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
          <p className="text-gray-500 mt-2">身体之间</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-violet-100 p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">登录</h2>

          {/* Role selector */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">身份</label>
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
                教师
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
                学生
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">管理员账号由系统预设，使用管理员邮箱登录</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-gray-900"
                placeholder={role === 'teacher' ? 'teacher@example.com' : 'student@example.com'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all text-gray-900"
                placeholder="请输入密码"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-gray-500">
            还没有账号？
            <Link to="/register" className="text-violet-600 font-medium hover:text-violet-700">立即注册</Link>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button onClick={() => { login('演示用户', role); navigate('/') }} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              快速体验（跳过登录）
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
