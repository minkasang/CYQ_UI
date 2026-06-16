// 待办输入框
// 给 AI 的话：快速添加待办，支持分类、优先级

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import type { TodoCategory, TodoPriority } from '../../types'
import { useTodoStore, CATEGORY_LABELS, PRIORITY_LABELS } from '../../store/useTodoStore'

export function TodoInput() {
  const [expanded, setExpanded] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<TodoCategory>('work')
  const [priority, setPriority] = useState<TodoPriority>('medium')
  const [dueDate, setDueDate] = useState('')

  const addTodo = useTodoStore(s => s.addTodo)

  const handleSubmit = () => {
    if (!title.trim()) return
    addTodo({
      title: title.trim(),
      category,
      priority,
      dueDate: dueDate || undefined,
    })
    setTitle('')
    setDueDate('')
    setExpanded(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      setExpanded(false)
    }
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 border-dashed text-white/70 text-sm transition"
        style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      >
        <Plus size={16} /> 添加待办事项
      </button>
    )
  }

  return (
    <div
      className="p-3 rounded-xl border border-white/15 space-y-2"
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="要做的事情..."
          className="flex-1 bg-transparent text-sm text-white placeholder-white/40 outline-none"
        />
        <button
          onClick={() => setExpanded(false)}
          className="p-1 rounded hover:bg-white/10 text-white/60"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {/* 分类 */}
        <div className="flex gap-1">
          {(Object.keys(CATEGORY_LABELS) as TodoCategory[]).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-[10px] px-2 py-0.5 rounded transition ${
                category === cat
                  ? 'bg-blue-500/40 text-white border border-blue-400/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="w-px h-3 bg-white/15" />

        {/* 优先级 */}
        <div className="flex gap-1">
          {(Object.keys(PRIORITY_LABELS) as TodoPriority[]).map(p => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`text-[10px] px-2 py-0.5 rounded transition ${
                priority === p
                  ? p === 'high' ? 'bg-red-500/40 text-white border border-red-400/50'
                    : p === 'medium' ? 'bg-yellow-500/40 text-white border border-yellow-400/50'
                    : 'bg-green-500/40 text-white border border-green-400/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }`}
            >
              {PRIORITY_LABELS[p]}
            </button>
          ))}
        </div>

        <div className="w-px h-3 bg-white/15" />

        {/* 截止日期 */}
        <input
          type="date"
          value={dueDate}
          onChange={e => setDueDate(e.target.value)}
          className="text-[10px] bg-white/5 text-white/80 px-2 py-0.5 rounded border border-white/10 outline-none"
        />

        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="ml-auto text-xs px-3 py-1 rounded bg-blue-500/40 hover:bg-blue-500/60 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          添加
        </button>
      </div>
    </div>
  )
}
