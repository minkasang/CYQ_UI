// 看板视图
// 三列：待办 / 进行中 / 已完成，支持拖拽切换状态

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { useTodoStore } from '../../store/useTodoStore'
import { useProjectStore } from '../../store/useProjectStore'
import { useTagStore } from '../../store/useTagStore'
import type { Todo } from '../../types'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'

type KanbanStatus = 'todo' | 'inProgress' | 'done'

// 根据任务状态判断看板列
function getKanbanStatus(todo: Todo): KanbanStatus {
  if (todo.completed) return 'done'
  if (todo.timeEntries.some(e => !e.endTime)) return 'inProgress' // 有正在计时的任务视为进行中
  return 'todo'
}

export function TodoKanban() {
  const todos = useTodoStore(s => s.todos.filter(t => !t.archived))
  const toggleComplete = useTodoStore(s => s.toggleComplete)
  const startTimeEntry = useTodoStore(s => s.startTimeEntry)
  const stopTimeEntry = useTodoStore(s => s.stopTimeEntry)

  const loadProjects = useProjectStore(s => s.loadProjects)
  const loadTags = useTagStore(s => s.loadTags)

  const [activeTodo, setActiveTodo] = useState<Todo | null>(null)

  // 初始化加载
  useState(() => {
    loadProjects()
    loadTags()
  })

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  // 分组任务
  const todoList = todos.filter(t => getKanbanStatus(t) === 'todo')
  const inProgressList = todos.filter(t => getKanbanStatus(t) === 'inProgress')
  const doneList = todos.filter(t => getKanbanStatus(t) === 'done')

  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string
    const todo = todos.find(t => t.id === id)
    if (todo) setActiveTodo(todo)
  }

  // 拖拽结束
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTodo(null)

    if (!over) return

    const todoId = active.id as string
    const targetStatus = over.id as KanbanStatus
    const todo = todos.find(t => t.id === todoId)

    if (!todo) return

    const currentStatus = getKanbanStatus(todo)
    if (currentStatus === targetStatus) return

    // 状态切换逻辑
    if (targetStatus === 'done') {
      // 移动到已完成
      if (!todo.completed) toggleComplete(todo.id)
      if (todo.timeEntries.some(e => !e.endTime)) stopTimeEntry(todo.id)
    } else if (targetStatus === 'inProgress') {
      // 移动到进行中
      if (todo.completed) toggleComplete(todo.id)
      if (!todo.timeEntries.some(e => !e.endTime)) startTimeEntry(todo.id)
    } else {
      // 移动到待办
      if (todo.completed) toggleComplete(todo.id)
      if (todo.timeEntries.some(e => !e.endTime)) stopTimeEntry(todo.id)
    }
  }

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-4 h-full">
          <KanbanColumn
            id="todo"
            title="待办"
            todos={todoList}
            color="bg-blue-500/20"
          />
          <KanbanColumn
            id="inProgress"
            title="进行中"
            todos={inProgressList}
            color="bg-yellow-500/20"
          />
          <KanbanColumn
            id="done"
            title="已完成"
            todos={doneList}
            color="bg-green-500/20"
          />
        </div>

        <DragOverlay>
          {activeTodo && <KanbanCard todo={activeTodo} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
