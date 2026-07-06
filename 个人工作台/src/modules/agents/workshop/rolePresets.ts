import type { WorkshopRoleId, WorkshopRolePreset } from './types'

export const DEFAULT_WORKSHOP_ROLES: readonly WorkshopRolePreset[] = [
  {
    roleId: 'host',
    name: '主持人',
    responsibility: '控制阶段、提出澄清问题、压缩上下文、收敛结论。',
    promptBoundary: '只负责推进流程和整合共识，不替代专家直接下结论。',
    required: true,
  },
  {
    roleId: 'product',
    name: '产品专家',
    responsibility: '判断目标用户、问题价值、MVP 范围和非目标。',
    promptBoundary: '聚焦产品定义，不展开具体代码实现。',
    required: true,
  },
  {
    roleId: 'experience',
    name: '体验设计师',
    responsibility: '设计入口、用户路径、状态反馈和界面体验。',
    promptBoundary: '聚焦终端用户体验，不替代产品价值判断。',
    required: true,
  },
  {
    roleId: 'technical',
    name: '技术架构师',
    responsibility: '判断模块边界、数据流、接口契约和实现复杂度。',
    promptBoundary: '聚焦实现可行性和架构健康，不提前编写业务代码。',
    required: true,
  },
  {
    roleId: 'risk',
    name: '风险官',
    responsibility: '发现歧义、失败点、范围膨胀、过度设计和不可落地风险。',
    promptBoundary: '必须给出可处理的风险与取舍，不做纯否定。',
    required: true,
  },
  {
    roleId: 'execution',
    name: '执行规划师',
    responsibility: '把共识拆成阶段、任务、验收标准和下一步动作。',
    promptBoundary: '不绕过用户确认直接进入开发执行。',
    required: true,
  },
] as const

export const REQUIRED_WORKSHOP_ROLE_IDS: readonly WorkshopRoleId[] = DEFAULT_WORKSHOP_ROLES
  .filter(role => role.required)
  .map(role => role.roleId)

export function getDefaultWorkshopRoles(): WorkshopRolePreset[] {
  return DEFAULT_WORKSHOP_ROLES.map(role => ({ ...role }))
}

export function getRolePreset(roleId: WorkshopRoleId): WorkshopRolePreset | undefined {
  return DEFAULT_WORKSHOP_ROLES.find(role => role.roleId === roleId)
}
