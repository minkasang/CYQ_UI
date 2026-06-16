// 待办列表
// 给 AI 的话：展示过滤后的待办项，支持切换过滤条件

import { useTodoStore, selectFilteredTodos, selectTodoStats } from '../../store/useTodoStore'
import { TodoItem } from './TodoItem'
import { TodoInput } from './TodoInput'

type FilterType = 'all' | 'today' | 'pending' | 'completed'

const FILTERS: { value: FilterType; label: string }[] = [
  { value: 'today', label: '今天' },
  { value: 'pending', label: '待完成' },
  { value: 'completed', label: '已完成' },
  { value: 'all', label: '全部' },
]

export function TodoList() {
  const todos = useTodoStore(selectFilteredTodos)
  const filter = useTodoStore(s => s.filter)
  const setFilter = useTodoStore(s => s.setFilter)
  const stats = useTodoStore(selectTodoStats)
  const clearCompleted = useTodoStore(s => s.clearCompleted)

  const completedCount = todos.filter(t => t.completed).length

  return (
    <div className="space-y-3">
      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatCard label="今日待办" value={stats.today} color="text-blue-300" />
        <StatCard label="已完成" value={stats.completed} color="text-green-300" />
        <StatCard label="总待办" value={stats.total} color="text-white/80" />
      </div>

      {/* 过滤栏 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1 rounded-full transition ${
              filter === f.value
                ? 'bg-white/15 text-white border border-white/20'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
            }`}
          >
            {f.label}
          </button>
        ))}
        {completedCount > 0 && (
          <button
            onClick={clearCompleted}
            className="ml-auto text-xs px-3 py-1 rounded-full bg-red-500/15 text-red-200 hover:bg-red-500/25 transition"
          >
            清理已完成
          </button>
        )}
      </div>

      {/* 输入框 */}
      <TodoInput />

      {/* 待办列表 */}
      {todos.length === 0 ? (
        <div className="text-center py-12 text-white/40 text-sm">
          {filter === 'today' && '📝 今天还没有待办'}
          {filter === 'pending' && '✨ 所有待办都已完成'}
          {filter === 'completed' && '还没有完成过待办'}
          {filter === 'all' && '📋 还没有添加待办，点击上方按钮开始'}
        </div>
      ) : (
        <div className="space-y-1">
          {todos.map(todo => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}
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
      <div className="text-[10px] text-white/50 mt-0.5">{label}</div>
    </div>
  )
}
