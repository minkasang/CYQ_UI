// 任务依赖选择器
// 支持设置任务的前置依赖，显示阻塞状态

import { useState } from 'react'
import { Link, X, AlertCircle, CheckCircle } from 'lucide-react'
import { Popover } from '../ui/Popover'
import type { Todo } from '../../types'

interface DependencySelectorProps {
  currentTodoId: string
  dependsOn: string[]
  allTodos: Todo[]
  onChange: (dependsOn: string[]) => void
}

export function DependencySelector({
  currentTodoId,
  dependsOn,
  allTodos,
  onChange,
}: DependencySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')

  // 获取依赖的任务详情
  const dependencyTasks = allTodos.filter(t => dependsOn.includes(t.id))

  // 可选的任务（排除自己、已依赖的、已完成的）
  const availableTasks = allTodos.filter(t =>
    t.id !== currentTodoId &&
    !dependsOn.includes(t.id) &&
    !t.completed &&
    !t.archived
  )

  // 搜索过滤
  const filteredTasks = availableTasks.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // 添加依赖
  const handleAdd = (todoId: string) => {
    onChange([...dependsOn, todoId])
    setSearchTerm('')
  }

  // 移除依赖
  const handleRemove = (todoId: string) => {
    onChange(dependsOn.filter(id => id !== todoId))
  }

  // 检查是否有未完成的依赖
  const hasBlocking = dependencyTasks.some(t => !t.completed)

  return (
    <div className="space-y-2">
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Link size={14} className="text-white/60" />
        <span className="text-xs text-white/60">前置依赖</span>
        {hasBlocking && (
          <span className="text-[10px] text-orange-300 flex items-center gap-1">
            <AlertCircle size={10} />
            有阻塞
          </span>
        )}
      </div>

      {/* 已选依赖列表 */}
      {dependencyTasks.length > 0 && (
        <div className="space-y-1">
          {dependencyTasks.map(task => (
            <div
              key={task.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                task.completed
                  ? 'bg-green-500/10 text-green-300'
                  : 'bg-orange-500/10 text-orange-300'
              }`}
            >
              {task.completed ? (
                <CheckCircle size={12} />
              ) : (
                <AlertCircle size={12} />
              )}
              <span className="flex-1 truncate">{task.title}</span>
              <button
                onClick={() => handleRemove(task.id)}
                className="p-0.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 添加依赖按钮 */}
      {availableTasks.length > 0 && (
        <Popover
          align="left"
          minWidth={256}
          trigger={
            <button className="text-xs px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition">
              + 添加依赖
            </button>
          }
        >
          <div>
            {/* 搜索框 */}
            <div className="p-2 border-b border-white/[0.06]">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索任务..."
                className="w-full px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-blue-400/50"
                autoFocus
              />
            </div>

            {/* 任务列表 */}
            <div className="max-h-48 overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="px-3 py-2 text-xs text-white/30 text-center">
                  没有可选的任务
                </div>
              ) : (
                filteredTasks.map(task => (
                  <button
                    key={task.id}
                    onClick={() => {
                      handleAdd(task.id)
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500/60 flex-shrink-0" />
                    <span className="flex-1 truncate">{task.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </Popover>
      )}

      {/* 空状态 */}
      {dependencyTasks.length === 0 && availableTasks.length === 0 && (
        <p className="text-[10px] text-white/40">没有可依赖的任务</p>
      )}
    </div>
  )
}

// 检查任务是否被阻塞（有未完成的依赖）
export function isTaskBlocked(todo: Todo, allTodos: Todo[]): boolean {
  if (!todo.dependsOn || todo.dependsOn.length === 0) return false
  return todo.dependsOn.some(depId => {
    const depTask = allTodos.find(t => t.id === depId)
    return depTask && !depTask.completed
  })
}

// 获取阻塞任务列表
export function getBlockingTasks(todo: Todo, allTodos: Todo[]): Todo[] {
  if (!todo.dependsOn) return []
  return allTodos.filter(t => todo.dependsOn.includes(t.id) && !t.completed)
}
