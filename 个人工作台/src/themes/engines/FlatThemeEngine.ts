// 扁平化主题引擎
// 给 AI 的话：实现简洁的扁平化主题，参考 macOS 设计原则

import type { ThemeEngine, ThemeConfig, ThemeCapabilities } from '../../types/theme'
import { ThemeEngineError } from '../../types/theme'

/**
 * 扁平化主题引擎
 * 遵循 macOS 设计原则：简洁、清晰、高效
 */
export class FlatThemeEngine implements ThemeEngine {
  readonly name = 'flat'
  readonly version = '1.0.0'
  readonly author = 'Personal Workbench Team'

  private config: ThemeConfig | null = null
  private registeredElements: Set<HTMLElement> = new Set()
  private styleElement: HTMLStyleElement | null = null

  /**
   * 初始化主题引擎
   */
  async init(config: ThemeConfig): Promise<void> {
    try {
      this.config = config

      // 创建样式元素
      this.styleElement = document.createElement('style')
      this.styleElement.id = 'flat-theme-styles'
      document.head.appendChild(this.styleElement)

      // 应用基础样式
      this.applyBaseStyles()

      console.log(`[FlatThemeEngine] 初始化完成`)
    } catch (error) {
      throw new ThemeEngineError(
        this.name,
        `初始化失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 渲染主题到指定元素
   */
  render(element: HTMLElement, config: ThemeConfig): void {
    if (!this.config) {
      console.warn('[FlatThemeEngine] 引擎未初始化，跳过渲染')
      return
    }

    try {
      // 应用扁平化样式
      this.applyFlatStyles(element, config)

      // 记录已注册元素
      if (!this.registeredElements.has(element)) {
        this.registeredElements.add(element)
      }
    } catch (error) {
      console.error('[FlatThemeEngine] 渲染失败:', error)
    }
  }

  /**
   * 更新主题配置
   */
  update(config: Partial<ThemeConfig>): void {
    if (!this.config || !this.styleElement) {
      console.warn('[FlatThemeEngine] 引擎未初始化，跳过更新')
      return
    }

    try {
      // 合并配置
      this.config = {
        ...this.config,
        ...config,
        colors: {
          ...this.config.colors,
          ...config.colors
        },
        typography: {
          ...this.config.typography,
          ...config.typography
        },
        spacing: {
          ...this.config.spacing,
          ...config.spacing
        }
      }

      // 更新样式
      this.applyBaseStyles()

      // 更新所有已注册元素
      this.registeredElements.forEach(element => {
        this.applyFlatStyles(element, this.config!)
      })

      console.log(`[FlatThemeEngine] 配置已更新`)
    } catch (error) {
      console.error('[FlatThemeEngine] 更新失败:', error)
    }
  }

  /**
   * 销毁主题引擎，释放资源
   */
  destroy(): void {
    // 移除样式元素
    if (this.styleElement && this.styleElement.parentNode) {
      this.styleElement.parentNode.removeChild(this.styleElement)
      this.styleElement = null
    }

    // 清理已注册元素
    this.registeredElements.forEach(element => {
      this.removeFlatStyles(element)
    })
    this.registeredElements.clear()

    this.config = null
    console.log(`[FlatThemeEngine] 已销毁`)
  }

  /**
   * 获取主题引擎能力
   */
  getCapabilities(): ThemeCapabilities {
    return {
      dynamicBackground: false,
      realTimeParams: true,
      customShapes: false,
      performance: 'high',
      supportedBrowsers: ['Chrome', 'Firefox', 'Safari', 'Edge']
    }
  }

  /**
   * 应用基础样式
   */
  private applyBaseStyles(): void {
    if (!this.styleElement || !this.config) return

    const { colors, typography, spacing, shadows, borders } = this.config

    // 生成 CSS 变量
    const cssVariables = this.generateCSSVariables(colors, typography, spacing, shadows, borders)

    this.styleElement.textContent = `
      :root {
        ${cssVariables}
      }

      /* 扁平化主题基础样式 */
      .flat-theme {
        background-color: var(--flat-background);
        color: var(--flat-text);
        font-family: var(--flat-font-family);
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      /* 扁平化面板样式 */
      .flat-panel {
        background-color: var(--flat-surface);
        border-radius: var(--flat-radius-md);
        box-shadow: var(--flat-shadow-sm);
        padding: var(--flat-spacing-md);
        border: 1px solid var(--flat-border);
        transition: all 0.2s ease;
      }

      .flat-panel:hover {
        box-shadow: var(--flat-shadow-md);
      }

      /* 扁平化按钮样式 */
      .flat-button {
        background-color: var(--flat-primary);
        color: white;
        border: none;
        border-radius: var(--flat-radius-sm);
        padding: var(--flat-spacing-sm) var(--flat-spacing-md);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .flat-button:hover {
        opacity: 0.9;
        transform: translateY(-1px);
      }

      .flat-button:active {
        transform: translateY(0);
      }

      /* 扁平化输入框样式 */
      .flat-input {
        background-color: var(--flat-surface);
        border: 1px solid var(--flat-border);
        border-radius: var(--flat-radius-sm);
        padding: var(--flat-spacing-sm) var(--flat-spacing-md);
        color: var(--flat-text);
        transition: border-color 0.2s ease;
      }

      .flat-input:focus {
        outline: none;
        border-color: var(--flat-primary);
      }
    `
  }

  /**
   * 生成 CSS 变量
   */
  private generateCSSVariables(
    colors?: any,
    typography?: any,
    spacing?: any,
    shadows?: any,
    borders?: any
  ): string {
    const variables: string[] = []

    // 颜色变量
    if (colors) {
      variables.push(`--flat-primary: ${colors.primary || '#007AFF'}`)
      variables.push(`--flat-secondary: ${colors.secondary || '#5856D6'}`)
      variables.push(`--flat-background: ${colors.background || '#F5F5F7'}`)
      variables.push(`--flat-surface: ${colors.surface || '#FFFFFF'}`)
      variables.push(`--flat-text: ${colors.text || '#1D1D1F'}`)
      variables.push(`--flat-text-secondary: ${colors.textSecondary || '#86868B'}`)
      variables.push(`--flat-border: ${colors.border || '#D2D2D7'}`)
    }

    // 字体变量
    if (typography) {
      variables.push(`--flat-font-family: ${typography.fontFamily || '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}`)

      if (typography.fontSize) {
        Object.entries(typography.fontSize).forEach(([key, value]) => {
          variables.push(`--flat-font-size-${key}: ${value}`)
        })
      }

      if (typography.fontWeight) {
        Object.entries(typography.fontWeight).forEach(([key, value]) => {
          variables.push(`--flat-font-weight-${key}: ${value}`)
        })
      }
    }

    // 间距变量
    if (spacing) {
      Object.entries(spacing).forEach(([key, value]) => {
        variables.push(`--flat-spacing-${key}: ${value}`)
      })
    }

    // 阴影变量
    if (shadows) {
      Object.entries(shadows).forEach(([key, value]) => {
        variables.push(`--flat-shadow-${key}: ${value}`)
      })
    }

    // 边框变量
    if (borders) {
      if (borders.radius) {
        Object.entries(borders.radius).forEach(([key, value]) => {
          variables.push(`--flat-radius-${key}: ${value}`)
        })
      }
    }

    return variables.join(';\n        ')
  }

  /**
   * 应用扁平化样式到元素
   */
  private applyFlatStyles(element: HTMLElement, config: ThemeConfig): void {
    // 添加扁平化主题类
    element.classList.add('flat-theme')

    // 应用颜色
    if (config.colors) {
      element.style.backgroundColor = config.colors.background || '#F5F5F7'
      element.style.color = config.colors.text || '#1D1D1F'
    }

    // 应用字体
    if (config.typography?.fontFamily) {
      element.style.fontFamily = config.typography.fontFamily
    }
  }

  /**
   * 移除扁平化样式
   */
  private removeFlatStyles(element: HTMLElement): void {
    element.classList.remove('flat-theme')
    element.style.backgroundColor = ''
    element.style.color = ''
    element.style.fontFamily = ''
  }
}
