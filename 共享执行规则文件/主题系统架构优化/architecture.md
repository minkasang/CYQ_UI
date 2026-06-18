# 主题系统架构设计文档

## 一、设计目标

### 1.1 质量目标（来自 rules）

根据 `.trae/rules/project_rules.md` 的质量属性要求，主题系统必须确保：

| 质量属性 | 目标 | 实现手段（来自 skill） |
|----------|------|----------------------|
| **可靠性** | 主题切换不崩溃，错误可恢复 | 错误处理：fail-fast + 容错降级 |
| **可维护性** | 主题逻辑集中管理，易于修改 | 项目结构：按功能分包 |
| **可扩展性** | 新增主题无需修改核心代码 | 设计原则：开闭原则（OCP） |
| **性能效率** | 主题切换响应时间 < 100ms | 数据流：不可变数据优先 |
| **可测试性** | 主题引擎可独立测试 | 可测试性设计：依赖注入 |
| **可观测性** | 主题状态可监控，日志可追踪 | 错误处理：错误传播链 |
| **安全性** | 主题配置安全可控 | 接口与契约：输入校验 |
| **兼容性** | 向后兼容现有配置 | 接口与契约：向后兼容策略 |
| **可移植性** | 主题包可独立分发 | 项目结构：按功能分包 |

### 1.2 功能目标

1. **支持多主题切换**：液态玻璃、扁平化、毛玻璃、新拟态等
2. **主题可扩展**：第三方开发者可以创建主题包
3. **主题可配置**：用户可以自定义主题参数
4. **性能优化**：主题切换流畅，不影响应用性能
5. **向后兼容**：现有液态玻璃效果保持不变

## 二、架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      应用层（Application）                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  HomePage    │  │  TodoPage    │  │  DiaryPage   │ ...  │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    主题管理层（Theme Manager）                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ThemeProvider（主题提供者）                │  │
│  │  - 管理主题状态                                         │  │
│  │  - 提供主题上下文                                       │  │
│  │  - 处理主题切换                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ThemeManager（主题管理器）                 │  │
│  │  - 主题注册/注销                                       │  │
│  │  - 主题切换                                            │  │
│  │  - 主题配置管理                                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   主题抽象层（Theme Abstraction）              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ThemeEngine（主题引擎接口）                │  │
│  │  - init(config): Promise<void>                        │  │
│  │  - render(element, config): void                      │  │
│  │  - update(config): void                               │  │
│  │  - destroy(): void                                    │  │
│  │  - getCapabilities(): ThemeCapabilities               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   主题实现层（Theme Engines）                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ LiquidGlass  │  │   FlatTheme  │  │ FrostedGlass │ ...  │
│  │   Engine     │  │    Engine    │  │    Engine    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    数据层（Data Layer）                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ThemeStore   │  │ ConfigStore  │  │ WallpaperStore│     │
│  │  (Zustand)   │  │  (Zustand)   │  │  (Zustand)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 依赖方向

遵循 **依赖反转原则（DIP）**：
- 应用层 → 主题管理层 → 主题抽象层 ← 主题实现层
- 高层模块（应用层、主题管理层）依赖抽象（主题抽象层）
- 低层模块（主题实现层）实现抽象（主题抽象层）

## 三、核心接口设计

### 3.1 主题引擎接口（ThemeEngine）

```typescript
/**
 * 主题引擎接口 - 所有主题引擎必须实现此接口
 * 遵循接口隔离原则（ISP）：接口小而精，只包含必要方法
 */
interface ThemeEngine {
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
```

### 3.2 主题配置接口（ThemeConfig）

```typescript
/**
 * 主题配置接口
 * 遵循参数明确原则：每个字段都有明确的类型和说明
 */
interface ThemeConfig {
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

/**
 * 主题元数据
 */
interface ThemeMetadata {
  id: string                    // 主题唯一标识
  name: string                  // 主题显示名称
  description?: string          // 主题描述
  version: string               // 主题版本
  author?: string               // 作者
  tags?: string[]               // 标签（如：glass, flat, modern）
  preview?: string              // 预览图URL
}

/**
 * 主题变体
 */
interface ThemeVariant {
  id: string                    // 变体ID
  name: string                  // 变体名称
  description?: string          // 变体描述
  config: Partial<ThemeConfig>  // 变体配置
}

/**
 * 主题引擎类型
 */
type ThemeEngineType =
  | 'liquid-glass'    // 液态玻璃
  | 'flat'            // 扁平化
  | 'frosted'         // 毛玻璃
  | 'neumorphism'     // 新拟态
  | 'gradient'        // 渐变
  | 'custom'          // 自定义

/**
 * 主题能力标记
 */
interface ThemeCapabilities {
  dynamicBackground: boolean    // 是否支持动态背景
  realTimeParams: boolean       // 是否支持实时调参
  customShapes: boolean         // 是否支持自定义形状
  performance: 'high' | 'medium' | 'low'  // 性能等级
  supportedBrowsers: string[]   // 支持的浏览器
}
```

