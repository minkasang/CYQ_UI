// 主题系统最小测试 — 验证导入链
import { describe, it, expect } from 'vitest'
import { deepMerge } from '../../store/useThemeStore'

describe('deepMerge 纯函数', () => {
  it('应覆盖基本值', () => {
    expect(deepMerge({ a: 1 }, { a: 2 })).toEqual({ a: 2 })
  })

  it('应跳过 undefined', () => {
    expect(deepMerge({ a: 1 }, { a: undefined })).toEqual({ a: 1 })
  })

  it('应递归合并嵌套', () => {
    expect(deepMerge({ a: { b: 1 } }, { a: { c: 2 } })).toEqual({ a: { b: 1, c: 2 } })
  })
})
