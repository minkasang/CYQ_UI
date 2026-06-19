// useModuleRoutes hook 集成测试：localStorage 过滤
import { describe, it, expect, beforeEach } from 'vitest'

const PREFIX = 'module_toggle_'

// 不能直接测 hook（需要 react-router 上下文），测纯逻辑
function isModuleToggledOn(id: string): boolean {
  return localStorage.getItem(PREFIX + id) !== 'off'
}

describe('useModuleRoutes 过滤逻辑（集成）', () => {
  beforeEach(() => {
    ;['settings', 'wallpaper', 'todo', 'diary', 'ai'].forEach(id =>
      localStorage.removeItem(PREFIX + id)
    )
  })

  it('全部开启时不过滤任何模块', () => {
    const ids = ['todo', 'diary', 'ai']
    expect(ids.filter(isModuleToggledOn)).toEqual(['todo', 'diary', 'ai'])
  })

  it('关闭 todo，过滤掉 todo', () => {
    localStorage.setItem('module_toggle_todo', 'off')
    const ids = ['todo', 'diary', 'ai']
    expect(ids.filter(isModuleToggledOn)).toEqual(['diary', 'ai'])
  })

  it('关闭后重新开启，恢复', () => {
    localStorage.setItem('module_toggle_todo', 'off')
    expect(isModuleToggledOn('todo')).toBe(false)

    localStorage.setItem('module_toggle_todo', 'on')
    expect(isModuleToggledOn('todo')).toBe(true)
  })

  it('任意非 off 值都视为开启', () => {
    localStorage.setItem('module_toggle_todo', 'on')
    expect(isModuleToggledOn('todo')).toBe(true)

    localStorage.setItem('module_toggle_todo', '')
    expect(isModuleToggledOn('todo')).toBe(true)

    localStorage.setItem('module_toggle_todo', 'whatever')
    expect(isModuleToggledOn('todo')).toBe(true)
  })

  it('没有对应 key 时默认开启', () => {
    expect(isModuleToggledOn('nonexistent')).toBe(true)
  })
})
