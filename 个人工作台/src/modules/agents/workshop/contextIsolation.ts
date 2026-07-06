import type { IsolatedContext, IsolatedContextInput, WorkshopDiscussionRecord } from './types'

export function buildIsolatedContext(input: IsolatedContextInput): IsolatedContext {
  const visibleRecords = filterVisibleRecords(input)
  const clarificationText = input.clarification ? `\n已澄清信息：${input.clarification}` : ''

  return {
    topic: input.topic,
    role: input.role,
    visibleRecords,
    instruction: [
      `议题：${input.topic}`,
      clarificationText.trim(),
      `你的角色：${input.role.name}`,
      `你的职责：${input.role.responsibility}`,
      `发言边界：${input.role.promptBoundary}`,
      phaseInstruction(input),
    ].filter(Boolean).join('\n'),
  }
}

function filterVisibleRecords(input: IsolatedContextInput): WorkshopDiscussionRecord[] {
  if (input.phase === 'diverge' && input.independentDraft) {
    return input.records.filter(record => record.roleId === input.role.roleId && record.phase !== 'diverge')
  }

  if (input.phase === 'converge' || input.phase === 'artifact') {
    return input.records.filter(record => record.content.trim().length > 0)
  }

  return input.records
}

function phaseInstruction(input: IsolatedContextInput): string {
  if (input.phase === 'diverge' && input.independentDraft) {
    return '请先独立给出你的第一版判断，不要假设或引用其他专家的观点。'
  }

  if (input.phase === 'challenge') {
    return '请围绕已出现的方案提出可处理的风险、反例和取舍建议。'
  }

  if (input.phase === 'converge') {
    return '请合并共识，去掉重复内容，并保留关键分歧。'
  }

  if (input.phase === 'artifact') {
    return '请为最终结构化产物提供必要内容，避免空泛总结。'
  }

  return '请严格围绕当前阶段目标发言。'
}
