// 主题系统类型定义
// 给 AI 的话：这是主题系统的核心接口定义，遵循接口隔离原则（ISP）

// ========== 主题引擎类型 ==========
export type ThemeEngineType =
  | 'liquid-glass'    // 液态玻璃
  | 'flat'            // 扁平化
  | 'frosted'         // 毛玻璃
  | 'neumorphism'     // 新拟态
  | 'gradient'        // 渐变
  | 'custom'          // 自定义

// ========== 主题元数据 ==========
export interface ThemeMetadata {
  id: string                    // 主题唯一标识
  name: string                  // 主题显示名称
  description?: string          // 主题描述
  version: string               // 主题版本
  author?: string               // 作者
  tags?: string[]               // 标签（如：glass, flat, modern）
  preview?: string              // 预览图URL
}

// ========== 主题变体 ==========
export interface ThemeVariant {
  id: string                    // 变体ID
  name: string                  // 变体名称
  description?: string          // 变体描述
  config: Partial<ThemeConfig>  // 变体配置
}

// ========== 主题能力标记 ==========
export interface ThemeCapabilities {
  dynamicBackground: boolean    // 是否支持动态背景
  realTimeParams: boolean       // 是否支持实时调参
  customShapes: boolean         // 是否支持自定义形状
  performance: 'high' | 'medium' | 'low'  // 性能等级
  supportedBrowsers: string[]   // 支持的浏览器
}

// ========== 视觉配置方案 ==========
export interface ColorScheme {
  primary?: string              // 主色
  secondary?: string            // 辅助色
  background?: string           // 背景色
  surface?: string              // 表面色
  text?: string                 // 文本色
  textSecondary?: string        // 次要文本色
  border?: string               // 边框色
  // ... 其他颜色
}

export interface TypographyScheme {
  fontFamily?: string           // 字体族
  fontSize?: {
    xs?: string
    sm?: string
    base?: string
    lg?: string
    xl?: string
    '2xl'?: string
  }
  fontWeight?: {
    normal?: number
    medium?: number
    semibold?: number
    bold?: number
  }
  lineHeight?: {
    tight?: number
    normal?: number
    relaxed?: number
  }
}

export interface SpacingScheme {
  xs?: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
  '2xl'?: string
}

export interface ShadowScheme {
  sm?: string
  md?: string
  lg?: string
  xl?: string
  '2xl'?: string
}

export interface BorderScheme {
  radius?: {
    sm?: string
    md?: string
    lg?: string
    full?: string
  }
  width?: {
    thin?: string
    default?: string
    thick?: string
  }
}

// ========== 主题配置接口 ==========
export interface ThemeConfig {
  // ========== 元数据 ==========
  metadata: ThemeMetadata

  // ========== 主题变体 ==========
  variants: ThemeVariant[]

  // ========== 引擎配置 ==========
  engine: {
    type: ThemeEngineType
    params: Record<string, any>  // 引擎特定参数
  }

  // ========== 视觉配置 ==========
  colors?: ColorScheme           // 颜色方案
  typography?: TypographyScheme  // 字体方案
  spacing?: SpacingScheme        // 间距方案
  shadows?: ShadowScheme         // 阴影方案
  borders?: BorderScheme         // 边框方案
}

// ========== 主题引擎接口 ==========
/**
 * 主题引擎接口 - 所有主题引擎必须实现此接口
 * 遵循接口隔离原则（ISP）：接口小而精，只包含必要方法
 */
export interface ThemeEngine {
  // ========== 元数据 ==========
  readonly name: string           // 主题引擎名称
  readonly version: string        // 主题引擎版本
  readonly author?: string        // 作者信息

  // ========== 生命周期 ==========
  /**
   * 初始化主题引擎
   * @param config 主题配置
   * @throws ThemeInitError 初始化失败时抛出
   */
  init(config: ThemeConfig): Promise<void>

  /**
   * 渲染主题到指定元素
   * @param element 目标DOM元素
   * @param config 主题配置
   */
  render(element: HTMLElement, config: ThemeConfig): void

  /**
   * 更新主题配置
   * @param config 新的主题配置（部分更新）
   */
  update(config: Partial<ThemeConfig>): void

  /**
   * 销毁主题引擎，释放资源
   */
  destroy(): void

  // ========== 能力查询 ==========
  /**
   * 获取主题引擎能力
   * @returns 主题能力标记
   */
  getCapabilities(): ThemeCapabilities
}

// ========== 主题包结构 ==========
/**
 * 主题包结构
 * 遵循稳定的公共API原则：主题包结构稳定，便于分发
 */
export interface ThemePackage {
  // ========== 元数据 ==========
  metadata: ThemeMetadata

  // ========== 引擎 ==========
  engine: ThemeEngine

  // ========== 配置 ==========
  config: ThemeConfig

  // ========== 资源 ==========
  assets?: {
    images?: Record<string, string>    // 图片资源
    fonts?: Record<string, string>     // 字体资源
    styles?: Record<string, string>    // 样式资源
  }

  // ========== 钩子 ==========
  hooks?: {
    beforeInit?: () => Promise<void>   // 初始化前钩子
    afterInit?: () => Promise<void>    // 初始化后钩子
    beforeSwitch?: () => Promise<void> // 切换前钩子
    afterSwitch?: () => Promise<void>  // 切换后钩子
  }
}

// ========== 主题错误类型 ==========
/**
 * 主题错误基类
 * 遵循业务异常与技术异常分离原则
 */
export class ThemeError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ThemeError'
  }
}

// 业务异常
export class ThemeNotFoundError extends ThemeError {
  constructor(themeId: string) {
    super(`主题未找到: ${themeId}`, 'THEME_NOT_FOUND')
  }
}

export class ThemeInitError extends ThemeError {
  constructor(themeId: string, reason: string) {
    super(`主题初始化失败: ${themeId}, 原因: ${reason}`, 'THEME_INIT_FAILED')
  }
}

export class ThemeSwitchError extends ThemeError {
  constructor(fromId: string, toId: string, reason: string) {
    super(`主题切换失败: ${fromId} → ${toId}, 原因: ${reason}`, 'THEME_SWITCH_FAILED')
  }
}

export class ThemeRegisterError extends ThemeError {
  constructor(themeId: string, reason: string) {
    super(`主题注册失败: ${themeId}, 原因: ${reason}`, 'THEME_REGISTER_FAILED')
  }
}

// 技术异常
export class ThemeEngineError extends ThemeError {
  constructor(engineName: string, reason: string) {
    super(`主题引擎错误: ${engineName}, 原因: ${reason}`, 'THEME_ENGINE_ERROR')
  }
}
