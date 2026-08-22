import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import {
  ALL_SCENARIOS,
  type ScenarioConfig,
} from '@/constants/roleplayScenarios'
import {
  createInitialState,
  processUserInput,
  estimateMinRounds,
  type FsmState,
} from '@/services/roleplay/fsEngine'
import {
  parseUserIntent,
  parseIntentOffline,
  generateNpcResponseOffline,
  generateSuggestions,
  type NluParseResult,
} from '@/services/roleplay/llmService'
import { MAX_ROUNDS, VICTORY_ASSERTIVENESS_THRESHOLD, DEFEAT_RISK_THRESHOLD } from '@/types/roleplay'

// ═══════════════════════════════════════════════════════════
// 组件：RolePlay
//
// 改动：
//   1. Win/Lose → 统一 Target（简洁清晰）
//   2. 用户输入立即发出，不等 NPC 加载完
//   3. NPC 回复打字特效
//   4. Suggested responses 每轮 2 条，由 AI 实时生成
// ═══════════════════════════════════════════════════════════

type ViewMode = 'list' | 'playing' | 'result'

// ───────────────────────────────────────────────────────────
// 主页面
// ───────────────────────────────────────────────────────────
export default function RolePlay() {
  const { requireAuth } = useAuth()

  // ── 视图状态 ────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedScenario, setSelectedScenario] = useState<ScenarioConfig | null>(null)

  // ── FSM 状态 ────────────────────────────────────────────
  const [fsmState, setFsmState] = useState<FsmState | null>(null)

  // ── 用户输入 ────────────────────────────────────────────
  const [customInput, setCustomInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // ── AI 建议 ─────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)

  // ── 打字特效 ────────────────────────────────────────────
  const [displayedMessages, setDisplayedMessages] = useState<Map<number, string>>(new Map())
  const typingRefs = useRef<Map<number, NodeJS.Timeout>>(new Map())

  // ── 筛选 ────────────────────────────────────────────────
  const [selectedTag, setSelectedTag] = useState('All')

  // ── 消息滚动 refs ───────────────────────────────────────
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── 自动滚动到底部 ──────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [fsmState?.messages, displayedMessages])

  // ── 聚焦输入框 ──────────────────────────────────────────
  useEffect(() => {
    if (viewMode === 'playing' && !isLoading) {
      inputRef.current?.focus()
    }
  }, [viewMode, isLoading])

  // ── 打字特效清理 ────────────────────────────────────────
  useEffect(() => {
    return () => {
      typingRefs.current.forEach(t => clearTimeout(t))
    }
  }, [])

  // ── 用于追踪已触发打字特效的消息索引，避免 useEffect 循环 ────
  const typedMsgIndicesRef = useRef<Set<number>>(new Set())

  // ── 为每条 NPC 消息启动打字特效 ────────────────────────
  useEffect(() => {
    if (!fsmState) return
    const msgCount = fsmState.messages.length
    const idx = msgCount - 1
    // 只在新消息加入时触发，不依赖 displayedMessages 状态变化
    if (idx <= typedMsgIndicesRef.current.size) return
    if (displayedMessages.has(idx)) {
      typedMsgIndicesRef.current.add(idx)
      return
    }

    const lastMsg = fsmState.messages[idx]
    if (!lastMsg || lastMsg.sender !== 'npc' || lastMsg.content.length === 0) return

    const fullText = lastMsg.content
    let current = ''
    let i = 0

    const typeNext = () => {
      if (i >= fullText.length) {
        setDisplayedMessages(prev => {
          const next = new Map(prev)
          next.set(idx, fullText)
          return next
        })
        typedMsgIndicesRef.current.add(idx)
        return
      }
      current += fullText[i]
      i++
      setDisplayedMessages(prev => {
        const next = new Map(prev)
        next.set(idx, current)
        return next
      })
      typingRefs.current.set(idx, setTimeout(typeNext, 18))
    }

    typingRefs.current.set(idx, setTimeout(typeNext, 100))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fsmState?.messages])

  // ── 生成 AI 建议 ────────────────────────────────────────
  // 使用 ref 持有稳定引用，避免 useCallback 依赖 state setter 导致循环
  const fetchSuggestionsRef = useRef<((state: FsmState, scenario: ScenarioConfig) => void) | null>(null)
  fetchSuggestionsRef.current = async (state, scenario) => {
    const lastNpcMsg = [...state.messages].reverse().find(m => m.sender === 'npc')
    const lastUserMsg = [...state.messages].reverse().find(m => m.sender === 'user')
    if (!lastNpcMsg || !lastUserMsg) return

    setIsGeneratingSuggestions(true)
    try {
      const result = await generateSuggestions(
        scenario.id,
        lastNpcMsg.content,
        lastUserMsg.content,
        state.round,
      )
      setSuggestions(result.suggestions)
    } catch {
      setSuggestions([])
    } finally {
      setIsGeneratingSuggestions(false)
    }
  }

  // 当新 NPC 消息出现时，生成建议
  useEffect(() => {
    if (!fsmState || !selectedScenario) return
    const lastMsg = fsmState.messages[fsmState.messages.length - 1]
    if (lastMsg?.sender !== 'npc') return
    fetchSuggestionsRef.current?.(fsmState, selectedScenario)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fsmState?.messages.length, selectedScenario])

  // ── 场景标签筛选 ────────────────────────────────────────
  const tags = ['All', ...Array.from(new Set(ALL_SCENARIOS.map(s => s.tag)))]
  const filtered = selectedTag === 'All'
    ? ALL_SCENARIOS
    : ALL_SCENARIOS.filter(s => s.tag === selectedTag)

  // ── 难度标签 ────────────────────────────────────────────
  const difficultyLabel = (d: string) => {
    const map: Record<string, { label: string; color: string }> = {
      easy:   { label: 'Easy',    color: 'bg-green-100 text-green-700' },
      medium: { label: 'Medium',  color: 'bg-yellow-100 text-yellow-700' },
      hard:   { label: 'Hard',    color: 'bg-red-100 text-red-700' },
    }
    const { label, color } = map[d] ?? { label: d, color: 'bg-gray-100 text-gray-600' }
    return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  }

  // ════════════════════════════════════════════════════════
  // 开始游戏
  // ════════════════════════════════════════════════════════
  const startGame = useCallback((scenario: ScenarioConfig) => {
    if (!requireAuth()) return
    const initialState = createInitialState(scenario)
    setFsmState(initialState)
    setSelectedScenario(scenario)
    setViewMode('playing')
    setCustomInput('')
    setSuggestions([])
    setDisplayedMessages(new Map())
  }, [requireAuth])

  // ════════════════════════════════════════════════════════
  // 发送用户输入（立即发出，不等 NPC）
  // ════════════════════════════════════════════════════════
  const sendInput = useCallback(async () => {
    if (!fsmState || !selectedScenario || isLoading) return

    const userInput = customInput.trim()
    if (!userInput) return

    setIsLoading(true)
    setSuggestions([])

    try {
      // 第一层隔离：NLU 意图解析
      let nluResult: NluParseResult
      try {
        nluResult = await parseUserIntent(userInput, {
          npcDialogue: fsmState.messages[fsmState.messages.length - 1]?.content ?? '',
          scenarioId: selectedScenario.id,
          round: fsmState.round,
        })
      } catch {
        nluResult = parseIntentOffline(userInput, '')
      }

      // 第二层隔离：FSM 状态门控
      let newMessages = [...fsmState.messages]
      let newAssertiveness = fsmState.assertiveness
      let newRisk = fsmState.risk
      let newStateNode = fsmState.currentNodeId

      if (!nluResult.safetyBoundaryMaintained || nluResult.intent === 'UNKNOWN') {
        const safetyReply = generateNpcResponseOffline(
          selectedScenario.nodes[fsmState.currentNodeId],
          'UNKNOWN'
        )
        newMessages.push({
          sender: 'npc',
          content: safetyReply,
          timestamp: Date.now(),
        })
      } else {
        const newState = processUserInput(
          fsmState,
          userInput,
          selectedScenario,
          () => nluResult,
        )
        newMessages = newState.messages
        newAssertiveness = newState.assertiveness
        newRisk = newState.risk
        newStateNode = newState.currentNodeId
      }

      setFsmState({
        ...fsmState,
        messages: newMessages,
        assertiveness: newAssertiveness,
        risk: newRisk,
        currentNodeId: newStateNode,
        gameOver: false,
      })

      setCustomInput('')
    } finally {
      setIsLoading(false)
    }
  }, [fsmState, selectedScenario, isLoading, customInput])

  // 处理 Enter 键提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendInput()
    }
  }

  // ════════════════════════════════════════════════════════
  // 视图：场景列表
  // ════════════════════════════════════════════════════════
  if (viewMode === 'list') {
    return (
      <div>
        <div className="mb-6 p-4 bg-pink-50 rounded-xl border border-pink-100">
          <h2 className="font-bold text-gray-900 text-lg mb-1">🎭 Dialogue Sandbox</h2>
          <p className="text-sm text-gray-600">
            Choose a scenario and practice setting boundaries. Your choices shape the outcome — stay firm, stay safe.
          </p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tags.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedTag === t
                  ? 'bg-pink-600 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-pink-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map(scenario => {
            const minRounds = estimateMinRounds(scenario)
            return (
              <button
                key={scenario.id}
                onClick={() => startGame(scenario)}
                className="card w-full text-left hover:border-pink-300 transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900 text-lg">{scenario.title}</h3>
                      {difficultyLabel(scenario.difficulty)}
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full">
                        {scenario.tag}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{scenario.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>🎯 {scenario.targetCondition.slice(0, 50)}...</span>
                    </div>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="text-gray-300 group-hover:text-pink-500 transition-colors flex-shrink-0 mt-1"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                  <span>≈ {minRounds} rounds to win</span>
                  <span>•</span>
                  <span>{Object.keys(scenario.nodes).length} nodes</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // 视图：结算面板
  // ════════════════════════════════════════════════════════
  if (viewMode === 'result' && fsmState && selectedScenario) {
    const isVictory = fsmState.result === 'victory'
    return (
      <div className="max-w-xl mx-auto">
        <div className={`card text-center py-10 mb-6 ${isVictory ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="text-5xl mb-4">{isVictory ? '🎉' : '⚠️'}</div>
          <h2 className={`text-2xl font-bold mb-2 ${isVictory ? 'text-green-800' : 'text-red-800'}`}>
            {isVictory ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED'}
          </h2>
          <p className="text-gray-600 text-sm mb-6">{fsmState.resultMessage}</p>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatTile label="Rounds" value={`${fsmState.round - 1}/${MAX_ROUNDS}`} color={isVictory ? 'green' : 'red'} />
            <StatTile label="Assertiveness" value={`${fsmState.assertiveness}`} color={isVictory ? 'green' : 'red'} />
            <StatTile label="Risk Level" value={`${fsmState.risk}`} color={isVictory ? 'green' : 'red'} />
          </div>

          <div className="space-y-3 text-left max-w-xs mx-auto">
            <NumberBar label="Assertiveness (A)" value={fsmState.assertiveness} target={VICTORY_ASSERTIVENESS_THRESHOLD} goal="victory" showValue />
            <NumberBar label="Risk Level (R)" value={fsmState.risk} target={DEFEAT_RISK_THRESHOLD} goal="defeat" showValue />
          </div>
        </div>

        <div className="card mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Conversation Review</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto text-sm">
            {fsmState.messages.map((msg: import('@/types/roleplay').ChatMessage, i: number) => (
              <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender !== 'user' && (
                  <span className="text-xs text-gray-400 mt-0.5">{msg.sender === 'npc' ? selectedScenario.nodes[fsmState.currentNodeId]?.speakerName ?? 'NPC' : '📢'}</span>
                )}
                <span className={`px-3 py-1.5 rounded-xl max-w-xs ${
                  msg.sender === 'user'
                    ? 'bg-pink-100 text-pink-800'
                    : msg.sender === 'system'
                    ? 'bg-gray-100 text-gray-600 italic'
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}>
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => setViewMode('list')} className="btn-primary px-6">
            Back to Scenarios
          </button>
          <button
            onClick={() => {
              const initial = createInitialState(selectedScenario)
              setFsmState(initial)
              setViewMode('playing')
              setCustomInput('')
              setSuggestions([])
            }}
            className="btn-secondary px-6"
          >
            Replay
          </button>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  // 视图：对话中
  // ════════════════════════════════════════════════════════
  if (viewMode === 'playing' && fsmState && selectedScenario) {
    const isGameOver = fsmState.gameOver

    return (
      <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 140px)', minHeight: 500 }}>

        {/* ── 顶部状态栏 ── */}
        <div className="card mb-4 py-3 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setViewMode('list')}
              className="text-sm text-pink-600 hover:text-pink-800 transition-colors flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-sm font-medium text-gray-700">{selectedScenario.title}</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className={`px-2 py-0.5 rounded-full ${
              selectedScenario.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
              selectedScenario.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {selectedScenario.difficulty.charAt(0).toUpperCase() + selectedScenario.difficulty.slice(1)}
            </span>
          </div>
        </div>

        {/* ── 统一目标提示 ── */}
        <div className="card mb-4 py-3 px-4 flex-shrink-0 border-l-4 border-l-pink-400">
          <div className="flex items-start gap-2">
            <span className="text-pink-500 text-lg mt-0.5">🎯</span>
            <div>
              <span className="text-xs font-bold text-pink-600 uppercase tracking-wide">Your Goal</span>
              <p className="text-sm text-gray-700 mt-0.5">{selectedScenario.targetCondition}</p>
            </div>
          </div>
        </div>

        {/* ── 数值条（隐藏具体数值） ── */}
        <div className="card mb-4 py-3 px-4 flex-shrink-0">
          <div className="grid grid-cols-2 gap-4">
            <NumberBar label="Assertiveness (A)" value={fsmState.assertiveness} target={VICTORY_ASSERTIVENESS_THRESHOLD} goal="victory" />
            <NumberBar label="Risk Level (R)" value={fsmState.risk} target={DEFEAT_RISK_THRESHOLD} goal="defeat" />
          </div>
        </div>

        {/* ── 对话消息区 ── */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
          {fsmState.messages.map((msg: import('@/types/roleplay').ChatMessage, i: number) => {
            // 打字特效：NPC 消息显示逐步构建的文本
            const displayText = msg.sender === 'npc'
              ? (displayedMessages.get(i) ?? '')
              : msg.content

            return (
              <div key={i} className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender !== 'user' && (
                  <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {msg.sender === 'system' ? '📢' : (selectedScenario.nodes[fsmState.currentNodeId]?.speakerName?.[0] ?? 'N')}
                  </div>
                )}
                <div className={`max-w-xs px-3 py-2 rounded-xl text-sm ${
                  msg.sender === 'user'
                    ? 'bg-pink-500 text-white rounded-br-sm'
                    : msg.sender === 'system'
                    ? 'bg-gray-100 text-gray-500 italic text-xs rounded-xl'
                    : 'bg-white border border-gray-200 text-gray-700 rounded-bl-sm'
                }`}>
                  {displayText || (msg.sender === 'npc' ? <span className="animate-pulse">...</span> : '')}
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    👤
                  </div>
                )}
              </div>
            )
          })}
          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-pink-100 flex items-center justify-center text-xs flex-shrink-0">
                {selectedScenario.nodes[fsmState.currentNodeId]?.speakerName?.[0] ?? 'N'}
              </div>
              <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl rounded-bl-sm text-sm text-gray-400">
                <span className="animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ── 输入区 ── */}
        {!isGameOver && (
          <div className="flex-shrink-0 space-y-2">
            {/* 输入框 */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your response..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 outline-none text-sm disabled:bg-gray-50"
              />
              <button
                onClick={sendInput}
                disabled={isLoading || !customInput.trim()}
                className="px-4 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            {/* AI 建议回复（每轮 2 条，AI 实时生成） */}
            {isGeneratingSuggestions && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating suggestions...
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-gray-400 mb-1.5">💡 Try saying:</p>
                {suggestions.map((suggestion, i: number) => (
                  <button
                    key={i}
                    onClick={() => { setCustomInput(suggestion); sendInput() }}
                    disabled={isLoading}
                    className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-pink-300 hover:bg-pink-50 transition-all text-sm text-gray-700 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 游戏结束 ── */}
        {isGameOver && (
          <div className="flex-shrink-0 flex gap-3 justify-center pt-2">
            <button onClick={() => setViewMode('result')} className="btn-primary px-6 py-2">
              View Results
            </button>
            <button onClick={() => setViewMode('list')} className="btn-secondary px-6 py-2">
              Back to Scenarios
            </button>
          </div>
        )}
      </div>
    )
  }

  return null
}

// ═══════════════════════════════════════════════════════════
// 子组件：数值条
// ═══════════════════════════════════════════════════════════
function NumberBar({
  label, value, target, goal, showValue,
}: {
  label: string
  value: number
  target: number
  goal: 'victory' | 'defeat'
  showValue?: boolean
}) {
  const getColor = () => {
    if (goal === 'victory') {
      if (value >= target) return 'bg-green-500'
      if (value >= target * 0.7) return 'bg-yellow-500'
      return 'bg-pink-400'
    }
    if (value >= target) return 'bg-red-600'
    if (value >= target * 0.7) return 'bg-orange-400'
    return 'bg-green-400'
  }

  const getLabelColor = () => {
    if (goal === 'victory') {
      return value >= target ? 'text-green-700' : 'text-pink-600'
    }
    return value >= target ? 'text-red-700' : 'text-green-600'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-medium ${getLabelColor()}`}>{label}</span>
        {!showValue && <span className="text-xs text-gray-400">Goal: {target}</span>}
        {showValue && <span className="text-xs text-gray-400">{value} / {target}</span>}
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 子组件：统计卡片
// ═══════════════════════════════════════════════════════════
function StatTile({ label, value, color }: { label: string; value: string; color: 'green' | 'red' }) {
  return (
    <div className={`rounded-xl p-3 ${color === 'green' ? 'bg-green-50' : 'bg-red-50'}`}>
      <div className={`text-xs font-medium mb-1 ${color === 'green' ? 'text-green-600' : 'text-red-600'}`}>{label}</div>
      <div className={`text-2xl font-bold ${color === 'green' ? 'text-green-800' : 'text-red-800'}`}>{value}</div>
    </div>
  )
}
