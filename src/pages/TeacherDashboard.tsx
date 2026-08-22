import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'
import { useAuth } from '@/providers/AuthProvider'

interface Assignment {
  id: string
  join_code: string
  title: string
  lesson_content: string
  created_at: string
}

interface Submission {
  id: string
  student_name: string
  step1_reading: boolean
  step2_completed: boolean
  step2_game_score: number
  step3_question: string | null
  step3_completed: boolean
  completed_at: string | null
  created_at: string
}

export default function TeacherDashboard() {
  const { user, openAuthModal } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selected, setSelected] = useState<Assignment | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [subLoading, setSubLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Load teacher's assignments — ONLY when authenticated
  useEffect(() => {
    if (!user) return
    loadAssignments()
  }, [user])

  const loadAssignments = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('assignments')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })
    setAssignments(data || [])
    setLoading(false)
  }

  // When an assignment card is clicked, load its submissions
  const selectAssignment = async (a: Assignment) => {
    if (selected?.id === a.id) {
      setSelected(null)
      setSubmissions([])
      return
    }
    setSelected(a)
    setSubLoading(true)
    const { data } = await supabase
      .from('assignment_submissions')
      .select('*')
      .eq('assignment_id', a.id)
      .order('created_at', { ascending: true })
    setSubmissions(data || [])
    setSubLoading(false)
  }

  const completedCount = submissions.filter(s => s.completed_at).length
  const totalCount = submissions.length
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const copySummary = () => {
    if (!selected) return
    const lines = [
      `Assignment: ${selected.title} (Code: ${selected.join_code})`,
      `Completion: ${completedCount}/${totalCount} (${completionPct}%)`,
      '',
      'Student Details:',
      ...submissions.map(s =>
        `  ${s.student_name} | Reading: ${s.step1_reading ? '✓' : '✗'} | Game Score: ${s.step2_game_score}/5 | Question: ${s.step3_question || '(none)'} | Completed: ${s.completed_at ? '✓' : '✗'}`
      ),
    ]
    navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportCSV = () => {
    if (!selected) return
    const header = 'Student Name,Step 1 Reading,Step 2 Game Score,Step 3 Question,Completed,Submitted At'
    const rows = submissions.map(s =>
      [
        `"${s.student_name}"`,
        s.step1_reading ? 'Yes' : 'No',
        s.step2_game_score,
        `"${(s.step3_question || '').replace(/"/g, '""')}"`,
        s.completed_at ? 'Yes' : 'No',
        s.created_at,
      ].join(',')
    )
    const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected.title.replace(/\s+/g, '_')}_report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Questions summary (only real questions, skip "(No question)")
  const questionsList = submissions.filter(
    s => s.step3_question && s.step3_question !== '(No question)'
  )

  // ── Auth guard: block unauthenticated access ──
  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-50 mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Teacher Dashboard requires authentication</h2>
        <p className="text-gray-500 mb-8 leading-relaxed">Please log in or sign up as a teacher to view your class assignment results and student progress.</p>
        <button
          onClick={openAuthModal}
          className="bg-cyan-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-cyan-700 transition-colors"
        >
          Log in / Sign up
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* My Assignments List */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">My Assignments</h2>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-500">No assignments yet.</p>
          <p className="text-sm text-gray-400 mt-1">Go to "Course Design" and click "Assign Lesson" to create one.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {assignments.map(a => {
            const isSelected = selected?.id === a.id
            return (
              <div key={a.id}>
                <button
                  onClick={() => selectAssignment(a)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50 shadow-md'
                      : 'border-gray-100 bg-white hover:border-cyan-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{a.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Code: <span className="font-mono font-bold text-cyan-600">{a.join_code}</span>
                        <span className="mx-2">·</span>
                        {new Date(a.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isSelected ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isSelected && (
                  <div className="mt-2 ml-2 mr-2 mb-4 p-5 bg-white rounded-xl border border-gray-100 shadow-sm">
                    {subLoading ? (
                      <div className="text-center py-8 text-gray-400">Loading student data...</div>
                    ) : submissions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No students have joined yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Share the code <span className="font-mono font-bold">{a.join_code}</span> with your students.</p>
                      </div>
                    ) : (
                      <>
                        {/* Stats row */}
                        <div className="flex items-center gap-6 mb-5">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-cyan-600">{completedCount}/{totalCount}</div>
                            <div className="text-xs text-gray-500 mt-1">Completed</div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>Completion Rate</span>
                              <span className="font-bold">{completionPct}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3">
                              <div
                                className="bg-gradient-to-r from-cyan-500 to-teal-400 h-3 rounded-full transition-all"
                                style={{ width: `${completionPct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Student detail table */}
                        <div className="overflow-x-auto mb-5">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-2 px-2 font-semibold text-gray-700">Student Name</th>
                                <th className="text-center py-2 px-2 font-semibold text-gray-700">Reading</th>
                                <th className="text-center py-2 px-2 font-semibold text-gray-700">Game Score</th>
                                <th className="text-left py-2 px-2 font-semibold text-gray-700">Question</th>
                                <th className="text-center py-2 px-2 font-semibold text-gray-700">Status</th>
                                <th className="text-right py-2 px-2 font-semibold text-gray-700">Time</th>
                              </tr>
                            </thead>
                            <tbody>
                              {submissions.map(s => (
                                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                                  <td className="py-2.5 px-2 font-medium text-gray-900">{s.student_name}</td>
                                  <td className="py-2.5 px-2 text-center">
                                    {s.step1_reading ? (
                                      <span className="text-green-500 text-lg">✓</span>
                                    ) : (
                                      <span className="text-gray-300 text-lg">—</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    <span className={`font-bold ${s.step2_game_score >= 4 ? 'text-green-600' : s.step2_game_score >= 2 ? 'text-amber-500' : 'text-red-500'}`}>
                                      {s.step2_game_score}/5
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-2 text-gray-600 max-w-[200px] truncate">
                                    {s.step3_question && s.step3_question !== '(No question)' ? s.step3_question : <span className="text-gray-300 italic">—</span>}
                                  </td>
                                  <td className="py-2.5 px-2 text-center">
                                    {s.completed_at ? (
                                      <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full">Done</span>
                                    ) : (
                                      <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">In Progress</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-2 text-right text-gray-400 text-xs">
                                    {new Date(s.created_at).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Anonymous questions summary */}
                        {questionsList.length > 0 && (
                          <div className="mb-5">
                            <h4 className="font-semibold text-gray-800 mb-2">📬 Anonymous Questions ({questionsList.length})</h4>
                            <div className="space-y-2">
                              {questionsList.map(s => (
                                <div key={s.id} className="p-3 bg-violet-50 rounded-lg border border-violet-100">
                                  <p className="text-sm text-gray-800">{s.step3_question}</p>
                                  <p className="text-xs text-gray-400 mt-1">— {s.student_name}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={copySummary}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            {copied ? '✓ Copied!' : '📋 Copy Summary'}
                          </button>
                          <button
                            onClick={exportCSV}
                            className="px-4 py-2 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-medium hover:bg-cyan-100 transition-colors"
                          >
                            📥 Export CSV
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
