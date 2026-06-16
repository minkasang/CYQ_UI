// React Hook 适配层（最小封装，原版 看板 中没有这个 hook）
import { useEffect, useRef } from 'react'
import { LiquidGlass, type LiquidGlassConfig } from '../lib/liquid-glass'
import { useSettingsStore } from '../store/useSettingsStore'

// 全局 LiquidGlass 实例（单例模式，避免多组件重复创建）
let globalLG: LiquidGlass | null = null
let globalBgUrl: string | undefined = undefined

/**
 * 创建/管理一个 LiquidGlass 实例（全局单例）
 * - bgUrl 改变 → 重新加载图片、保留所有 panel、强制重渲染
 * - 组件卸载 → 不销毁实例（因为是全局共享的）
 */
export function useLiquidGlass(bgUrl: string | undefined) {
  const registeredRef = useRef<HTMLElement[]>([])

  useEffect(() => {
    if (!bgUrl) return

    // 如果已有实例且 bgUrl 相同，直接复用
    if (globalLG && globalBgUrl === bgUrl) {
      // 重新注册已保存的元素
      registeredRef.current.forEach((el) => globalLG!.addPanel(el))
      return
    }

    // bgUrl 变化，需要重新创建实例
    if (globalLG) {
      globalLG.destroy()
    }

    const lg = new LiquidGlass(bgUrl)
    globalLG = lg
    globalBgUrl = bgUrl
    lg.init().then(() => {
      lg.start()
      // 应用 localStorage 中保存的玻璃参数
      const savedGlass = useSettingsStore.getState().settings.glass
      lg.updateConfig(savedGlass)
      // 重新注册已保存的元素
      registeredRef.current.forEach((el) => lg.addPanel(el))
      // 全局暴露，供 GlassControlPanel 使用
      ;(window as any).__lg = lg
    })

    // 不在组件卸载时销毁，因为是全局共享的
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgUrl])

  function registerPanel(el: HTMLElement | null, overrides?: LiquidGlassConfig) {
    if (!el) {
      return
    }
    if (!globalLG) {
      // 还没初始化完成，先存起来等 start 后注册
      if (!registeredRef.current.find(e => e === el)) {
        registeredRef.current.push(el)
      }
      return
    }
    // 用 DOM 节点本身查重（同一节点不会重复插入）
    if (!globalLG.panels.find(p => p.el === el)) {
      globalLG.addPanel(el, overrides)
    }
  }

  return { registerPanel }
}
