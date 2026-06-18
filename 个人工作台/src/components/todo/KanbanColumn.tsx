// 看板列组件

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Todo } from '../../types'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  id: string
  title: string
  todos: Todo[]
  color: string
}

export function KanbanColumn({ id, title, todos, color }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-xl ${color} ${isOver ? 'ring-2 ring-white/30' : ''}`}
    >
      {/* 标题 */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/90">{title}</h3>
          <span className="text-xs text-white/50 bg-white/10 px-2 py-0.5 rounded-full">
            {todos.length}
          </span>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        <SortableContext items={todos.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {todos.map(todo => (
            <KanbanCard key={todo.id} todo={todo} />
          ))}
        </SortableContext>

        {todos.length === 0 && (
          <div className="text-center py-8 text-white/30 text-xs">
            拖拽任务到这里
          </div>
        )}
      </div>
    </div>
  )
}
