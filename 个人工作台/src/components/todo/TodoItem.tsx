// 待办项
// 给 AI 的话：单个待办的展示和操作

import { useState } from 'react'
import { Check, Trash2, Circle, Edit2, ChevronDown, ChevronRight, Archive, ArchiveRestore, AlertCircle } from 'lucide-react'
import type { Todo } from '../../types'
import { useTodoStore, CATEGORY_LABELS, PRIORITY_LABELS } from '../../store/useTodoStore'
import { useTagStore } from '../../store/useTagStore'
import { relativeTime } from '../../utils/date'
import { TodoEditModal } from './TodoEditModal'
import { isTaskBlocked, getBlockingTasks } from './DependencySelector'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const toggleComplete = useTodoStore(s => s.toggleComplete)
  const deleteTodo = useTodoStore(s => s.deleteTodo)
  const toggleSubTask = useTodoStore(s => s.toggleSubTask)
  const archiveTodo = useTodoStore(s => s.archiveTodo)
  const unarchiveTodo = useTodoStore(s => s.unarchiveTodo)
  const tags = useTagStore(s => s.tags)
  const allTodos = useTodoStore(s => s.todos)

  const [showEdit, setShowEdit] = useState(false)
  const [showSubtasks, setShowSubtasks] = useState(false)

  // 检查是否被阻塞
  const blocked = isTaskBlocked(todo, allTodos)
  const blockingTasks = getBlockingTasks(todo, allTodos)

  // 优先级颜色
  const priorityColor = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500',
  }[todo.priority]

  // 分类颜色
  const categoryColor = {
    work: 'bg-blue-500/20 text-blue-200',
    life: 'bg-green-500/20 text-green-200',
    study: 'bg-purple-500/20 text-purple-200',
    other: 'bg-gray-500/20 text-gray-200',
  }[todo.category]

  // 子任务进度
  const subtaskProgress = todo.subtasks.length > 0
    ? todo.subtasks.filter(s => s.completed).length / todo.subtasks.length
    : null

  // 获取任务的标签
  const todoTags = tags.filter(t => todo.tags.includes(t.id))

  return (
    <>
      <div
        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
          todo.completed ? 'opacity-50' : 'hover:bg-white/8'
        }`}
      >
        {/* 复选框 */}
        <button
          onClick={() => toggleComplete(todo.id)}
          className="flex-shrink-0 transition"
          title={todo.completed ? '标记为未完成' : '标记为完成'}
        >
          {todo.completed ? (
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <Check size={12} className="text-white" />
            </div>
          ) : (
            <Circle size={20} className="text-white/40 hover:text-white/70" />
          )}
        </button>

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className={`text-sm ${todo.completed ? 'line-through text-white/50' : 'text-white/90'} flex items-center gap-2`}>
            <span className="truncate">{todo.title}</span>
            {/* 阻塞提示 */}
            {blocked && !todo.completed && (
              <span
                className="flex items-center gap-1 text-[10px] text-orange-300"
                title={`被阻塞：${blockingTasks.map(t => t.title).join('、')}`}
              >
                <AlertCircle size={10} />
                <span className="hidden sm:inline">阻塞</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColor}`}>
              {CATEGORY_LABELS[todo.category]}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${priorityColor}`} title={`优先级：${PRIORITY_LABELS[todo.priority]}`} />

            {/* 标签 */}
            {todoTags.map(tag => (
              <span
                key={tag.id}
                className="text-[10px] px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}

            {/* 子任务进度 */}
            {subtaskProgress !== null && (
              <span className="text-[10px] text-white/40">
                📋 {todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length}
              </span>
            )}

            <span className="text-[10px] text-white/40">
              {todo.dueDate ? `📅 ${todo.dueDate}` : relativeTime(todo.createdAt)}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
          {/* 子任务展开按钮 */}
          {todo.subtasks.length > 0 && (
            <button
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition"
              title={showSubtasks ? '收起子任务' : '展开子任务'}
            >
              {showSubtasks ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* 编辑按钮 */}
          <button
            onClick={() => setShowEdit(true)}
            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition"
            title="编辑"
          >
            <Edit2 size={14} />
          </button>

          {/* 归档/恢复按钮 */}
          {todo.archived ? (
            <button
              onClick={() => unarchiveTodo(todo.id)}
              className="p-1.5 rounded hover:bg-blue-500/20 text-white/50 hover:text-blue-300 transition"
              title="恢复"
            >
              <ArchiveRestore size={14} />
            </button>
          ) : (
            <button
              onClick={() => archiveTodo(todo.id)}
              className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition"
              title="归档"
            >
              <Archive size={14} />
            </button>
          )}

          {/* 删除按钮 */}
          <button
            onClick={() => deleteTodo(todo.id)}
            className="p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-300 transition"
            title="删除"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* 子任务列表 */}
      {showSubtasks && todo.subtasks.length > 0 && (
        <div className="ml-8 mb-2 space-y-1">
          {todo.subtasks.map(subtask => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 px-2 py-1 rounded bg-white/5"
            >
              <button
                onClick={() => toggleSubTask(todo.id, subtask.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                  subtask.completed
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'border-white/30 hover:border-white/50'
                }`}
              >
                {subtask.completed && <span className="text-[10px]">✓</span>}
              </button>
              <span className={`flex-1 text-xs ${subtask.completed ? 'line-through text-white/40' : 'text-white/80'}`}>
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 编辑弹窗 */}
      {showEdit && (
        <TodoEditModal todo={todo} onClose={() => setShowEdit(false)} />
      )}
    </>
  )
}
