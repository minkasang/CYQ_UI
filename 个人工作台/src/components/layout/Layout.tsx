// 整体布局 — 壳选择器
// 根据 useLayoutRegistry.activeId 动态选择布局壳组件

import { Outlet } from 'react-router-dom'
import { useLayoutRegistry } from '../../store/useLayoutRegistry'
import { DefaultLayout } from '../../layouts/DefaultLayout'
import { MacOSLayout } from '../../layouts/MacOSLayout'
import { DashboardLayout } from '../../layouts/DashboardLayout'
import { FullWidthLayout } from '../../layouts/FullWidthLayout'
import { TopNavLayout } from '../../layouts/TopNavLayout'

import { BentoLayout } from '../../layouts/BentoLayout'

import type { ReactNode } from 'react'
type ShellComponent = (props: { children: ReactNode }) => ReactNode
const SHELL_MAP: Record<string, ShellComponent> = {
  default: DefaultLayout,
  macos: MacOSLayout,
  bento: BentoLayout,
  dashboard: DashboardLayout,
  fullwidth: FullWidthLayout,
  topnav: TopNavLayout,
}

export function Layout() {
  const activeId = useLayoutRegistry(s => s.activeId)
  const Shell = SHELL_MAP[activeId] || DefaultLayout

  return <Shell><Outlet /></Shell>
}
