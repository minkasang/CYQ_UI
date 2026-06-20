// 液态玻璃主题引擎
// 给 AI 的话：包装现有 LiquidGlass 类，实现 ThemeEngine 接口，确保不破坏现有功能

import type { ThemeEngine, ThemeConfig, ThemeCapabilities } from '../../types/theme'
import { LiquidGlass, type LiquidGlassConfig } from '../../lib/liquid-glass'
import { ThemeEngineError } from '../../types/theme'

/**
 * 液态玻璃主题引擎
 * 遵循开闭原则（OCP）：扩展功能，不修改原有代码
 */
export class LiquidGlassEngine implements ThemeEngine {
  readonly name = 'liquid-glass'
  readonly version = '1.0.0'
  readonly author = 'Personal Workbench Team'

  private lg: LiquidGlass | null = null
  private config: ThemeConfig | null = null
  private registeredPanels: Set<HTMLElement> = new Set()

  /**
   * 初始化主题引擎
   */
  async init(config: ThemeConfig): Promise<void> {
    try {
      this.config = config

      // 从配置中提取背景 URL
      const bgUrl = this.extractBackgroundUrl(config)
      if (!bgUrl) {
        throw new ThemeEngineError(this.name, '缺少背景图片URL')
      }

      // 创建 LiquidGlass 实例
      this.lg = new LiquidGlass(bgUrl)
      await this.lg.init()

      console.log(`[LiquidGlassEngine] 初始化完成`)
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
    if (!this.lg) {
      console.warn('[LiquidGlassEngine] 引擎未初始化，跳过渲染')
      return
    }

    try {
      // 提取玻璃参数
      const glassParams = this.extractGlassParams(config)

      // 注册面板
      if (!this.registeredPanels.has(element)) {
        this.lg.addPanel(element, glassParams)
        this.registeredPanels.add(element)
      }
    } catch (error) {
      console.error('[LiquidGlassEngine] 渲染失败:', error)
    }
  }

  /**
   * 更新主题配置
   */
  update(config: Partial<ThemeConfig>): void {
    if (!this.lg || !this.config) {
      console.warn('[LiquidGlassEngine] 引擎未初始化，跳过更新')
      return
    }

    try {
      // 合并配置
      this.config = {
        ...this.config,
        ...config,
        engine: {
          ...this.config.engine,
          ...config.engine,
          params: {
            ...this.config.engine.params,
            ...config.engine?.params
          }
        }
      }

      // 提取玻璃参数
      const glassParams = this.extractGlassParams(this.config)

      // 更新所有面板
      this.lg.updateConfig(glassParams)

      console.log(`[LiquidGlassEngine] 配置已更新`)
    } catch (error) {
      console.error('[LiquidGlassEngine] 更新失败:', error)
    }
  }

  /**
   * 销毁主题引擎，释放资源
   */
  destroy(): void {
    if (this.lg) {
      this.lg.destroy()
      this.lg = null
    }
    this.config = null
    this.registeredPanels.clear()
    console.log(`[LiquidGlassEngine] 已销毁`)
  }

  /**
   * 获取主题引擎能力
   */
  getCapabilities(): ThemeCapabilities {
    return {
      dynamicBackground: true,
      realTimeParams: true,
      customShapes: false,
      performance: 'medium',
      supportedBrowsers: ['Chrome', 'Firefox', 'Safari', 'Edge']
    }
  }

  getParamDefs(): import('../../types/theme').ParamDef[] {
    return [
      { key: 'refraction',      label: '折射率',   type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.69 },
      { key: 'chromAberration', label: '色差强度', type: 'slider', min: 0, max: 10, step: 0.01, defaultValue: 0.05 },
      { key: 'fresnel',         label: '菲涅尔',   type: 'slider', min: 0, max: 2, step: 0.01, defaultValue: 1.0 },
      { key: 'specular',        label: '镜面反射', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.0 },
      { key: 'cornerRadius',    label: '圆角',     type: 'slider', min: 0, max: 50, step: 1, defaultValue: 24 },
      { key: 'zRadius',         label: 'Z轴半径',  type: 'slider', min: 0, max: 80, step: 1, defaultValue: 40 },
      { key: 'opacity',         label: '不透明度', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 1.0 },
      { key: 'saturation',      label: '饱和度',   type: 'slider', min: 0, max: 300, step: 1, defaultValue: 0 },
      { key: 'brightness',      label: '亮度',     type: 'slider', min: -50, max: 50, step: 1, defaultValue: 0 },
      { key: 'tintStrength',    label: '色调强度', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.0 },
      { key: 'shadowOpacity',   label: '阴影不透明度', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.30 },
      { key: 'shadowSpread',    label: '阴影扩散', type: 'slider', min: 0, max: 40, step: 1, defaultValue: 10 },
      { key: 'shadowOffsetY',   label: '阴影Y偏移', type: 'slider', min: 0, max: 20, step: 1, defaultValue: 1 },
      { key: 'blurAmount',      label: '模糊度',   type: 'slider', min: 0, max: 2, step: 0.1, defaultValue: 0.0 },
      { key: 'distortion',      label: '畸变',     type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.0 },
      { key: 'edgeHighlight',   label: '边缘高光', type: 'slider', min: 0, max: 0.5, step: 0.01, defaultValue: 0.05 },
    ]
  }

  /**
   * 提取背景 URL
   */
  private extractBackgroundUrl(config: ThemeConfig): string | null {
    // 从配置中提取背景 URL
    // 这里需要根据实际的配置结构来提取
    // 暂时返回一个默认值
    return config.engine.params?.bgUrl || null
  }

  /**
   * 提取玻璃参数
   */
  private extractGlassParams(config: ThemeConfig): LiquidGlassConfig {
    const params = config.engine.params || {}

    // 映射配置参数到 LiquidGlass 参数
    return {
      refraction: params.refraction ?? 0.69,
      chromAberration: params.chromAberration ?? 0.05,
      fresnel: params.fresnel ?? 1.0,
      specular: params.specular ?? 0.0,
      cornerRadius: params.cornerRadius ?? 24,
      zRadius: params.zRadius ?? 40,
      opacity: params.opacity ?? 1.0,
      saturation: params.saturation ?? 0.0,
      brightness: params.brightness ?? 0.0,
      tintStrength: params.tintStrength ?? 0.0,
      shadowOpacity: params.shadowOpacity ?? 0.30,
      shadowSpread: params.shadowSpread ?? 10,
      shadowOffsetY: params.shadowOffsetY ?? 1,
      blurAmount: params.blurAmount ?? 0.0,
      distortion: params.distortion ?? 0.0,
      edgeHighlight: params.edgeHighlight ?? 0.05,
    }
  }

  /**
   * 切换背景图片
   */
  async changeBackground(url: string): Promise<void> {
    if (!this.lg) {
      throw new ThemeEngineError(this.name, '引擎未初始化')
    }

    try {
      await this.lg.changeBg(url)
      console.log(`[LiquidGlassEngine] 背景已切换`)
    } catch (error) {
      throw new ThemeEngineError(
        this.name,
        `切换背景失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 获取内部 LiquidGlass 实例（用于向后兼容）
   * @deprecated 仅用于向后兼容，新代码请使用 ThemeEngine 接口
   */
  getInternalInstance(): LiquidGlass | null {
    return this.lg
  }
}