### 3.3 主题管理器接口（ThemeManager）

```typescript
/**
 * 主题管理器接口
 * 遵循单一职责原则（SRP）：只负责主题管理
 */
interface ThemeManager {
  // ========== 主题注册 ==========
  /**
   * 注册主题
   * @param theme 主题包
   * @throws ThemeRegisterError 注册失败时抛出
   */
  registerTheme(theme: ThemePackage): void

  /**
   * 注销主题
   * @param themeId 主题ID
   */
  unregisterTheme(themeId: string): void

  // ========== 主题切换 ==========
  /**
   * 切换主题
   * @param themeId 主题ID
   * @param variantId 变体ID（可选）
   * @throws ThemeSwitchError 切换失败时抛出
   */
  switchTheme(themeId: string, variantId?: string): Promise<void>

  // ========== 主题查询 ==========
  /**
   * 获取当前激活的主题
   * @returns 当前主题包，如果没有则返回null
   */
  getActiveTheme(): ThemePackage | null

  /**
   * 获取主题列表
   * @returns 所有已注册的主题包
   */
  getThemeList(): ThemePackage[]

  /**
   * 获取主题详情
   * @param themeId 主题ID
   * @returns 主题包，如果不存在则返回null
   */
  getTheme(themeId: string): ThemePackage | null

  // ========== 主题配置 ==========
  /**
   * 更新主题配置
   * @param config 新的主题配置（部分更新）
   */
  updateThemeConfig(config: Partial<ThemeConfig>): void

  /**
   * 重置主题配置
   */
  resetThemeConfig(): void

  /**
   * 获取当前主题配置
   * @returns 当前主题配置
   */
  getThemeConfig(): ThemeConfig | null
}
```

### 3.4 主题包结构（ThemePackage）

```typescript
/**
 * 主题包结构
 * 遵循稳定的公共API原则：主题包结构稳定，便于分发
 */
interface ThemePackage {
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
```

## 四、状态管理设计

### 4.1 主题 Store（useThemeStore）

```typescript
/**
 * 主题状态管理
 * 遵循状态归属原则：状态放在离使用者最近的地方
 */
interface ThemeState {
  // ========== 状态 ==========
  activeThemeId: string | null          // 当前激活的主题ID
  activeVariantId: string | null        // 当前激活的变体ID
  registeredThemes: Map<string, ThemePackage>  // 已注册的主题

  // ========== 操作 ==========
  registerTheme: (theme: ThemePackage) => void
  unregisterTheme: (themeId: string) => void
  switchTheme: (themeId: string, variantId?: string) => Promise<void>
  updateConfig: (config: Partial<ThemeConfig>) => void
  resetConfig: () => void

  // ========== 选择器 ==========
  getActiveTheme: () => ThemePackage | null
  getThemeList: () => ThemePackage[]
}
```

### 4.2 与现有 Store 的关系

```
useThemeStore（新增）
├── activeThemeId
├── activeVariantId
└── registeredThemes

useSettingsStore（现有）
├── glass: GlassConfig        → 迁移到 useThemeStore
├── theme: 'light' | 'dark'   → 迁移到 useThemeStore
└── 其他设置...

useWallpaperStore（现有）
├── current: Wallpaper
└── history: Wallpaper[]
```

## 五、错误处理设计

### 5.1 错误类型定义

