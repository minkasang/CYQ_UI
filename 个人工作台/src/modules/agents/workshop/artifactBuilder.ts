import type { BuildArtifactInput, WorkshopArtifact } from './types'
import { evaluateArtifactQuality } from './qualityGate'

export function buildWorkshopArtifact(input: BuildArtifactInput): WorkshopArtifact {
  const artifact: WorkshopArtifact = {
    id: input.id,
    version: input.version,
    title: input.title.trim(),
    goal: input.goal.trim(),
    nonGoals: cleanList(input.nonGoals),
    targetUsers: cleanList(input.targetUsers),
    userPath: cleanList(input.userPath),
    mvpScope: cleanList(input.mvpScope),
    implementationNotes: cleanList(input.implementationNotes),
    risks: cleanList(input.risks),
    nextSteps: cleanList(input.nextSteps),
    completeness: input.completeness ?? 'complete',
    createdAt: input.createdAt,
  }

  const quality = evaluateArtifactQuality(artifact)
  if (quality.missingFields.length === qualityGateFieldCount()) {
    throw new Error('Cannot build empty workshop artifact')
  }

  return artifact
}

export function isArtifactComplete(artifact: WorkshopArtifact): boolean {
  return evaluateArtifactQuality(artifact).passed && artifact.completeness === 'complete'
}

function cleanList(items: string[]): string[] {
  return items.map(item => item.trim()).filter(Boolean)
}

function qualityGateFieldCount(): number {
  return 7
}
