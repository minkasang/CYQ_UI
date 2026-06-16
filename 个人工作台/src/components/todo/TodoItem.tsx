// 待办项
// 给 AI 的话：单个待办的展示和操作

import { Check, Trash2, Circle } from 'lucide-react'
import type { Todo } from '../../types'
import { useTodoStore, CATEGORY_LABELS, PRIORITY_LABELS } from '../../store/useTodoStore'
import { relativeTime } from '../../utils/date'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const toggleComplete = useTodoStore(s => s.toggleComplete)
  const deleteTodo = useTodoStore(s => s.deleteTodo)

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

  return (
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
        <div className={`text-sm ${todo.completed ? 'line-through text-white/50' : 'text-white/90'}`}>
          {todo.title}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${categoryColor}`}>
            {CATEGORY_LABELS[todo.category]}
          </span>
          <div className={`w-1.5 h-1.5 rounded-full ${priorityColor}`} title={`优先级：${PRIORITY_LABELS[todo.priority]}`} />
          <span className="text-[10px] text-white/40">
            {todo.dueDate ? `📅 ${todo.dueDate}` : relativeTime(todo.createdAt)}
          </span>
        </div>
      </div>

      {/* 删除按钮 */}
      <button
        onClick={() => deleteTodo(todo.id)}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-300 transition"
        title="删除"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