```typescript
/**
 * 主题错误基类
 * 遵循业务异常与技术异常分离原则
 */
class ThemeError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ThemeError'
  }
}

// 业务异常
class ThemeNotFoundError extends ThemeError {
  constructor(themeId: string) {
    super(`主题未找到: ${themeId}`, 'THEME_NOT_FOUND')
  }
}

class ThemeInitError extends ThemeError {
  constructor(themeId: string, reason: string) {
    super(`主题初始化失败: ${themeId}, 原因: ${reason}`, 'THEME_INIT_FAILED')
  }
}

class ThemeSwitchError extends ThemeError {
  constructor(fromId: string, toId: string, reason: string) {
    super(`主题切换失败: ${fromId} → ${toId}, 原因: ${reason}`, 'THEME_SWITCH_FAILED')
  }
}

// 技术异常
class ThemeEngineError extends ThemeError {
  constructor(engineName: string, reason: string) {
    super(`主题引擎错误: ${engineName}, 原因: ${reason}`, 'THEME_ENGINE_ERROR')
  }
}
```

### 5.2 错误处理策略

```typescript
/**
 * 主题切换错误处理
 * 遵循容错降级原则
 */
async function switchThemeWithErrorHandling(
  themeId: string,
  variantId?: string
): Promise<void> {
  try {
    // 尝试切换主题
    await themeManager.switchTheme(themeId, variantId)
  } catch (error) {
    if (error instanceof ThemeNotFoundError) {
      // 业务异常：主题不存在，提示用户
      console.error(`主题 ${themeId} 不存在`)
      // 降级处理：使用默认主题
      await themeManager.switchTheme('default')
    } else if (error instanceof ThemeInitError) {
      // 技术异常：初始化失败，记录日志
      console.error(`主题初始化失败: ${error.message}`)
      // 降级处理：使用扁平化主题
      await themeManager.switchTheme('flat')
    } else if (error instanceof ThemeSwitchError) {
      // 技术异常：切换失败，记录日志
      console.error(`主题切换失败: ${error.message}`)
      // 降级处理：保持当前主题
    } else {
      // 未知异常：记录日志，抛出
      console.error(`未知错误: ${error}`)
      throw error
    }
  }
}
```

## 六、性能优化设计

### 6.1 懒加载机制

```typescript
/**
 * 主题懒加载
 * 遵循性能效率原则
 */
class LazyThemeLoader {
  private cache: Map<string, Promise<ThemePackage>> = new Map()

  /**
   * 懒加载主题
   * @param themeId 主题ID
   * @returns 主题包Promise
   */
  async loadTheme(themeId: string): Promise<ThemePackage> {
    // 检查缓存
    if (this.cache.has(themeId)) {
      return this.cache.get(themeId)!
    }

    // 加载主题
    const loadPromise = this.fetchTheme(themeId)
    this.cache.set(themeId, loadPromise)

    return loadPromise
  }

  /**
   * 预加载主题
   * @param themeIds 主题ID列表
   */
  async preloadThemes(themeIds: string[]): Promise<void> {
    await Promise.all(themeIds.map(id => this.loadTheme(id)))
  }
}
```

### 6.2 配置缓存

```typescript
/**
 * 主题配置缓存
 * 遵循性能效率原则
 */
class ThemeConfigCache {
  private cache: Map<string, ThemeConfig> = new Map()

  /**
   * 获取缓存的配置
   * @param themeId 主题ID
   * @returns 缓存的配置，如果不存在则返回null
   */
  get(themeId: string): ThemeConfig | null {
    return this.cache.get(themeId) || null
  }

  /**
   * 设置缓存
   * @param themeId 主题ID
   * @param config 主题配置
   */
  set(themeId: string, config: ThemeConfig): void {
    this.cache.set(themeId, config)
  }

  /**
   * 清除缓存
   * @param themeId 主题ID（可选，不传则清除所有）
   */
  clear(themeId?: string): void {
    if (themeId) {
      this.cache.delete(themeId)
    } else {
      this.cache.clear()
    }
  }
}
```

## 七、向后兼容设计

### 7.1 配置迁移

