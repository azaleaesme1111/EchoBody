import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/providers/AuthProvider'

/* ── Mini-game scenario questions ────────────────────────────────────────── */
const GAME_QUESTIONS = [
  { q: 'A classmate wants to hug you but you feel uncomfortable. What should you do?', options: ['Agree because they are a classmate', 'Politely say you don\'t want to and step back', 'Say nothing and endure it', 'Hug them back anyway'], answer: 1, explain: 'You always have the right to refuse any physical contact that makes you uncomfortable.' },
  { q: 'Someone online asks you to share your home address. What is the safest response?', options: ['Share it — they seem friendly', 'Never share personal info with online strangers', 'Ask a parent or teacher first', 'Both B and C are correct'], answer: 3, explain: 'Personal information should never be shared online without checking with a trusted adult first.' },
  { q: 'A friend touches a part of your body that feels private and makes you uncomfortable. What should you do?', options: ['Keep it a secret', 'Tell a trusted adult immediately', 'Blame yourself', 'Wait and see if it happens again'], answer: 1, explain: 'Your body belongs to you. Always tell a trusted adult if someone touches you in a way that feels wrong.' },
  { q: 'Your friend shares a embarrassing photo of a classmate in a group chat. What should you do?', options: ['Forward it to others', 'Laugh along with the group', 'Don\'t share it and tell your friend it\'s not okay', 'Pretend you didn\'t see it'], answer: 2, explain: 'Sharing embarrassing photos of others is a form of bullying. Stand up for what\'s right.' },
  { q: 'Someone keeps bothering you even after you\'ve said "stop". What is the best action?', options: ['Keep tolerating it', 'Say "stop" louder and walk away, then tell a trusted adult', 'Bother them back', 'Leave school without telling anyone'], answer: 1, explain: 'If someone doesn\'t respect your boundaries, seek help from a trusted adult immediately.' },
]

/* ── Raw markdown renderer (preserves **bold** from LLM output) ──────────── */
function renderRawMd(text: string) {
  return text.split('\n').map((line, i) => {
    const safe = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    if (line.startsWith('# ')) return <h2 key={i} className="text-xl font-bold text-gray-900 mt-4 mb-2" dangerouslySetInnerHTML={{ __html: safe.slice(2) }} />
    if (line.startsWith('## ')) return <h3 key={i} className="text-base font-bold text-gray-900 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: safe.slice(3) }} />
    if (line.startsWith('### ')) return <p key={i} className="font-semibold text-gray-800 mt-2 mb-1" dangerouslySetInnerHTML={{ __html: safe.slice(4) }} />
    if (line.startsWith('- ') || line.startsWith('* ')) return <div key={i} className="flex items-start gap-2 ml-2 my-0.5 text-sm"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" /><span className="text-gray-700" dangerouslySetInnerHTML={{ __html: safe.slice(2) }} /></div>
    if (/^\d+\.\s/.test(line)) return <div key={i} className="ml-2 my-0.5 text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: safe.replace(/^\d+\.\s/, '') }} />
    if (line.trim() === '') return <div key={i} className="h-2" />
    return <p key={i} className="text-sm text-gray-700 my-1" dangerouslySetInnerHTML={{ __html: safe }} />
  })
}

/* ── Step labels ─────────────────────────────────────────────────────────── */
const STEPS = ['Reading', 'Mini Game', 'Anonymous Box']

