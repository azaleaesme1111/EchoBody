// ============================================================
// FSM 引擎：RolePlay 模块的"大脑与骨架"
//
// 核心职责：
//   1. 管理对话状态机（当前节点、轮次、坚定度、风险值）
//   2. 执行状态转移（根据用户意图和节点转移规则跳转）
//   3. 动态数值公式计算坚定度 A 和风险值 R
//   4. 判断游戏胜负条件
//   5. 双层隔离安全门控（UNKNOWN 意图不跳转，触发防作弊回复）
//
// 数值公式：
//   A_{t+1} = Clamp(A_t + ΔA * k_pressure, 0, 100)
//   R_{t+1} = Clamp(R_t + ΔR * (1 - A_{t+1}/100),  0, 100)
//
// 胜负条件：
//   胜利：坚定度 A >= 80
//   失败：风险值 R >= 90 或 超过 20 轮
// ============================================================

import {
  ScenarioConfig,
  FsmState,
  ChatMessage,
  NluParseResult,
  MAX_ROUNDS,
  VICTORY_ASSERTIVENESS_THRESHOLD,
  DEFEAT_RISK_THRESHOLD,
  clamp,
  type Intent,
} from '@/types/roleplay'
// 重新导出供外部使用
export type { FsmState, ChatMessage } from '@/types/roleplay'

// ─────────────────────────────────────────────────────────────
// 压力系数 k_pressure
// 压力越大，坚定度变化越剧烈（也意味着风险值更容易上升）
// 难度越高，压力系数越大
// ─────────────────────────────────────────────────────────────

const PRESSURE_FACTOR: Record<string, number> = {
  easy:   0.7,
  medium: 1.0,
  hard:   1.4,
}

/** 默认压力系数 */
const DEFAULT_PRESSURE = PRESSURE_FACTOR.medium

// ─────────────────────────────────────────────────────────────
// 游戏常量
// ─────────────────────────────────────────────────────────────
const INITIAL_ASSERTIVENESS = 20   // 初始坚定度（偏低，需要学习）
const INITIAL_RISK = 30            // 初始风险值（有一定潜在风险）

// ─────────────────────────────────────────────────────────────
// 初始化 FSM 状态
// 返回初始状态：当前节点为场景初始节点，A=20，R=30
// ─────────────────────────────────────────────────────────────

/**
 * 创建新的 FSM 状态
 * @param scenario 场景配置
 * @returns 初始 FsmState
 */
export function createInitialState(scenario: ScenarioConfig): FsmState {
  const initialNode = scenario.nodes[scenario.initialNodeId]
  if (!initialNode) {
    throw new Error(`[FSM] Initial node "${scenario.initialNodeId}" not found in scenario "${scenario.id}"`)
  }

  // 添加 NPC 开场白到消息历史
  const openingMessage: ChatMessage = {
    sender: 'npc',
    content: initialNode.dialogue,
    timestamp: Date.now(),
  }

  return {
    currentNodeId: scenario.initialNodeId,
    round: 1,
    assertiveness: INITIAL_ASSERTIVENESS,
    risk: INITIAL_RISK,
    messages: [openingMessage],
    gameOver: false,
    result: 'idle',
  }
}

// ─────────────────────────────────────────────────────────────
// 核心：执行用户输入
// 流程：
//   1. 将用户输入添加到消息历史
//   2. 调用 NLU 解析意图（parseIntent 由上层 LLM 服务提供）
//   3. 若意图为 UNKNOWN → 不跳转节点，添加防作弊 NPC 回复
//   4. 若意图有效 → 在节点 choices 中查找匹配项，跳转下一节点
//   5. 计算 A 和 R 的更新值（公式见顶部注释）
//   6. 判断胜负条件
// ─────────────────────────────────────────────────────────────

/**
 * 执行用户输入，推进 FSM 到下一轮
 *
 * @param state       当前 FSM 状态
 * @param userInput   用户输入文本
 * @param scenario    场景配置（用于查找节点和转移规则）
 * @param parseIntent 意图解析函数（来自 LLM 服务，可注入测试 mock）
 * @param generateNpcResponse  NPC 回复生成函数（来自 LLM 服务）
 * @returns 更新后的 FSM 状态
 */
