import { useState, useRef } from 'react'
import { Send, Presentation, Sparkles } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'
import { THEMES } from '@/components/StylePickerModal'
import type { SlideTheme } from '@/components/StylePickerModal'
import SlideViewer from '@/components/SlideViewer'
import type { SlideData, TypographyConfig } from '@/components/SlideViewer'
import { TYPOGRAPHY } from '@/components/SlideViewer'

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

// ── PRD: Parameter Options ──────────────────────────────────────────────────
const GENDER_OPTIONS = [
  { value: 'Co-ed', title: 'Co-ed', subtitle: 'Inclusive & interactive discussion for mixed groups' },
  { value: 'Girls-only', title: 'Girls-only', subtitle: 'Puberty, body development, girls\' safety & autonomy' },
  { value: 'Boys-only', title: 'Boys-only', subtitle: 'Puberty, respecting boundaries, responsibility & empathy' },
]

const SETTING_OPTIONS = [
  { value: 'Standard Public School', label: 'Public' },
  { value: 'Private School', label: 'Private' },
  { value: 'International School', label: 'International' },
  { value: 'Alternative / Community School', label: 'Alternative' },
]

const CLASS_SIZE_OPTIONS = [
  { value: 'Small Group (5-10)', label: '5-10' },
  { value: 'Standard Class (20-30)', label: '20-30' },
  { value: 'Large Class (30+)', label: '30+' },
]

const STYLE_OPTIONS = [
  { value: 'Balanced (Discussion & Activity)', label: 'Balanced' },
  { value: 'Discussion-heavy', label: 'Discussion' },
  { value: 'Activity-heavy', label: 'Activity' },
  { value: 'Lecture-based', label: 'Lecture' },
  { value: 'Project-based', label: 'Project' },
]

const TOPIC_EXAMPLES = [
  'Body Boundaries',
  'Consent and Personal Space',
  'Online Social Safety',
  'Understanding Puberty',
  'Respectful Relationships',
  'Dealing with Harassment',
  'Digital Footprint and Privacy',
]

// ── Markdown sanitize helper ─────────────────────────────────────────────────
function sanitizeMarkdown(text: string): string {
  let s = text
  // 1. Fix unclosed ** bold: if odd number of ** on a line, remove the trailing one
  s = s.split('\n').map(line => {
    const count = (line.match(/\*\*/g) || []).length
    if (count % 2 !== 0) {
      // Remove the last standalone ** that has no pair
      const lastIdx = line.lastIndexOf('**')
      if (lastIdx !== -1) {
        line = line.slice(0, lastIdx) + line.slice(lastIdx + 2)
      }
    }
    return line
  }).join('\n')
  // 2. Convert bare asterisk bullets (* item) to proper markdown dashes (- item)
  s = s.replace(/^(\*)\s+/gm, '- ')
  // 3. Ensure ## headings have a blank line before them (for proper paragraph breaks)
  s = s.replace(new RegExp('([^\\n])\\n(#{1,3}\\s)', 'g'), '$1\\n\\n$2')
  // 4. Normalize multiple consecutive blank lines to max 2
  s = s.replace(/\n{3,}/g, '\n\n')
  // 5. Strip leading/trailing whitespace
  return s.trim()
}

