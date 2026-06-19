// 全局类型定义
// 给 AI 的话：所有数据类型统一在这里定义，避免散落各处

// ============== 待办 ==============
export type TodoCategory = 'work' | 'life' | 'study' | 'other'
export type TodoPriority = 'high' | 'medium' | 'low'

// 子任务
export interface SubTask {
  id: string
  title: string
  completed: boolean
}

// 时间追踪记录
export interface TimeEntry {
  id: string
  startTime: number  // 时间戳
  endTime?: number   // 时间戳，未结束则为 undefined
  duration: number   // 分钟
}

// 重复任务配置
export interface RepeatConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom'
  interval: number   // 间隔（如每 2 周）
  endDate?: string   // 结束日期 YYYY-MM-DD
  daysOfWeek?: number[]  // 周几（1-7，用于 weekly）
}

// 提醒配置
export interface ReminderConfig {
  enabled: boolean
  time: string       // HH:mm 格式，如 "09:00"
  advanceDays: number // 提前几天提醒，0 表示当天
}

export interface Todo {
  id: string
  title: string
  content?: string
  category: TodoCategory
  priority: TodoPriority
  completed: boolean
  createdAt: number
  completedAt?: number
  dueDate?: string  // YYYY-MM-DD 格式

  // 新增字段
  tags: string[]           // 标签 ID 列表
  subtasks: SubTask[]      // 子任务
  projectId?: string       // 所属项目
  repeat?: RepeatConfig    // 重复任务配置
  reminder?: ReminderConfig // 提醒配置
  dependsOn: string[]      // 依赖的任务 ID
  timeSpent: number        // 总耗时（分钟）
  timeEntries: TimeEntry[] // 时间追踪记录
  archived: boolean        // 是否归档
  order: number            // 排序权重
}

// ============== 项目 ==============
export interface Project {
  id: string
  name: string
  color: string    // 颜色值 #RRGGBB
  order: number    // 排序权重
  createdAt: number
}

// ============== 标签 ==============
export interface Tag {
  id: string
  name: string
  color: string    // 颜色值 #RRGGBB
  createdAt: number
}

// ============== 日记 ==============

// 情绪类型
export type EmotionType = 'happy' | 'calm' | 'anxious' | 'sad' | 'angry' | 'neutral' | 'excited'

// AI 分析的情绪数据
export interface EmotionData {
  type: EmotionType       // 情绪类型
  intensity: number       // 情绪强度 1-5
  keywords: string[]      // 情绪关键词
  analyzedAt: number      // 分析时间
}

// 日记设置（AI 功能开关）
export interface DiarySettings {
  enableAIAssist: boolean        // AI 写作辅助
  enableEmotionAnalysis: boolean // 情绪分析
  enableAIFeedback: boolean      // 即时反馈
  enableDiaryChat: boolean       // 日记对话
  enableStats: boolean           // 数据统计
  autoAnalyze: boolean           // 保存时自动分析情绪
}

export interface Diary {
  id: string
  title: string
  content: string  // Markdown 格式
  date: string     // YYYY-MM-DD 格式
  mood?: string    // 用户选择的情绪 emoji
  weather?: string
  tags?: string[]
  // 新增字段
  emotionData?: EmotionData  // AI 分析的情绪数据
  aiFeedback?: string        // AI 反馈
  wordCount: number          // 字数统计
  createdAt: number
  updatedAt: number
}

// ============== AI 配置 ==============
export type AIProvider = 'agnes' | 'deepseek' | 'openai' | 'claude' | 'kimi' | 'zhipu' | 'custom'

export interface AIConfig {
  provider: AIProvider
  apiKey: string
  baseUrl: string
  model: string
  temperature: number
  maxTokens: number
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// ============== API Key 管理 ==============
export interface APIKeyEntry {
  id: string        // 唯一标识
  label: string     // 用户自定义标签："主Key"、"备用"
  key: string       // 实际 Key 值
  createdAt: number // 创建时间
}

// ============== 模型能力标记 ==============
export interface ModelCapabilities {
  reasoning?: boolean   // 深度思考
  vision?: boolean      // 视觉识别
  imageGen?: boolean    // 图片生成
  videoGen?: boolean    // 视频生成
}

// ============== 壁纸 ==============
export type WallpaperType = 'url' | 'local' | 'color' | 'gradient' | 'preset'

export interface Wallpaper {
  id: string
  type: WallpaperType
  value: string      // URL / base64 / 颜色值 / 渐变字符串
  name?: string
  createdAt: number
}

export interface WallpaperState {
  current: Wallpaper | null
  history: Wallpaper[]
}

// ============== 液态玻璃效果配置 ==============
// 对应 liquid-glass.ts 中的 DEFAULTS
export interface GlassConfig {
  // 核心光学参数
  refraction: number        // 折射强度 (0-2)
  chromAberration: number   // 色散/色差 (0-0.2)
  fresnel: number          // 菲涅尔/边缘反光 (0-2)
  specular: number         // 高光强度 (0-1)
  
  // 外观参数
  cornerRadius: number     // 圆角半径 (0-100)
  zRadius: number          // Z轴厚度/立体感 (0-80)
  opacity: number          // 不透明度 (0-1)
  
  // 颜色调整
  saturation: number       // 饱和度调整 (-1-1)
  brightness: number       // 亮度调整 (-0.5-0.5)
  tintStrength: number     // 色调强度 (0-1)
  
  // 阴影参数
  shadowOpacity: number    // 阴影透明度 (0-1)
  shadowSpread: number     // 阴影扩散 (0-30)
  shadowOffsetY: number    // 阴影垂直偏移 (-10-10)
  
  // 其他效果
  blurAmount: number       // 背景模糊 (0-5)
  distortion: number       // 扭曲/噪点 (0-0.5)
  edgeHighlight: number    // 边缘高亮 (0-0.2)
  
  // 特殊模式（可选）
  floating?: boolean       // 悬浮效果
  button?: boolean         // 按钮模式
  bevelMode?: number       // 倒角模式 (0-1)
}

// ============== 设置 ==============
export interface AppSettings {
  glass: GlassConfig
  ai: Omit<AIConfig, 'apiKey'>  // apiKey 由 useAPIKeysStore 单独管理
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  diary: DiarySettings  // 日记设置
}

// ============== 导出/导入 ==============
export interface ExportData {
  version: string
  exportedAt: number
  todos: Todo[]
  diaries: Diary[]
  wallpapers: Wallpaper[]
  settings: AppSettings
  apiKeys: Record<string, APIKeyEntry[]>  // 新增：API Keys
  projects: Project[]                      // 新增：项目
  tags: Tag[]                              // 新增：标签
  achievements: any[]                      // 新增：成就
}
