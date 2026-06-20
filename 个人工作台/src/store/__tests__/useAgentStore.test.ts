// useAgentStore 单元测试
// 纯逻辑测试，mock fileStorage

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock fileStorage 避免 IO 副作用
vi.mock('../../utils/fileStorage', () => ({
  loadFromFile: vi.fn().mockResolvedValue({ agents: [] }),
  saveToFile: vi.fn().mockResolvedValue(undefined),
  FILE_KEYS: { AGENTS: 'mock/agents.json' },
}))

import { useAgentStore } from '../useAgentStore'
import type { AgentFormData } from '../../types/agent'

function sampleAgent(overrides: Partial<AgentFormData> = {}): AgentFormData {
  return {
    name: '测试 Agent',
    provider: 'deepseek',
    model: 'deepseek-chat',
    systemPrompt: '你是一个测试助手',
    replyProbability: 0.7,
    cooldownMin: 5000,
    cooldownMax: 15000,
    ...overrides,
  }
}

describe('useAgentStore', () => {
  beforeEach(() => {
    useAgentStore.setState({ agents: [], loaded: true })
  })

  it('初始状态为空数组', () => {
    expect(useAgentStore.getState().agents).toEqual([])
  })

  it('add 创建 Agent 并返回', () => {
    const result = useAgentStore.getState().add(sampleAgent())
    expect(result).not.toBeNull()
    expect(result!.name).toBe('测试 Agent')
    expect(result!.id).toBeTruthy()
    expect(useAgentStore.getState().agents).toHaveLength(1)
  })

  it('add 重名时返回 null', () => {
    useAgentStore.getState().add(sampleAgent({ name: '唯一' }))
    const result = useAgentStore.getState().add(sampleAgent({ name: '唯一' }))
    expect(result).toBeNull()
  })

  it('add 自动 trim 名称', () => {
    const result = useAgentStore.getState().add(sampleAgent({ name: '  毒舌  ' }))
    expect(result!.name).toBe('毒舌')
  })

  it('update 修改 Agent 字段', () => {
    const agent = useAgentStore.getState().add(sampleAgent())!
    useAgentStore.getState().update(agent.id, { name: '改名后', replyProbability: 0.5 })
    const updated = useAgentStore.getState().getById(agent.id)
    expect(updated!.name).toBe('改名后')
    expect(updated!.replyProbability).toBe(0.5)
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(agent.updatedAt)
  })

  it('remove 删除 Agent', () => {
    const agent = useAgentStore.getState().add(sampleAgent())!
    useAgentStore.getState().remove(agent.id)
    expect(useAgentStore.getState().agents).toHaveLength(0)
  })

  it('getById 返回正确的 Agent', () => {
    const agent = useAgentStore.getState().add(sampleAgent({ name: '找这个' }))!
    const found = useAgentStore.getState().getById(agent.id)
    expect(found!.name).toBe('找这个')
  })

  it('getById 不存在返回 undefined', () => {
    expect(useAgentStore.getState().getById('not-exist')).toBeUndefined()
  })

  it('支持多个 Agent', () => {
    useAgentStore.getState().add(sampleAgent({ name: 'A' }))
    useAgentStore.getState().add(sampleAgent({ name: 'B' }))
    useAgentStore.getState().add(sampleAgent({ name: 'C' }))
    expect(useAgentStore.getState().agents).toHaveLength(3)
  })
})
