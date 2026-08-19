import { useState } from 'react'
import { FAQItem } from '@/providers/AuthProvider'

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: '我是从哪里来的？',
    ages: ['child', 'teen'],
    content: '你来自于爸爸妈妈的爱。爸爸的身体里有一个小小的"种子"叫精子，妈妈的身体里有一个小小的"种子"叫卵子。当精子和卵子相遇，就会在妈妈肚子里的一个小房间（子宫）里慢慢长大，最后变成你。',
    tips: '可以用绘本《小威向前冲》作为辅助材料，用简单有趣的方式解释。',
    activity: '画一画：让学生画出他们想象中自己从哪里来。',
  },
  {
    id: '2',
    question: '什么是喜欢？',
    ages: ['child', 'teen', 'adult'],
    content: '喜欢是一种温暖的感受。当你和某人在一起很开心、很想见到TA、想和TA分享事情，那就是喜欢。喜欢可以是友情也可以是其他，每个人感受不一样，重要的是你要知道这种感觉是什么。',
    tips: '引导学生区分"喜欢"和"爱"，理解感情的不同层次。',
    activity: '写下"我喜欢的人和事"清单，分享不保密的部分。',
  },
  {
    id: '3',
    question: '什么是同意（Consent）？',
    ages: ['teen', 'adult'],
    content: '同意就是对方清楚地、自愿地说"好"。同意必须满足几个条件：是自由的（不是被强迫）、是可撤销的（任何时候可以说"不"）、是知情同意的（知道会发生什么）、是热情的（是真的愿意）、是具体的（一件事同意不代表所有事都同意）。',
    tips: '使用FRIES模型（Free, Reversible, Informed, Enthusiastic, Specific）进行教学。',
    activity: '情景卡判断：给几个场景让学生判断是否构成同意。',
  },
  {
    id: '4',
    question: '如果是熟人让我不舒服怎么办？',
    ages: ['child', 'teen'],
    content: '记住：任何让你身体不舒服的接触都是不对的，无论对方是谁——即使是老师、亲戚、熟悉的人。你有权利说不，有权利离开，有权利告诉信任的大人。秘密和隐私不一样：健康的隐私不会让你害怕或不舒服。',
    tips: '强调"你的身体你做主"，让学生知道他们不需要对任何人妥协。',
    activity: '练习说"不"的三个技巧：大声说、转身走、找人帮。',
  },
  {
    id: '5',
    question: '有人向我要照片怎么办？',
    ages: ['teen', 'adult'],
    content: '任何人向你索要照片（尤其是隐私部位的照片）都是错误的。你应该：1）不要发送；2）不要回复；3）立即告诉信任的大人；4）保留证据。记住：这不是你的错，对方才是错的。',
    tips: '提醒学生网络信息一旦发送就无法完全删除，风险很高。',
    activity: '制作"网络安全检查清单"，贴在班级显眼处。',
  },
  {
    id: '6',
    question: '我的身体在变化，这正常吗？',
    ages: ['child', 'teen'],
    content: '完全正常！青春期每个人的身体都会发生变化——身高、体重、声音、第二性征等。这些变化说明你的身体正在健康成长。每个人变化时间和速度不同，这都很正常。',
    tips: '区分男生女生不同的变化，准备相应的科普材料。',
    activity: '匿名提问箱：让学生写下自己最想知道的身体变化问题。',
  },
]

const AGE_LABELS: Record<string, string> = { child: '小学', teen: '初中', adult: '高中及以上' }

export default function FAQ() {
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = FAQ_DATA.filter(f => {
    const matchSearch = f.question.includes(search) || f.content.includes(search)
    const matchAge = ageFilter === 'all' || (f.ages as string[]).includes(ageFilter)
    return matchSearch && matchAge
  })

  return (
    <div>
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索问题..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-gray-900" />
        </div>
        <div className="flex gap-2">
          {(['all', 'child', 'teen', 'adult'] as const).map(a => (
            <button key={a} onClick={() => setAgeFilter(a)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                ageFilter === a ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}>
              {a === 'all' ? '全部' : AGE_LABELS[a]}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-3">
        {filtered.map(f => (
          <button key={f.id} onClick={() => setExpandedId(expandedId === f.id ? null : f.id)}
            className="card w-full text-left transition-all hover:border-violet-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {f.ages.map(a => (
                    <span key={a} className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{AGE_LABELS[a]}</span>
                  ))}
                </div>
                <h3 className="font-bold text-gray-900">{f.question}</h3>
              </div>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`text-gray-400 flex-shrink-0 transition-transform ${expandedId === f.id ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
            {expandedId === f.id && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">{f.content}</p>
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <p className="text-xs font-medium text-yellow-800 mb-1">注意事项</p>
                  <p className="text-sm text-yellow-700">{f.tips}</p>
                </div>
                {f.activity && (
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-xs font-medium text-green-800 mb-1">推荐活动</p>
                    <p className="text-sm text-green-700">{f.activity}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="text-xs text-violet-600 hover:text-violet-800 font-medium">复制答案</button>
                  <button className="text-xs text-gray-400 hover:text-gray-600 font-medium">导出教案</button>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
