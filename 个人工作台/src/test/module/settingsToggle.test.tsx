// SettingsPage 集成测试：开关交互
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../hooks/useLiquidGlass', () => ({
  useLiquidGlass: () => ({ registerPanel: () => {} })
}))
vi.mock('../../store/useWallpaperStore', () => ({
  useWallpaperStore: (fn: any) => fn({ current: { type: 'color', value: '#000' } })
}))

const PREFIX = 'module_toggle_'
const PAGE_PATH = '../../modules/settings/pages/SettingsPage'

beforeEach(() => {
  ;['settings', 'wallpaper', 'todo', 'diary', 'ai'].forEach(id =>
    localStorage.removeItem(PREFIX + id)
  )
})

describe('SettingsPage：模块开关', () => {
  it('渲染 5 个模块开关', async () => {
    const { SettingsPage } = await import(PAGE_PATH)
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    expect(screen.getByText('模块管理')).toBeInTheDocument()
    expect(screen.getByText('系统设置')).toBeInTheDocument()
    expect(screen.getByText('壁纸引擎')).toBeInTheDocument()
    expect(screen.getByText('待办管理')).toBeInTheDocument()
    expect(screen.getByText('日记')).toBeInTheDocument()
    expect(screen.getByText('AI 助手')).toBeInTheDocument()
  })

  it('默认所有开关为开启', async () => {
    const { SettingsPage } = await import(PAGE_PATH)
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBe(5)
    checkboxes.forEach(cb => expect(cb).toBeChecked())
  })

  it('点击"待办管理"开关写入 localStorage', async () => {
    const { SettingsPage } = await import(PAGE_PATH)
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[2])
    expect(localStorage.getItem('module_toggle_todo')).toBe('off')
  })

  it('关闭后再开启，恢复为 on', async () => {
    localStorage.setItem('module_toggle_todo', 'off')
    const { SettingsPage } = await import(PAGE_PATH)
    render(<MemoryRouter><SettingsPage /></MemoryRouter>)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[2]).not.toBeChecked()

    fireEvent.click(checkboxes[2])
    expect(localStorage.getItem('module_toggle_todo')).toBe('on')
  })
})