export default function CheckinPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  /* ── State ─────────────────────────────────────────────────────────────── */
  const [assignment, setAssignment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [showNameGate, setShowNameGate] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [submissionId, setSubmissionId] = useState<string | null>(null)

  // Step states
  const [step1Done, setStep1Done] = useState(false)
  const [step2Done, setStep2Done] = useState(false)
  const [step2Score, setStep2Score] = useState(0)
  const [step3Done, setStep3Done] = useState(false)

  // Game state
  const [gameQ, setGameQ] = useState(0)
  const [gameSelected, setGameSelected] = useState<number | null>(null)
  const [gameCorrect, setGameCorrect] = useState(0)
  const [gameFinished, setGameFinished] = useState(false)

  // Anonymous question
  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [noQuestion, setNoQuestion] = useState(false)

  /* ── Load assignment + existing submission ─────────────────────────────── */
  useEffect(() => {
    if (!code) return
    ;(async () => {
      const { data: a } = await supabase.from('assignments').select('*').eq('join_code', code.toUpperCase()).single()
      if (!a) { setError('Invalid join code. Please check with your teacher.'); setLoading(false); return }
      setAssignment(a)

      const saved = localStorage.getItem(`checkin_${code}`)
      if (saved) {
        const { studentName: n } = JSON.parse(saved)
        setStudentName(n)
        const { data: sub } = await supabase.from('assignment_submissions').select('*').eq('assignment_id', a.id).eq('student_name', n).maybeSingle()
        if (sub) {
          setSubmissionId(sub.id)
          setStep1Done(sub.step1_reading)
          setStep2Done(sub.step2_completed)
          setStep2Score(sub.step2_game_score)
          setStep3Done(sub.step3_completed)
          if (sub.step1_reading) setCurrentStep(2)
          if (sub.step2_completed) setCurrentStep(3)
          if (sub.step3_completed) setCurrentStep(4)
        }
      } else if (!user) {
        setShowNameGate(true)
      }
      setLoading(false)
    })()
  }, [code]) // eslint-disable-line

  /* ── Helpers ───────────────────────────────────────────────────────────── */
  const progress = step1Done && step2Done && step3Done ? 100 : step1Done && step2Done ? 66 : step1Done ? 33 : 0

  const updateStep = async (updates: Record<string, any>) => {
    if (!submissionId || !assignment) return
    const { data, error: err } = await supabase.from('assignment_submissions').update(updates).eq('id', submissionId).select().single()
    if (err) console.error('[Checkin] updateStep error:', err)
    else if (data) setSubmissionId(data.id)
  }

  const initSubmission = async (name: string) => {
    const uid = user?.id ?? null
    const { data, error: err } = await supabase.from('assignment_submissions').insert({ assignment_id: assignment.id, student_name: name, user_id: uid }).select().single()
    if (err) { console.error('[Checkin] initSubmission error:', err); return }
    if (data) setSubmissionId(data.id)
  }

  /* ── Handlers ──────────────────────────────────────────────────────────── */
  const handleNameSubmit = async () => {
    if (!studentName.trim()) return
    const n = studentName.trim()
    localStorage.setItem(`checkin_${code}`, JSON.stringify({ studentName: n }))
    setShowNameGate(false)
    await initSubmission(n)
  }

  const handleStep1Done = async () => {
    setStep1Done(true)
    setCurrentStep(2)
    await updateStep({ step1_reading: true })
  }

  const handleGameAnswer = (idx: number) => {
    if (gameSelected !== null) return
    setGameSelected(idx)
    if (idx === GAME_QUESTIONS[gameQ].answer) setGameCorrect(c => c + 1)
  }

  const handleGameNext = () => {
    if (gameQ < GAME_QUESTIONS.length - 1) {
      setGameQ(q => q + 1)
      setGameSelected(null)
    } else {
      setGameFinished(true)
    }
  }

  const handleGameFinish = async () => {
    const score = Math.round((gameCorrect / GAME_QUESTIONS.length) * 100)
    setStep2Score(score)
    setStep2Done(true)
    setCurrentStep(3)
    await updateStep({ step2_game_score: score, step2_completed: true })
  }

  const handleSubmitQuestion = async () => {
    if (submitting) return
    if (!noQuestion && !question.trim()) return
    setSubmitting(true)
    setStep3Done(true)
    setCurrentStep(4)
    const qText = noQuestion ? '(No question)' : question.trim()
    await updateStep({ step3_question: qText, step3_completed: true, completed_at: new Date().toISOString() })
    setSubmitting(false)
  }

  /* ── Loading / Error ───────────────────────────────────────────────────── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-pink-50">
      <div className="flex items-center gap-3 text-violet-600"><svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>Loading your lesson...</div>
    </div>
  )
  if (error || !assignment) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-pink-50">
      <div className="text-center"><p className="text-red-500 mb-4">{error || 'Assignment not found'}</p><button onClick={() => navigate('.')} className="btn-primary px-6 py-2">Go Home</button></div>
    </div>
  )

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-violet-100 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-bold text-gray-900 text-lg">{assignment.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Code: <span className="font-mono font-bold text-violet-600">{code?.toUpperCase()}</span>{studentName ? ` · ${studentName}` : ''}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white border-b border-violet-50 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Progress</span>
            <span className="text-xs font-bold text-violet-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-violet-500 to-pink-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-3">
            {STEPS.map((label, i) => {
              const stepNum = i + 1
              const done = [step1Done, step2Done, step3Done][i]
              const active = currentStep === stepNum
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {done ? '✓' : stepNum}
                  </div>
                  <span className={`text-xs hidden sm:inline ${active ? 'text-violet-600 font-medium' : done ? 'text-green-600' : 'text-gray-400'}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Name Gate */}
        {showNameGate && (
          <div className="card text-center py-10">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">What's your name?</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your name to start the lesson check-in</p>
            <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleNameSubmit()} placeholder="Your first name" className="w-64 px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-center text-lg" autoFocus />
            <div><button onClick={handleNameSubmit} disabled={!studentName.trim()} className="btn-primary px-8 py-2.5 mt-4 disabled:opacity-50">Let's Go!</button></div>
          </div>
        )}

        {/* Step 1: Reading */}
        {!showNameGate && currentStep === 1 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 font-bold text-sm">1</div>
              <h2 className="font-bold text-gray-900 text-lg">Step 1: Read the Lesson</h2>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 mb-4 max-h-96 overflow-y-auto">{renderRawMd(assignment.lesson_content)}</div>
            {step1Done ? (
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Completed!</div>
            ) : (
              <button onClick={handleStep1Done} className="btn-primary px-6 py-2.5">I've read this ✓</button>
            )}
          </div>
        )}

        {/* Step 2: Mini Game */}
        {!showNameGate && currentStep === 2 && !gameFinished && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 font-bold text-sm">2</div>
              <h2 className="font-bold text-gray-900 text-lg">Step 2: Scenario Quiz</h2>
            </div>
            <div className="flex items-center gap-2 mb-4">
              {GAME_QUESTIONS.map((_, i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < gameQ ? 'bg-green-400' : i === gameQ ? 'bg-violet-500' : 'bg-gray-200'}`} />)}
            </div>
            <p className="text-xs text-gray-400 mb-2">Question {gameQ + 1} of {GAME_QUESTIONS.length}</p>
            <p className="font-medium text-gray-900 mb-4">{GAME_QUESTIONS[gameQ].q}</p>
            <div className="space-y-2 mb-4">
              {GAME_QUESTIONS[gameQ].options.map((opt, i) => (
                <button key={i} onClick={() => handleGameAnswer(i)} disabled={gameSelected !== null}
                  className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    gameSelected === null ? 'border-gray-200 hover:border-violet-300 hover:bg-violet-50'
                    : i === GAME_QUESTIONS[gameQ].answer ? 'border-green-500 bg-green-50 text-green-800'
                    : i === gameSelected ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-gray-100 opacity-50'
                  }`}>
                  <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                </button>
              ))}
            </div>
            {gameSelected !== null && (
              <div className="space-y-3">
                <p className={`text-sm ${gameSelected === GAME_QUESTIONS[gameQ].answer ? 'text-green-600' : 'text-red-500'}`}>
                  {gameSelected === GAME_QUESTIONS[gameQ].answer ? '✓ Correct! ' : '✗ Not quite. '}{GAME_QUESTIONS[gameQ].explain}
                </p>
                <button onClick={handleGameNext} className="btn-primary px-6 py-2">{gameQ < GAME_QUESTIONS.length - 1 ? 'Next Question →' : 'See Results'}</button>
              </div>
            )}
          </div>
        )}

        {/* Step 2 Results → finish */}
        {!showNameGate && currentStep === 2 && gameFinished && !step2Done && (
          <div className="card text-center py-8">
            <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🎮</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-gray-500 mb-1">You got <span className="font-bold text-violet-600">{gameCorrect}</span> out of <span className="font-bold">{GAME_QUESTIONS.length}</span> correct</p>
            <p className="text-3xl font-bold text-violet-600 mb-6">{Math.round((gameCorrect / GAME_QUESTIONS.length) * 100)}%</p>
            <button onClick={handleGameFinish} className="btn-primary px-8 py-2.5">Continue →</button>
          </div>
        )}

        {/* Step 3: Anonymous Box */}
        {!showNameGate && currentStep === 3 && (
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 font-bold text-sm">3</div>
              <h2 className="font-bold text-gray-900 text-lg">Step 3: Anonymous Question Box</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Ask any question you have about the lesson topic. Your question is anonymous — no one will know who asked it.</p>
            {step3Done ? (
              <div className="flex items-center gap-2 text-green-600 font-medium text-sm"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>Check-in complete!</div>
            ) : (
              <>
                <label className="flex items-center gap-2.5 mb-4 cursor-pointer select-none">
                  <input type="checkbox" checked={noQuestion} onChange={e => { setNoQuestion(e.target.checked); if (e.target.checked) setQuestion('') }}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                  <span className="text-sm text-gray-600">I don't have any questions right now</span>
                </label>
                <textarea value={question} onChange={e => setQuestion(e.target.value)} rows={4}
                  placeholder={noQuestion ? 'No question needed' : 'Type your question here...'}
                  disabled={noQuestion}
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-sm resize-none mb-4 ${noQuestion ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`} />
                <button onClick={handleSubmitQuestion} disabled={(!question.trim() && !noQuestion) || submitting} className="btn-primary px-6 py-2.5 disabled:opacity-50">{submitting ? 'Submitting...' : noQuestion ? 'Skip & Complete' : 'Submit Question'}</button>
              </>
            )}
          </div>
        )}

        {/* All done */}
        {!showNameGate && currentStep === 4 && (
          <div className="card text-center py-10">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h2>
            <p className="text-gray-500 mb-1">Great job, <span className="font-semibold">{studentName}</span>!</p>
            <p className="text-sm text-gray-400 mb-6">Quiz score: {step2Score}% · All 3 steps completed</p>
            <button onClick={() => { localStorage.removeItem(`checkin_${code}`); navigate('/'); }} className="btn-primary px-8 py-2.5">Back to Home</button>
          </div>
        )}
      </div>
    </div>
  )
}
