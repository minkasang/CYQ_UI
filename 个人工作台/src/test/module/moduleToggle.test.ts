// 模块开关：验证 localStorage 过滤逻辑
import { describe, it, expect, beforeEach } from 'vitest'

const PREFIX = 'module_toggle_'

function isToggledOn(id: string): boolean {
  return localStorage.getItem(PREFIX + id) !== 'off'
}

function setToggle(id: string, on: boolean) {
  localStorage.setItem(PREFIX + id, on ? 'on' : 'off')
}

function filterModules(ids: string[]): string[] {
  return ids.filter(id => isToggledOn(id))
}

describe('模块开关逻辑', () => {
  beforeEach(() => {
    // 清理
    ['settings', 'wallpaper', 'todo', 'diary', 'ai'].forEach(id => {
      localStorage.removeItem(PREFIX + id)
    })
  })

  it('默认全部开启', () => {
    const result = filterModules(['settings', 'todo', 'diary'])
    expect(result).toEqual(['settings', 'todo', 'diary'])
  })

  it('关闭todo后过滤掉todo', () => {
    setToggle('todo', false)
    const result = filterModules(['settings', 'todo', 'diary'])
    expect(result).toEqual(['settings', 'diary'])
  })

  it('关闭多个，只保留开启的', () => {
    setToggle('todo', false)
    setToggle('ai', false)
    const result = filterModules(['settings', 'todo', 'diary', 'ai'])
    expect(result).toEqual(['settings', 'diary'])
  })

  it('关闭后重新开启', () => {
    setToggle('todo', false)
    expect(filterModules(['todo'])).toEqual([])

    setToggle('todo', true)
    expect(filterModules(['todo'])).toEqual(['todo'])
  })

  it('写入非off值视为开启', () => {
    localStorage.setItem(PREFIX + 'todo', 'on')
    expect(isToggledOn('todo')).toBe(true)

    localStorage.setItem(PREFIX + 'todo', '')
    expect(isToggledOn('todo')).toBe(true)

    localStorage.setItem(PREFIX + 'todo', 'anything')
    expect(isToggledOn('todo')).toBe(true)
  })
})
