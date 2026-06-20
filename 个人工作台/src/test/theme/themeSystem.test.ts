// 主题系统单元测试 — ThemeManager + ThemeLoader + 引擎 + Store
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ThemeManager } from '../../themes/ThemeManager'
import { ThemeLoader } from '../../themes/ThemeLoader'
import type { ThemePackage, ThemeEngine } from '../../types/theme'

// ============================================================
// Mock helpers
// ============================================================
function mockEngine(name = 'mock'): ThemeEngine {
  return {
    name,
    version: '1.0',
    init: vi.fn().mockResolvedValue(undefined),
    render: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
    getCapabilities: vi.fn().mockReturnValue({ dynamicBackground: false, realTimeParams: true, customShapes: false, performance: 'medium' as const, supportedBrowsers: ['Chrome'] }),
    getParamDefs: vi.fn().mockReturnValue([]),
  }
}

function cfg(id: string) {
  return {
    metadata: { id, name: id, version: '1.0' },
    variants: [],
    engine: { type: 'liquid-glass' as const, params: {} },
    colors: { primary: '#000', background: '#fff' },
    typography: { fontFamily: 'Arial' }
  }
}

function makeTheme(id: string, engine?: ThemeEngine): ThemePackage {
  return {
    metadata: { id, name: `Theme ${id}`, version: '1.0.0' },
    engine: engine || mockEngine(),
    config: cfg(id)
  }
}

// ============================================================
// 1. ThemeManager
// ============================================================
describe('ThemeManager', () => {
  let mgr: ThemeManager
  beforeEach(() => { mgr = new ThemeManager() })

  it('注册主题 → getThemeCount 递增', () => {
    mgr.registerTheme(makeTheme('a'))
    expect(mgr.getThemeCount()).toBe(1)
  })

  it('getThemeList 返回全部', () => {
    mgr.registerTheme(makeTheme('a'))
    mgr.registerTheme(makeTheme('b'))
    expect(mgr.getThemeList()).toHaveLength(2)
  })

  it('getTheme 按 ID 查询', () => {
    mgr.registerTheme(makeTheme('x'))
    expect(mgr.getTheme('x')?.metadata.id).toBe('x')
    expect(mgr.getTheme('y')).toBeNull()
  })

  it('hasTheme 判断是否存在', () => {
    mgr.registerTheme(makeTheme('a'))
    expect(mgr.hasTheme('a')).toBe(true)
    expect(mgr.hasTheme('b')).toBe(false)
  })

  it('注销主题 → hasTheme 变 false', () => {
    mgr.registerTheme(makeTheme('a'))
    mgr.unregisterTheme('a')
    expect(mgr.hasTheme('a')).toBe(false)
  })

  it('注销不存在的主题不抛错', () => {
    expect(() => mgr.unregisterTheme('nope')).not.toThrow()
  })

  it('切换到已注册主题', async () => {
    const eng = mockEngine()
    mgr.registerTheme(makeTheme('a', eng))
    await mgr.switchTheme('a')
    expect(mgr.getActiveThemeId()).toBe('a')
    expect(eng.init).toHaveBeenCalled()
  })

  it('切换到不存在的主题应抛错', async () => {
    await expect(mgr.switchTheme('nope')).rejects.toThrow()
  })

  it('切换主题 → 旧引擎 destroy, 新引擎 init', async () => {
    const e1 = mockEngine(), e2 = mockEngine()
    mgr.registerTheme(makeTheme('a', e1))
    mgr.registerTheme(makeTheme('b', e2))
    await mgr.switchTheme('a')
    await mgr.switchTheme('b')
    expect(e1.destroy).toHaveBeenCalled()
    expect(e2.init).toHaveBeenCalled()
  })

  it('engine.init 失败 → activeThemeId 保持旧值', async () => {
    const good = mockEngine()
    mgr.registerTheme(makeTheme('ok', good))
    await mgr.switchTheme('ok')
    expect(mgr.getActiveThemeId()).toBe('ok')

    const bad = mockEngine()
    bad.init = vi.fn().mockRejectedValue(new Error('fail'))
    mgr.registerTheme(makeTheme('bad', bad))
    await mgr.switchTheme('bad').catch(() => {})
    expect(mgr.getActiveThemeId()).toBe('ok')
  })

  it('updateThemeConfig 委托给 engine.update', async () => {
    const eng = mockEngine()
    mgr.registerTheme(makeTheme('a', eng))
    await mgr.switchTheme('a')
    mgr.updateThemeConfig({ colors: { background: '#red' } })
    expect(eng.update).toHaveBeenCalled()
  })

  it('getThemeConfig 返回配置', async () => {
    mgr.registerTheme(makeTheme('a'))
    await mgr.switchTheme('a')
    expect(mgr.getThemeConfig()).toBeTruthy()
  })

  it('resetThemeConfig 恢复默认', async () => {
    const eng = mockEngine()
    mgr.registerTheme(makeTheme('a', eng))
    await mgr.switchTheme('a')
    mgr.updateThemeConfig({ colors: { primary: '#NEW' } })
    mgr.resetThemeConfig()
    expect(eng.update).toHaveBeenCalled()
  })
})

