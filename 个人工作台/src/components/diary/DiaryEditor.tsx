// 日记编辑器
// 给 AI 的话：左编辑右预览，支持 Markdown，集成 AI 辅助功能

import { useState, useEffect, useRef } from 'react'
import { X, FileText, Eye, ChevronDown, ChevronUp, Brain } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useDiaryStore } from '../../store/useDiaryStore'
import { useEmotionAnalysis } from '../../hooks/useEmotionAnalysis'
import { DiaryToolbar } from './DiaryToolbar'
import { DiaryMeta } from './DiaryMeta'
import { DiaryFeedback } from './DiaryFeedback'
import { DiaryChat } from './DiaryChat'
import type { EmotionData } from '../../types'

// 情绪类型中文映射
const EMOTION_LABELS: Record<string, string> = {
  happy: '开心',
  calm: '平静',
  anxious: '焦虑',
  sad: '悲伤',
  angry: '愤怒',
  neutral: '中性',
  excited: '兴奋',
}

// 情绪颜色映射
const EMOTION_COLORS: Record<string, string> = {
  happy: 'text-yellow-300',
  calm: 'text-blue-300',
  anxious: 'text-orange-300',
  sad: 'text-blue-400',
  angry: 'text-red-300',
  neutral: 'text-gray-300',
  excited: 'text-pink-300',
}

export function DiaryEditor() {
  const currentId = useDiaryStore(s => s.currentId)
  const diaries = useDiaryStore(s => s.diaries)
  const updateDiary = useDiaryStore(s => s.updateDiary)
  const setCurrent = useDiaryStore(s => s.setCurrent)
  const { analyzeDiaryEmotion } = useEmotionAnalysis()

  const diary = diaries.find(d => d.id === currentId)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [showMeta, setShowMeta] = useState(true)
  const [saved, setSaved] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
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
    saveTimerRef.current = window.setTimeout(async () => {
      updateDiary(diary.id, { title, content })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)

      // 自动分析情绪（如果启用且有足够内容）
      if (content.trim().length >= 20) {
        setAnalyzing(true)
        await analyzeDiaryEmotion(diary.id, content)
        setAnalyzing(false)
      }
    }, 800)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [title, content, diary?.id])

  // 更新元数据
  const handleMetaChange = (patch: { mood?: string; weather?: string; tags?: string[] }) => {
    if (!diary) return
    updateDiary(diary.id, patch)
  }

  // AI 工具栏应用内容
  const handleAIApply = (newContent: string) => {
    setContent(newContent)
  }

  // 渲染情绪分析结果
  const renderEmotionData = (emotionData: EmotionData) => {
    const label = EMOTION_LABELS[emotionData.type] || emotionData.type
    const colorClass = EMOTION_COLORS[emotionData.type] || 'text-white/70'

    return (
      <div className="flex items-center gap-2 text-xs">
        <Brain size={12} className={colorClass} />
        <span className={colorClass}>AI 分析：{label}</span>
        <span className="text-white/40">强度 {emotionData.intensity}/5</span>
        {emotionData.keywords.length > 0 && (
          <span className="text-white/30">
            关键词：{emotionData.keywords.slice(0, 3).join('、')}
          </span>
        )}
      </div>
    )
  }

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
        {analyzing && (
          <span className="text-xs text-blue-300 flex items-center gap-1">
            <Brain size={12} className="animate-pulse" /> 分析中...
          </span>
        )}
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

      {/* AI 工具栏 */}
      <DiaryToolbar content={content} onApply={handleAIApply} />

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
            minHeight: '300px',
          }}
        />

        {/* 预览 */}
        {showPreview && (
          <div
            className="h-full p-4 rounded-xl bg-white/5 border border-white/10 overflow-auto prose prose-invert prose-sm max-w-none"
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              minHeight: '300px',
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

      {/* 元数据区域（可折叠） */}
      <div className="border-t border-white/10 pt-3">
        {/* 情绪分析结果 */}
        {diary.emotionData && renderEmotionData(diary.emotionData)}

        <button
          onClick={() => setShowMeta(!showMeta)}
          className="flex items-center gap-1 text-xs text-white/60 hover:text-white/80 transition mt-2 mb-3"
        >
          {showMeta ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showMeta ? '收起元数据' : '展开元数据'}
        </button>

        {showMeta && (
          <DiaryMeta
            mood={diary.mood}
            weather={diary.weather}
            tags={diary.tags}
            wordCount={diary.wordCount}
            onChange={handleMetaChange}
          />
        )}
      </div>

      <p className="text-[10px] text-white/40">
        💡 支持 Markdown：# 标题、**粗体**、*斜体*、`代码`、- 列表、&gt; 引用等
      </p>

      {/* AI 反馈 */}
      {content.trim().length >= 20 && (
        <DiaryFeedback
          diaryId={diary.id}
          content={content}
          savedFeedback={diary.aiFeedback}
        />
      )}

      {/* 日记对话 */}
      {content.trim().length >= 20 && (
        <DiaryChat
          diaryContent={content}
          diaryTitle={title}
          diaryDate={diary.date}
        />
      )}
    </div>
  )
}
