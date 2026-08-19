import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'

interface Question {
  id: string
  content: string
  createdAt: number
  answered: boolean
  isPublic: boolean
  reply?: string
  answeredBy?: string
}

const DEMO_QUESTIONS: Question[] = [
  {
    id: '1',
    content: '老师，我最近发现班上有个同学总是盯着我看，这让我很不舒服，我该怎么办？',
    createdAt: Date.now() - 86400000 * 2,
    answered: false,
    isPublic: false,
  },
  {
    id: '2',
    content: '我在网上认识了一个朋友，他让我不要告诉别人我们的对话，我觉得有点害怕，这是对的吗？',
    createdAt: Date.now() - 86400000,
    answered: true,
    isPublic: true,
    reply: '你的害怕是身体在提醒你注意安全。如果有人让你保守"秘密"，尤其是让你不要告诉大人，这通常是不健康的信号。请一定告诉信任的大人。',
    answeredBy: '李老师',
  },
  {
    id: '3',
    content: '为什么有些人会说"你是成年人了所以不算"这样的话？',
    createdAt: Date.now() - 3600000,
    answered: false,
    isPublic: false,
  },
]

export default function AnonymousBox() {
  const { user } = useAuth()
  const [questions, setQuestions] = useState<Question[]>(DEMO_QUESTIONS)
  const [newContent, setNewContent] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [filter, setFilter] = useState<'all' | 'answered' | 'pending'>('all')
  const [viewingId, setViewingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const handleAsk = () => {
    if (!newContent.trim()) return
    const q: Question = {
      id: Date.now().toString(),
      content: newContent.trim(),
      createdAt: Date.now(),
      answered: false,
      isPublic,
    }
    setQuestions(prev => [q, ...prev])
    setNewContent('')
    setIsPublic(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  const handleReply = (id: string) => {
    if (!replyText.trim()) return
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, answered: true, reply: replyText.trim(), answeredBy: user?.name } : q))
    setReplyText('')
    setViewingId(null)
  }

  const handleTogglePublic = (id: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, isPublic: !q.isPublic } : q))
  }

  const filtered = questions.filter(q => {
    if (filter === 'answered') return q.answered
    if (filter === 'pending') return !q.answered
    return true
  })

  return (
    <div className="space-y-6">
      {/* 提问入口 */}
      <div className="card">
        <h3 className="font-bold text-gray-900 text-lg mb-3">匿名提问</h3>
        <p className="text-sm text-gray-500 mb-4">你的问题不会被公开名字，只有老师能看到你是谁</p>
        <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
          placeholder="写下你想问的问题..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-gray-900 resize-none"
          rows={3} />
        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-violet-600" />
            允许老师匿名公开讨论
          </label>
          <button onClick={handleAsk} disabled={!newContent.trim()} className="btn-primary text-sm py-2 px-5 disabled:opacity-50">
            提交问题
          </button>
        </div>
        {submitted && <p className="mt-3 text-sm text-green-600">问题已提交，谢谢你的信任。</p>}
      </div>

      {/* 问题列表 */}
      <div>
        <div className="flex gap-2 mb-4">
          {(['all', 'pending', 'answered'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === f ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}>
              {f === 'all' ? '全部' : f === 'pending' ? '待回复' : '已回复'}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(q => (
            <div key={q.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400">匿名学生</span>
                    {q.isPublic && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">可公开</span>}
                    {!q.isPublic && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">仅老师可见</span>}
                  </div>
                  <p className="text-gray-900">{q.content}</p>
                  {q.reply && (
                    <div className="mt-3 p-3 bg-violet-50 rounded-xl">
                      <p className="text-xs text-violet-600 font-medium mb-1">{q.answeredBy} 回复</p>
                      <p className="text-sm text-gray-700">{q.reply}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => setViewingId(viewingId === q.id ? null : q.id)}
                  className="ml-3 text-gray-400 hover:text-violet-600 flex-shrink-0">
                  {viewingId === q.id ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  )}
                </button>
              </div>
              {viewingId === q.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                    placeholder="输入回复..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-violet-500 outline-none text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleReply(q.id)} />
                  <button onClick={() => handleReply(q.id)} disabled={!replyText.trim()} className="btn-primary text-sm py-2 px-4 disabled:opacity-50">回复</button>
                  {!q.isPublic && <button onClick={() => handleTogglePublic(q.id)} className="text-xs text-gray-400 hover:text-violet-600 px-2">设为公开</button>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
