export type WorkshopPhase =
  | 'clarify'
  | 'diverge'
  | 'challenge'
  | 'converge'
  | 'artifact'
  | 'completed'

export type WorkshopStatus = 'idle' | 'clarifying' | 'running' | 'paused' | 'completed' | 'failed'

export type WorkshopRoleId =
  | 'host'
  | 'product'
  | 'experience'
  | 'technical'
  | 'risk'
  | 'execution'

export type WorkshopCheckpointReason =
  | 'need-user-clarification'
  | 'choose-direction'
  | 'choose-output-bias'

export type WorkshopTraceEventType =
  | 'phase-started'
  | 'speaker-selected'
  | 'agent-succeeded'
  | 'agent-failed'
  | 'agent-skipped'
  | 'quality-checked'
  | 'checkpoint-created'

export type WorkshopCompleteness = 'complete' | 'partial' | 'failed'

export interface WorkshopRolePreset {
  roleId: WorkshopRoleId
  name: string
  responsibility: string
  promptBoundary: string
  required: boolean
}

export interface WorkshopRoleSnapshot extends WorkshopRolePreset {
  agentId?: string
}

export interface WorkshopArtifact {
  id: string
  version: number
  title: string
  goal: string
  nonGoals: string[]
  targetUsers: string[]
  userPath: string[]
  mvpScope: string[]
  implementationNotes: string[]
  risks: string[]
  nextSteps: string[]
  completeness: WorkshopCompleteness
  createdAt: number
}

export interface QualityGateResult {
  passed: boolean
  score: number
  missingFields: string[]
  revisionHint?: string
}

export interface WorkshopCheckpoint {
  phase: WorkshopPhase
  reason: WorkshopCheckpointReason
  prompt: string
  options: string[]
  createdAt: number
}

export interface WorkshopTraceEvent {
  id: string
  runId: string
  phase: WorkshopPhase
  type: WorkshopTraceEventType
  roleId?: WorkshopRoleId
  reason?: string
  createdAt: number
}

export interface WorkshopState {
  topic: string
  phase: WorkshopPhase
  roles: WorkshopRoleSnapshot[]
  artifacts: WorkshopArtifact[]
  checkpoint?: WorkshopCheckpoint
  trace: WorkshopTraceEvent[]
  quality?: QualityGateResult
  incompleteReason?: string
  status: WorkshopStatus
  currentRunId?: string
  createdAt: number
  updatedAt: number
}

export interface CandidateSelectionContext {
  phase: WorkshopPhase
  roles: WorkshopRoleSnapshot[]
  challengedRoleIds?: WorkshopRoleId[]
}

export interface CandidateSelectionResult {
  candidates: WorkshopRoleSnapshot[]
  requireIndependentDraft: boolean
  incompleteReason?: string
}

export interface WorkshopDiscussionRecord {
  phase: WorkshopPhase
  roleId: WorkshopRoleId
  content: string
  createdAt: number
}

export interface IsolatedContextInput {
  phase: WorkshopPhase
  role: WorkshopRoleSnapshot
  topic: string
  clarification?: string
  records: WorkshopDiscussionRecord[]
  independentDraft?: boolean
}

export interface IsolatedContext {
  topic: string
  role: WorkshopRoleSnapshot
  visibleRecords: WorkshopDiscussionRecord[]
  instruction: string
}

export interface BuildArtifactInput {
  id: string
  version: number
  title: string
  goal: string
  nonGoals: string[]
  targetUsers: string[]
  userPath: string[]
  mvpScope: string[]
  implementationNotes: string[]
  risks: string[]
  nextSteps: string[]
  completeness?: WorkshopCompleteness
  createdAt: number
}
