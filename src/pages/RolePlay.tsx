import { useState } from 'react'
import { Scenario } from '@/providers/AuthProvider'

const SCENARIOS: Scenario[] = [
  {
    id: '1',
    title: '熟人边界问题',
    tag: '身体边界',
    description: '周末，你的一位叔叔来家里做客。他抱着你的时候，你感觉不太舒服。他当着很多人的面，说"叔叔就这么喜欢你"，然后捏了你的脸。',
    choices: [
      { text: '忍着不说，因为是长辈', feedback: '这不是正确的做法。你有权保护自己的感受，即使是长辈也要尊重你的边界。', correct: false },
      { text: '明确告诉叔叔"我不喜欢这样"', feedback: '很好！你可以用温和但坚定的方式表达自己的不舒服。记住，你的身体你做主。', correct: true },
      { text: '事后告诉爸爸妈妈', feedback: '很好的选择！如果当时不方便说，事后告诉信任的大人也是正确的做法。', correct: true },
      { text: '假装没事，以后躲着他', feedback: '躲避不能解决问题。长期压抑感受可能会影响你的心理健康。建议找一个安全的机会表达你的感受。', correct: false },
    ],
  },
  {
    id: '2',
    title: '网络社交安全',
    tag: '网络安全',
    description: '你在网上认识了一个比你大5岁的网友，你们聊得很投缘。有一天他问你："你能发一张你的照片给我看看吗？"并说"这只是我们之间的秘密"。',
    choices: [
      { text: '发一张普通的照片给他', feedback: '即使是普通照片也不应该发给网友。网络上的信息可能被保存、传播，存在风险。', correct: false },
      { text: '拒绝他，并告诉父母或老师', feedback: '完全正确！任何让你不舒服的要求都要拒绝，并告诉信任的大人。记住：真正的网络安全是保护自己的隐私。', correct: true },
      { text: '不回复，直接拉黑', feedback: '这也是一个安全的做法。但如果你感到困扰或害怕，一定要告诉大人。', correct: true },
      { text: '答应他，说"那你要给我发什么？"', feedback: '这样做会让你陷入危险境地。不要进行任何形式的隐私交换，这是对方的操控手段。', correct: false },
    ],
  },
  {
    id: '3',
    title: 'Consent（性同意）',
    tag: '同意',
    description: '你和一个你喜欢的人在一起，对方想牵你的手并靠近你。但你还没有准备好。',
    choices: [
      { text: '顺从对方的意愿', feedback: '这不是必须的。你的感受最重要，你有权利在任何时候说"不"或"还没准备好"。', correct: false },
      { text: '告诉对方"我还不想这样，但我们还是可以朋友"', feedback: '很好的表达！清晰地沟通你的边界，同时表达对关系的重视。', correct: true },
      { text: '不说话，但身体往后退', feedback: '身体语言是有效的信号，但有时候对方可能没有注意到。最好加上语言表达会更清晰。', correct: false },
      { text: '先假装同意，之后再想办法', feedback: '这会让你非常不舒服。同意应该是自愿且清晰的，不要勉强自己。', correct: false },
    ],
  },
  {
    id: '4',
    title: '公共场所的骚扰',
    tag: '安全',
    description: '在地铁上，有人一直盯着你看，并故意靠近你。你感觉很不舒服。',
    choices: [
      { text: '假装没看见，忍一忍就过去了', feedback: '忍耐不是解决之道。你有权利在公共场所感到安全。', correct: false },
      { text: '大声呵斥对方', feedback: '大声表达可以吓退一些人，但也要评估现场安全情况，优先保护自己。', correct: true },
      { text: '移动到有其他人的地方，或向工作人员求助', feedback: '非常好的做法！寻找安全区域和求助是保护自己最有效的方式。', correct: true },
      { text: '记录下来，事后报警', feedback: '如果有证据且情况严重，报警是正确的选择。但首先要确保当下的安全。', correct: true },
    ],
  },
]

export default function RolePlay() {
  const [view, setView] = useState<{ mode: 'list' | 'play'; scenario: Scenario | null; choiceIdx: number; done: boolean }>({
    mode: 'list', scenario: null, choiceIdx: -1, done: false,
  })
  const [selectedTag, setSelectedTag] = useState('全部')

  const tags = ['全部', ...Array.from(new Set(SCENARIOS.map(s => s.tag)))]
  const filtered = selectedTag === '全部' ? SCENARIOS : SCENARIOS.filter(s => s.tag === selectedTag)

  if (view.mode === 'play' && view.scenario) {
    const s = view.scenario
    return (
      <div>
        <button onClick={() => setView({ mode: 'list', scenario: null, choiceIdx: -1, done: false })}
          className="text-sm text-violet-600 mb-4 hover:text-violet-800 flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回情景列表
        </button>
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">{s.tag}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{s.title}</h2>
          <p className="text-gray-600 leading-relaxed">{s.description}</p>
        </div>

        <div className="space-y-3">
          {s.choices.map((c, i) => (
            <button key={i} onClick={() => setView({ mode: 'play', scenario: s, choiceIdx: i, done: true })}
              className={`w-full card text-left p-4 transition-all ${
                view.done && view.choiceIdx === i
                  ? c.correct ? 'ring-2 ring-green-500 bg-green-50' : 'ring-2 ring-red-400 bg-red-50'
                  : view.done && view.choiceIdx !== i ? 'opacity-40' : 'hover:border-pink-300'
              }`}>
              <div className="flex items-start gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  view.done && view.choiceIdx === i
                    ? c.correct ? 'bg-green-500 text-white' : 'bg-red-400 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}>{String.fromCharCode(65 + i)}</span>
                <div className="flex-1">
                  <p className={`font-medium ${view.done && view.choiceIdx === i ? (c.correct ? 'text-green-800' : 'text-red-700') : 'text-gray-900'}`}>
                    {c.text}
                  </p>
                  {view.done && view.choiceIdx === i && (
                    <p className={`text-sm mt-2 ${c.correct ? 'text-green-700' : 'text-red-600'}`}>{c.feedback}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {view.done && (
          <div className="mt-6 text-center">
            <button onClick={() => setView({ mode: 'list', scenario: null, choiceIdx: -1, done: false })} className="btn-primary">
              回到情景列表
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tags.map(t => (
          <button key={t} onClick={() => setSelectedTag(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selectedTag === t ? 'bg-pink-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}>
            {t}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {filtered.map(s => (
          <button key={s.id} onClick={() => setView({ mode: 'play', scenario: s, choiceIdx: -1, done: false })}
            className="card w-full text-left hover:border-pink-300 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">{s.tag}</span>
                <h3 className="font-bold text-gray-900 text-lg mt-2">{s.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description}</p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 flex-shrink-0 ml-3 mt-1">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
              <span>{s.choices.length} 个选择</span>
              <span>•</span>
              <span>角色扮演</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
