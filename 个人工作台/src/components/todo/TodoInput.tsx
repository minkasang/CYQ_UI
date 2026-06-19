// 待办快速输入 — macOS 风格
// 规范：共享执行规则文件/模块UI设计/todo-design.md §7

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
    addTodo({ title: title.trim(), category, priority, dueDate: dueDate || undefined })
    setTitle(''); setDueDate(''); setExpanded(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
    else if (e.key === 'Escape') { setExpanded(false) }
  }

  // 折叠态
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-2 px-4 h-[36px] rounded-lg transition-colors text-[13px]"
        style={{
          background: 'rgba(255,255,255,0.05)',
          color: 'rgba(255,255,255,0.4)',
          border: '0.5px solid rgba(255,255,255,0.06)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
          e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
        }}
      >
        <Plus size={16} /> 添加待办
      </button>
    )
  }

  // 展开态
  return (
    <div className="p-3 rounded-lg space-y-2" style={{
      background: 'rgba(255,255,255,0.06)',
      border: '0.5px solid rgba(255,255,255,0.1)',
    }}>
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入待办标题..."
        className="w-full bg-transparent text-[13px] text-white outline-none placeholder-white/30"
        style={{ fontFamily: 'inherit' }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        {/* 分类 */}
        <select value={category} onChange={e => setCategory(e.target.value as TodoCategory)}
          className="text-[11px] px-2 py-1 rounded bg-white/5 text-white/60 border-0 outline-none"
          style={{ fontFamily: 'inherit' }}>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k} style={{ background: '#1C1C1E' }}>{v}</option>
          ))}
        </select>

        {/* 优先级 */}
        <select value={priority} onChange={e => setPriority(e.target.value as TodoPriority)}
          className="text-[11px] px-2 py-1 rounded bg-white/5 text-white/60 border-0 outline-none"
          style={{ fontFamily: 'inherit' }}>
          {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
            <option key={k} value={k} style={{ background: '#1C1C1E' }}>{v}</option>
          ))}
        </select>

        {/* 截止日期 */}
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
          className="text-[11px] px-2 py-1 rounded bg-white/5 text-white/60 border-0 outline-none"
          style={{ fontFamily: 'inherit', colorScheme: 'dark' }} />

        <div className="flex-1" />
        <button onClick={handleSubmit}
          className="text-[11px] px-3 py-1 rounded font-medium transition-colors"
          style={{ background: '#0A84FF', color: '#fff' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#0077ED' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0A84FF' }}>
          添加
        </button>
      </div>
    </div>
  )
}