// ── Simple Markdown → JSX renderer ──────────────────────────────────────────
function renderMarkdown(text: string) {
  const clean = sanitizeMarkdown(text)
  const sections: { title: string; content: string }[] = []
  const parts = clean.split(/^## /m)

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const nlIdx = trimmed.indexOf('\n')
    if (nlIdx === -1) {
      sections.push({ title: trimmed.replace(/\*\*/g, ''), content: '' })
    } else {
      sections.push({
        title: trimmed.slice(0, nlIdx).replace(/\*\*/g, ''),
        content: trimmed.slice(nlIdx + 1),
      })
    }
  }

  if (sections.length === 0) {
    return <p className="text-sm text-gray-700 whitespace-pre-wrap">{clean}</p>
  }

  return (
    <div className="space-y-4">
      {sections.map((sec, i) => (
        <div key={i}>
          <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
            {sec.title}
          </h4>
          <div className="text-sm text-gray-700 leading-relaxed">
            {sec.content.split('\n').map((line, j) => {
              // Strip any remaining ** bold markers for safe innerHTML
              const safe = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              if (line.startsWith('- ') || line.startsWith('* ')) {
                return (
                  <div key={j} className="flex items-start gap-2 ml-2 my-0.5">
                    <span className="w-1 h-1 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: safe.slice(2) }} />
                  </div>
                )
              }
              if (/^\d+\.\s/.test(line)) {
                const t = line.replace(/^\d+\.\s/, '')
                return (
                  <div key={j} className="flex items-start gap-2 ml-2 my-0.5">
                    <span dangerouslySetInnerHTML={{ __html: t }} />
                  </div>
                )
              }
              if (line.startsWith('### ')) {
                return <p key={j} className="font-semibold text-gray-800 mt-3 mb-1" dangerouslySetInnerHTML={{ __html: safe.slice(4) }} />
              }
              if (line.trim() === '') return <div key={j} className="h-2" />
              return <p key={j} className="my-1" dangerouslySetInnerHTML={{ __html: safe }} />
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CourseDesign() {
  const { requireAuth } = useAuth()
  const [tab, setTab] = useState<'template' | 'discussion'>('template')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  // AI generation state
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const [aiGrade, setAiGrade] = useState('')
  const [aiDuration, setAiDuration] = useState('')
  const [aiGender, setAiGender] = useState(GENDER_OPTIONS[0].value)
  const [aiSetting, setAiSetting] = useState('')
  const [aiClassSize, setAiClassSize] = useState('')
  const [aiStyle, setAiStyle] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Refine chat state
  const [refineMessages, setRefineMessages] = useState<{ role: string; content: string }[]>([])
  const [refineInput, setRefineInput] = useState('')
  const [refineLoading, setRefineLoading] = useState(false)

  // Slides flow state
  const [slides, setSlides] = useState<SlideData[] | null>(null)
  const [slidesLoading, setSlidesLoading] = useState(false)
  const [slidesError, setSlidesError] = useState('')
  const [currentTheme, setCurrentTheme] = useState<SlideTheme | null>(null)
  const [typography, setTypography] = useState<TypographyConfig | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refineEndRef = useRef<HTMLDivElement | null>(null)

  // ── API call helper ──────────────────────────────────────────────────────
  const callApi = async (body: Record<string, any>) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    console.log('[callApi] Requesting:', body.action, '| URL:', supabaseUrl)
    const response = await fetch(`${supabaseUrl}/functions/v1/ai-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(body),
    })
    if (!response.ok) {
      const errText = await response.text()
      let errorMsg = `Server error ${response.status}`
      try { const j = JSON.parse(errText); errorMsg = j.error || errorMsg } catch { errorMsg = errText.slice(0, 200) }
      throw new Error(errorMsg)
    }
    const data = await response.json()
    if (data.error) throw new Error(data.error)
    return data
  }

  const handleGenerate = async () => {
    if (!aiTopic.trim()) return
    if (!requireAuth()) return
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      setAiLoading(true)
      setAiError('')
      setAiResult('')
      setRefineMessages([])
      setSlides(null)
      setSlidesError('')

      try {
        const payload: Record<string, any> = {
          action: 'generate',
          topic: aiTopic.trim(),
          gradeOrAge: aiGrade,
          lessonDuration: aiDuration,
          genderFocus: aiGender,
        }
        // Only include advanced settings if user actively selected non-empty values
        if (aiSetting) payload.schoolSetting = aiSetting
        if (aiClassSize) payload.classSize = aiClassSize
        if (aiStyle) payload.teachingStyle = aiStyle
        console.log('[CourseDesign] API Payload:', JSON.stringify(payload, null, 2))
        const data = await callApi(payload)
        setAiResult(data.content || 'No response generated')
      } catch (e: any) {
        setAiError(e.message || 'Network error, please try again')
      } finally {
        setAiLoading(false)
      }
    }, 500)
  }

  // ── Refine with AI ──────────────────────────────────────────────────────
  const handleRefine = async () => {
    if (!refineInput.trim() || !aiResult || refineLoading) return
    const feedback = refineInput.trim()
    setRefineMessages(prev => [...prev, { role: 'user', content: feedback }])
    setRefineInput('')
    setRefineLoading(true)

    try {
      const refinePayload = { action: 'refine', currentPlan: aiResult, feedback }
      console.log('[Refine] Request sent:', JSON.stringify({ action: 'refine', feedbackLength: feedback.length, planLength: aiResult.length }, null, 2))
      const data = await callApi(refinePayload)
      console.log('[Refine] Response received:', data.content ? `${data.content.length} chars` : 'EMPTY')
      setRefineMessages(prev => [...prev, { role: 'assistant', content: data.content }])
      setAiResult(data.content)
    } catch (e: any) {
      setRefineMessages(prev => [...prev, { role: 'assistant', content: `Error: ${e.message}` }])
    } finally {
      setRefineLoading(false)
      setTimeout(() => refineEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  // ── Grade Level Inference (3-tier: low/mid/high, decoupled from color theme) ─
  const inferGradeLevel = (): 'low' | 'mid' | 'high' => {
    const g = aiGrade.toLowerCase().trim()

    // Extract explicit number: "grade 4", "grade4", "4th grade", "4th", "4-6"
    const numMatch = g.match(/(\d+)(?:\s*[-–]\s*(\d+))?/)
    if (numMatch) {
      const first = parseInt(numMatch[1])
      const last = numMatch[2] ? parseInt(numMatch[2]) : first
      const avg = (first + last) / 2
      if (avg >= 1 && avg <= 5) return 'low'
      if (avg >= 6 && avg <= 8) return 'mid'
      if (avg >= 9) return 'high'
    }

    // Keyword matching
    if (/elementary|primary|kids?|young|lower\sgrade/i.test(g)) return 'low'
    if (/middle|junior|intermediate|6th|7th|8th/i.test(g)) return 'mid'
    if (/high|secondary|senior|teen|adolescen|adult/i.test(g)) return 'high'

    // Age range: "8-10", "10-12 years", "15-18"
    const ageMatch = g.match(/(\d+)\s*[-–]\s*(\d+)\s*(year|yr|y\.o)/i)
    if (ageMatch) {
      const avg = (parseInt(ageMatch[1]) + parseInt(ageMatch[2])) / 2
      if (avg <= 10) return 'low'
      if (avg <= 13) return 'mid'
      return 'high'
    }

    // Default
    return 'mid'
  }

  // Smart default theme based on grade context
  const inferDefaultTheme = (): SlideTheme => {
    const level = inferGradeLevel()
    if (level === 'low') return THEMES.find(t => t.id === 'warm-cream') || THEMES[0]
    // Check topic for context-aware color selection
    const topic = aiTopic.toLowerCase()
    if (/physi|body|health|boundar/i.test(topic)) return THEMES.find(t => t.id === 'soft-sage') || THEMES[1]
    if (/online|social|digital|cyber|network/i.test(topic)) return THEMES.find(t => t.id === 'ocean-breeze') || THEMES[2]
    return THEMES.find(t => t.id === 'ocean-breeze') || THEMES[2]
  }

  // ── Generate Slides (auto-infer grade + theme) ─────────────────────────
  const handleGenerateSlides = async () => {
    const level = inferGradeLevel()
    const theme = inferDefaultTheme()
    const typo = TYPOGRAPHY[level]

    const levelNames = { low: 'Low (Grade 3-5)', mid: 'Mid (Grade 6-8)', high: 'High (Grade 9-12)' }
    console.log(`[PPT Generator] Parsed Grade Level: ${levelNames[level]} (input: "${aiGrade}")`)
    console.log(`[PPT Generator] Theme: ${theme.name} | Typography: ${level} (${typo.titleFont}/${typo.bodyFont})`)

    setCurrentTheme(theme)
    setTypography(typo)
    setSlidesLoading(true)
    setSlidesError('')
    setSlides(null)

    try {
      const data = await callApi({ action: 'slides', lessonPlan: aiResult })
      setSlides(data.slides || [])
    } catch (e: any) {
      setSlidesError(e.message || 'Failed to generate slides')
    } finally {
      setSlidesLoading(false)
    }
  }

  const selected = TEMPLATES.find(t => t.id === selectedTemplate)

  return (
    <div>
      {/* ── AI Lesson Design Assistant (PRD v2) ────────────────────────── */}
      <div className="card mb-6">
        <h3 className="font-bold text-gray-900 text-lg mb-2">AI Lesson Design Assistant</h3>
        <p className="text-sm text-gray-500 mb-5">Configure parameters below to generate a tailored lesson plan framework</p>

        {/* Grade / Age */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Grade / Age</label>
          <input
            type="text"
            value={aiGrade}
            onChange={e => setAiGrade(e.target.value)}
            placeholder="e.g. Grade 5, 10-12 years old..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-gray-900"
          />
        </div>

        {/* Target Gender */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Gender</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {GENDER_OPTIONS.map(g => (
              <button
                key={g.value} type="button"
                onClick={() => setAiGender(g.value)}
                className={`px-4 py-3 rounded-xl border text-left transition-all ${
                  aiGender === g.value
                    ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-100'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="text-sm font-bold text-gray-900">{g.title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{g.subtitle}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
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
              <button key={ex} type="button" onClick={() => setAiTopic(ex)}
                className="text-xs bg-violet-50 text-violet-600 px-2.5 py-1 rounded-full hover:bg-violet-100 transition-colors">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Duration</label>
          <input
            type="text"
            value={aiDuration}
            onChange={e => setAiDuration(e.target.value)}
            placeholder="e.g. 45 min, 1 hour..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-gray-900"
          />
        </div>

        {/* Advanced Settings */}
        <div className="mb-5">
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-violet-600 transition-colors mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>
              <path d="M9 18l6-6-6-6" />
            </svg>
            Advanced Settings
            {showAdvanced && <span className="text-xs text-violet-400 ml-1">(optional)</span>}
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">School Setting</label>
                <select value={aiSetting} onChange={e => setAiSetting(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-violet-500 outline-none text-sm text-gray-900 bg-white">
                  <option value="" disabled>Select setting...</option>
                  {SETTING_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Class Size</label>
                <select value={aiClassSize} onChange={e => setAiClassSize(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-violet-500 outline-none text-sm text-gray-900 bg-white">
                  <option value="" disabled>Select class size...</option>
                  {CLASS_SIZE_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Teaching Style</label>
                <select value={aiStyle} onChange={e => setAiStyle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-violet-500 outline-none text-sm text-gray-900 bg-white">
                  <option value="" disabled>Select teaching style...</option>
                  {STYLE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          )}
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

        {/* Error */}
        {aiError && (
          <p className="mt-3 text-sm text-red-500">{aiError}</p>
        )}

        {/* Structured result */}
        {aiResult && (
          <div className="mt-6 border border-violet-100 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-50 to-pink-50 px-5 py-3 border-b border-violet-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-sm">Generated Lesson Plan</h4>
              <button onClick={() => navigator.clipboard.writeText(aiResult)}
                className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy
              </button>
            </div>
            <div className="px-5 py-4 bg-white">
              {renderMarkdown(aiResult)}
            </div>
          </div>
        )}

        {/* ── Refine with AI (chat) ──────────────────────────────────────── */}
        {aiResult && (
          <div className="mt-5 border-t border-gray-100 pt-5">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles size={14} className="text-violet-500" />
              Refine with AI
            </h4>

            {/* Message history */}
            {refineMessages.length > 0 && (
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {refineMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}>
                      {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                    </div>
                  </div>
                ))}
                {refineLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.3s]" />
                        Refining...
                      </span>
                    </div>
                  </div>
                )}
                <div ref={refineEndRef} />
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={refineInput}
                onChange={e => setRefineInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleRefine()}
                placeholder="e.g. Make the activity 10 minutes shorter, use simpler language..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-sm text-gray-900"
                disabled={refineLoading}
              />
              <button
                onClick={handleRefine}
                disabled={refineLoading || !refineInput.trim()}
                className="bg-violet-600 text-white px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ── Generate Slides CTA ─────────────────────────────────────────── */}
        {aiResult && (
          <div className="mt-5">
            <button
              onClick={handleGenerateSlides}
              disabled={slidesLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white py-3.5 px-6 rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-3 shadow-lg shadow-violet-200 disabled:opacity-60"
            >
              <Presentation size={20} />
              Generate Slides
            </button>
            {slidesLoading && (
              <div className="mt-3 text-center text-sm text-violet-600 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating slides...
                </div>
                <span className="text-xs text-violet-400">AI matched: {inferDefaultTheme().name} · {(() => { const l = inferGradeLevel(); return l === 'low' ? '🎨 Playful' : l === 'mid' ? '📐 Standard' : '📐 Editorial' })()} layout</span>
              </div>
            )}
            {slidesError && <p className="mt-2 text-sm text-red-500">{slidesError}</p>}
          </div>
        )}
      </div>

      {/* ── Lesson Templates & Discussion Questions ──────────────────── */}
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

      {/* ── Slide Viewer ────────────────────────────────────────────────── */}
      {slides && currentTheme && typography && (
        <SlideViewer
          slides={slides}
          theme={currentTheme}
          typography={typography}
          onClose={() => { setSlides(null); setCurrentTheme(null); setTypography(null) }}
        />
      )}
    </div>
  )
}
