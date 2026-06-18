// 任务编辑弹窗
// 支持编辑任务的所有字段

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Todo, TodoCategory, TodoPriority, RepeatConfig, ReminderConfig } from '../../types'
import { useTodoStore, CATEGORY_LABELS, PRIORITY_LABELS } from '../../store/useTodoStore'
import { useProjectStore } from '../../store/useProjectStore'
import { useTagStore } from '../../store/useTagStore'
import { GlassPanel } from '../glass/GlassPanel'
import { SubtaskEditor } from './SubtaskEditor'
import { TagSelector } from './TagSelector'
import { RepeatConfigEditor } from './RepeatConfigEditor'
import { TimeTracker } from './TimeTracker'
import { ReminderEditor } from './ReminderEditor'
import { DependencySelector } from './DependencySelector'

interface TodoEditModalProps {
  todo: Todo
  onClose: () => void
}

export function TodoEditModal({ todo, onClose }: TodoEditModalProps) {
  const updateTodo = useTodoStore(s => s.updateTodo)
  const addSubTask = useTodoStore(s => s.addSubTask)
  const toggleSubTask = useTodoStore(s => s.toggleSubTask)
  const deleteSubTask = useTodoStore(s => s.deleteSubTask)
  const addTag = useTodoStore(s => s.addTag)
  const removeTag = useTodoStore(s => s.removeTag)
  const startTimeEntry = useTodoStore(s => s.startTimeEntry)
  const stopTimeEntry = useTodoStore(s => s.stopTimeEntry)

  const projects = useProjectStore(s => s.projects)
  const tags = useTagStore(s => s.tags)
  const allTodos = useTodoStore(s => s.todos)

  // 表单状态
  const [title, setTitle] = useState(todo.title)
  const [content, setContent] = useState(todo.content || '')
  const [category, setCategory] = useState<TodoCategory>(todo.category)
  const [priority, setPriority] = useState<TodoPriority>(todo.priority)
  const [dueDate, setDueDate] = useState(todo.dueDate || '')
  const [projectId, setProjectId] = useState(todo.projectId || '')
  const [repeat, setRepeat] = useState<RepeatConfig | undefined>(todo.repeat)
  const [reminder, setReminder] = useState<ReminderConfig | undefined>(todo.reminder)
  const [dependsOn, setDependsOn] = useState<string[]>(todo.dependsOn || [])
  const [error, setError] = useState('')

  // 保存
  const handleSave = () => {
    // 输入校验
    if (!title.trim()) {
      setError('任务标题不能为空')
      return
    }

    updateTodo(todo.id, {
      title: title.trim(),
      content: content.trim() || undefined,
      category,
      priority,
      dueDate: dueDate || undefined,
      projectId: projectId || undefined,
      repeat,
      reminder,
      dependsOn,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <GlassPanel
        cornerRadius={16}
        padding="24px"
        className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto"
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">编辑任务</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* 表单 */}
        <div className="space-y-4">
          {/* 标题 */}
          <div>
            <label className="text-xs text-white/60 mb-1 block">任务标题 *</label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); setError('') }}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-400/50"
              placeholder="输入任务标题"
            />
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          {/* 内容 */}
          <div>
            <label className="text-xs text-white/60 mb-1 block">详细内容</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-400/50 resize-none"
              placeholder="添加详细描述..."
            />
          </div>

          {/* 分类和优先级 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60 mb-1 block">分类</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TodoCategory)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-400/50"
              >
                {(Object.keys(CATEGORY_LABELS) as TodoCategory[]).map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">优先级</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as TodoPriority)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-400/50"
              >
                {(Object.keys(PRIORITY_LABELS) as TodoPriority[]).map(p => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 截止日期和项目 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60 mb-1 block">截止日期</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-400/50"
              />
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">所属项目</label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-400/50"
              >
                <option value="">无</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 提醒设置 */}
          <div>
            <label className="text-xs text-white/60 mb-1 block">提醒</label>
            <ReminderEditor
              value={reminder}
              dueDate={dueDate}
              onChange={setReminder}
            />
          </div>

          {/* 标签选择器 */}
          <TagSelector
            allTags={tags}
            selectedTagIds={todo.tags}
            onToggle={tagId => {
              if (todo.tags.includes(tagId)) {
                removeTag(todo.id, tagId)
              } else {
                addTag(todo.id, tagId)
              }
            }}
          />

          {/* 子任务编辑器 */}
          <SubtaskEditor
            subtasks={todo.subtasks}
            onToggle={subtaskId => toggleSubTask(todo.id, subtaskId)}
            onDelete={subtaskId => deleteSubTask(todo.id, subtaskId)}
            onAdd={title => addSubTask(todo.id, title)}
          />

          {/* 重复任务配置 */}
          <RepeatConfigEditor
            value={repeat}
            onChange={setRepeat}
          />

          {/* 任务依赖 */}
          <DependencySelector
            currentTodoId={todo.id}
            dependsOn={dependsOn}
            allTodos={allTodos}
            onChange={setDependsOn}
          />

          {/* 时间追踪 */}
          <div>
            <label className="text-xs text-white/60 mb-2 block">时间追踪</label>
            <TimeTracker
              todo={todo}
              onStart={() => startTimeEntry(todo.id)}
              onStop={() => stopTimeEntry(todo.id)}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-2 rounded-lg bg-blue-500/40 hover:bg-blue-500/60 text-white text-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            保存
          </button>
        </div>
      </GlassPanel>
    </div>
  )
}
