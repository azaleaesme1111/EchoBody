import { useState, useRef } from 'react'
import { useAuth } from '@/providers/AuthProvider'

const TEMPLATES: { id: string; title: string; grade: string; duration: string; objectives: string[]; steps: string[] }[] = [
  {
    id: '1',
    title: 'Getting to Know My Body',
    grade: 'Elementary Grades 3-4',
    duration: '40 minutes',
    objectives: ['Recognize main body parts', 'Understand private areas of the body', 'Learn to use correct names for body parts'],
    steps: [
      'Introduction: Sing "Head, Shoulders, Knees and Toes" to spark interest (5 min)',
      'Teaching: Use a human body diagram to identify main parts (10 min)',
      'Activity: Body part name matching card game (10 min)',
      'Discussion: Which parts are private and why we should protect them (10 min)',
      'Summary: Body autonomy song, distribute learning cards (5 min)',
    ],
  },
  {
    id: '2',
    title: 'Body Boundaries and Respect',
    grade: 'Elementary Grades 5-6',
    duration: '45 minutes',
    objectives: ['Understand the concept of body boundaries', 'Learn to identify uncomfortable contact', 'Master methods to refuse unsafe contact'],
    steps: [
      'Introduction: Picture book story "Don\'t Touch Me Without Asking" (5 min)',
      'Teaching: Body traffic light concept — safe / uncomfortable / dangerous (10 min)',
      'Scenario discussion: Practice judging different contact situations (10 min)',
      'Role play: Learn three techniques for saying "no" (15 min)',
      'Summary: Safety network map — who to turn to when in difficulty (5 min)',
    ],
  },
  {
    id: '3',
    title: 'Consent',
    grade: 'Middle School Grades 7-9',
    duration: '50 minutes',
    objectives: ['Understand the definition and elements of consent', 'Learn to identify different forms of consent', 'Master how to express boundaries in relationships'],
    steps: [
      'Introduction: Case discussion — "Does saying yes always mean consent?" (5 min)',
      'Teaching: FRIES consent model (Free, Reversible, Informed, Enthusiastic, Specific) (15 min)',
      'Group activity: Scenario card judgment practice (15 min)',
      'Role play: How to express consent / refusal (10 min)',
      'Summary: Commitment wall on respecting each other\'s boundaries (5 min)',
    ],
  },
  {
    id: '4',
    title: 'Online Social Safety',
    grade: 'Middle School Grades 7-9',
    duration: '40 minutes',
    objectives: ['Identify online social risks', 'Learn to protect personal privacy information', 'Master methods to handle online harassment'],
    steps: [
      'Introduction: Real case discussion (5 min)',
      'Teaching: Online personal information safety checklist (10 min)',
      'Scenario judgment: What information should not be shared (10 min)',
      'Role play: What to do when encountering online harassment (10 min)',
      'Summary: Online safety commitment letter (5 min)',
    ],
  },
]

const DISCUSSION_QUESTIONS: { id: string; topic: string; question: string; age: string }[] = [
  { id: '1', topic: 'Body Boundaries', question: 'If you don\'t like someone touching you, what can you say?', age: 'Elementary' },
  { id: '2', topic: 'Consent', question: 'What is true "consent"? Does staying silent mean consent?', age: 'Middle School' },
  { id: '3', topic: 'Online Social', question: 'What should you do if someone makes you uncomfortable online?', age: 'Middle School' },
  { id: '4', topic: 'Acquaintance Relationships', question: 'If someone you know makes you uncomfortable, do you have the right to say "no"?', age: 'Middle School' },
  { id: '5', topic: 'Seeking Help', question: 'When you encounter difficulties, who would you turn to for help? Why?', age: 'Elementary' },
]

const AGE_GROUPS = [
  { value: 'elementary', label: 'Elementary School' },
  { value: 'middle', label: 'Middle School' },
  { value: 'high', label: 'High School' },
] as const

const TOPIC_EXAMPLES = [
  'Body Boundaries',
  'Consent and Personal Space',
  'Online Social Safety',
  'Understanding Puberty',
  'Respectful Relationships',
  'Dealing with Harassment',
  'Digital Footprint and Privacy',
]

export default function CourseDesign() {
  const { requireAuth } = useAuth()
  const [tab, setTab] = useState<'template' | 'discussion'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const [aiAgeGroup, setAiAgeGroup] = useState('elementary')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleGenerate = async () => {
    if (!aiTopic.trim()) return
    if (!requireAuth()) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setAiLoading(true)
      setAiError('')
      setAiResult('')

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

        const response = await fetch(`${supabaseUrl}/functions/v1/ai-lesson`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({ topic: aiTopic.trim(), ageGroup: aiAgeGroup }),
        })

        if (!response.ok) {
          const errText = await response.text()
          let errorMsg = `Server error ${response.status}`
          try {
            const errJson = JSON.parse(errText)
            errorMsg = errJson.error || errorMsg
          } catch {
            errorMsg = errText.slice(0, 200)
          }
          setAiError(errorMsg)
          return
        }

        const data = await response.json()
        if (data.error) {
          setAiError(data.error)
          return
        }

        setAiResult(data.content || 'No response generated')
      } catch (e: any) {
        setAiError(e.message || 'Network error, please try again')
      } finally {
        setAiLoading(false)
      }
    }, 500)
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
            {t === 'template' ? 'Lesson Templates' : 'Discussion Questions'}
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
                  {expanded ? 'Collapse' : 'View details'}
                </button>
              </div>
              {expanded && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Objectives</h4>
                    <ul className="space-y-1">
                      {selected.objectives.map((o, i) => (
                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />{o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Lesson Flow</h4>
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
                    <button className="btn-primary text-sm py-2 px-4">Export Lesson Plan</button>
                    <button className="btn-secondary text-sm py-2 px-4">Download PPT Template</button>
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

      {/* AI Assistant */}
      <div className="mt-8 card">
        <h3 className="font-bold text-gray-900 text-lg mb-2">AI Lesson Design Assistant</h3>
        <p className="text-sm text-gray-500 mb-4">Select an age group and enter a topic to generate a lesson plan framework</p>

        {/* Age group selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
          <div className="flex gap-2">
            {AGE_GROUPS.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setAiAgeGroup(g.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                  aiAgeGroup === g.value
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic input with examples */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Course Topic</label>
          <input
            type="text"
            value={aiTopic}
            onChange={e => setAiTopic(e.target.value)}
            placeholder="e.g. Body Boundaries, Consent, Online Safety..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-gray-900"
            onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs text-gray-400">Examples:</span>
            {TOPIC_EXAMPLES.map(ex => (
              <button
                key={ex}
                type="button"
                onClick={() => setAiTopic(ex)}
                className="text-xs bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full hover:bg-violet-100 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={aiLoading || !aiTopic.trim()}
          className="btn-primary px-6 py-3 disabled:opacity-50"
        >
          {aiLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating...
            </span>
          ) : 'Generate Lesson Plan'}
        </button>

        {/* Error message */}
        {aiError && (
          <p className="mt-3 text-sm text-red-500">{aiError}</p>
        )}

        {/* Generated result */}
        {aiResult && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
            {aiResult}
          </div>
        )}
      </div>
    </div>
  )
}