export function processUserInput(
  state: FsmState,
  userInput: string,
  scenario: ScenarioConfig,
  parseIntent: (input: string, ctx: { npcDialogue: string; scenarioId: string; round: number }) => NluParseResult,
): FsmState {
  // 游戏已结束，直接返回
  if (state.gameOver) return state

  const currentNode = scenario.nodes[state.currentNodeId]
  if (!currentNode) {
    console.error(`[FSM] Node "${state.currentNodeId}" not found`)
    return state
  }

  // ── 第一步：记录用户输入 ──
  const userMessage: ChatMessage = {
    sender: 'user',
    content: userInput,
    timestamp: Date.now(),
  }

  // ── 第二步：NLU 意图解析（第一层隔离） ──
  let nluResult: NluParseResult
  try {
    nluResult = parseIntent(userInput, {
      npcDialogue: currentNode.dialogue,
      scenarioId: scenario.id,
      round: state.round,
    })
  } catch {
    // 解析出错 → 视为安全边界未维持
    nluResult = {
      intent: 'UNKNOWN',
      strategyUsed: 'Parse error',
      safetyBoundaryMaintained: false,
    }
  }

  // ── 第三步：双层隔离门控 ──
  // 若安全边界未维持，或意图为 UNKNOWN，FSM 不跳转，触发防作弊回复
  if (!nluResult.safetyBoundaryMaintained || nluResult.intent === 'UNKNOWN') {
    const safetyReply = generateSafetyReply(currentNode, nluResult)
    const safetyMessage: ChatMessage = {
      sender: 'npc',
      content: safetyReply,
      timestamp: Date.now(),
    }
    return advanceRound({
      ...state,
      messages: [...state.messages, userMessage, safetyMessage],
      // 坚定度和风险值不变化（隔离层拦截了影响）
    })
  }

  // ── 第四步：在节点 choices 中匹配意图，查找下一节点 ──
  const matchingChoice = currentNode.choices.find(c => c.intent === nluResult.intent)

  if (!matchingChoice) {
    // 意图有效但无对应 choice → 退化为 DEFLECT（逃避），不跳转
    const deflectReply = generateDeflectReply(currentNode)
    const deflectMessage: ChatMessage = {
      sender: 'npc',
      content: deflectReply,
      timestamp: Date.now(),
    }
    return advanceRound({
      ...state,
      messages: [...state.messages, userMessage, deflectMessage],
    })
  }

  // ── 第五步：计算坚定度和风险值的增量 ──
  const pressure = PRESSURE_FACTOR[scenario.difficulty] ?? DEFAULT_PRESSURE

  // A_{t+1} = Clamp(A_t + ΔA * k_pressure, 0, 100)
  const newAssertiveness = clamp(
    state.assertiveness + matchingChoice.deltaAssertiveness * pressure,
    0,
    100
  )

  // R_{t+1} = Clamp(R_t + ΔR * (1 - A_{t+1}/100), 0, 100)
  // 公式含义：坚定度越高，风险值增长越慢（自我保护能力强的人风险累积慢）
  const riskGrowthFactor = 1 - newAssertiveness / 100
  const newRisk = clamp(
    state.risk + matchingChoice.deltaRisk * riskGrowthFactor,
    0,
    100
  )

  // ── 第六步：跳转到下一节点 ──
  const nextNodeId = matchingChoice.nextNodeId
  const nextNode = scenario.nodes[nextNodeId]

  let newMessages: ChatMessage[] = [...state.messages, userMessage]

  // 如果下一节点存在，将 NPC 台词加入消息历史
  if (nextNode) {
    newMessages.push({
      sender: 'npc',
      content: nextNode.dialogue,
      timestamp: Date.now(),
    })
  }

  // ── 第七步：推进轮次并检查游戏结束条件 ──
  let newState: FsmState = {
    ...state,
    currentNodeId: nextNodeId,
    round: state.round + 1,
    assertiveness: newAssertiveness,
    risk: newRisk,
    messages: newMessages,
  }

  return checkGameOver(newState, scenario)
}

// ─────────────────────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────────────────────

/** 推进轮次（更新消息列表，但不改变其他状态） */
function advanceRound(state: FsmState): FsmState {
  // 检查游戏结束条件
  return checkGameOver(state)
}

/**
 * 检查游戏胜负条件
 * 胜利：坚定度 >= 80
 * 失败：风险值 >= 90 或 超过 MAX_ROUNDS 轮
 */