```typescript
/**
 * 配置迁移工具
 * 遵循向后兼容原则
 */
class ConfigMigrator {
  /**
   * 迁移旧配置到新格式
   * @param oldConfig 旧配置
   * @returns 新配置
   */
  migrate(oldConfig: any): ThemeConfig {
    // 检测旧配置格式
    if (oldConfig.glass && 'mode' in oldConfig.glass) {
      // 旧格式：包含 mode 字段
      return this.migrateFromV0(oldConfig)
    } else if (oldConfig.theme) {
      // 旧格式：只有 theme 字段
      return this.migrateFromV1(oldConfig)
    } else {
      // 新格式：直接返回
      return oldConfig
    }
  }

  /**
   * 从 v0 迁移
   */
  private migrateFromV0(oldConfig: any): ThemeConfig {
    return {
      metadata: {
        id: 'liquid-glass',
        name: '液态玻璃',
        version: '1.0.0'
      },
      variants: [],
      engine: {
        type: 'liquid-glass',
        params: oldConfig.glass
      }
    }
  }

  /**
   * 从 v1 迁移
   */
  private migrateFromV1(oldConfig: any): ThemeConfig {
    return {
      metadata: {
        id: oldConfig.theme === 'dark' ? 'flat-dark' : 'flat-light',
        name: oldConfig.theme === 'dark' ? '扁平化深色' : '扁平化浅色',
        version: '1.0.0'
      },
      variants: [],
      engine: {
        type: 'flat',
        params: {}
      }
    }
  }
}
```

### 7.2 API 兼容层

```typescript
/**
 * API 兼容层
 * 保持旧 API 可用，标记为 deprecated
 */
class ThemeAPICompat {
  private themeManager: ThemeManager

  constructor(themeManager: ThemeManager) {
    this.themeManager = themeManager
  }

  /**
   * @deprecated 请使用 themeManager.switchTheme()
   */
  setGlass(config: Partial<GlassConfig>): void {
    console.warn('setGlass 已废弃，请使用 themeManager.updateThemeConfig()')
    this.themeManager.updateThemeConfig({
      engine: { type: 'liquid-glass', params: config }
    })
  }

  /**
   * @deprecated 请使用 themeManager.switchTheme()
   */
  setTheme(theme: 'light' | 'dark'): void {
    console.warn('setTheme 已废弃，请使用 themeManager.switchTheme()')
    const themeId = theme === 'dark' ? 'flat-dark' : 'flat-light'
    this.themeManager.switchTheme(themeId)
  }
}
```

## 八、架构健康检查

### 8.1 检查清单

根据 `.trae/skill/healthy-architecture/SKILL.md` 的架构健康检查清单：

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 模块职责清晰 | ✅ | 主题引擎、主题管理器、主题包职责明确 |
| 接口稳定 | ✅ | 主题引擎接口稳定，新增主题无需修改接口 |
| 依赖方向正确 | ✅ | 应用层 → 主题管理层 → 主题抽象层 ← 主题实现层 |
| 错误有处理 | ✅ | 定义了完整的错误类型和处理策略 |
| 可测试 | ✅ | 主题引擎可独立测试，依赖注入 |
| 无过度设计 | ✅ | 只为已出现的需求设计扩展点 |
| 副作用隔离 | ✅ | 主题渲染与业务逻辑分离 |

### 8.2 禁止行为检查

根据 `.trae/skill/healthy-architecture/SKILL.md` 的禁止行为清单：

| 禁止行为 | 状态 | 说明 |
|----------|------|------|
| 没有接口设计就直接写实现 | ✅ | 先定义接口，再实现 |
| 为了"更快完成"而牺牲架构清晰度 | ✅ | 保持架构清晰 |
| 深层继承链（>3 层） | ✅ | 无继承链，使用组合 |
| 链式调用穿过 3 个以上对象 | ✅ | 封装在中间层 |
| 第一次出现重复就急着重构抽象 | ✅ | 遵循三次法则 |
| 吞异常不传播上下文 | ✅ | 错误传播链完整 |
| 混放业务异常和技术异常 | ✅ | 分离定义 |
| 状态放在共享层但只被一个模块使用 | ✅ | 状态归属合理 |

## 九、总结

本架构设计遵循了 `.trae/rules/project_rules.md` 的质量目标和 `.trae/skill/healthy-architecture/SKILL.md` 的设计维度，确保了主题系统的：

1. **可靠性**：通过错误处理和容错降级实现
2. **可维护性**：通过模块化设计和清晰的职责划分实现
3. **可扩展性**：通过主题引擎接口和主题包机制实现
4. **性能效率**：通过懒加载和缓存机制实现
5. **可测试性**：通过依赖注入和副作用隔离实现
6. **可观测性**：通过错误传播链和日志实现
7. **安全性**：通过输入校验和配置验证实现
8. **兼容性**：通过配置迁移和API兼容层实现
9. **可移植性**：通过主题包结构实现

下一步将进入阶段三：原型实现。
