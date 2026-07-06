import type {
  CandidateSelectionContext,
  CandidateSelectionResult,
  WorkshopRoleId,
  WorkshopRoleSnapshot,
} from './types'

const PHASE_ROLE_CANDIDATES: Record<string, WorkshopRoleId[]> = {
  clarify: ['host'],
  diverge: ['product', 'experience', 'technical', 'execution'],
  challenge: ['risk'],
  converge: ['host', 'execution'],
  artifact: ['host'],
  completed: [],
}

export function selectCandidates(ctx: CandidateSelectionContext): CandidateSelectionResult {
  const allowedRoleIds = getAllowedRoleIds(ctx)
  const candidates = allowedRoleIds
    .map(roleId => findRole(ctx.roles, roleId))
    .filter((role): role is WorkshopRoleSnapshot => role !== undefined)

  const riskMissing = ctx.phase === 'challenge' && !candidates.some(role => role.roleId === 'risk')
  if (riskMissing) {
    const host = findRole(ctx.roles, 'host')
    return {
      candidates: host ? [host] : [],
      requireIndependentDraft: false,
      incompleteReason: host
        ? '风险官缺失，由主持人代行反方审查。'
        : '风险官和主持人均缺失，无法进入质疑阶段。',
    }
  }

  return {
    candidates,
    requireIndependentDraft: ctx.phase === 'diverge',
    incompleteReason: candidates.length === 0 ? `阶段 ${ctx.phase} 没有可用发言者。` : undefined,
  }
}

function getAllowedRoleIds(ctx: CandidateSelectionContext): WorkshopRoleId[] {
  if (ctx.phase !== 'challenge' || !ctx.challengedRoleIds?.length) {
    return PHASE_ROLE_CANDIDATES[ctx.phase]
  }

  return uniqueRoleIds(['risk', ...ctx.challengedRoleIds])
}

function findRole(roles: WorkshopRoleSnapshot[], roleId: WorkshopRoleId): WorkshopRoleSnapshot | undefined {
  return roles.find(role => role.roleId === roleId)
}

function uniqueRoleIds(roleIds: WorkshopRoleId[]): WorkshopRoleId[] {
  return [...new Set(roleIds)]
}
