import { useState } from 'react'
import { Scenario } from '@/providers/AuthProvider'

const SCENARIOS: Scenario[] = [
  {
    id: '1',
    title: 'Boundaries with Someone You Know',
    tag: 'Body Boundaries',
    description: 'On a weekend, your uncle comes to visit. When he hugs you, you feel uncomfortable. In front of many people, he says "Uncle just loves you this much" and pinches your cheek.',
    choices: [
      { text: 'Suffer in silence because he\'s an elder', feedback: 'This is not the right approach. You have the right to protect your feelings, and even elders must respect your boundaries.', correct: false },
      { text: 'Clearly tell your uncle "I don\'t like this"', feedback: 'Well done! You can express your discomfort in a gentle but firm way. Remember, your body, your rules.', correct: true },
      { text: 'Tell your mom and dad later', feedback: 'Great choice! If it\'s not convenient to say it then, telling a trusted adult afterward is the right thing to do.', correct: true },
      { text: 'Pretend it\'s fine and avoid him from now on', feedback: 'Avoidance doesn\'t solve the problem. Suppressing your feelings for a long time may affect your mental health. Find a safe moment to express how you feel.', correct: false },
    ],
  },
  {
    id: '2',
    title: 'Online Social Safety',
    tag: 'Online Safety',
    description: 'You met someone online who is 5 years older than you, and you get along great. One day they ask: "Can you send me a photo of yourself?" and say "This is just between us."',
    choices: [
      { text: 'Send a regular (non-private) photo', feedback: 'Even a normal photo shouldn\'t be sent to someone you only know online. Information shared online can be saved and spread, posing risks.', correct: false },
      { text: 'Refuse and tell your parents or teacher', feedback: 'Absolutely correct! Refuse any request that makes you uncomfortable, and tell a trusted adult. True online safety means protecting your privacy.', correct: true },
      { text: 'Don\'t reply and block them directly', feedback: 'This is also a safe approach. But if you feel distressed or scared, be sure to tell an adult.', correct: true },
      { text: 'Agree and ask "What will you send me?"', feedback: 'This puts you in danger. Never exchange private information — it\'s a manipulation tactic.', correct: false },
    ],
  },
  {
    id: '3',
    title: 'Consent',
    tag: 'Consent',
    description: 'You\'re with someone you like, and they want to hold your hand and get closer. But you\'re not ready yet.',
    choices: [
      { text: 'Go along with what they want', feedback: 'You don\'t have to. Your feelings matter most — you have the right to say "no" or "not yet" at any time.', correct: false },
      { text: 'Tell them "I\'m not ready for this, but we can still be friends"', feedback: 'Great communication! Clearly express your boundaries while showing you value the relationship.', correct: true },
      { text: 'Say nothing but lean back', feedback: 'Body language is an effective signal, but sometimes the other person may not notice it. It\'s best to add verbal communication for clarity.', correct: false },
      { text: 'Pretend to agree and figure it out later', feedback: 'This will make you very uncomfortable. Consent should be voluntary and clear — don\'t force yourself.', correct: false },
    ],
  },
  {
    id: '4',
    title: 'Harassment in Public',
    tag: 'Safety',
    description: 'On the subway, someone keeps staring at you and deliberately getting close. You feel very uncomfortable.',
    choices: [
      { text: 'Pretend not to notice and endure it', feedback: 'Endurance is not the solution. You have the right to feel safe in public places.', correct: false },
      { text: 'Shout at them loudly', feedback: 'Speaking up can deter some people, but also assess the safety of the situation and prioritize your own safety.', correct: true },
      { text: 'Move to a place with more people, or ask staff for help', feedback: 'An excellent approach! Finding a safe area and seeking help is the most effective way to protect yourself.', correct: true },
      { text: 'Record evidence and report to the police later', feedback: 'If you have evidence and the situation is serious, reporting is the right choice. But first ensure your immediate safety.', correct: true },
    ],
  },
]

export default function RolePlay() {
  const [view, setView] = useState<{ mode: 'list' | 'play'; scenario: Scenario | null; choiceIdx: number; done: boolean }>({
    mode: 'list', scenario: null, choiceIdx: -1, done: false,
  })
  const [selectedTag, setSelectedTag] = useState('All')

  const tags = ['All', ...Array.from(new Set(SCENARIOS.map(s => s.tag)))]
  const filtered = selectedTag === 'All' ? SCENARIOS : SCENARIOS.filter(s => s.tag === selectedTag)

  if (view.mode === 'play' && view.scenario) {
    const s = view.scenario
    return (
      <div>
        <button onClick={() => setView({ mode: 'list', scenario: null, choiceIdx: -1, done: false })}
          className="text-sm text-violet-600 mb-4 hover:text-violet-800 flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to scenarios
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
              Back to scenario list
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
              <span>{s.choices.length} choices</span>
              <span>•</span>
              <span>Role play</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
