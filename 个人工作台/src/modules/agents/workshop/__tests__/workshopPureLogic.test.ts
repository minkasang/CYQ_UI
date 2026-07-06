import { describe, expect, it } from 'vitest'
import { buildWorkshopArtifact, isArtifactComplete } from '../artifactBuilder'
import { selectCandidates } from '../candidateSelector'
import { buildIsolatedContext } from '../contextIsolation'
import { canTransition, getNextPhase, assertCanTransition } from '../phaseMachine'
import { DEFAULT_WORKSHOP_ROLES, getDefaultWorkshopRoles, getRolePreset, REQUIRED_WORKSHOP_ROLE_IDS } from '../rolePresets'
import { evaluateArtifactQuality } from '../qualityGate'
import type { BuildArtifactInput, WorkshopDiscussionRecord, WorkshopRoleSnapshot, WorkshopState } from '../types'

function roleSnapshots(): WorkshopRoleSnapshot[] {
  return getDefaultWorkshopRoles().map(role => ({ ...role, agentId: `agent-${role.roleId}` }))
}

function artifactInput(overrides: Partial<BuildArtifactInput> = {}): BuildArtifactInput {
  return {
    id: 'artifact-1',
    version: 1,
    title: 'AI 圆桌工作坊',
    goal: '把模糊想法转成可执行方案',
    nonGoals: ['不做无限自由群聊'],
    targetUsers: ['个人工作台用户'],
    userPath: ['输入想法', '专家分析', '输出方案'],
    mvpScope: ['固定专家组', '阶段流转', '结构化产出'],
    implementationNotes: ['先实现纯逻辑模块'],
    risks: ['范围膨胀'],
    nextSteps: ['实现阶段 1'],
    createdAt: 1,
    ...overrides,
  }
}

describe('AI 圆桌工作坊阶段 1 纯逻辑', () => {
  it('按固定顺序推进工作坊阶段', () => {
    expect(getNextPhase('clarify')).toBe('diverge')
    expect(getNextPhase('artifact')).toBe('completed')
    expect(getNextPhase('completed')).toBeNull()
    expect(canTransition('challenge', 'converge')).toBe(true)
    expect(canTransition('clarify', 'artifact')).toBe(false)
    expect(() => assertCanTransition('clarify', 'artifact')).toThrow('Invalid workshop phase transition')
  })

  it('默认专家组包含所有必选角色且职责不重复', () => {
    const roleIds = DEFAULT_WORKSHOP_ROLES.map(role => role.roleId)
    expect(roleIds).toEqual(['host', 'product', 'experience', 'technical', 'risk', 'execution'])
    expect(REQUIRED_WORKSHOP_ROLE_IDS).toEqual(roleIds)
    expect(new Set(DEFAULT_WORKSHOP_ROLES.map(role => role.responsibility)).size).toBe(DEFAULT_WORKSHOP_ROLES.length)
    expect(getRolePreset('risk')?.name).toBe('风险官')
  })

  it('根据阶段选择合法发言候选池', () => {
    const roles = roleSnapshots()
    expect(selectCandidates({ phase: 'clarify', roles }).candidates.map(role => role.roleId)).toEqual(['host'])

    const diverge = selectCandidates({ phase: 'diverge', roles })
    expect(diverge.requireIndependentDraft).toBe(true)
    expect(diverge.candidates.map(role => role.roleId)).toEqual(['product', 'experience', 'technical', 'execution'])

    const challenge = selectCandidates({ phase: 'challenge', roles, challengedRoleIds: ['technical'] })
    expect(challenge.candidates.map(role => role.roleId)).toEqual(['risk', 'technical'])
  })

  it('风险官缺失时由主持人代行质疑并标记不完整', () => {
    const roles = roleSnapshots().filter(role => role.roleId !== 'risk')
    const result = selectCandidates({ phase: 'challenge', roles })
    expect(result.candidates.map(role => role.roleId)).toEqual(['host'])
    expect(result.incompleteReason).toContain('风险官缺失')
  })

  it('独立初稿阶段隔离其他专家观点', () => {
    const product = roleSnapshots().find(role => role.roleId === 'product')!
    const records: WorkshopDiscussionRecord[] = [
      { phase: 'diverge', roleId: 'technical', content: '技术观点', createdAt: 1 },
      { phase: 'challenge', roleId: 'risk', content: '风险观点', createdAt: 2 },
    ]

    const ctx = buildIsolatedContext({
      phase: 'diverge',
      role: product,
      topic: '多 AI 镜头互动',
      records,
      independentDraft: true,
    })

    expect(ctx.visibleRecords).toEqual([])
    expect(ctx.instruction).toContain('独立给出')
  })

  it('质疑阶段允许看到被质疑观点', () => {
    const risk = roleSnapshots().find(role => role.roleId === 'risk')!
    const records: WorkshopDiscussionRecord[] = [
      { phase: 'diverge', roleId: 'technical', content: '建议新增模块', createdAt: 1 },
    ]

    const ctx = buildIsolatedContext({
      phase: 'challenge',
      role: risk,
      topic: '多 AI 镜头互动',
      records,
    })

    expect(ctx.visibleRecords).toHaveLength(1)
    expect(ctx.instruction).toContain('可处理的风险')
  })

  it('构建并校验完整结构化产物', () => {
    const artifact = buildWorkshopArtifact(artifactInput())
    const quality = evaluateArtifactQuality(artifact)
    expect(artifact.nonGoals).toEqual(['不做无限自由群聊'])
    expect(quality.passed).toBe(true)
    expect(quality.score).toBe(100)
    expect(isArtifactComplete(artifact)).toBe(true)
  })

  it('质量门禁能发现缺失字段', () => {
    const artifact = buildWorkshopArtifact(artifactInput({ mvpScope: ['  '], risks: [] }))
    const quality = evaluateArtifactQuality(artifact)
    expect(quality.passed).toBe(false)
    expect(quality.missingFields).toEqual(['MVP 范围', '风险与取舍'])
    expect(quality.revisionHint).toContain('MVP 范围')
  })

  it('拒绝构建完全空的产物', () => {
    expect(() => buildWorkshopArtifact(artifactInput({
      goal: '',
      nonGoals: [],
      userPath: [],
      mvpScope: [],
      implementationNotes: [],
      risks: [],
      nextSteps: [],
    }))).toThrow('Cannot build empty workshop artifact')
  })

  it('WorkshopState 能表达检查点、质量结果和 trace', () => {
    const state: WorkshopState = {
      topic: '多 AI 镜头互动',
      phase: 'diverge',
      roles: roleSnapshots(),
      artifacts: [],
      checkpoint: {
        phase: 'diverge',
        reason: 'choose-direction',
        prompt: '你想优先看哪个方向？',
        options: ['产品', '技术'],
        createdAt: 1,
      },
      trace: [{
        id: 'trace-1',
        runId: 'run-1',
        phase: 'diverge',
        type: 'checkpoint-created',
        createdAt: 1,
      }],
      quality: { passed: false, score: 80, missingFields: ['风险与取舍'] },
      incompleteReason: '风险官缺失',
      status: 'paused',
      currentRunId: 'run-1',
      createdAt: 1,
      updatedAt: 1,
    }

    expect(state.checkpoint?.reason).toBe('choose-direction')
    expect(state.trace[0].type).toBe('checkpoint-created')
    expect(state.quality?.missingFields).toEqual(['风险与取舍'])
  })
})
