import { Link } from 'react-router-dom'
import { MODULES } from '@/constants/modules'
import { useAuth } from '@/providers/AuthProvider'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="page-container">
      {/* Hero */}
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-violet-600 text-white mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">EchoBody</h1>
        <p className="text-xl text-violet-600 font-medium mb-3">身体之间</p>
        <p className="text-gray-500 max-w-lg mx-auto">帮助老师设计与开展高质量性教育课程的互动教学平台</p>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {MODULES.map(m => (
          <Link key={m.path} to={m.path} className="module-card">
            <div className="flex items-start justify-between">
              <div className="module-icon" style={{ background: `${m.color}15` }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill={m.color}>
                  <path d={m.icon} />
                </svg>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{m.label}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">{m.desc}</p>
            </div>
            <div className="mt-2 text-sm font-medium" style={{ color: m.color }}>
              进入模块
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline ml-0.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick stats for teachers */}
      {user?.role === 'teacher' && (
        <div className="mt-10 card">
          <h3 className="font-bold text-gray-900 mb-4">我的教学概览</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-violet-600">3</div>
              <div className="text-xs text-gray-500 mt-1">已备课次</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-pink-600">12</div>
              <div className="text-xs text-gray-500 mt-1">待处理问题</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">8</div>
              <div className="text-xs text-gray-500 mt-1">公开讨论</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="mt-16 text-center text-sm text-gray-400 pb-4">
        <p>EchoBody · 身体之间 · v0.1</p>
      </div>
    </div>
  )
}
