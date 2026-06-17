// 全局类型定义
// 给 AI 的话：所有数据类型统一在这里定义，避免散落各处

// ============== 待办 ==============
export type TodoCategory = 'work' | 'life' | 'study' | 'other'
export type TodoPriority = 'high' | 'medium' | 'low'

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
}

// ============== 日记 ==============
export interface Diary {
  id: string
  title: string
  content: string  // Markdown 格式
  date: string     // YYYY-MM-DD 格式
  mood?: string    // 表情符号
  weather?: string
  tags?: string[]
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
  ai: AIConfig
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
}

// ============== 导出/导入 ==============
export interface ExportData {
  version: string
  exportedAt: number
  todos: Todo[]
  diaries: Diary[]
  wallpapers: Wallpaper[]
  settings: AppSettings
}
