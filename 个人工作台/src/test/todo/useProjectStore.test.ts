import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjectStore, selectOrderedProjects } from '../../store/useProjectStore'

// Mock fileStorage
vi.mock('../../utils/fileStorage', () => ({
  loadFromFile: vi.fn().mockResolvedValue([]),
  saveToFile: vi.fn().mockResolvedValue(true),
  FILE_KEYS: {
    PROJECTS: '个人工作台/data/projects.json',
  },
}))

describe('useProjectStore', () => {
  beforeEach(() => {
    useProjectStore.setState({ projects: [], loaded: false, loading: false })
  })

  it('应该能添加项目', () => {
    useProjectStore.getState().addProject('工作项目', '#3b82f6')

    const projects = useProjectStore.getState().projects
    expect(projects.length).toBe(1)
    expect(projects[0].name).toBe('工作项目')
    expect(projects[0].color).toBe('#3b82f6')
  })

  it('应该能更新项目', () => {
    useProjectStore.getState().addProject('工作项目', '#3b82f6')
    const projectId = useProjectStore.getState().projects[0].id

    useProjectStore.getState().updateProject(projectId, { name: '新名称' })

    const project = useProjectStore.getState().projects.find(p => p.id === projectId)
    expect(project?.name).toBe('新名称')
  })

  it('应该能删除项目', () => {
    useProjectStore.getState().addProject('工作项目', '#3b82f6')
    const projectId = useProjectStore.getState().projects[0].id

    useProjectStore.getState().deleteProject(projectId)

    expect(useProjectStore.getState().projects.length).toBe(0)
  })

  it('应该能重排序项目', () => {
    useProjectStore.getState().addProject('项目1', '#3b82f6')
    useProjectStore.getState().addProject('项目2', '#ef4444')
    useProjectStore.getState().addProject('项目3', '#22c55e')

    useProjectStore.getState().reorderProjects(0, 2)

    const ordered = selectOrderedProjects(useProjectStore.getState())
    expect(ordered[0].name).toBe('项目2')
    expect(ordered[1].name).toBe('项目3')
    expect(ordered[2].name).toBe('项目1')
  })
})
