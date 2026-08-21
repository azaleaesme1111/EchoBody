import { useState } from 'react'

const QUIZZES = [
  {
    id: '1',
    question: 'Student A voluntarily hugged Student B in the hallway during break, and Student B looked uncomfortable. Was Student A\'s behavior appropriate?',
    options: [
      { text: 'Yes, friendly hugging between classmates is normal', correct: false, feedback: 'Not necessarily. Every student has different boundaries. Even among friends, you should always ask first.' },
      { text: 'No, they should have asked "Can I hug you?" first', correct: true, feedback: 'Correct! Any physical contact should be done with the other person\'s consent first.' },
      { text: 'It depends on the situation', correct: false, feedback: 'While context matters, the core principle is: ask first, then act.' },
    ],
  },
  {
    id: '2',
    question: 'Which of the following constitutes "consent"?',
    options: [
      { text: 'A friend kept asking until you reluctantly agreed', correct: false, feedback: 'No. Consent must be voluntary and enthusiastic, not forced.' },
      { text: 'The other person was drunk and not thinking clearly, and you agreed', correct: false, feedback: 'No. Someone who is intoxicated cannot give true consent.' },
      { text: 'The other person was sober, willing, and enthusiastically agreed', correct: true, feedback: 'Correct! This reflects the "Free" and "Enthusiastic" parts of the FRIES model.' },
    ],
  },
  {
    id: '3',
    question: 'You receive an inappropriate photo online. The sender says "It\'s just for us to see." What should you do?',
    options: [
      { text: 'Keep it but don\'t tell anyone', correct: false, feedback: 'This is not safe. Even if they call it a secret, it could be a manipulation tactic.' },
      { text: 'Delete it and tell a trusted adult', correct: true, feedback: 'Correct! Protecting yourself comes first. Telling an adult can help resolve the situation.' },
      { text: 'Forward it to a close friend to look at together', correct: false, feedback: 'Wrong! This spreads inappropriate content and may harm the person in the photo.' },
    ],
  },
  {
    id: '4',
    question: 'Your good friend had a lot to drink at a party and says to you "I\'m willing to go home with you." What should you do?',
    options: [
      { text: 'Since they said yes, it\'s fine', correct: false, feedback: 'No. Someone who is drunk cannot give valid consent. Making sure they are safe is the right thing to do.' },
      { text: 'Make sure they get home safely and contact their friends or family', correct: true, feedback: 'Correct! True care means protecting the other person\'s safety, not taking advantage of a vulnerable situation.' },
      { text: 'Take advantage of their impaired state and do what you want', correct: false, feedback: 'This is illegal. Consent must be clear, willing, and given while sober.' },
    ],
  },
]

const QUIZ_TITLE = 'Consent Judgment Quiz'

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
        <p className="text-lg text-gray-500 mb-2">
          You got <span className="font-bold text-violet-600">{score}</span> / {QUIZZES.length} correct
        </p>
        <p className="text-sm text-gray-400 mb-8">
          {score === QUIZZES.length ? 'Awesome! You have a great understanding of consent.' : score >= 2 ? 'Nice work! Keep learning!' : 'Keep at it! Practice makes perfect.'}
        </p>
        <button onClick={handleRestart} className="btn-primary px-8 py-3">Try again</button>
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
            {currentIdx < QUIZZES.length - 1 ? 'Next question' : 'See results'}
          </button>
        </div>
      )}
    </div>
  )
}