// ============================================================
// 2. ThemeLoader
// ============================================================
describe('ThemeLoader', () => {
  let loader: ThemeLoader
  beforeEach(() => { loader = new ThemeLoader() })

  it('loadTheme → isLoaded 为 true', async () => {
    await loader.loadTheme(makeTheme('a'))
    expect(loader.isLoaded('a')).toBe(true)
    expect(loader.getLoadedCount()).toBe(1)
  })

  it('重复加载幂等', async () => {
    await loader.loadTheme(makeTheme('a'))
    await loader.loadTheme(makeTheme('a'))
    expect(loader.getLoadedThemes()).toHaveLength(1)
  })

  it('unloadTheme → isLoaded 为 false', async () => {
    const eng = mockEngine()
    await loader.loadTheme(makeTheme('a', eng))
    await loader.unloadTheme('a')
    expect(loader.isLoaded('a')).toBe(false)
    expect(eng.destroy).toHaveBeenCalled()
  })

  it('卸载不存在的主题不抛错', async () => {
    await expect(loader.unloadTheme('nope')).resolves.not.toThrow()
  })

  it('hotReload 不销毁引擎', async () => {
    const eng = mockEngine()
    await loader.loadTheme(makeTheme('a', eng))
    await loader.hotReload('a', makeTheme('a', eng))
    expect(eng.destroy).not.toHaveBeenCalled()
    expect(eng.update).toHaveBeenCalled()
  })

  it('clearAll 卸载全部', async () => {
    const e1 = mockEngine(), e2 = mockEngine()
    await loader.loadTheme(makeTheme('a', e1))
    await loader.loadTheme(makeTheme('b', e2))
    await loader.clearAll()
    expect(loader.getLoadedCount()).toBe(0)
    expect(e1.destroy).toHaveBeenCalled()
    expect(e2.destroy).toHaveBeenCalled()
  })

  it('getDependencyGraph 返回 Map', async () => {
    await loader.loadTheme(makeTheme('a'))
    expect(loader.getDependencyGraph() instanceof Map).toBe(true)
  })

  it('detectCircularDependency 无环返回 false', async () => {
    await loader.loadTheme(makeTheme('a'))
    await loader.loadTheme(makeTheme('b'))
    expect(loader.detectCircularDependency('a')).toBe(false)
  })
})

// ============================================================
// 3. 并发安全
// ============================================================
describe('并发安全', () => {
  it('快速连续切换不崩溃', async () => {
    const mgr = new ThemeManager()
    mgr.registerTheme(makeTheme('a'))
    mgr.registerTheme(makeTheme('b'))
    mgr.registerTheme(makeTheme('c'))
    await Promise.all([
      mgr.switchTheme('a'),
      mgr.switchTheme('b'),
      mgr.switchTheme('c')
    ].map(p => p.catch(() => {})))
    expect(mgr.getActiveThemeId()).toBeTruthy()
  })
})
