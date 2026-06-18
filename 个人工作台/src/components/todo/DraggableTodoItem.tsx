// 可拖拽的任务项
// 包装 TodoItem 实现拖拽排序

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo } from '../../types'
import { TodoItem } from './TodoItem'

interface DraggableTodoItemProps {
  todo: Todo
}

export function DraggableTodoItem({ todo }: DraggableTodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TodoItem todo={todo} />
    </div>
  )
}
