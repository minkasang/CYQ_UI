// 待办列表
// 给 AI 的话：展示过滤后的待办项，支持切换过滤条件、拖拽排序和视图切换

import { useEffect, useState, useMemo } from 'react'
import { LayoutList, LayoutGrid, Search, X } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useTodoStore, selectFilteredTodos, selectTodoStats } from '../../store/useTodoStore'
import { useProjectStore } from '../../store/useProjectStore'
import { useTagStore } from '../../store/useTagStore'
import { TodoInput } from './TodoInput'
import { DraggableTodoItem } from './DraggableTodoItem'
import { TodoKanban } from './TodoKanban'
import { ProjectSidebar } from './ProjectSidebar'

type FilterType = 'all' | 'today' | 'pending' | 'completed' | 'archived'
type ViewMode = 'list' | 'kanban'

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'today', label: '今天' },
  { value: 'pending', label: '待完成' },
  { value: 'completed', label: '已完成' },
  { value: 'archived', label: '归档' },
  { value: 'all', label: '全部' },
]

export function TodoList() {
  const todos = useTodoStore(selectFilteredTodos)
  const filter = useTodoStore(s => s.filter)
  const setFilter = useTodoStore(s => s.setFilter)
  const projectFilter = useTodoStore(s => s.projectFilter)
  const setProjectFilter = useTodoStore(s => s.setProjectFilter)
  const stats = useTodoStore(selectTodoStats)
  const clearCompleted = useTodoStore(s => s.clearCompleted)
  const reorderTodos = useTodoStore(s => s.reorderTodos)

  const loadProjects = useProjectStore(s => s.loadProjects)
  const loadTags = useTagStore(s => s.loadTags)
  const allTags = useTagStore(s => s.tags)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchQuery, setSearchQuery] = useState('')

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要移动 8px 才开始拖拽，避免误触
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 初始化加载项目和标签
  useEffect(() => {
    loadProjects()
    loadTags()
  }, [loadProjects, loadTags])

  // 拖拽结束处理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = filteredTodos.findIndex(t => t.id === active.id)
      const newIndex = filteredTodos.findIndex(t => t.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        reorderTodos(oldIndex, newIndex)
      }
    }
  }

  // 搜索过滤
  const filteredTodos = useMemo(() => {
    if (!searchQuery.trim()) return todos
    const q = searchQuery.toLowerCase()
    return todos.filter(todo =>
      todo.title.toLowerCase().includes(q) ||
      (todo.content?.toLowerCase().includes(q)) ||
      todo.tags.some(tagId => {
        const tag = allTags.find(t => t.id === tagId)
        return tag?.name.toLowerCase().includes(q)
      })
    )
  }, [todos, searchQuery, allTags])

  const completedCount = filteredTodos.filter(t => t.completed).length

  // 看板视图
  if (viewMode === 'kanban') {
    return (
      <div className="space-y-3">
        {/* 视图切换 */}
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-4 gap-2 text-center flex-1">
            <StatCard label="今日待办" value={stats.today} color="text-blue-300" />
            <StatCard label="已完成" value={stats.completed} color="text-green-300" />
            <StatCard label="归档" value={stats.archived} color="text-white/50" />
            <StatCard label="总待办" value={stats.total} color="text-white/80" />
          </div>
          <button
            onClick={() => setViewMode('list')}
            className="ml-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
            title="切换到列表视图"
          >
            <LayoutList size={18} />
          </button>
        </div>

        {/* 看板 */}
        <div className="h-[calc(100vh-300px)] min-h-[400px]">
          <TodoKanban />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-4">
      {/* 项目侧边栏 */}
      <ProjectSidebar
        selectedProjectId={projectFilter}
        onSelectProject={setProjectFilter}
      />

      {/* 主内容区 */}
      <div className="flex-1 space-y-3">
        {/* 过滤卡片式 Tab 栏 */}
        <div className="flex items-center gap-2">
          {FILTERS.map(f => {
            const isActive = filter === f.value
            const count = f.value === 'today' ? stats.today :
                         f.value === 'pending' ? stats.pending :
                         f.value === 'completed' ? stats.completed :
                         f.value === 'archived' ? stats.archived :
                         stats.total
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontWeight: isActive ? 500 : 400,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {f.label}
                <span className="text-xs px-1.5 py-px rounded-full"
                  style={{
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)',
                  }}>
                  {count}
                </span>
              </button>
            )
          })}
          <div className="flex-1" />
          {completedCount > 0 && filter !== 'archived' && (
            <button
              onClick={clearCompleted}
              className="text-[11px] px-2 py-1.5 rounded-lg transition-colors"
              style={{ color: 'rgba(255,100,80,0.8)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,69,58,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              清理
            </button>
          )}
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title={viewMode === 'list' ? '看板视图' : '列表视图'}
          >
            {viewMode === 'list' ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && setSearchQuery('')}
            placeholder="搜索待办..."
            className="w-full pl-9 pr-8 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white outline-none placeholder-white/30 focus:border-white/20 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 输入框 */}
        {filter !== 'archived' && <TodoInput />}

        {/* 待办列表 */}
        {filteredTodos.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-sm">
            {searchQuery ? (
              <>🔍 未找到匹配 "{searchQuery}" 的待办</>
            ) : (
              <>
                {filter === 'today' && '📝 今天还没有待办'}
                {filter === 'pending' && '✨ 所有待办都已完成'}
                {filter === 'completed' && '还没有完成过待办'}
                {filter === 'archived' && '📦 还没有归档的任务'}
                {filter === 'all' && '📋 还没有添加待办，点击上方按钮开始'}
              </>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTodos.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {filteredTodos.map(todo => (
                  <DraggableTodoItem key={todo.id} todo={todo} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="px-3 py-2.5 rounded-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
      <div className="text-xs text-white/50 mt-0.5">{label}</div>
    </div>
  )
}
