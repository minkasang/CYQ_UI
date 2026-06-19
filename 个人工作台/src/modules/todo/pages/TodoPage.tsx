// 待办管理页面 — macOS 设计语言
// 规范：共享执行规则文件/模块UI设计/todo-design.md

import { TodoList } from '../../../components/todo/TodoList'
import { useLiquidGlass } from '../../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../../store/useWallpaperStore'
import { useTodoStore, selectTodoStats } from '../../../store/useTodoStore'
import { useEffect } from 'react'

export function TodoPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)
  const loadTodos = useTodoStore(s => s.loadTodos)
  const stats = useTodoStore(selectTodoStats)
  const highPriority = useTodoStore(s => s.todos.filter(t => t.priority === 'high' && !t.completed).length)

  useEffect(() => { loadTodos() }, [loadTodos])

  return (
    <div className="max-w-3xl mx-auto">
      {/* 页面标题 */}
      <h1 className="text-[26px] font-bold text-white mb-1">✅ 每日待办</h1>

      {/* 统计摘要 */}
      <div className="flex items-center gap-3 mb-6 text-xs text-white/50">
        <span>{stats.pending} 项待完成</span>
        <span className="text-white/20">·</span>
        <span>今天 {stats.today} 项</span>
        {highPriority > 0 && (
          <>
            <span className="text-white/20">·</span>
            <span style={{ color: '#FF453A' }}>🔴 高优先 {highPriority}</span>
          </>
        )}
      </div>

      {/* 待办列表（玻璃面板包裹） */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
        <TodoList />
      </div>
    </div>
  )
}
