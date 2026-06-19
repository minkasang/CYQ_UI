// 主题状态管理 Store
// 给 AI 的话：管理主题注册、切换、预览、回滚，与现有 Store 协调

import { create } from 'zustand'
import type {
  ThemePackage,
  ThemeConfig,
  GlobalThemeConfig,
  ThemePreviewState,
  ThemeHistoryEntry,
  ConfigInheritanceChain
} from '../types/theme'
import {
  DEFAULT_GLOBAL_CONFIG,
  ThemeNotFoundError,
  ThemeSwitchError,
  ThemePreviewError,
  ThemeRollbackError
} from '../types/theme'
import { ThemeManager } from '../themes/ThemeManager'
import { ThemeLoader } from '../themes/ThemeLoader'
import { loadFromFile, saveToFile } from '../utils/fileStorage'

// 主题配置文件路径
const THEME_CONFIG_FILE = '个人工作台/data/theme_config.json'

// ========== 状态接口 ==========
interface ThemeState {
  // ========== 基础状态 ==========
  activeThemeId: string | null          // 当前激活的主题ID
  activeVariantId: string | null        // 当前激活的变体ID
  loaded: boolean                       // 是否已从文件加载

  // ========== 扩展状态 ==========
  globalConfig: GlobalThemeConfig        // 全局配置
  themeHistory: ThemeHistoryEntry[]      // 切换历史
  previewState: ThemePreviewState        // 预览状态
  userOverrides: Record<string, Partial<ThemeConfig>>  // 用户自定义配置

  // ========== 内部实例 ==========
  _themeManager: ThemeManager | null     // 主题管理器实例
  _themeLoader: ThemeLoader | null       // 主题加载器实例

  // ========== 基础操作 ==========
  loadFromFile: () => Promise<void>       // 初始化主题系统（与其他 Store 保持命名一致）
  registerTheme: (theme: ThemePackage) => void
  unregisterTheme: (themeId: string) => void
  switchTheme: (themeId: string, variantId?: string) => Promise<void>

  // ========== 扩展操作 ==========
  updateGlobalConfig: (config: Partial<GlobalThemeConfig>) => void
  updateUserOverride: (themeId: string, config: Partial<ThemeConfig>) => void
  startPreview: (themeId: string, variantId?: string) => Promise<void>
  endPreview: () => void
  applyPreview: () => Promise<void>
  rollback: () => Promise<void>
  rollbackTo: (index: number) => Promise<void>

  // ========== 选择器 ==========
  getActiveTheme: () => ThemePackage | null
  getThemeList: () => ThemePackage[]
  getMergedConfig: (themeId: string) => ThemeConfig | null
  getHistory: () => ThemeHistoryEntry[]
  canRollback: () => boolean

  // ========== 内部方法 ==========
  _saveToFile: () => Promise<void>
}

// ========== 默认预览状态 ==========
const DEFAULT_PREVIEW_STATE: ThemePreviewState = {
  previewThemeId: null,
  previewVariantId: null,
  previewConfig: null,
  isPreviewActive: false
}

// ========== 深度合并工具（简化类型）==========
export function deepMerge(target: any, source: any): any {
  const result = { ...target }
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(result[key], source[key])
      } else {
        result[key] = source[key]
      }
    }
  }
  return result
}

