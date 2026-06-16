// 日记列表
// 给 AI 的话：按日期分组展示所有日记

import { useDiaryStore, selectSortedDiaries } from '../../store/useDiaryStore'
import { useState } from 'react'
import { Plus, Trash2, BookOpen } from 'lucide-react'
import { relativeTime } from '../../utils/date'

export function DiaryList() {
  const diaries = useDiaryStore(selectSortedDiaries)
  const currentId = useDiaryStore(s => s.currentId)
  const setCurrent = useDiaryStore(s => s.setCurrent)
  const createDiary = useDiaryStore(s => s.createDiary)
  const deleteDiary = useDiaryStore(s => s.deleteDiary)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const handleCreate = () => {
    const diary = createDiary()
    setCurrent(diary.id)
  }

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      deleteDiary(id)
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }

  return (
    <div className="space-y-3">
      {/* 新建按钮 */}
      <button
        onClick={handleCreate}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 border-dashed text-white/70 text-sm transition"
        style={{ backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      >
        <Plus size={16} /> 写一篇新日记
      </button>

      {/* 列表 */}
      {diaries.length === 0 ? (
        <div className="text-center py-12 text-white/40 text-sm">
          📔 还没有日记，开始记录你的思考和感悟
        </div>
      ) : (
        <div className="space-y-1.5">
          {diaries.map(diary => {
            const isActive = diary.id === currentId
            const isConfirming = confirmDeleteId === diary.id
            return (
              <div
                key={diary.id}
                onClick={() => setCurrent(diary.id)}
                className={`group flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer transition ${
                  isActive
                    ? 'bg-white/15 border border-white/20'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <BookOpen size={16} className="text-white/50 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white/90 truncate">{diary.title}</div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-white/50">
                    <span>{diary.date}</span>
                    <span>·</span>
                    <span>{relativeTime(diary.updatedAt)}</span>
                    <span>·</span>
                    <span>{diary.content.length} 字</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(diary.id)
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1.5 rounded text-xs transition ${
                    isConfirming
                      ? 'opacity-100 bg-red-500/30 text-red-200'
                      : 'hover:bg-red-500/20 text-white/50 hover:text-red-300'
                  }`}
                  title={isConfirming ? '再点一次确认删除' : '删除'}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
