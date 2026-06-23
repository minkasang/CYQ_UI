// 项目侧边栏
// 显示项目列表，支持按项目筛选任务

import { useState } from 'react'
import { Folder, Plus, Trash2 } from 'lucide-react'
import { useProjectStore, selectOrderedProjects, PROJECT_COLORS } from '../../store/useProjectStore'
import { useTodoStore } from '../../store/useTodoStore'

interface ProjectSidebarProps {
  selectedProjectId: string | null
  onSelectProject: (projectId: string | null) => void
}

export function ProjectSidebar({ selectedProjectId, onSelectProject }: ProjectSidebarProps) {
  const projects = useProjectStore(selectOrderedProjects)
  const addProject = useProjectStore(s => s.addProject)
  const deleteProject = useProjectStore(s => s.deleteProject)

  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0])

  // 统计每个项目的任务数
  const todos = useTodoStore(s => s.todos)
  const getProjectCount = (projectId: string) => {
    return todos.filter(t => t.projectId === projectId && !t.archived).length
  }

  // 创建新项目
  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      addProject(newProjectName.trim(), newProjectColor)
      setNewProjectName('')
      setShowNewProject(false)
    }
  }

  return (
    <div className="w-48 flex-shrink-0">
      <div className="rounded-xl bg-white/5 p-3 space-y-2">
        {/* 标题 */}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium text-white/60">项目</span>
          <button
            onClick={() => setShowNewProject(true)}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white transition"
            title="新建项目"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* 全部任务 */}
        <button
          onClick={() => onSelectProject(null)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${
            selectedProjectId === null
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:bg-white/5 hover:text-white/80'
          }`}
        >
          <Folder size={14} />
          <span className="text-xs flex-1">全部任务</span>
          <span className="text-xs text-white/40">{todos.filter(t => !t.archived).length}</span>
        </button>

        {/* 项目列表 */}
        <div className="space-y-0.5">
          {projects.map(project => (
            <div
              key={project.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-lg transition hover:bg-white/5"
            >
              <button
                onClick={() => onSelectProject(project.id)}
                className={`flex items-center gap-2 flex-1 text-left ${
                  selectedProjectId === project.id ? 'text-white' : 'text-white/60 hover:text-white/80'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-xs flex-1 truncate">{project.name}</span>
                <span className="text-xs text-white/40">{getProjectCount(project.id)}</span>
              </button>

              {/* 操作按钮 */}
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={() => deleteProject(project.id)}
                  className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-300 transition"
                  title="删除项目"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 新建项目表单 */}
        {showNewProject && (
          <div className="px-2 py-2 space-y-2 border-t border-white/10 mt-2 pt-2">
            <input
              type="text"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
              placeholder="项目名称"
              className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-blue-400/50"
              autoFocus
            />
            <div className="flex gap-1 flex-wrap">
              {PROJECT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setNewProjectColor(color)}
                  className={`w-5 h-5 rounded transition ${
                    newProjectColor === color ? 'ring-2 ring-white/50' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setShowNewProject(false)}
                className="flex-1 px-2 py-1 rounded bg-white/5 text-xs text-white/60 hover:bg-white/10 transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="flex-1 px-2 py-1 rounded bg-blue-500/30 text-xs text-white hover:bg-blue-500/50 transition disabled:opacity-40"
              >
                创建
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
