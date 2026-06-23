// 日记编辑器
// 给 AI 的话：左编辑右预览，支持 Markdown，集成 AI 辅助功能

import { useState, useEffect, useRef } from 'react'
import { X, FileText, Eye, ChevronDown, ChevronUp, Brain, Save } from 'lucide-react'
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
  const [mood, setMood] = useState('')
  const [weather, setWeather] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(true)
  const [showMeta, setShowMeta] = useState(true)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const saveTimerRef = useRef<number | null>(null)

  // 当切换日记时，同步本地状态
  useEffect(() => {
    if (diary) {
      setTitle(diary.title)
      setContent(diary.content)
      setMood(diary.mood || '')
      setWeather(diary.weather || '')
      setTags(diary.tags || [])
    }
  }, [diary?.id])

  // 标记是否有未保存的修改
  useEffect(() => {
    if (!diary) return
    const metaDirty =
      mood !== (diary.mood || '') ||
      weather !== (diary.weather || '') ||
      JSON.stringify(tags) !== JSON.stringify(diary.tags || [])
    setDirty(title !== diary.title || content !== diary.content || metaDirty)
  }, [title, content, mood, weather, tags, diary?.title, diary?.content, diary?.mood, diary?.weather, diary?.tags])

  // 自动保存（5 秒安全网，主要靠用户手动保存）
  useEffect(() => {
    if (!diary) return
    // 所有字段都没变则跳过
    if (title === diary.title && content === diary.content &&
        mood === (diary.mood || '') && weather === (diary.weather || '') &&
        JSON.stringify(tags) === JSON.stringify(diary.tags || [])) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(async () => {
      updateDiary(diary.id, { title, content, mood, weather, tags })
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 2000)

      if (content.trim().length >= 20) {
        setAnalyzing(true)
        await analyzeDiaryEmotion(diary.id, content)
        setAnalyzing(false)
      }
    }, 5000) // 5 秒无操作自动保存（安全网）

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [title, content, diary?.id])

  // 手动保存
  const handleSave = () => {
    if (!diary) return
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    updateDiary(diary.id, { title, content, mood, weather, tags })
    setSaved(true)
    setDirty(false)
    setTimeout(() => setSaved(false), 2000)

    if (content.trim().length >= 20) {
      setAnalyzing(true)
      analyzeDiaryEmotion(diary.id, content).finally(() => setAnalyzing(false))
    }
  }

  // Ctrl+S 快捷键
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [title, content, diary?.id])

  // 更新元数据
  const handleMetaChange = (patch: { mood?: string; weather?: string; tags?: string[] }) => {
    if (patch.mood !== undefined) setMood(patch.mood)
    if (patch.weather !== undefined) setWeather(patch.weather)
    if (patch.tags !== undefined) setTags(patch.tags)
    // 不直接保存——标记 dirty，等用户手动保存
  }

  // AI 工具栏应用内容
  const handleAIApply = (newContent: string) => {
    setContent(newContent)
  }

  // 关闭前保存（避免自动保存 800ms 延迟导致内容丢失）
  const handleClose = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (diary && (title !== diary.title || content !== diary.content ||
        mood !== (diary.mood || '') || weather !== (diary.weather || '') ||
        JSON.stringify(tags) !== JSON.stringify(diary.tags || []))) {
      updateDiary(diary.id, { title, content, mood, weather, tags })
    }
    setDirty(false)
    setCurrent(null)
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
        {/* 保存状态 */}
        {dirty ? (
          <span className="text-xs text-amber-300 flex items-center gap-1 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> 未保存
          </span>
        ) : saved ? (
          <span className="text-xs text-green-300 whitespace-nowrap">✓ 已保存</span>
        ) : null}
        {analyzing && (
          <span className="text-xs text-blue-300 flex items-center gap-1 whitespace-nowrap">
            <Brain size={12} className="animate-pulse" /> 分析中...
          </span>
        )}
        {/* 保存按钮 */}
        <button
          onClick={handleSave}
          disabled={!dirty}
          className={`text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 ${
            dirty
              ? 'bg-blue-500/40 hover:bg-blue-500/60 text-white'
              : 'bg-white/5 text-white/30 cursor-not-allowed'
          }`}
          title="保存 (Ctrl+S)"
        >
          <Save size={12} /> 保存
        </button>
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
          onClick={handleClose}
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
            mood={mood}
            weather={weather}
            tags={tags}
            wordCount={diary.wordCount}
            onChange={handleMetaChange}
          />
        )}
      </div>

      <p className="text-xs text-white/40">
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
