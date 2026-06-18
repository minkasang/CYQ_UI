// 主题管理器
// 给 AI 的话：管理主题注册、切换、查询，确保不破坏现有功能

import type { ThemePackage, ThemeConfig } from '../types/theme'
import {
  ThemeNotFoundError,
  ThemeRegisterError,
  ThemeSwitchError
} from '../types/theme'

/**
 * 主题管理器
 * 遵循单一职责原则（SRP）：只负责主题管理
 */
export class ThemeManager {
  private registeredThemes: Map<string, ThemePackage> = new Map()
  private activeTheme: ThemePackage | null = null
  private activeVariantId: string | null = null

  /**
   * 注册主题
   */
  registerTheme(theme: ThemePackage): void {
    try {
      // 验证主题包
      this.validateThemePackage(theme)

      // 注册主题
      this.registeredThemes.set(theme.metadata.id, theme)
      console.log(`[ThemeManager] 主题已注册: ${theme.metadata.name} (${theme.metadata.id})`)
    } catch (error) {
      throw new ThemeRegisterError(
        theme.metadata.id,
        `注册失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 注销主题
   */
  unregisterTheme(themeId: string): void {
    const theme = this.registeredThemes.get(themeId)
    if (!theme) {
      console.warn(`[ThemeManager] 主题未找到: ${themeId}`)
      return
    }

    // 如果是当前激活的主题，先销毁
    if (this.activeTheme?.metadata.id === themeId) {
      this.activeTheme.engine.destroy()
      this.activeTheme = null
      this.activeVariantId = null
    }

    this.registeredThemes.delete(themeId)
    console.log(`[ThemeManager] 主题已注销: ${themeId}`)
  }

  /**
   * 切换主题
   */
  async switchTheme(themeId: string, variantId?: string): Promise<void> {
    try {
      // 查找主题
      const theme = this.registeredThemes.get(themeId)
      if (!theme) {
        throw new ThemeNotFoundError(themeId)
      }

      // 销毁当前主题
      if (this.activeTheme) {
        this.activeTheme.engine.destroy()
      }

      // 初始化新主题
      const config = variantId
        ? this.mergeVariantConfig(theme.config, variantId)
        : theme.config

      await theme.engine.init(config)

      // 更新激活状态
      this.activeTheme = theme
      this.activeVariantId = variantId || null

      console.log(`[ThemeManager] 主题已切换: ${theme.metadata.name}${variantId ? ` (${variantId})` : ''}`)
    } catch (error) {
      if (error instanceof ThemeNotFoundError) {
        throw error
      }
      throw new ThemeSwitchError(
        this.activeTheme?.metadata.id || 'none',
        themeId,
        `切换失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 获取当前激活的主题
   */
  getActiveTheme(): ThemePackage | null {
    return this.activeTheme
  }

  /**
   * 获取主题列表
   */
  getThemeList(): ThemePackage[] {
    return Array.from(this.registeredThemes.values())
  }

  /**
   * 获取主题详情
   */
  getTheme(themeId: string): ThemePackage | null {
    return this.registeredThemes.get(themeId) || null
  }

  /**
   * 更新主题配置
   */
  updateThemeConfig(config: Partial<ThemeConfig>): void {
    if (!this.activeTheme) {
      console.warn('[ThemeManager] 没有激活的主题，无法更新配置')
      return
    }

    this.activeTheme.engine.update(config)
    console.log(`[ThemeManager] 主题配置已更新`)
  }

  /**
   * 重置主题配置
   */
  resetThemeConfig(): void {
    if (!this.activeTheme) {
      console.warn('[ThemeManager] 没有激活的主题，无法重置配置')
      return
    }

    // 重置为默认配置
    this.activeTheme.engine.update(this.activeTheme.config)
    console.log(`[ThemeManager] 主题配置已重置`)
  }

  /**
   * 获取当前主题配置
   */
  getThemeConfig(): ThemeConfig | null {
    return this.activeTheme?.config || null
  }

  /**
   * 验证主题包
   */
  private validateThemePackage(theme: ThemePackage): void {
    // 验证元数据
    if (!theme.metadata.id) {
      throw new Error('主题缺少 ID')
    }
    if (!theme.metadata.name) {
      throw new Error('主题缺少名称')
    }
    if (!theme.metadata.version) {
      throw new Error('主题缺少版本')
    }

    // 验证引擎
    if (!theme.engine) {
      throw new Error('主题缺少引擎')
    }

    // 验证配置
    if (!theme.config) {
      throw new Error('主题缺少配置')
    }
  }

  /**
   * 合并变体配置
   */
  private mergeVariantConfig(baseConfig: ThemeConfig, variantId: string): ThemeConfig {
    const variant = baseConfig.variants.find(v => v.id === variantId)
    if (!variant) {
      console.warn(`[ThemeManager] 变体未找到: ${variantId}，使用基础配置`)
      return baseConfig
    }

    // 深度合并配置
    return {
      ...baseConfig,
      ...variant.config,
      engine: {
        ...baseConfig.engine,
        ...variant.config.engine,
        params: {
          ...baseConfig.engine.params,
          ...variant.config.engine?.params
        }
      }
    }
  }

  /**
   * 获取激活的主题 ID
   */
  getActiveThemeId(): string | null {
    return this.activeTheme?.metadata.id || null
  }

  /**
   * 获取激活的变体 ID
   */
  getActiveVariantId(): string | null {
    return this.activeVariantId
  }

  /**
   * 检查主题是否已注册
   */
  hasTheme(themeId: string): boolean {
    return this.registeredThemes.has(themeId)
  }

  /**
   * 获取已注册主题数量
   */
  getThemeCount(): number {
    return this.registeredThemes.size
  }
}
