import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AISummary } from '../components/ai/AISummary'

// Mock useLiquidGlass hook
vi.mock('../hooks/useLiquidGlass', () => ({
  useLiquidGlass: () => ({ registerPanel: () => {} })
}))

// Mock useAIConfigStore
vi.mock('../store/useAIConfigStore', () => ({
  useAIConfigStore: () => ({ config: { provider: 'deepseek', model: 'deepseek-chat' } })
}))

// Mock useAPIKeysStore
vi.mock('../store/useAPIKeysStore', () => ({
  useAPIKeysStore: (selector: (s: { hasKey: () => boolean; hasAnyKey: boolean }) => unknown) => {
    const state = { hasKey: () => true, hasAnyKey: true }
    return selector(state)
  }
}))

// Mock useDiaryStore
vi.mock('../store/useDiaryStore', () => ({
  useDiaryStore: () => [],
  selectSortedDiaries: () => []
}))

describe('AISummary', () => {
  it('不应该显示提供商选择下拉框（已移除）', () => {
    render(
      <BrowserRouter>
        <AISummary />
      </BrowserRouter>
    )
    expect(screen.queryByText('DeepSeek')).not.toBeInTheDocument()
    expect(screen.queryByText('OpenAI')).not.toBeInTheDocument()
    expect(screen.queryByText('Agnes AI')).not.toBeInTheDocument()
  })

  it('不应该显示模型选择下拉框（已移除）', () => {
    render(
      <BrowserRouter>
        <AISummary />
      </BrowserRouter>
    )
    expect(screen.queryByText('deepseek-chat')).not.toBeInTheDocument()
  })

  it('应该显示模式切换按钮', () => {
    render(
      <BrowserRouter>
        <AISummary />
      </BrowserRouter>
    )
    expect(screen.getByText('总结日记')).toBeInTheDocument()
    expect(screen.getByText('总结文本')).toBeInTheDocument()
  })
})
