// Sidebar 集成测试：验证 localStorage 开关后导航链接消失
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const PREFIX = 'module_toggle_'
const SIDEBAR_PATH = '../../components/layout/Sidebar'

beforeEach(() => {
  ;['welcome', 'settings', 'wallpaper', 'todo', 'diary', 'ai'].forEach(id =>
    localStorage.removeItem(PREFIX + id)
  )
  ;(window as any).__sidebarRefresh?.()
})

describe('Sidebar：模块开关联动', () => {
  it('默认显示所有导航项', async () => {
    const { Sidebar } = await import(SIDEBAR_PATH)
    render(<MemoryRouter initialEntries={['/']}><Sidebar /></MemoryRouter>)
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.getByText('待办')).toBeInTheDocument()
    expect(screen.getByText('日记')).toBeInTheDocument()
    expect(screen.getByText('AI 总结')).toBeInTheDocument()
    expect(screen.getByText('壁纸')).toBeInTheDocument()
  })

  it('关闭"待办"后导航栏不显示"待办"', async () => {
    localStorage.setItem('module_toggle_todo', 'off')
    ;(window as any).__sidebarRefresh?.()

    const { Sidebar } = await import(SIDEBAR_PATH)
    render(<MemoryRouter initialEntries={['/']}><Sidebar /></MemoryRouter>)
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.queryByText('待办')).toBeNull()
    expect(screen.getByText('日记')).toBeInTheDocument()
  })

  it('关闭多个模块，导航栏同步消失', async () => {
    localStorage.setItem('module_toggle_todo', 'off')
    localStorage.setItem('module_toggle_diary', 'off')
    ;(window as any).__sidebarRefresh?.()

    const { Sidebar } = await import(SIDEBAR_PATH)
    render(<MemoryRouter initialEntries={['/']}><Sidebar /></MemoryRouter>)
    expect(screen.getByText('首页')).toBeInTheDocument()
    expect(screen.queryByText('待办')).toBeNull()
    expect(screen.queryByText('日记')).toBeNull()
    expect(screen.getByText('AI 总结')).toBeInTheDocument()
  })

  it('首页可被关闭（module_toggle_welcome = off 后消失）', async () => {
    localStorage.setItem('module_toggle_welcome', 'off')
    ;(window as any).__sidebarRefresh?.()

    const { Sidebar } = await import(SIDEBAR_PATH)
    render(<MemoryRouter initialEntries={['/']}><Sidebar /></MemoryRouter>)
    expect(screen.queryByText('首页')).toBeNull()
  })

  it('设置永远显示（不可关闭）', async () => {
    localStorage.setItem('module_toggle_settings', 'off')
    ;(window as any).__sidebarRefresh?.()

    const { Sidebar } = await import(SIDEBAR_PATH)
    render(<MemoryRouter initialEntries={['/']}><Sidebar /></MemoryRouter>)
    expect(screen.getByText('设置')).toBeInTheDocument()
  })
})
