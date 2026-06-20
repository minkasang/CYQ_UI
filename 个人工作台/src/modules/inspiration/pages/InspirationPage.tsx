// 每日灵感页面 — 随机回顾卡片 + 快速捕获 + 列表浏览

import { useState, useCallback, useEffect } from 'react'
import { useInspirationStore } from '../../../store/useInspirationStore'
import { Heart, RefreshCw, Star, Plus, ChevronDown, ChevronUp } from 'lucide-react'
import type { InspirationItem } from '../../../types'

export function InspirationPage() {
  const items = useInspirationStore(s => s.items)
  const add = useInspirationStore(s => s.add)
  const toggleFavorite = useInspirationStore(s => s.toggleFavorite)
  const setImpact = useInspirationStore(s => s.setImpact)
  const markReviewed = useInspirationStore(s => s.markReviewed)
  const getNextReview = useInspirationStore(s => s.getNextReview)

  const [current, setCurrent] = useState<InspirationItem | null>(null)
  const [showCapture, setShowCapture] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 表单状态
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [tags, setTags] = useState('')
  const [reflection, setReflection] = useState('')

  // 初始化：选一条展示
  useEffect(() => {
    if (!current && items.length > 0) {
      setCurrent(getNextReview())
    }
  }, [items, current, getNextReview])

  // 空状态
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="text-5xl mb-6">💡</div>
        <h2 className="text-xl font-semibold text-white mb-2">记下第一句触动你的话</h2>
        <p className="text-sm text-white/50 mb-8">
          一句好话就像一盏灯，别让它熄灭在记忆里。
        </p>
        <button
          onClick={() => setShowCapture(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm transition"
        >
          <Plus size={16} /> 写下第一句
        </button>

        {showCapture && (
          <div className="mt-8 text-left">
            <CaptureForm
              content={content} setContent={setContent}
              source={source} setSource={setSource}
              tags={tags} setTags={setTags}
              reflection={reflection} setReflection={setReflection}
              onSubmit={() => {
                if (!content.trim()) return
                const item = add({ content, source: source || undefined, tags: tags ? tags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : undefined, reflection: reflection || undefined })
                setContent(''); setSource(''); setTags(''); setReflection('')
                setShowCapture(false)
                setCurrent(item)
              }}
              onCancel={() => setShowCapture(false)}
            />
          </div>
        )}
      </div>
    )
  }

  // 换一条
  const handleNext = useCallback(() => {
    if (current) markReviewed(current.id)
    const next = getNextReview()
    setCurrent(next)
  }, [current, markReviewed, getNextReview])

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-10">
      {/* ====== 随机回顾卡片 ====== */}
      {current && (
        <div className="text-center">
          <ReviewCard
            item={current}
            onFavorite={() => toggleFavorite(current.id)}
            onImpact={(v) => setImpact(current.id, v)}
            onNext={handleNext}
          />
        </div>
      )}

      {/* ====== 快速捕获 ====== */}
      <div className="rounded-xl bg-white/[.06] backdrop-blur-[10px] border border-white/10 p-5">
        {showCapture ? (
          <CaptureForm
            content={content} setContent={setContent}
            source={source} setSource={setSource}
            tags={tags} setTags={setTags}
            reflection={reflection} setReflection={setReflection}
            onSubmit={() => {
              if (!content.trim()) return
              add({ content, source: source || undefined, tags: tags ? tags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : undefined, reflection: reflection || undefined })
              setContent(''); setSource(''); setTags(''); setReflection('')
              setShowCapture(false)
            }}
            onCancel={() => setShowCapture(false)}
          />
        ) : (
          <button
            onClick={() => setShowCapture(true)}
            className="w-full py-3 rounded-lg border border-dashed border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={16} /> 记下一句触动你的话
          </button>
        )}
      </div>

      {/* ====== 列表浏览 ====== */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider">
          全部记录 · {items.length}
        </h3>
        {items.map(item => (
          <ListItem
            key={item.id}
            item={item}
            isExpanded={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onFavorite={() => toggleFavorite(item.id)}
            onImpact={(v) => setImpact(item.id, v)}
          />
        ))}
      </div>
    </div>
  )
}

// ====== 随机回顾卡片（Readwise 风格） ======
function ReviewCard({ item, onFavorite, onImpact, onNext }: {
  item: InspirationItem
  onFavorite: () => void
  onImpact: (v: number) => void
  onNext: () => void
}) {
  return (
    <div className="rounded-2xl bg-white/[.06] backdrop-blur-[10px] border border-white/10 shadow-card px-8 py-10">
      {/* 内容 — 大字、居中、留白 */}
      <blockquote className="text-xl leading-relaxed text-white/90 mb-6 font-medium tracking-wide">
        「{item.content}」
      </blockquote>

      {/* 来源 */}
      {item.source && (
        <p className="text-sm text-white/50 mb-4">— {item.source}</p>
      )}

      {/* 标签 */}
      {item.tags.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mb-6">
          {item.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded text-[10px] bg-white/5 text-white/40">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* 感想 */}
      {item.reflection && (
        <p className="text-xs text-white/40 italic mb-6 max-w-md mx-auto leading-relaxed">
          {item.reflection}
        </p>
      )}

      {/* 操作栏 */}
      <div className="flex items-center justify-center gap-4">
        {/* 触动程度 */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3].map(star => (
            <button
              key={star}
              onClick={() => onImpact(star)}
              className="transition-colors"
              title={`触动 ${star} 星`}
            >
              <Star
                size={16}
                className={star <= item.impact ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}
              />
            </button>
          ))}
        </div>

        {/* 收藏 */}
        <button
          onClick={onFavorite}
          className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
          title={item.isFavorite ? '取消收藏' : '收藏'}
        >
          <Heart
            size={16}
            className={item.isFavorite ? 'text-red-400 fill-red-400' : 'text-white/30'}
          />
        </button>

        {/* 换一条 */}
        <button
          onClick={onNext}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 text-xs transition"
        >
          <RefreshCw size={13} /> 换一条
        </button>
      </div>
    </div>
  )
}

// ====== 捕获表单 ======
function CaptureForm({ content, setContent, source, setSource, tags, setTags, reflection, setReflection, onSubmit, onCancel }: {
  content: string; setContent: (v: string) => void
  source: string; setSource: (v: string) => void
  tags: string; setTags: (v: string) => void
  reflection: string; setReflection: (v: string) => void
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="写下那句触动你的话…"
        rows={2}
        autoFocus
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-[#0A84FF] transition-colors resize-none"
        onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey && content.trim()) {
            e.preventDefault(); onSubmit()
          }
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={source}
          onChange={e => setSource(e.target.value)}
          placeholder="来源（谁说的/哪看到的）"
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 outline-none focus:border-[#0A84FF] transition-colors"
        />
        <input
          value={tags}
          onChange={e => setTags(e.target.value)}
          placeholder="标签（逗号分隔，如：哲学,励志）"
          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 outline-none focus:border-[#0A84FF] transition-colors"
        />
      </div>
      <textarea
        value={reflection}
        onChange={e => setReflection(e.target.value)}
        placeholder="我的感想（可选）"
        rows={2}
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs placeholder-white/30 outline-none focus:border-[#0A84FF] transition-colors resize-none"
      />
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-xs text-white/40 hover:text-white/60 transition">
          取消
        </button>
        <button
          onClick={onSubmit}
          disabled={!content.trim()}
          className="px-4 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0077ED] text-white text-xs font-medium transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          保存
        </button>
      </div>
    </div>
  )
}

// ====== 列表项 ======
function ListItem({ item, isExpanded, onToggle, onFavorite, onImpact }: {
  item: InspirationItem
  isExpanded: boolean
  onToggle: () => void
  onFavorite: () => void
  onImpact: (v: number) => void
}) {
  const maxLen = 60
  const summary = item.content.length > maxLen ? item.content.slice(0, maxLen) + '…' : item.content

  return (
    <div className="rounded-xl bg-white/[.04] border border-white/5 overflow-hidden transition hover:bg-white/[.06]">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/80 truncate">{summary}</p>
          <div className="flex items-center gap-2 mt-1">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] text-white/30">#{tag}</span>
            ))}
            <div className="flex gap-0.5 ml-1">
              {[1, 2, 3].map(s => (
                <Star key={s} size={9} className={s <= item.impact ? 'text-yellow-400/70 fill-yellow-400/70' : 'text-white/10'} />
              ))}
            </div>
          </div>
        </div>
        {item.isFavorite && <Heart size={12} className="text-red-400 fill-red-400 flex-shrink-0" />}
        {isExpanded ? <ChevronUp size={14} className="text-white/30 flex-shrink-0" /> : <ChevronDown size={14} className="text-white/30 flex-shrink-0" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
          <p className="text-sm text-white/70 leading-relaxed">{item.content}</p>
          {item.source && <p className="text-xs text-white/40">— {item.source}</p>}
          {item.reflection && (
            <div className="text-xs text-white/40 italic leading-relaxed border-l-2 border-white/10 pl-3">
              {item.reflection}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3].map(star => (
                <button key={star} onClick={() => onImpact(star)}>
                  <Star size={14} className={star <= item.impact ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} />
                </button>
              ))}
            </div>
            <button onClick={onFavorite}>
              <Heart size={14} className={item.isFavorite ? 'text-red-400 fill-red-400' : 'text-white/20'} />
            </button>
            <span className="text-[10px] text-white/20 ml-auto">
              {new Date(item.createdAt).toLocaleDateString('zh-CN')}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
