// React Hook 适配层（最小封装，原版 看板 中没有这个 hook）
// v2: 接入新主题系统，支持液态玻璃/扁平主题切换
// v3: 修复壁纸切换后液态玻璃不更新的 bug
//     - bgUrl 变化 → changeBg() 直接换背景，不动面板
//     - cleanupComponent 仅在组件真正卸载时执行
import { useEffect, useRef } from 'react'
import { LiquidGlass, type LiquidGlassConfig } from '../lib/liquid-glass'
import { useSettingsStore } from '../store/useSettingsStore'
import { useThemeStore } from '../store/useThemeStore'

// 全局 LiquidGlass 实例（单例模式，避免多组件重复创建）
let globalLG: LiquidGlass | null = null
let globalBgUrl: string | undefined = undefined

/** 获取全局 LiquidGlass 实例（供 GlassControlPanel 等外部使用） */
export function getGlobalLG(): LiquidGlass | null {
  return globalLG
}

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThemeId])

  // bgUrl 或主题变化时，更新背景（不销毁面板）
  useEffect(() => {
    if (isFlat || !bgUrl) {
      if (globalLG) destroyGlass()
      return
    }
    initGlass(bgUrl)
    // 注意：这里不返回 cleanup — 面板清理统一在组件卸载时做
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgUrl, isFlat])

  // 组件卸载时：只移除本组件注册的面板（不影响其他页面的面板）
  useEffect(() => {
    return () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function initGlass(url: string) {
    // 同一 URL，已有实例 → 只补充缺失的面板
    if (globalLG && globalBgUrl === url) {
      registeredRef.current.forEach((el) => {
        if (!globalLG!.panels.find(p => p.el === el)) {
          globalLG!.addPanel(el)
        }
      })
      return
    }

    // 已有实例但 URL 变了 → 直接换背景，不销毁重建（保留所有已注册面板）
    if (globalLG) {
      globalLG.changeBg(url).then(() => {
        globalBgUrl = url
        console.log(`[LiquidGlass] 背景已切换: ${url.slice(0, 50)}...`)
      })
      globalBgUrl = url
      return
    }

    // 首次创建
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
