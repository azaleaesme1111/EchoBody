// ============================================================
// RolePlay 模块类型定义
// 核心：FSM（有限状态机）+ 双层隔离架构
// ============================================================

// ─────────────────────────────────────────────────────────────
// 意图枚举：用户输入经 NLU 解析后映射到的意图类别
// ─────────────────────────────────────────────────────────────

/** 坚定拒绝：明确说不，保护自己 */
export type Intent = 'REFUSE_FIRM' | 'REFUSE_WEAK' | 'DEFLECT' | 'COMPLY' | 'UNKNOWN'

// ─────────────────────────────────────────────────────────────
// NLU 解析结果（来自 Parser LLM）
// 解析结果经 safetyBoundaryMaintained 字段区分"正常/恶意"输入
// ─────────────────────────────────────────────────────────────

export interface NluParseResult {
  /** 意图类别 */
  intent: Intent
  /** 用户使用的策略简述（用于调试/日志） */
  strategyUsed: string
  /** 是否维持了安全边界（false = 恶意注入/越界输入） */
  safetyBoundaryMaintained: boolean
}

// ─────────────────────────────────────────────────────────────
// FSM 节点（State）
// 每个节点 = 对话中的一个"回合"，含 NPC 台词与可选择的响应
// ─────────────────────────────────────────────────────────────

/** 单条响应选项 */
export interface ChoiceNode {
  /** 响应文案（用户点击或输入对应意图后触发） */
  response: string
  /** 该响应对应的意图 */
  intent: Intent
  /** 坚定度变化量（AI 生成场景时填写，单位：分） */
  deltaAssertiveness: number
  /** 风险值变化量（AI 生成场景时填写，单位：分） */
  deltaRisk: number
  /** 跳转目标节点 ID */
  nextNodeId: string
}

/** FSM 单个节点 */
export interface ScenarioNode {
  /** 节点唯一 ID（场景内唯一） */
  id: string
  /** 本节点 NPC 台词 */
  dialogue: string
  /** NPC 名称 */
  speakerName: string
  /** NPC 身份标签（如：uncle / stranger / friend） */
  speakerTag?: string
  /** 本节点的所有可选响应 */
  choices: ChoiceNode[]
}

// ─────────────────────────────────────────────────────────────
// FSM 场景配置（ScenarioSchema）
// 每个场景 = 一组节点 + 初始状态 + 胜负条件
// ─────────────────────────────────────────────────────────────

export interface ScenarioConfig {
  /** 场景唯一 ID */
  id: string
  /** 场景标题 */
  title: string
  /** 场景标签（用于筛选，如 Body Boundaries / Online Safety） */
  tag: string
  /** 一句话场景简介 */
  description: string
  /** 统一目标描述（Win/Lose 合并，简洁清晰） */
  targetCondition: string
  /** 获胜时的结果信息 */
  victoryText: string
  /** 失败时的结果信息 */
  defeatText: string
  /** 初始节点 ID */
  initialNodeId: string
  /** 所有节点映射（id → Node） */
  nodes: Record<string, ScenarioNode>
  /** 难度等级：easy / medium / hard */
  difficulty: 'easy' | 'medium' | 'hard'
}

// ─────────────────────────────────────────────────────────────
// FSM 运行时状态
// 每次用户输入后，FSM 更新此状态并推进一轮
// ─────────────────────────────────────────────────────────────

/** 单条对话消息 */
export interface ChatMessage {
  /** 发送方：'npc' / 'user' / 'system' */
  sender: 'npc' | 'user' | 'system'
  /** 消息内容 */
  content: string
  /** 消息时间戳 */
  timestamp: number
}

/** FSM 当前运行时状态 */
export interface FsmState {
  /** 当前所在节点 ID */
  currentNodeId: string
  /** 已进行轮次（从 1 开始） */
  round: number
  /** 当前坚定度（0-100） */
  assertiveness: number
  /** 当前风险值（0-100） */
  risk: number
  /** 对话消息历史 */
  messages: ChatMessage[]
  /** 游戏是否已结束 */
  gameOver: boolean
  /** 游戏结果：'idle' | 'victory' | 'defeat' */
  result: 'idle' | 'victory' | 'defeat'
  /** 最终结果说明 */
  resultMessage?: string
}

export interface SuggestionResult {
  suggestions: string[]
}

// ─────────────────────────────────────────────────────────────
// 工具类型
// ─────────────────────────────────────────────────────────────

/** 限制数值在 [min, max] 之间 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** 游戏常量 */
export const MAX_ROUNDS = 20
/** 胜利阈值：坚定度 >= 80 */
export const VICTORY_ASSERTIVENESS_THRESHOLD = 80
/** 失败阈值：风险值 >= 90 */
export const DEFEAT_RISK_THRESHOLD = 90
