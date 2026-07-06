import type { QualityGateResult, WorkshopArtifact } from './types'

const REQUIRED_FIELD_LABELS: Array<[keyof WorkshopArtifact, string]> = [
  ['goal', '目标定义'],
  ['nonGoals', '不做什么'],
  ['mvpScope', 'MVP 范围'],
  ['userPath', '用户路径'],
  ['implementationNotes', '技术实现建议'],
  ['risks', '风险与取舍'],
  ['nextSteps', '下一步计划'],
]

export function evaluateArtifactQuality(artifact: WorkshopArtifact): QualityGateResult {
  const missingFields = REQUIRED_FIELD_LABELS
    .filter(([field]) => isEmptyArtifactField(artifact[field]))
    .map(([, label]) => label)

  const score = Math.round(((REQUIRED_FIELD_LABELS.length - missingFields.length) / REQUIRED_FIELD_LABELS.length) * 100)
  const passed = missingFields.length === 0

  return {
    passed,
    score,
    missingFields,
    revisionHint: passed ? undefined : `请补充：${missingFields.join('、')}。`,
  }
}

function isEmptyArtifactField(value: WorkshopArtifact[keyof WorkshopArtifact]): boolean {
  if (Array.isArray(value)) return value.filter(item => item.trim().length > 0).length === 0
  if (typeof value === 'string') return value.trim().length === 0
  return value === undefined || value === null
}