function checkGameOver(state: FsmState, scenario?: ScenarioConfig): FsmState {
  // 条件 1：坚定度达到胜利阈值
  if (state.assertiveness >= VICTORY_ASSERTIVENESS_THRESHOLD) {
    return {
      ...state,
      gameOver: true,
      result: 'victory',
      resultMessage: scenario?.victoryText ?? '🎉 MISSION ACCOMPLISHED! You set clear boundaries and protected yourself.',
    }
  }

  // 条件 2：风险值超过失败阈值
  if (state.risk >= DEFEAT_RISK_THRESHOLD) {
    return {
      ...state,
      gameOver: true,
      result: 'defeat',
      resultMessage: scenario?.defeatText ?? '⚠️ MISSION FAILED. The situation became too risky. Remember: setting boundaries early prevents escalation.',
    }
  }

  // 条件 3：超过最大轮次
  if (state.round > MAX_ROUNDS) {
    return {
      ...state,
      gameOver: true,
      result: 'defeat',
      resultMessage: `⚠️ MISSION FAILED. You ran out of rounds (${MAX_ROUNDS}). In real life, practice speaking up sooner.`,
    }
  }

  return state
}

/**
 * 生成防作弊 NPC 回复
 * 当意图为 UNKNOWN 或安全边界未维持时使用
 * NPC 回复一个问号/困惑的台词，彻底断绝 Prompt 注入可能
 */
function generateSafetyReply(_node: import('@/types/roleplay').ScenarioNode, nluResult: NluParseResult): string {
  // 如果策略描述包含 injection 关键词，使用更严肃的回复
  if (nluResult.strategyUsed.toLowerCase().includes('injection') ||
      nluResult.strategyUsed.toLowerCase().includes('override') ||
      nluResult.strategyUsed.toLowerCase().includes('bypass')) {
    return '...Wait. What are you talking about? I think there\'s been a misunderstanding. Let\'s get back to what I was saying.'
  }

  // 默认：NPC 表现困惑，引导回到正轨
  const replies = [
    '...Huh? I\'m not sure what you\'re saying. Can you focus on what I just asked?',
    'Wait, I didn\'t understand that. Let\'s stick to the topic, okay?',
    '...What? Are you okay? I asked you about something serious.',
    'I don\'t get it. Can you just answer my question directly?',
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}

/**
 * 生成 DEFLECT（逃避/不匹配）时的 NPC 回复
 * 意图有效但节点无对应 choice 时使用
 */
function generateDeflectReply(_node: import('@/types/roleplay').ScenarioNode): string {
  const replies = [
    'I asked you a direct question. Don\'t dodge it.',
    'That\'s not really an answer. What do you actually think?',
    'Come on, just be honest. Do you really want to go along with this?',
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}

// ─────────────────────────────────────────────────────────────
// 场景统计工具
// ─────────────────────────────────────────────────────────────

/** 获取场景所有节点 IDs */
export function getAllNodeIds(config: ScenarioConfig): string[] {
  return Object.keys(config.nodes)
}

/** 获取场景初始节点 */
export function getInitialNode(config: ScenarioConfig): import('@/types/roleplay').ScenarioNode {
  const node = config.nodes[config.initialNodeId]
  if (!node) throw new Error(`Initial node not found: ${config.initialNodeId}`)
  return node
}

/** 获取场景可选的意图标签列表 */
export function getAvailableIntents(config: ScenarioConfig): Intent[] {
  const allChoices = Object.values(config.nodes).flatMap(n => n.choices)
  const intents = allChoices.map(c => c.intent as Intent)
  return [...new Set(intents)]
}

/** 计算从初始状态到目标节点的最短路径轮数（用于展示预估难度） */
export function estimateMinRounds(config: ScenarioConfig): number {
  const visited = new Set<string>()
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: config.initialNodeId, depth: 0 }]
  visited.add(config.initialNodeId)

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!
    const node = config.nodes[nodeId]
    if (!node) continue

    for (const choice of node.choices) {
      if (choice.nextNodeId === config.initialNodeId || visited.has(choice.nextNodeId)) continue
      visited.add(choice.nextNodeId)
      if (choice.intent === 'REFUSE_FIRM') return depth + 1 // 找到坚定拒绝路径
      queue.push({ nodeId: choice.nextNodeId, depth: depth + 1 })
    }
  }

  return MAX_ROUNDS // 未找到路径
}
