// 布局注册表 — 管理可用布局壳 + 当前选中

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface LayoutInfo {
  id: string
  name: string
  description: string
  icon: string
  isBuiltin: boolean
}

interface LayoutRegistryState {
  layouts: LayoutInfo[]
  activeId: string
  setActive: (id: string) => void
  register: (info: LayoutInfo) => void
  remove: (id: string) => void
}

// 内置布局元信息（shell 组件通过 id 映射）
const BUILTIN: LayoutInfo[] = [
  { id: 'default', name: '初始布局', description: '当前页面结构', icon: '📦', isBuiltin: true },
  { id: 'macos', name: 'macOS 风格', description: 'Apple 原生设计语言', icon: '🍎', isBuiltin: true },
  { id: 'fullwidth', name: '无侧栏全宽', description: '全宽内容区', icon: '📐', isBuiltin: true },
  { id: 'topnav', name: '顶栏导航', description: '顶部导航菜单', icon: '📋', isBuiltin: true },
]

export const useLayoutRegistry = create<LayoutRegistryState>()(
  persist(
    (set, get) => ({
      layouts: BUILTIN,
      activeId: 'default',

      setActive: (id) => {
        if (get().layouts.some(l => l.id === id)) set({ activeId: id })
      },

      register: (info) => {
        if (get().layouts.some(l => l.id === info.id)) return
        set({ layouts: [...get().layouts, { ...info, isBuiltin: false }] })
      },

      remove: (id) => {
        const l = get().layouts.find(li => li.id === id)
        if (!l || l.isBuiltin) return
        set({ layouts: get().layouts.filter(li => li.id !== id) })
        if (get().activeId === id) set({ activeId: 'default' })
      },
    }),
    { name: 'pw-layout-registry', partialize: (s) => ({ layouts: s.layouts, activeId: s.activeId }) }
  )
)
