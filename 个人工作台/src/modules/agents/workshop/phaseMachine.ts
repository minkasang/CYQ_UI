import type { WorkshopPhase } from './types'

const NEXT_PHASE: Record<Exclude<WorkshopPhase, 'completed'>, WorkshopPhase> = {
  clarify: 'diverge',
  diverge: 'challenge',
  challenge: 'converge',
  converge: 'artifact',
  artifact: 'completed',
}

export function getNextPhase(phase: WorkshopPhase): WorkshopPhase | null {
  return phase === 'completed' ? null : NEXT_PHASE[phase]
}

export function canTransition(from: WorkshopPhase, to: WorkshopPhase): boolean {
  return getNextPhase(from) === to
}

export function assertCanTransition(from: WorkshopPhase, to: WorkshopPhase): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid workshop phase transition: ${from} -> ${to}`)
  }
}
