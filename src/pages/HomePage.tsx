import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MODULES } from '@/constants/modules'
import { supabase } from '@/utils/supabase'
import Logo from '@/components/Logo'

export default function HomePage() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const joinInputRef = useRef<HTMLInputElement>(null)

  // Auto-fill and auto-join from URL ?code=XXX (shared assignment link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    if (code && code.length === 6) {
      const upperCode = code.toUpperCase()
      setJoinCode(upperCode)
      // Auto-trigger join after a brief delay to show the filled code
      setTimeout(() => {
        handleJoinWithCode(upperCode)
      }, 500)
    }
  }, [])

  const handleJoinWithCode = async (code: string) => {
    setJoinLoading(true)
    setJoinError('')
    const { data } = await supabase.from('assignments').select('id').eq('join_code', code).maybeSingle()
    setJoinLoading(false)
    if (data) {
      navigate(`/checkin/${code}`)
    } else {
      setJoinError('Invalid code. Please check with your teacher.')
    }
  }

  const handleJoin = async () => {
    if (joinCode.trim().length !== 6) { setJoinError('Please enter a 6-character code'); return }
    setJoinLoading(true)
    setJoinError('')
    const code = joinCode.trim().toUpperCase()
    const { data } = await supabase.from('assignments').select('id').eq('join_code', code).maybeSingle()
    setJoinLoading(false)
    if (data) {
      navigate(`/checkin/${code}`)
    } else {
      setJoinError('Invalid code. Please check with your teacher.')
    }
  }

  return (
    <div className="page-container">
      {/* Hero */}
      <div className="text-center pt-4 pb-6">
        <div className="mb-3">
          <div className="inline-flex items-center justify-center bg-purple-50 p-5 rounded-2xl">
            <Logo size="lg" showText={false} />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">EchoBody</h1>
        <p className="text-gray-500 max-w-md mx-auto text-sm">An interactive teaching platform to help educators design and deliver high-quality puberty and consent education courses</p>
      </div>

      {/* Join a Class */}
      <div className="max-w-md mx-auto mb-8">
        <div className="bg-white rounded-2xl border border-violet-100 p-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-center mb-1">Join a Class</h3>
          <p className="text-sm text-gray-500 text-center mb-4">Enter the 6-character code from your teacher</p>
          <div className="flex gap-2">
            <input ref={joinInputRef} type="text" value={joinCode} onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
              placeholder="e.g. AB12CD" maxLength={6}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-center font-mono text-lg tracking-widest uppercase" />
            <button onClick={handleJoin} disabled={joinLoading || joinCode.length !== 6}
              className="bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50">
              {joinLoading ? '...' : 'Join'}
            </button>
          </div>
          {joinError && <p className="text-xs text-red-500 mt-2 text-center">{joinError}</p>}
        </div>
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
              Enter module
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline ml-0.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer info */}
      <div className="mt-16 text-center text-sm text-gray-400 pb-4">
        <p>EchoBody · v0.1</p>
      </div>
    </div>
  )
}
