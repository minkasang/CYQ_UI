// 整体布局 — 壳选择器
// 根据 useLayoutRegistry.activeId 动态选择布局壳组件
// 壳只负责页面骨架，内容通过 <Outlet /> 渲染

import { Outlet } from 'react-router-dom'
import { useLayoutRegistry } from '../../store/useLayoutRegistry'
import { DefaultLayout } from '../../layouts/DefaultLayout'
import { MacOSLayout } from '../../layouts/MacOSLayout'
import { FullWidthLayout } from '../../layouts/FullWidthLayout'
import { TopNavLayout } from '../../layouts/TopNavLayout'

// 壳组件映射表
import type { ReactNode } from 'react'
type ShellComponent = (props: { children: ReactNode }) => ReactNode
const SHELL_MAP: Record<string, ShellComponent> = {
  default: DefaultLayout,
  macos: MacOSLayout,
  fullwidth: FullWidthLayout,
  topnav: TopNavLayout,
  // macos: 后续步骤添加
  // fullwidth: 后续步骤添加
  // topnav: 后续步骤添加
}

export function Layout() {
  const activeId = useLayoutRegistry(s => s.activeId)
  const Shell = SHELL_MAP[activeId] || DefaultLayout

  return <Shell><Outlet /></Shell>
}
