// 待办管理页面
// 给 AI 的话：引用现有组件，确保不破坏现有功能

import { TodoList } from '../../../components/todo/TodoList'
import { useLiquidGlass } from '../../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../../store/useWallpaperStore'
import { useTodoStore } from '../../../store/useTodoStore'
import { useEffect } from 'react'

export function TodoPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)
  const loadTodos = useTodoStore(s => s.loadTodos)

  // 加载待办数据
  useEffect(() => {
    loadTodos()
  }, [loadTodos])

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">每日待办</h1>
      <p className="text-sm text-white/60 mb-4">
        管理工作与生活的任务清单
      </p>
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-5">
        <TodoList />
      </div>
    </div>
  )
}
