// 待办项 — macOS 三行布局
// 规范：共享执行规则文件/模块UI设计/todo-design.md §4

import { useState } from 'react'
import { Check, Trash2, Edit2, ChevronDown, ChevronRight, Archive, ArchiveRestore, AlertCircle } from 'lucide-react'
import type { Todo } from '../../types'
import { useTodoStore, CATEGORY_LABELS, PRIORITY_LABELS } from '../../store/useTodoStore'
import { useTagStore } from '../../store/useTagStore'
import { relativeTime } from '../../utils/date'
import { TodoEditModal } from './TodoEditModal'
import { isTaskBlocked, getBlockingTasks } from './DependencySelector'

// 优先级颜色（macOS 系统色）
const PRIORITY_COLORS: Record<string, { dot: string; bg: string; text: string }> = {
  high:   { dot: '#FF453A', bg: 'rgba(255,69,58,0.15)',  text: '#FF453A' },
  medium: { dot: '#FF9F0A', bg: 'rgba(255,159,10,0.15)', text: '#FF9F0A' },
  low:    { dot: '#30D158', bg: 'rgba(48,209,88,0.15)',  text: '#30D158' },
}

// 分类标签色
const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  work:  { bg: 'rgba(10,132,255,0.15)', text: '#0A84FF' },
  life:  { bg: 'rgba(191,90,242,0.15)', text: '#BF5AF2' },
  study: { bg: 'rgba(255,159,10,0.15)', text: '#FF9F0A' },
  other: { bg: 'rgba(152,152,157,0.15)', text: '#98989D' },
}

interface TodoItemProps { todo: Todo }

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

  const blocked = isTaskBlocked(todo, allTodos)
  const blockingTasks = getBlockingTasks(todo, allTodos)
  const pc = PRIORITY_COLORS[todo.priority]
  const cc = CATEGORY_COLORS[todo.category] || CATEGORY_COLORS.other
  const todoTags = tags.filter(t => todo.tags.includes(t.id))

  const subtaskDone = todo.subtasks.filter(s => s.completed).length
  const subtaskTotal = todo.subtasks.length
  const subtaskPct = subtaskTotal > 0 ? subtaskDone / subtaskTotal : 0

  const isCompleted = todo.completed

  return (
    <>
      <div
        className="group flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors"
        style={{
          minHeight: 44,
          opacity: isCompleted ? 0.45 : 1,
          background: 'transparent',
        }}
        onMouseEnter={e => { if (!isCompleted) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        {/* 复选框 18×18 */}
        <button
          onClick={() => toggleComplete(todo.id)}
          className="flex-shrink-0 mt-0.5 transition"
          title={isCompleted ? '取消完成' : '标记完成'}
        >
          {isCompleted ? (
            <div className="w-[18px] h-[18px] rounded flex items-center justify-center"
              style={{ background: '#0A84FF' }}>
              <Check size={11} strokeWidth={3} color="#fff" />
            </div>
          ) : (
            <div className="w-[18px] h-[18px] rounded border transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.25)' }} />
          )}
        </button>

        {/* 内容区 */}
        <div className="flex-1 min-w-0">
          {/* L1: 标题 + 优先级 */}
          <div className="flex items-center gap-2">
            <span
              className="truncate text-[13px]"
              style={{
                color: isCompleted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.9)',
                textDecoration: isCompleted ? 'line-through' : 'none',
              }}
            >
              {todo.title}
            </span>

            {/* 优先级标签 */}
            <span
              className="text-[11px] px-1.5 py-px rounded flex-shrink-0"
              style={{ background: pc.bg, color: pc.text }}
            >
              {PRIORITY_LABELS[todo.priority]}
            </span>

            {/* 阻塞提示 */}
            {blocked && !isCompleted && (
              <span className="flex items-center gap-1 text-[11px] flex-shrink-0"
                style={{ color: '#FF9F0A' }}
                title={`被阻塞：${blockingTasks.map(t => t.title).join('、')}`}>
                <AlertCircle size={10} />
              </span>
            )}
          </div>

          {/* L2: 元数据（日期 + 分类 + 标签） */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* 截止/创建日期 */}
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {todo.dueDate ? `📅 ${todo.dueDate}` : relativeTime(todo.createdAt)}
            </span>

            {/* 分类 */}
            {todo.category && (
              <span className="text-[11px] px-1.5 py-px rounded" style={{ background: cc.bg, color: cc.text }}>
                {CATEGORY_LABELS[todo.category]}
              </span>
            )}

            {/* 自定义标签 */}
            {todoTags.map(tag => (
              <span key={tag.id} className="text-[11px] px-1.5 py-px rounded"
                style={{ background: tag.color + '22', color: tag.color }}>
                {tag.name}
              </span>
            ))}
          </div>

          {/* L3: 子任务进度（有子任务时显示） */}
          {subtaskTotal > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${subtaskPct * 100}%`,
                  background: subtaskPct === 1 ? '#30D158' : '#0A84FF',
                }} />
              </div>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {subtaskDone}/{subtaskTotal}
              </span>
            </div>
          )}
        </div>

        {/* 操作按钮（hover 显示） */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
          {subtaskTotal > 0 && (
            <IconBtn onClick={() => setShowSubtasks(!showSubtasks)} title="子任务">
              {showSubtasks ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </IconBtn>
          )}
          <IconBtn onClick={() => setShowEdit(true)} title="编辑">
            <Edit2 size={14} />
          </IconBtn>
          {todo.archived ? (
            <IconBtn onClick={() => unarchiveTodo(todo.id)} title="恢复" className="hover:text-blue-300">
              <ArchiveRestore size={14} />
            </IconBtn>
          ) : (
            <IconBtn onClick={() => archiveTodo(todo.id)} title="归档">
              <Archive size={14} />
            </IconBtn>
          )}
          <IconBtn onClick={() => deleteTodo(todo.id)} title="删除" className="hover:!text-red-300">
            <Trash2 size={14} />
          </IconBtn>
        </div>
      </div>

      {/* 子任务展开 */}
      {showSubtasks && subtaskTotal > 0 && (
        <div className="ml-9 mb-1 space-y-0.5">
          {todo.subtasks.map(sub => (
            <div key={sub.id} className="flex items-center gap-2 px-2 py-1 rounded"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <button
                onClick={() => toggleSubTask(todo.id, sub.id)}
                className="w-[16px] h-[16px] rounded border flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  background: sub.completed ? '#0A84FF' : 'transparent',
                  borderColor: sub.completed ? '#0A84FF' : 'rgba(255,255,255,0.2)',
                }}>
                {sub.completed && <Check size={9} strokeWidth={3} color="#fff" />}
              </button>
              <span className="flex-1 text-[12px] truncate" style={{
                color: sub.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.7)',
                textDecoration: sub.completed ? 'line-through' : 'none',
              }}>
                {sub.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {showEdit && <TodoEditModal todo={todo} onClose={() => setShowEdit(false)} />}
    </>
  )
}

// 小图标按钮
function IconBtn({ children, onClick, title, className = '' }: {
  children: React.ReactNode; onClick: () => void; title: string; className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1 rounded transition ${className}`}
      style={{ color: 'rgba(255,255,255,0.4)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
    >
      {children}
    </button>
  )
}
