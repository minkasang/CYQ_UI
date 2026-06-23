// 看板卡片组件

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo } from '../../types'
import { CATEGORY_LABELS } from '../../store/useTodoStore'
import { useTagStore } from '../../store/useTagStore'

interface KanbanCardProps {
  todo: Todo
  isDragging?: boolean
}

export function KanbanCard({ todo, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: todo.id })

  const tags = useTagStore(s => s.tags)
  const todoTags = tags.filter(t => todo.tags.includes(t.id))

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // 优先级颜色
  const priorityColor = {
    high: 'border-l-red-500',
    medium: 'border-l-yellow-500',
    low: 'border-l-green-500',
  }[todo.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white/5 rounded-lg p-3 border-l-2 ${priorityColor}
        cursor-grab active:cursor-grabbing
        ${isDragging ? 'shadow-lg ring-2 ring-blue-500/50' : 'hover:bg-white/8'}
        transition
      `}
    >
      {/* 标题 */}
      <div className={`text-sm ${todo.completed ? 'line-through text-white/50' : 'text-white/90'}`}>
        {todo.title}
      </div>

      {/* 元信息 */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
          {CATEGORY_LABELS[todo.category]}
        </span>

        {todoTags.slice(0, 2).map(tag => (
          <span
            key={tag.id}
            className="text-xs px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </span>
        ))}

        {todo.dueDate && (
          <span className="text-xs text-white/40">
            📅 {todo.dueDate}
          </span>
        )}

        {todo.subtasks.length > 0 && (
          <span className="text-xs text-white/40">
            📋 {todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length}
          </span>
        )}
      </div>
    </div>
  )
}
