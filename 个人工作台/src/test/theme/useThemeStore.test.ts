// 主题系统测试
// 给 AI 的话：验证主题系统的基本功能

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useThemeStore } from '../../store/useThemeStore'

// Mock fileStorage
vi.mock('../../utils/fileStorage', () => ({
  loadFromFile: vi.fn().mockResolvedValue({
    globalConfig: {
      id: 'global',
      name: '全局配置',
      transitionDuration: 300,
      enablePreview: true,
      enableRollback: true,
      maxHistoryDepth: 10
    },
    activeThemeId: null,
    activeVariantId: null,
    userOverrides: {},
    themeHistory: []
  }),
  saveToFile: vi.fn().mockResolvedValue(undefined)
}))

// Mock ThemeManager
vi.mock('../../themes/ThemeManager', () => ({
  ThemeManager: vi.fn().mockImplementation(function() {
    return {
      registerTheme: vi.fn(),
      unregisterTheme: vi.fn(),
      switchTheme: vi.fn().mockResolvedValue(undefined),
      getTheme: vi.fn().mockReturnValue(null),
      getThemeList: vi.fn().mockReturnValue([]),
      getThemeConfig: vi.fn().mockReturnValue(null),
      updateThemeConfig: vi.fn()
    }
  })
}))

// Mock ThemeLoader
vi.mock('../../themes/ThemeLoader', () => ({
  ThemeLoader: vi.fn().mockImplementation(function() {
    return {
      loadTheme: vi.fn().mockResolvedValue(undefined),
      unloadTheme: vi.fn().mockResolvedValue(undefined),
      getLoadedThemes: vi.fn().mockReturnValue([]),
      isLoaded: vi.fn().mockReturnValue(false)
    }
  })
}))

describe('useThemeStore', () => {
  beforeEach(() => {
    // 重置 store
    useThemeStore.setState({
      activeThemeId: null,
      activeVariantId: null,
      loaded: false,
      globalConfig: {
        id: 'global',
        name: '全局配置',
        transitionDuration: 300,
        enablePreview: true,
        enableRollback: true,
        maxHistoryDepth: 10,
        enableLazyLoad: true,
        cacheStrategy: 'localStorage'
      },
      themeHistory: [],
      previewState: {
        previewThemeId: null,
        previewVariantId: null,
        previewConfig: null,
        isPreviewActive: false
      },
      userOverrides: {},
      _themeManager: null,
      _themeLoader: null
    })
  })

  describe('loadFromFile', () => {
    it('应该正确初始化主题系统', async () => {
      const { loadFromFile } = useThemeStore.getState()

      await loadFromFile()

      const state = useThemeStore.getState()
      expect(state.loaded).toBe(true)
      expect(state._themeManager).not.toBeNull()
      expect(state._themeLoader).not.toBeNull()
    })
  })

  describe('updateGlobalConfig', () => {
    it('应该正确更新全局配置', async () => {
      const { loadFromFile, updateGlobalConfig } = useThemeStore.getState()

      await loadFromFile()
      updateGlobalConfig({ transitionDuration: 500 })

      const state = useThemeStore.getState()
      expect(state.globalConfig.transitionDuration).toBe(500)
    })
  })

  describe('canRollback', () => {
    it('没有历史记录时应该返回 false', () => {
      const { canRollback } = useThemeStore.getState()
      expect(canRollback()).toBe(false)
    })

    it('有历史记录且启用回滚时应该返回 true', async () => {
      const { loadFromFile } = useThemeStore.getState()
      await loadFromFile()

      useThemeStore.setState({
        themeHistory: [{
          themeId: 'test-theme',
          variantId: null,
          config: {} as any,
          timestamp: Date.now()
        }]
      })

      const { canRollback } = useThemeStore.getState()
      expect(canRollback()).toBe(true)
    })
  })

  describe('getHistory', () => {
    it('应该正确返回历史记录', async () => {
      const { loadFromFile } = useThemeStore.getState()
      await loadFromFile()

      const history = [{
        themeId: 'theme-1',
        variantId: null,
        config: {} as any,
        timestamp: 1000
      }, {
        themeId: 'theme-2',
        variantId: null,
        config: {} as any,
        timestamp: 2000
      }]

      useThemeStore.setState({ themeHistory: history })

      const { getHistory } = useThemeStore.getState()
      expect(getHistory()).toEqual(history)
    })
  })

  describe('预览功能', () => {
    it('预览状态应该正确初始化', () => {
      const { previewState } = useThemeStore.getState()
      expect(previewState.isPreviewActive).toBe(false)
      expect(previewState.previewThemeId).toBeNull()
    })
  })
})