import { useState } from 'react'

const TEMPLATES: { id: string; title: string; grade: string; duration: string; objectives: string[]; steps: string[] }[] = [
  {
    id: '1',
    title: '认识我的身体',
    grade: '小学 3-4年级',
    duration: '40分钟',
    objectives: ['认识身体的主要部位', '了解身体的隐私区域', '学会用正确名称称呼身体部位'],
    steps: [
      '导入：歌曲《头肩膀膝盖脚》激活兴趣（5分钟）',
      '讲解：人体结构图认识主要部位（10分钟）',
      '活动：身体部位名称配对卡片游戏（10分钟）',
      '讨论：哪些部位是隐私的，为什么要保护（10分钟）',
      '总结：身体自主权儿歌，发放学习卡（5分钟）',
    ],
  },
  {
    id: '2',
    title: '身体边界与尊重',
    grade: '小学 5-6年级',
    duration: '45分钟',
    objectives: ['理解身体边界的概念', '学会识别不舒服的接触', '掌握拒绝不安全接触的方法'],
    steps: [
      '导入：绘本故事《不要随便摸我》（5分钟）',
      '讲解：身体红绿灯概念——安全/不舒服/危险（10分钟）',
      '情景讨论：几种接触场景判断练习（10分钟）',
      '角色扮演：学习说"不"的三个技巧（15分钟）',
      '总结：安全网络图——遇到困难找谁（5分钟）',
    ],
  },
  {
    id: '3',
    title: '性同意（Consent）',
    grade: '初中 7-9年级',
    duration: '50分钟',
    objectives: ['理解同意的定义和要素', '学会识别不同形式的同意', '掌握在关系中表达边界的方法'],
    steps: [
      '导入：案例讨论——"他说好就是同意吗？"（5分钟）',
      '讲解：FRIES同意模型（Free, Reversible, Informed, Enthusiastic, Specific）（15分钟）',
      '小组活动：情景卡判断练习（15分钟）',
      '情景模拟：如何表达同意/拒绝（10分钟）',
      '总结：尊重彼此边界的承诺墙（5分钟）',
    ],
  },
  {
    id: '4',
    title: '网络社交安全',
    grade: '初中 7-9年级',
    duration: '40分钟',
    objectives: ['识别网络社交风险', '学会保护个人隐私信息', '掌握应对网络骚扰的方法'],
    steps: [
      '导入：真实案例讨论（5分钟）',
      '讲解：网络个人信息安全清单（10分钟）',
      '情景判断：哪些信息不能分享（10分钟）',
      '角色扮演：遇到网络骚扰怎么办（10分钟）',
      '总结：网络安全承诺书（5分钟）',
    ],
  },
]

const DISCUSSION_QUESTIONS: { id: string; topic: string; question: string; age: string }[] = [
  { id: '1', topic: '身体边界', question: '如果你不喜欢别人碰你，你可以怎么说？', age: '小学' },
  { id: '2', topic: '同意', question: '什么是真正的"同意"？不说的意思是同意吗？', age: '初中' },
  { id: '3', topic: '网络社交', question: '在网上遇到让你不舒服的对话，你应该怎么做？', age: '初中' },
  { id: '4', topic: '熟人关系', question: '如果是熟人让你不舒服，你有权利说"不"吗？', age: '初中' },
  { id: '5', topic: '寻求帮助', question: '当你遇到困难时，你会找谁帮忙？为什么？', age: '小学' },
]

export default function CourseDesign() {
  const [tab, setTab] = useState<'template' | 'discussion'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiTopic, setAiTopic] = useState('')

  const handleGenerate = async () => {
    if (!aiTopic.trim()) return
    setAiLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setAiResult(`【课程主题】${aiTopic}\n\n【适用年级】小学高年级 / 初中\n\n【课程目标】\n1. 帮助学生理解"${aiTopic}"的基本概念\n2. 培养学生的自我保护意识\n3. 引导学生学会在安全环境中表达感受\n\n【活动准备】\n- PPT课件\n- 情景卡片\n- 学习单\n\n【课程流程】（40分钟）\n1. 导入（5分钟）：通过故事引入主题\n2. 知识讲解（10分钟）：核心概念说明\n3. 互动活动（15分钟）：小组讨论/角色扮演\n4. 总结分享（10分钟）：学生分享收获`)
    setAiLoading(false)
  }

  const selected = TEMPLATES.find(t => t.id === selectedTemplate)

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['template', 'discussion'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}>
            {t === 'template' ? '课程模板' : '讨论问题库'}
          </button>
        ))}
      </div>

      {tab === 'template' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { setSelectedTemplate(t.id); setExpanded(false) }}
                className={`card text-left transition-all ${selectedTemplate === t.id ? 'ring-2 ring-violet-500' : ''}`}>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900">{t.title}</h3>
                  <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">{t.grade}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{t.duration}</p>
                <div className="mt-3 flex gap-2">
                  {t.objectives.slice(0, 2).map((o, i) => (
                    <span key={i} className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{o}</span>
                  ))}
                  {t.objectives.length > 2 && <span className="text-xs text-gray-400">+{t.objectives.length - 2}</span>}
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="card bg-violet-50/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 text-lg">{selected.title}</h3>
                <button onClick={() => setExpanded(!expanded)} className="text-sm text-violet-600 font-medium">
                  {expanded ? '收起' : '查看详情'}
                </button>
              </div>
              {expanded && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">课程目标</h4>
                    <ul className="space-y-1">
                      {selected.objectives.map((o, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />{o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">课程流程</h4>
                    <ol className="space-y-2">
                      {selected.steps.map((s, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button className="btn-primary text-sm py-2 px-4">导出教案</button>
                    <button className="btn-secondary text-sm py-2 px-4">下载PPT模板</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'discussion' && (
        <div className="space-y-3">
          {DISCUSSION_QUESTIONS.map(q => (
            <div key={q.id} className="card flex items-start gap-4">
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded-full whitespace-nowrap">{q.age}</span>
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-1">{q.topic}</p>
                <p className="text-gray-900 font-medium">{q.question}</p>
              </div>
              <button className="text-gray-400 hover:text-violet-600 transition-colors flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* AI 辅助 */}
      <div className="mt-8 card">
        <h3 className="font-bold text-gray-900 text-lg mb-2">AI 辅助课程设计</h3>
        <p className="text-sm text-gray-500 mb-4">输入课程主题，AI 帮你生成教案框架</p>
        <div className="flex gap-2">
          <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)}
            placeholder="例如：身体边界、网络社交安全..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-gray-900"
            onKeyDown={e => e.key === 'Enter' && handleGenerate()} />
          <button onClick={handleGenerate} disabled={aiLoading || !aiTopic.trim()}
            className="btn-primary px-6 py-3 disabled:opacity-50 whitespace-nowrap">
            {aiLoading ? '生成中...' : '生成教案'}
          </button>
        </div>
        {aiResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-wrap max-h-80 overflow-y-auto">
            {aiResult}
          </div>
        )}
      </div>
    </div>
  )
}
