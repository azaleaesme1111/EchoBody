import { useState } from 'react'

const QUIZZES = [
  {
    id: '1',
    question: '同学A在课间走廊主动抱了同学B，同学B的表情看起来不太舒服。同学A的做法对吗？',
    options: [
      { text: '对的，同学之间友好拥抱是正常的', correct: false, feedback: '不一定。每个同学的边界不同，即使同学关系也要先询问对方是否愿意。' },
      { text: '不对，应该先问对方"我可以抱你吗"', correct: true, feedback: '正确！任何身体接触都应该先征得对方同意。' },
      { text: '这要看当时的情况', correct: false, feedback: '虽然情境有关，但核心原则是：先询问，再行动。' },
    ],
  },
  {
    id: '2',
    question: '以下哪种情况属于"同意"？',
    options: [
      { text: '朋友一直请求，最后你勉强答应了', correct: false, feedback: '不是。同意必须是自愿、热情的，不是被迫的。' },
      { text: '对方喝了酒，神志不清，你答应了', correct: false, feedback: '不是。醉酒状态下无法做出真正的同意。' },
      { text: '对方清醒、自愿、热情地表达了同意', correct: true, feedback: '正确！这是FRIES模型中"Free（自由）"和"Enthusiastic（热情）"的体现。' },
    ],
  },
  {
    id: '3',
    question: '你在网上收到一张不合适的照片，对方说"只是给我们看的"，你怎么做？',
    options: [
      { text: '收下但不告诉任何人', correct: false, feedback: '这不安全。即使对方说是秘密，也可能是操控手段。' },
      { text: '删除并告诉信任的大人', correct: true, feedback: '正确！保护自己是第一位的，告诉大人能帮助解决问题。' },
      { text: '转发给好朋友一起看', correct: false, feedback: '错误！这会让不良信息扩散，也可能伤害到照片中的人。' },
    ],
  },
  {
    id: '4',
    question: '好朋友在派对上喝了很多酒，他/她对你说"我愿意和你回家"。你该怎么做？',
    options: [
      { text: '既然对方说了愿意，那就没问题', correct: false, feedback: '不是。醉酒状态下无法做出有效同意，照顾对方安全才是正确的。' },
      { text: '确保他/她安全回家，并联系他/她的朋友或家人', correct: true, feedback: '正确！真正的关心是保护对方的安全，而不是趁人之危。' },
      { text: '趁对方意识不清，做自己想做的事', correct: false, feedback: '这是违法行为。同意必须是清醒、自愿、明确的。' },
    ],
  },
]

const QUIZ_TITLE = 'Consent 判断练习'

export default function MiniGames() {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [finished, setFinished] = useState(false)

  const q = QUIZZES[currentIdx]

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    if (q.options[idx].correct) setScore(s => s + 1)
    setTimeout(() => setShowResult(true), 300)
  }

  const handleNext = () => {
    if (currentIdx < QUIZZES.length - 1) {
      setCurrentIdx(i => i + 1)
      setSelected(null)
      setShowResult(false)
    } else {
      setFinished(true)
    }
  }

  const handleRestart = () => {
    setCurrentIdx(0)
    setScore(0)
    setSelected(null)
    setShowResult(false)
    setFinished(false)
  }

  if (finished) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">{score >= 3 ? '🎉' : '💪'}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">练习完成！</h2>
        <p className="text-lg text-gray-500 mb-2">
          你答对了 <span className="font-bold text-violet-600">{score}</span> / {QUIZZES.length} 题
        </p>
        <p className="text-sm text-gray-400 mb-8">
          {score === QUIZZES.length ? '太棒了！你对同意有了很好的理解。' : score >= 2 ? '不错的表现，继续学习吧！' : '加油！多练习会越来越好。'}
        </p>
        <button onClick={handleRestart} className="btn-primary px-8 py-3">再来一次</button>
      </div>
    )
  }

  return (
    <div>
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-violet-600 rounded-full transition-all duration-300" style={{ width: `${((currentIdx + 1) / QUIZZES.length) * 100}%` }} />
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">{currentIdx + 1} / {QUIZZES.length}</span>
      </div>

      {/* Question */}
      <div className="card mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{QUIZ_TITLE}</h2>
        <p className="text-gray-700 leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleSelect(i)}
            className={`w-full card text-left transition-all ${
              selected === i
                ? opt.correct ? 'ring-2 ring-green-500 bg-green-50' : 'ring-2 ring-red-400 bg-red-50'
                : selected !== null ? 'opacity-40' : 'hover:border-violet-300'
            }`}>
            <div className="flex items-start gap-3">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                selected === i
                  ? opt.correct ? 'bg-green-500 text-white' : 'bg-red-400 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>{String.fromCharCode(65 + i)}</span>
              <div className="flex-1">
                <p className={`font-medium ${selected === i ? (opt.correct ? 'text-green-800' : 'text-red-700') : 'text-gray-900'}`}>
                  {opt.text}
                </p>
                {selected === i && (
                  <p className={`text-sm mt-2 ${opt.correct ? 'text-green-700' : 'text-red-600'}`}>{opt.feedback}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {showResult && (
        <div className="mt-6 text-center">
          <button onClick={handleNext} className="btn-primary px-8 py-3">
            {currentIdx < QUIZZES.length - 1 ? '下一题' : '查看结果'}
          </button>
        </div>
      )}
    </div>
  )
}
