// React Hook 适配层（最小封装，原版 看板 中没有这个 hook）
// v2: 接入新主题系统，支持液态玻璃/扁平主题切换
import { useEffect, useRef } from 'react'
import { LiquidGlass, type LiquidGlassConfig } from '../lib/liquid-glass'
import { useSettingsStore } from '../store/useSettingsStore'
import { useThemeStore } from '../store/useThemeStore'

// 全局 LiquidGlass 实例（单例模式，避免多组件重复创建）
let globalLG: LiquidGlass | null = null
let globalBgUrl: string | undefined = undefined

/**
 * 创建/管理一个 LiquidGlass 实例（全局单例）
 * - bgUrl 改变 → 重新加载图片、保留所有 panel、强制重渲染
 * - 主题切换 → 玻璃主题走 WebGL，扁平主题走 CSS
 * - 组件卸载 → 移除该组件注册的 panel（避免累积）
 */
export function useLiquidGlass(bgUrl: string | undefined) {
  const registeredRef = useRef<HTMLElement[]>([])

  // 监听主题切换
  const activeThemeId = useThemeStore(s => s.activeThemeId)
  const isFlat = activeThemeId === 'flat'

  // 主题变化时刷新
  useEffect(() => {
    if (isFlat) {
      destroyGlass()
    } else if (activeThemeId === 'liquid-glass') {
      reinitGlass(bgUrl)
    }
  }, [activeThemeId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFlat || !bgUrl) return
    initGlass(bgUrl)
    return () => cleanupComponent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgUrl, isFlat])

  function initGlass(url: string) {
    if (globalLG && globalBgUrl === url) {
      registeredRef.current.forEach((el) => {
        if (!globalLG!.panels.find(p => p.el === el)) {
          globalLG!.addPanel(el)
        }
      })
      return
    }

    destroyGlass()

    const lg = new LiquidGlass(url)
    globalLG = lg
    globalBgUrl = url
    lg.init().then(() => {
      lg.start()
      const savedGlass = useSettingsStore.getState().settings.glass
      lg.updateConfig(savedGlass)
      registeredRef.current.forEach((el) => lg.addPanel(el))
      console.log(`[LiquidGlass] 初始化完成: ${lg.panels.length} 个 panel`)
      ;(window as any).__lg = lg
    })
  }

  function reinitGlass(url?: string) {
    if (!url || globalBgUrl === url) return
    initGlass(url)
  }

  function destroyGlass() {
    if (globalLG) {
      globalLG.destroy()
      globalLG = null
      globalBgUrl = undefined
      ;(window as any).__lg = null
    }
  }

  function cleanupComponent() {
    if (!globalLG) return
    registeredRef.current.forEach((el) => {
      const idx = globalLG!.panels.findIndex(p => p.el === el)
      if (idx >= 0) {
        const canvas = el.querySelector('.lg-panel') as HTMLCanvasElement
        if (canvas?.parentNode) canvas.parentNode.removeChild(canvas)
        globalLG!.panels.splice(idx, 1)
      }
    })
    registeredRef.current = []
  }

  function registerPanel(el: HTMLElement | null, overrides?: LiquidGlassConfig) {
    if (!el) return

    if (!registeredRef.current.find(e => e === el)) {
      registeredRef.current.push(el)
    }

    // 扁平主题：移除 WebGL canvas，添加 CSS 类
    if (isFlat) {
      const canvas = el.querySelector('.lg-panel') as HTMLCanvasElement
      if (canvas?.parentNode) canvas.parentNode.removeChild(canvas)
      el.classList.add('flat-panel')
      return
    }

    // 玻璃主题：移除 flat CSS，走 WebGL
    el.classList.remove('flat-panel')

    if (!globalLG) return

    if (!globalLG.panels.find(p => p.el === el)) {
      globalLG.addPanel(el, overrides)
    }
  }

  return { registerPanel }
}
