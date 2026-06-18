// 子任务编辑器
// 负责子任务的增删改

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { SubTask } from '../../types'

interface SubtaskEditorProps {
  subtasks: SubTask[]
  onToggle: (subtaskId: string) => void
  onDelete: (subtaskId: string) => void
  onAdd: (title: string) => void
}

export function SubtaskEditor({ subtasks, onToggle, onDelete, onAdd }: SubtaskEditorProps) {
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = () => {
    if (newTitle.trim()) {
      onAdd(newTitle.trim())
      setNewTitle('')
    }
  }

  const progress = subtasks.length > 0
    ? `${subtasks.filter(s => s.completed).length}/${subtasks.length}`
    : null

  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">
        子任务 {progress && <span className="text-white/40">({progress})</span>}
      </label>

      {/* 添加子任务 */}
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-blue-400/50"
          placeholder="添加子任务..."
        />
        <button
          onClick={handleAdd}
          disabled={!newTitle.trim()}
          className="px-3 py-1.5 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-white text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* 子任务列表 */}
      <div className="space-y-1">
        {subtasks.map(subtask => (
          <div
            key={subtask.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/5"
          >
            <button
              onClick={() => onToggle(subtask.id)}
              className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                subtask.completed
                  ? 'bg-blue-500 border-blue-500 text-white'
                  : 'border-white/30 hover:border-white/50'
              }`}
            >
              {subtask.completed && <span className="text-[10px]">✓</span>}
            </button>
            <span className={`flex-1 text-xs ${subtask.completed ? 'line-through text-white/40' : 'text-white/80'}`}>
              {subtask.title}
            </span>
            <button
              onClick={() => onDelete(subtask.id)}
              className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-300 transition"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
