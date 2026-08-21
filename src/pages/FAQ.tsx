import { useState } from 'react'
import { FAQItem } from '@/providers/AuthProvider'

const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'Where do I come from?',
    ages: ['child', 'teen'],
    content: 'You come from the love of your mom and dad. Inside dad\'s body is a tiny "seed" called a sperm, and inside mom\'s body is a tiny "seed" called an egg. When the sperm and egg meet, they slowly grow together in a special room inside mom\'s body (the uterus), and eventually become you.',
    tips: 'You can use the picture book "Tiny Sperm\'s Big Race" as a teaching aid, explaining in a simple and fun way.',
    activity: 'Drawing activity: Ask students to draw what they imagine about where they came from.',
  },
  {
    id: '2',
    question: 'What is "liking" someone?',
    ages: ['child', 'teen', 'adult'],
    content: 'Liking is a warm feeling. When you\'re happy being with someone, you really want to see them, and you want to share things with them — that\'s liking. It can be friendship or something else. Everyone feels it differently, and the important thing is knowing what that feeling is.',
    tips: 'Guide students to distinguish between "liking" and "loving", understanding different levels of feelings.',
    activity: 'Write a list of "People and things I like" and share the parts you\'re comfortable sharing.',
  },
  {
    id: '3',
    question: 'What is Consent?',
    ages: ['teen', 'adult'],
    content: 'Consent means someone clearly and willingly says "yes". Consent must meet several conditions: it is free (not forced), reversible (you can say "no" anytime), informed (you know what will happen), enthusiastic (you truly want to), and specific (agreeing to one thing doesn\'t mean agreeing to everything).',
    tips: 'Use the FRIES model (Free, Reversible, Informed, Enthusiastic, Specific) for teaching.',
    activity: 'Scenario cards: Give students several scenarios to judge whether consent is present.',
  },
  {
    id: '4',
    question: 'What if someone I know makes me uncomfortable?',
    ages: ['child', 'teen'],
    content: 'Remember: any contact that makes your body feel uncomfortable is wrong, no matter who it is — even a teacher, relative, or someone you know well. You have the right to say no, the right to leave, and the right to tell a trusted adult. Secrets and privacy are different: healthy privacy never makes you afraid or uncomfortable.',
    tips: 'Emphasize "your body, your rules" — students should know they don\'t need to compromise with anyone.',
    activity: 'Practice three techniques for saying "no": say it loudly, turn and walk away, find someone to help.',
  },
  {
    id: '5',
    question: 'What if someone asks me for photos?',
    ages: ['teen', 'adult'],
    content: 'Anyone asking you for photos (especially private photos) is wrong. You should: 1) Not send them; 2) Not reply; 3) Tell a trusted adult immediately; 4) Keep the evidence. Remember: it\'s not your fault — the other person is at fault.',
    tips: 'Remind students that once information is sent online, it cannot be fully deleted. The risk is high.',
    activity: 'Create a "Online Safety Checklist" and post it somewhere visible in the classroom.',
  },
  {
    id: '6',
    question: 'My body is changing — is that normal?',
    ages: ['child', 'teen'],
    content: 'Completely normal! Everyone\'s body changes during puberty — height, weight, voice, secondary sexual characteristics, and more. These changes mean your body is growing healthily. Everyone changes at different times and at different speeds — that\'s all normal.',
    tips: 'Distinguish between changes for boys and girls, and prepare appropriate educational materials.',
    activity: 'Anonymous question box: Let students write down the body change questions they most want answered.',
  },
]

const AGE_LABELS: Record<string, string> = { child: 'Elementary', teen: 'Middle School', adult: 'High School & Up' }

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
            placeholder="Search questions..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none text-gray-900" />
        </div>
        <div className="flex gap-2">
          {(['all', 'child', 'teen', 'adult'] as const).map(a => (
            <button key={a} onClick={() => setAgeFilter(a)}
              className={`px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                ageFilter === a ? 'bg-violet-600 text-white' : 'bg-white text-gray-500 border border-gray-200'
              }`}>
              {a === 'all' ? 'All' : AGE_LABELS[a]}
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
                  <p className="text-xs font-medium text-yellow-800 mb-1">Notes</p>
                  <p className="text-sm text-yellow-700">{f.tips}</p>
                </div>
                {f.activity && (
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-xs font-medium text-green-800 mb-1">Suggested Activity</p>
                    <p className="text-sm text-green-700">{f.activity}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="text-xs text-violet-600 hover:text-violet-800 font-medium">Copy Answer</button>
                  <button className="text-xs text-gray-400 hover:text-gray-600 font-medium">Export Lesson Plan</button>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
