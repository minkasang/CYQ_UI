// 模块路由 Hook — localStorage 开关版
import { useMemo, useState, useEffect } from 'react'
import { createElement } from 'react'
import { Route } from 'react-router-dom'
import type { ReactNode } from 'react'
import { getModuleManager } from '../core/ModuleRegistry'

const STORAGE_PREFIX = 'module_toggle_'

let _refreshVersion = 0
const listeners: Array<() => void> = []

/** SettingsPage 开关变化后调用 */
export function notifyModuleToggleChanged() {
  _refreshVersion++
  listeners.forEach(fn => fn())
  ;(window as any).__sidebarRefresh?.()
}

/**
 * 模块开关订阅 Hook
 * 供 HomePage 等组件订阅开关变化，返回当前 isOn 快照
 * 每次开关切换时自动触发重渲染
 */
export function useModuleToggles() {
  const [, setVersion] = useState(_refreshVersion)

  useEffect(() => {
    const fn = () => setVersion(_refreshVersion)
    listeners.push(fn)
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1) }
  }, [])

  return { isOn: isModuleToggledOn }
}

/** 各模块id列表，用于设置页枚举 */
export const ALL_MODULE_IDS = ['welcome', 'settings', 'wallpaper', 'todo', 'diary', 'ai', 'inspiration', 'theme', 'agents']
export const MODULE_NAMES: Record<string, string> = {
  welcome: '首页',
  settings: '系统设置',
  wallpaper: '壁纸引擎',
  todo: '待办管理',
  diary: '日记',
  ai: 'AI 助手',
  inspiration: '每日灵感',
  theme: '主题管理',
  agents: '多 Agent 群聊',
}

/** 读取模块开关状态（纯函数，供 HomePage/Sidebar 复用） */
export function isModuleToggledOn(id: string): boolean {
  return localStorage.getItem(STORAGE_PREFIX + id) !== 'off'
}

export function useModuleRoutes(): ReactNode[] {
  const [, setVersion] = useState(_refreshVersion)

  useEffect(() => {
    const fn = () => setVersion(_refreshVersion)
    listeners.push(fn)
    return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1) }
  }, [])

  // 初始化：安装内置模块
  useEffect(() => { initBuiltinModules().then(() => notifyModuleToggleChanged()) }, [])

  const routes = useMemo(() => {
    const mgr = getModuleManager()
    const modules = mgr.getInstalledModules()
    return modules
      .filter(m => isModuleToggledOn(m.metadata.id))
      .filter(m => m.routes && m.routes.length > 0)
      .flatMap(m =>
        m.routes!.map(r =>
          createElement(Route as any, {
            key: `${m.metadata.id}-${r.path}`,
            path: r.path,
            element: createElement(r.element as any)
          })
        )
      )
  }, [_refreshVersion])

  return routes
}

let _initialized = false

async function initBuiltinModules() {
  if (_initialized) return
  _initialized = true

  const mgr = getModuleManager()
  if (mgr.getInstalledModules().length > 0) return

  const modules = await Promise.all([
    import('../modules/settings').then(m => m.SettingsModule),
    import('../modules/wallpaper').then(m => m.WallpaperModule),
    import('../modules/todo').then(m => m.TodoModule),
    import('../modules/diary').then(m => m.DiaryModule),
    import('../modules/ai').then(m => m.AIModule),
    import('../modules/inspiration').then(m => m.InspirationModule),
    import('../modules/theme').then(m => m.ThemeModule),
    import('../modules/agents').then(m => m.AgentsModule),
  ])

  for (const mod of modules) {
    try { mgr.registerModule(mod) } catch (e) { console.warn('register', mod.metadata.id, e) }
  }
  for (const mod of modules) {
    try { await mgr.installModule(mod.metadata.id) } catch (e) { console.warn('install', mod.metadata.id, e) }
  }
  for (const mod of modules) {
    try { await mgr.enableModule(mod.metadata.id) } catch (e) { console.warn('enable', mod.metadata.id, e) }
  }
}
