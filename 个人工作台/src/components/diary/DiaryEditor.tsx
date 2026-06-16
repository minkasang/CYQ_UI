// 日记编辑器
// 给 AI 的话：左编辑右预览，支持 Markdown

import { useState, useEffect, useRef } from 'react'
import { X, FileText, Eye } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useDiaryStore } from '../../store/useDiaryStore'

export function DiaryEditor() {
  const currentId = useDiaryStore(s => s.currentId)
  const diaries = useDiaryStore(s => s.diaries)
  const updateDiary = useDiaryStore(s => s.updateDiary)
  const setCurrent = useDiaryStore(s => s.setCurrent)

  const diary = diaries.find(d => d.id === currentId)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [saved, setSaved] = useState(false)
  const saveTimerRef = useRef<number | null>(null)

  // 当切换日记时，同步本地状态
  useEffect(() => {
    if (diary) {
      setTitle(diary.title)
      setContent(diary.content)
    }
  }, [diary?.id])

  // 自动保存（防抖）
  useEffect(() => {
    if (!diary) return
    if (title === diary.title && content === diary.content) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = window.setTimeout(() => {
      updateDiary(diary.id, { title, content })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 800)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [title, content, diary?.id])

  if (!diary) {
    return (
      <div className="h-full flex items-center justify-center text-white/40 text-sm">
        ← 从左侧选择一篇日记，或点击"写一篇新日记"
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-3">
      {/* 标题栏 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="日记标题..."
          className="flex-1 bg-transparent text-lg font-semibold text-white outline-none placeholder-white/30"
        />
        <span className={`text-xs transition ${saved ? 'text-green-300' : 'text-white/0'}`}>
          ✓ 已保存
        </span>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`text-xs px-3 py-1.5 rounded-lg transition ${
            showPreview ? 'bg-white/15 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
          title="切换预览"
        >
          {showPreview ? <><FileText size={12} className="inline mr-1" />编辑</> : <><Eye size={12} className="inline mr-1" />预览</>}
        </button>
        <button
          onClick={() => setCurrent(null)}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition"
          title="关闭"
        >
          <X size={12} />
        </button>
      </div>

      {/* 编辑 + 预览 */}
      <div className={`flex-1 grid gap-3 ${showPreview ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* 编辑器 */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`# ${diary.date}\n\n今天发生了...\n\n## 学到了什么\n\n## 明天要做什么\n`}
          className="w-full h-full p-4 rounded-xl bg-white/5 text-sm text-white/90 outline-none resize-none font-mono leading-relaxed placeholder-white/30 border border-white/10"
          style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            minHeight: '400px',
          }}
        />

        {/* 预览 */}
        {showPreview && (
          <div
            className="h-full p-4 rounded-xl bg-white/5 border border-white/10 overflow-auto prose prose-invert prose-sm max-w-none"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              minHeight: '400px',
            }}
          >
            {content.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            ) : (
              <p className="text-white/30 text-sm">预览区域</p>
            )}
          </div>
        )}
      </div>

      <p className="text-[10px] text-white/40">
        💡 支持 Markdown：# 标题、**粗体**、*斜体*、`代码`、- 列表、&gt; 引用等
      </p>
    </div>
  )
}
