// React Hook 适配层（最小封装，原版 看板 中没有这个 hook）
import { useEffect, useRef } from 'react'
import { LiquidGlass, type LiquidGlassConfig } from '../lib/liquid-glass'

/**
 * 创建/管理一个 LiquidGlass 实例
 * - bgUrl 改变 → 重新加载图片、保留所有 panel、强制重渲染
 * - 组件卸载 → 销毁实例、清理 canvas
 */
export function useLiquidGlass(bgUrl: string | undefined) {
  const lgRef = useRef<LiquidGlass | null>(null)
  const registeredRef = useRef<HTMLElement[]>([])
  const bgUrlRef = useRef(bgUrl)

  useEffect(() => {
    if (!bgUrl) return
    const lg = new LiquidGlass(bgUrl)
    lgRef.current = lg
    lg.init().then(() => {
      lg.start()
      // 重新注册已保存的元素
      registeredRef.current.forEach((el) => lg.addPanel(el))
      // 测试用探针
      ;(window as any).__lg = lg
    })

    return () => {
      lg.destroy()
      lgRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // bgUrl 变化时换图
    if (bgUrl && bgUrl !== bgUrlRef.current && lgRef.current) {
      bgUrlRef.current = bgUrl
      lgRef.current.changeBg(bgUrl)
    } else if (bgUrl) {
      bgUrlRef.current = bgUrl
    }
  }, [bgUrl])

  function registerPanel(el: HTMLElement | null, overrides?: LiquidGlassConfig) {
    if (!el) {
      return
    }
    if (!lgRef.current) {
      // 还没初始化完成，先存起来等 start 后注册
      if (!registeredRef.current.find(e => e === el)) {
        registeredRef.current.push(el)
      }
      return
    }
    // 用 DOM 节点本身查重（同一节点不会重复插入）
    if (!lgRef.current.panels.find(p => p.el === el)) {
      lgRef.current.addPanel(el, overrides)
    }
  }

  return { registerPanel }
}
