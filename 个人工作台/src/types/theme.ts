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

// ========== 参数定义 ==========
/** 单个参数定义 — 供配置面板动态渲染滑块 */
export interface ParamDef {
  key: string
  label: string
  type: 'slider' | 'toggle' | 'number'
  min?: number
  max?: number
  step?: number
  defaultValue: number | boolean
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

  /**
   * 获取引擎可调参数定义
   * @returns 参数定义列表（供配置面板动态渲染）
   */
  getParamDefs(): ParamDef[]
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

// ========== 全局主题配置 ==========
/**
 * 全局主题配置
 * 所有主题共享的参数，优先级最低
 */
export interface GlobalThemeConfig {
  // ========== 基础全局参数 ==========
  id: 'global'                     // 固定为 'global'
  name: string                      // 显示名称

  // ========== 全局视觉参数 ==========
  colors?: Partial<ColorScheme>     // 全局颜色（可被主题覆盖）
  typography?: Partial<TypographyScheme>  // 全局字体
  spacing?: Partial<SpacingScheme>  // 全局间距
  shadows?: Partial<ShadowScheme>   // 全局阴影
  borders?: Partial<BorderScheme>   // 全局边框

  // ========== 全局行为参数 ==========
  transitionDuration?: number       // 主题切换过渡时间（毫秒）
  enablePreview?: boolean           // 是否启用预览功能
  enableRollback?: boolean          // 是否启用回滚功能
  maxHistoryDepth?: number          // 最大历史记录深度（用于回滚）

  // ========== 全局性能参数 ==========
  enableLazyLoad?: boolean          // 是否启用懒加载
  cacheStrategy?: 'memory' | 'localStorage' | 'none'  // 缓存策略
}

// ========== 默认全局配置 ==========
export const DEFAULT_GLOBAL_CONFIG: GlobalThemeConfig = {
  id: 'global',
  name: '全局配置',
  transitionDuration: 300,
  enablePreview: true,
  enableRollback: true,
  maxHistoryDepth: 10,
  enableLazyLoad: true,
  cacheStrategy: 'localStorage'
}

// ========== 参数继承链 ==========
/**
 * 参数继承链
 * 优先级从低到高：全局 → 主题默认 → 变体 → 用户自定义
 */
export interface ConfigInheritanceChain {
  global: GlobalThemeConfig         // 全局配置（优先级最低）
  theme: ThemeConfig                // 主题默认配置
  variant?: ThemeVariant            // 变体配置（可选）
  user?: Partial<ThemeConfig>       // 用户自定义配置（优先级最高）
}

// ========== 主题预览状态 ==========
/**
 * 主题预览状态
 */
export interface ThemePreviewState {
  previewThemeId: string | null     // 正在预览的主题ID
  previewVariantId: string | null   // 正在预览的变体ID
  previewConfig: ThemeConfig | null // 预览配置
  isPreviewActive: boolean          // 预览是否激活
}

// ========== 主题切换历史记录 ==========
/**
 * 主题切换历史记录
 */
export interface ThemeHistoryEntry {
  themeId: string                   // 主题ID
  variantId: string | null          // 变体ID
  config: ThemeConfig               // 配置
  timestamp: number                 // 切换时间
  userConfig?: Partial<ThemeConfig> // 用户自定义配置
}

// ========== 主题包版本信息 ==========
/**
 * 主题包版本信息
 */
export interface ThemeVersion {
  major: number                     // 主版本号
  minor: number                     // 次版本号
  patch: number                     // 补丁版本号
  prerelease?: string               // 预发布标签（如 'alpha', 'beta'）
  build?: string                    // 构建号
}

/**
 * 版本兼容性信息
 */
export interface VersionCompatibility {
  minVersion: ThemeVersion          // 最小兼容版本
  maxVersion?: ThemeVersion         // 最大兼容版本（可选）
  deprecated: boolean               // 是否已废弃
  migrationGuide?: string           // 迁移指南URL
}

// ========== 主题依赖声明 ==========
/**
 * 主题依赖声明
 */
export interface ThemeDependency {
  themeId: string                   // 依赖的主题ID
  versionRange?: string             // 版本范围（如 '>=1.0.0 <2.0.0'）
  optional?: boolean                // 是否可选依赖
  description?: string              // 依赖描述
}

/**
 * 主题包扩展（包含依赖）
 */
export interface ThemePackageExtended extends ThemePackage {
  // ========== 依赖声明 ==========
  dependencies?: ThemeDependency[]  // 依赖的其他主题

  // ========== 扩展点 ==========
  extends?: string                  // 继承的基础主题ID

  // ========== 版本信息 ==========
  versionInfo?: ThemeVersion        // 版本信息
  compatibility?: VersionCompatibility  // 兼容性信息
}

// ========== 主题生命周期钩子（扩展） ==========
/**
 * 主题生命周期钩子（扩展）
 */
export interface ThemeLifecycleHooks {
  // ========== 加载阶段 ==========
  beforeLoad?: (themeId: string) => Promise<void>    // 加载前
  afterLoad?: (theme: ThemePackage) => Promise<void> // 加载后

  // ========== 激活阶段 ==========
  beforeActivate?: (themeId: string) => Promise<void>   // 激活前
  afterActivate?: (theme: ThemePackage) => Promise<void> // 激活后

  // ========== 卸载阶段 ==========
  beforeUnload?: (themeId: string) => Promise<void>  // 卸载前
  afterUnload?: (themeId: string) => Promise<void>   // 卸载后

  // ========== 热更新阶段 ==========
  beforeHotReload?: (themeId: string) => Promise<void>  // 热更新前
  afterHotReload?: (theme: ThemePackage) => Promise<void> // 热更新后
}

// ========== 持久化策略接口 ==========
/**
 * 持久化策略接口
 */
export interface PersistenceStrategy {
  /**
   * 保存配置
   */
  save(key: string, data: any): Promise<void>

  /**
   * 加载配置
   */
  load(key: string): Promise<any | null>

  /**
   * 删除配置
   */
  delete(key: string): Promise<void>

  /**
   * 检查是否存在
   */
  exists(key: string): boolean
}
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

// ========== 扩展错误类型 ==========
export class ThemeVersionError extends ThemeError {
  constructor(themeId: string, reason: string) {
    super(`主题版本错误: ${themeId}, 原因: ${reason}`, 'THEME_VERSION_ERROR')
  }
}

export class ThemeDependencyError extends ThemeError {
  constructor(themeId: string, reason: string) {
    super(`主题依赖错误: ${themeId}, 原因: ${reason}`, 'THEME_DEPENDENCY_ERROR')
  }
}

export class ThemePreviewError extends ThemeError {
  constructor(themeId: string, reason: string) {
    super(`主题预览错误: ${themeId}, 原因: ${reason}`, 'THEME_PREVIEW_ERROR')
  }
}

export class ThemeRollbackError extends ThemeError {
  constructor(reason: string) {
    super(`主题回滚错误: 原因: ${reason}`, 'THEME_ROLLBACK_ERROR')
  }
}