// ========== Store 实现 ==========
export const useThemeStore = create<ThemeState>((set, get) => ({
  // ========== 初始状态 ==========
  activeThemeId: null,
  activeVariantId: null,
  loaded: false,
  globalConfig: DEFAULT_GLOBAL_CONFIG,
  themeHistory: [],
  previewState: DEFAULT_PREVIEW_STATE,
  userOverrides: {},
  _themeManager: null,
  _themeLoader: null,

  // ========== 初始化 ==========
  loadFromFile: async () => {
    // 创建管理器和加载器
    const themeManager = new ThemeManager()
    const themeLoader = new ThemeLoader()

    set({ _themeManager: themeManager, _themeLoader: themeLoader })

    // 从文件加载配置
    try {
      const savedConfig = await loadFromFile<{
        globalConfig?: GlobalThemeConfig
        activeThemeId?: string
        activeVariantId?: string
        userOverrides?: Record<string, Partial<ThemeConfig>>
        themeHistory?: ThemeHistoryEntry[]
      }>(THEME_CONFIG_FILE, {})

      if (savedConfig.globalConfig) {
        set({ globalConfig: deepMerge(DEFAULT_GLOBAL_CONFIG, savedConfig.globalConfig) })
      }
      if (savedConfig.userOverrides) {
        set({ userOverrides: savedConfig.userOverrides })
      }
      if (savedConfig.themeHistory) {
        set({ themeHistory: savedConfig.themeHistory })
      }
      if (savedConfig.activeThemeId) {
        set({ activeThemeId: savedConfig.activeThemeId })
      }
      if (savedConfig.activeVariantId) {
        set({ activeVariantId: savedConfig.activeVariantId })
      }

      console.log('[useThemeStore] 配置已加载')
    } catch (err) {
      console.warn('[useThemeStore] 加载配置失败，使用默认配置:', err)
    }

    set({ loaded: true })
  },

  // ========== 基础操作 ==========
  registerTheme: (theme) => {
    const { _themeManager, _themeLoader } = get()
    if (!_themeManager || !_themeLoader) {
      console.warn('[useThemeStore] 主题系统未初始化')
      return
    }

    _themeManager.registerTheme(theme)
    _themeLoader.loadTheme(theme)
    console.log(`[useThemeStore] 主题已注册: ${theme.metadata.id}`)
  },

  unregisterTheme: (themeId) => {
    const { _themeManager, _themeLoader, activeThemeId } = get()
    if (!_themeManager || !_themeLoader) return

    // 如果是当前激活的主题，先切换到默认主题
    if (activeThemeId === themeId) {
      console.warn(`[useThemeStore] 正在注销激活的主题: ${themeId}`)
      set({ activeThemeId: null, activeVariantId: null })
    }

    _themeManager.unregisterTheme(themeId)
    _themeLoader.unloadTheme(themeId)
    console.log(`[useThemeStore] 主题已注销: ${themeId}`)
  },

  switchTheme: async (themeId, variantId) => {
    const { _themeManager, globalConfig, userOverrides, themeHistory } = get()
    if (!_themeManager) {
      throw new ThemeNotFoundError(themeId)
    }

    // 记录历史（用于回滚）
    const currentEntry: ThemeHistoryEntry = {
      themeId: get().activeThemeId || 'none',
      variantId: get().activeVariantId,
      config: _themeManager.getThemeConfig() || {} as ThemeConfig,
      timestamp: Date.now(),
      userConfig: get().activeThemeId ? userOverrides[get().activeThemeId!] : undefined
    }

    // 限制历史记录深度
    const maxDepth = globalConfig.maxHistoryDepth || 10
    const newHistory = [currentEntry, ...themeHistory].slice(0, maxDepth)

    // 切换主题
    try {
      await _themeManager.switchTheme(themeId, variantId || undefined)
      set({
        activeThemeId: themeId,
        activeVariantId: variantId || null,
        themeHistory: newHistory
      })

      // 保存到文件
      get()._saveToFile()
      console.log(`[useThemeStore] 主题已切换: ${themeId}`)
    } catch (err) {
      throw new ThemeSwitchError(
        get().activeThemeId || 'none',
        themeId,
        err instanceof Error ? err.message : String(err)
      )
    }
  },

  // ========== 扩展操作 ==========
  updateGlobalConfig: (config) => {
    const newGlobalConfig = deepMerge(get().globalConfig, config)
    set({ globalConfig: newGlobalConfig })
    get()._saveToFile()
    console.log('[useThemeStore] 全局配置已更新')
  },

  updateUserOverride: (themeId, config) => {
    const { userOverrides, activeThemeId, _themeManager } = get()
    const newOverrides = { ...userOverrides, [themeId]: config }
    set({ userOverrides: newOverrides })

    // 如果是当前激活的主题，立即应用
    if (activeThemeId === themeId && _themeManager) {
      const mergedConfig = get().getMergedConfig(themeId)
      if (mergedConfig) {
        _themeManager.updateThemeConfig(mergedConfig)
      }
    }

    get()._saveToFile()
    console.log(`[useThemeStore] 用户配置已更新: ${themeId}`)
  },

  startPreview: async (themeId, variantId) => {
    const { _themeManager, globalConfig } = get()
    if (!_themeManager) {
      throw new ThemePreviewError(themeId, '主题系统未初始化')
    }

    if (!globalConfig.enablePreview) {
      throw new ThemePreviewError(themeId, '预览功能未启用')
    }

    // 获取主题配置
    const theme = _themeManager.getTheme(themeId)
    if (!theme) {
      throw new ThemeNotFoundError(themeId)
    }

    // 合并配置
    const mergedConfig = get().getMergedConfig(themeId)
    if (!mergedConfig) {
      throw new ThemePreviewError(themeId, '无法获取配置')
    }

    // 设置预览状态
    set({
      previewState: {
        previewThemeId: themeId,
        previewVariantId: variantId || null,
        previewConfig: mergedConfig,
        isPreviewActive: true
      }
    })

    // 应用预览效果（不实际切换）
    _themeManager.updateThemeConfig(mergedConfig)
    console.log(`[useThemeStore] 开始预览: ${themeId}`)
  },

  endPreview: () => {
    const { previewState, activeThemeId, _themeManager } = get()
    if (!previewState.isPreviewActive) return

    // 恢复到当前激活的主题
    if (activeThemeId && _themeManager) {
      const mergedConfig = get().getMergedConfig(activeThemeId)
      if (mergedConfig) {
        _themeManager.updateThemeConfig(mergedConfig)
      }
    }

    set({ previewState: DEFAULT_PREVIEW_STATE })
    console.log('[useThemeStore] 预览已结束')
  },

  applyPreview: async () => {
    const { previewState } = get()
    if (!previewState.isPreviewActive || !previewState.previewThemeId) {
      throw new ThemePreviewError('none', '没有正在进行的预览')
    }

    // 正式切换主题
    await get().switchTheme(previewState.previewThemeId, previewState.previewVariantId || undefined)
    set({ previewState: DEFAULT_PREVIEW_STATE })
    console.log('[useThemeStore] 预览已应用')
  },

  rollback: async () => {
    const { themeHistory, globalConfig, _themeManager } = get()
    if (!globalConfig.enableRollback) {
      throw new ThemeRollbackError('回滚功能未启用')
    }

    if (themeHistory.length === 0) {
      throw new ThemeRollbackError('没有可回滚的历史记录')
    }

    const lastEntry = themeHistory[0]
    if (!_themeManager) {
      throw new ThemeRollbackError('主题系统未初始化')
    }

    try {
      await _themeManager.switchTheme(lastEntry.themeId, lastEntry.variantId || undefined)

      // 移除第一条历史记录
      const newHistory = themeHistory.slice(1)
      set({
        activeThemeId: lastEntry.themeId,
        activeVariantId: lastEntry.variantId,
        themeHistory: newHistory
      })

      get()._saveToFile()
      console.log(`[useThemeStore] 已回滚到: ${lastEntry.themeId}`)
    } catch (err) {
      throw new ThemeRollbackError(err instanceof Error ? err.message : String(err))
    }
  },

  rollbackTo: async (index) => {
    const { themeHistory, globalConfig, _themeManager } = get()
    if (!globalConfig.enableRollback) {
      throw new ThemeRollbackError('回滚功能未启用')
    }

    if (index < 0 || index >= themeHistory.length) {
      throw new ThemeRollbackError(`无效的回滚索引: ${index}`)
    }

    const targetEntry = themeHistory[index]
    if (!_themeManager) {
      throw new ThemeRollbackError('主题系统未初始化')
    }

    try {
      await _themeManager.switchTheme(targetEntry.themeId, targetEntry.variantId || undefined)

      // 移除目标索引之前的所有历史记录
      const newHistory = themeHistory.slice(index + 1)
      set({
        activeThemeId: targetEntry.themeId,
        activeVariantId: targetEntry.variantId,
        themeHistory: newHistory
      })

      get()._saveToFile()
      console.log(`[useThemeStore] 已回滚到索引 ${index}: ${targetEntry.themeId}`)
    } catch (err) {
      throw new ThemeRollbackError(err instanceof Error ? err.message : String(err))
    }
  },

  // ========== 选择器 ==========
  getActiveTheme: () => {
    const { _themeManager, activeThemeId } = get()
    if (!_themeManager || !activeThemeId) return null
    return _themeManager.getTheme(activeThemeId)
  },

  getThemeList: () => {
    const { _themeManager } = get()
    if (!_themeManager) return []
    return _themeManager.getThemeList()
  },

  getMergedConfig: (themeId) => {
    const { _themeManager, globalConfig, userOverrides } = get()
    if (!_themeManager) return null

    const theme = _themeManager.getTheme(themeId)
    if (!theme) return null

    // 构建继承链
    const chain: ConfigInheritanceChain = {
      global: globalConfig,
      theme: theme.config,
      variant: undefined,
      user: userOverrides[themeId]
    }

    // 合并配置
    return deepMerge(
      deepMerge(
        deepMerge(chain.global, chain.theme),
        chain.variant?.config || {}
      ),
      chain.user || {}
    ) as ThemeConfig
  },

  getHistory: () => get().themeHistory,

  canRollback: () => {
    const { themeHistory, globalConfig } = get()
    return Boolean(globalConfig.enableRollback && themeHistory.length > 0)
  },

  // ========== 内部方法 ==========
  _saveToFile: async () => {
    const { globalConfig, activeThemeId, activeVariantId, userOverrides, themeHistory } = get()
    try {
      await saveToFile(THEME_CONFIG_FILE, {
        globalConfig,
        activeThemeId,
        activeVariantId,
        userOverrides,
        themeHistory
      })
      console.log('[useThemeStore] 配置已保存')
    } catch (err) {
      console.error('[useThemeStore] 保存配置失败:', err)
    }
  }
}))