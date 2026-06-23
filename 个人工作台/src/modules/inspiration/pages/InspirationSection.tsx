// 灵感模块首页 Section — v5：Magazine Spread 布局
// 左 Hero 卡 + 右紧凑列表卡，液态玻璃双面板
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useInspirationStore } from '../../../store/useInspirationStore'
import { Heart, RefreshCw, Star, Plus, Trash2, Pencil, Check, X, Search, ArrowRight } from 'lucide-react'
import type { LiquidGlassConfig } from '../../../lib/liquid-glass'
import { useInspirationTagStore } from '../../../store/useInspirationTagStore'

export function InspirationSection({ registerPanel }: {
  registerPanel: (el: HTMLElement | null, overrides?: Partial<LiquidGlassConfig>) => void
}) {
  const items = useInspirationStore(s => s.items)
  const add = useInspirationStore(s => s.add)
  const remove = useInspirationStore(s => s.remove)
  const update = useInspirationStore(s => s.update)
  const toggleFavorite = useInspirationStore(s => s.toggleFavorite)
  const setImpact = useInspirationStore(s => s.setImpact)
  const markReviewed = useInspirationStore(s => s.markReviewed)
  const getNextReview = useInspirationStore(s => s.getNextReview)

  const [current, setCurrent] = useState<typeof items[0] | null>(null)
  const [fading, setFading] = useState(false)
  const [showCapture, setShowCapture] = useState(false)
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSource, setEditSource] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editTagInput, setEditTagInput] = useState('')
  const [editReflection, setEditReflection] = useState('')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => { if (items.length > 0 && !current) setCurrent(getNextReview()) }, [items, current, getNextReview])

  // 同步已有标签到 tag store
  const ensureTag = useInspirationTagStore(s => s.ensure)
  useEffect(() => {
    items.forEach(item => item.tags.forEach(tag => ensureTag(tag)))
  }, [items.length])

  const allTags = useMemo(() => { const s = new Set<string>(); items.forEach(i => i.tags.forEach(t => s.add(t))); return Array.from(s).sort() }, [items])

  const filteredItems = useMemo(() => {
    let list = [...items]
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter(i => i.content.toLowerCase().includes(q) || i.source?.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))) }
    return list.sort((a, b) => b.createdAt - a.createdAt)
  }, [items, search])

  const recentItems = filteredItems.slice(0, showAll ? undefined : 5)

  const handleNext = useCallback(() => {
    setFading(true); setTimeout(() => { if (current) markReviewed(current.id); setCurrent(getNextReview()); setFading(false) }, 200)
  }, [current, markReviewed, getNextReview])

  const handleAdd = () => {
    if (!content.trim()) return
    const item = add({ content, source: source || undefined, tags: tags })
    setContent(''); setSource(''); setTags([]); setTagInput(''); setShowCapture(false); setCurrent(item)
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) { setTags([...tags, t]); setTagInput('') }
  }

  const removeTag = (t: string) => { setTags(tags.filter(x => x !== t)) }

  const startEdit = (item: typeof items[0]) => { setEditingId(item.id); setEditContent(item.content); setEditSource(item.source || ''); setEditTags(item.tags); setEditTagInput(''); setEditReflection(item.reflection || '') }
  const saveEdit = () => {
    if (!editingId || !editContent.trim()) return
    update(editingId, { content: editContent.trim(), source: editSource.trim() || undefined, tags: editTags, reflection: editReflection.trim() || undefined })
    setEditingId(null); if (current?.id === editingId) { const u = useInspirationStore.getState().items.find(i => i.id === editingId); if (u) setCurrent(u) }
  }

  const removeEditTag = (t: string) => { setEditTags(editTags.filter(x => x !== t)) }

  if (items.length === 0 && !showCapture) {
    return (
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5"><span className="text-sm font-medium text-white/40 uppercase tracking-wider">💡 每日灵感</span></div>
        <div className="text-center py-12 px-6">
          <p className="text-lg font-medium text-white/70 mb-2">记下第一句触动你的话</p>
          <p className="text-sm text-white/35 mb-6">一句好话就像一盏灯，别让它熄灭在记忆里</p>
          <button onClick={() => setShowCapture(true)} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm transition-colors duration-200 motion-safe:active:scale-95"><Plus size={15} /> 写一句</button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ====== 上：Hero 卡（液态玻璃）— 纯推荐，高度随内容 ====== */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl overflow-hidden">
        <div className="px-8 py-8">
          {current ? (
            <div className={`transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-base text-white/25 uppercase tracking-wider">今日推荐</span>
                {current.isFavorite && <Heart size={16} className="text-red-400 fill-red-400" />}
              </div>
              <blockquote className="text-xl leading-relaxed text-white/90 mb-5 font-medium tracking-wide" style={{ textWrap: 'balance' } as React.CSSProperties}>
                「{current.content}」
              </blockquote>
              {current.source && <p className="text-base text-white/45 mb-4">— {current.source}</p>}
              {current.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mb-5">{current.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-white/[.06] text-white/35 border border-white/[.06]">#{tag}</span>)}</div>}
              {current.reflection && <p className="text-sm text-white/40 italic mb-6 border-l-2 border-white/10 pl-3 leading-relaxed">{current.reflection}</p>}
              <div className="flex items-center gap-4">
                {[1,2,3].map(s => <button key={s} onClick={() => setImpact(current.id, s)} className="transition-transform duration-150 motion-safe:hover:scale-110 motion-safe:active:scale-90"><Star size={22} className={`transition-colors duration-200 ${s <= current.impact ? 'text-yellow-400 fill-yellow-400' : 'text-white/15 hover:text-white/25'}`} /></button>)}
                <button onClick={() => toggleFavorite(current.id)} className="transition-transform duration-150 motion-safe:hover:scale-110 motion-safe:active:scale-90"><Heart size={22} className={`transition-colors duration-200 ${current.isFavorite ? 'text-red-400 fill-red-400' : 'text-white/20 hover:text-white/35'}`} /></button>
                <button onClick={handleNext} className="flex items-center gap-1.5 ml-auto text-sm text-white/30 hover:text-white/55 transition-colors duration-150"><RefreshCw size={20} /> 换一条</button>
              </div>
            </div>
          ) : <p className="text-sm text-white/35 text-center py-8">暂无记录</p>}
        </div>
      </div>

      {/* ====== 中：捕获卡（液态玻璃）— 常驻输入 ====== */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl">
        <div className="px-5 py-3 border-b border-white/5">
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">记一句</span>
        </div>
        <div className="px-5 py-4 space-y-3 overflow-visible">
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="想写点什么…"
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 outline-none focus:border-[#0A84FF] transition-colors duration-200 resize-none"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && content.trim()) { e.preventDefault(); handleAdd() } }} />
          <div className="space-y-2">
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="来源（可选）" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm placeholder-white/25 outline-none focus:border-[#0A84FF] transition-colors duration-200" />
            <TagInput tags={tags} tagInput={tagInput} setTagInput={setTagInput} onAdd={addTag} onRemove={removeTag} />
          </div>
          <div className="flex justify-end">
            <button onClick={handleAdd} disabled={!content.trim()}
              className="px-5 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0077ED] text-white text-sm font-medium transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed motion-safe:active:scale-95">
              保存
            </button>
          </div>
        </div>
      </div>

      {/* ====== 下：列表卡（液态玻璃）— 搜索 + 标签 + 列表 ====== */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl overflow-hidden flex flex-col">
        {/* 搜索 + 标签 */}
        <div className="px-5 py-3 border-b border-white/5 space-y-2">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-white/25 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索…"
              className="flex-1 bg-transparent text-xs text-white/70 placeholder-white/20 outline-none" />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allTags.map(tag => (
                <button key={tag} onClick={() => setSearch(search === `#${tag}` ? '' : `#${tag}`)}
                  className={`px-2 py-0.5 rounded-full text-xs transition-colors duration-150 ${search === `#${tag}` ? 'bg-[#0A84FF]/25 text-[#0A84FF]' : 'bg-white/[.04] text-white/30 hover:bg-white/10 hover:text-white/45'}`}>#{tag}</button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
          <span className="text-sm font-medium text-white/50">最近记录</span>
          <span className="text-sm text-white/20">{filteredItems.length}</span>
        </div>
        <div className="flex-1 overflow-auto max-h-[480px] divide-y divide-white/[.04]">
          {filteredItems.length === 0 ? (
            <p className="text-sm text-white/20 text-center py-10">没有匹配的记录</p>
          ) : (
            recentItems.map(item => (
              <div key={item.id} className="group">
                {editingId === item.id ? (
                  <div className="px-3 py-2.5 space-y-1.5">
                    <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={2} autoFocus className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#0A84FF] resize-none" />
                    <input value={editSource} onChange={e => setEditSource(e.target.value)} placeholder="来源" className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#0A84FF]" />
                    <TagInput tags={editTags} tagInput={editTagInput} setTagInput={setEditTagInput} onAdd={() => { const t = editTagInput.trim(); if (t && !editTags.includes(t)) { setEditTags([...editTags, t]); setEditTagInput('') } }} onRemove={removeEditTag} />
                    <textarea value={editReflection} onChange={e => setEditReflection(e.target.value)} placeholder="感想" rows={1} className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs outline-none resize-none" />
                    <div className="flex justify-end gap-1.5"><button onClick={() => setEditingId(null)} className="p-3 rounded text-white/25 hover:text-white/50 hover:bg-white/5"><X size={20} /></button><button onClick={saveEdit} disabled={!editContent.trim()} className="p-1 rounded text-[#0A84FF] hover:bg-[#0A84FF]/10 disabled:opacity-30"><Check size={20} /></button></div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/[.02] transition-colors duration-150">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/75 truncate leading-relaxed">{item.content}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.source && <span className="text-[11px] text-white/20">{item.source}</span>}
                        {item.tags.slice(0,2).map((tag: string) => <span key={tag} className="text-[11px] text-white/20">#{tag}</span>)}
                        {[1,2,3].map((s: number) => <Star key={s} size={9} className={s <= item.impact ? 'text-yellow-400/40 fill-yellow-400/40' : 'text-white/[.04]'} />)}
                        {item.isFavorite && <Heart size={14} className="text-red-400/60 fill-red-400/60" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(item)} className="p-3 rounded text-white/20 hover:text-white/60 hover:bg-white/5"><Pencil size={20} /></button>
                      <button onClick={() => { if (confirm('删除这条记录？')) remove(item.id) }} className="p-1 rounded text-white/15 hover:text-red-400 hover:bg-red-400/5"><Trash2 size={20} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {filteredItems.length > 5 && !showAll && (
          <button onClick={() => setShowAll(true)} className="w-full py-2.5 border-t border-white/5 text-xs text-white/25 hover:text-white/45 transition-colors duration-150 flex items-center justify-center gap-1">
            查看全部 {filteredItems.length} 条 <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* ====== 标签管理 ====== */}
      {allTags.length > 0 && (
        <div className="rounded-2xl bg-white/[.06] backdrop-blur-[10px] border border-white/10 shadow-card overflow-hidden">
          <TagManager allTags={allTags} items={items} />
        </div>
      )}
    </div>
  )
}

// ====== 标签管理面板 ======
function TagManager({ allTags, items }: { allTags: string[]; items: { tags: string[] }[] }) {
  const tagStore = useInspirationTagStore(s => s.tags)
  const setColor = useInspirationTagStore(s => s.setColor)
  const removeTag = useInspirationTagStore(s => s.remove)
  const [expanded, setExpanded] = useState(false)

  const COLORS = ['#0A84FF', '#FF6B6B', '#51CF66', '#FFD43B', '#CC5DE8', '#FF922B', '#20C997', '#F06595', '#74C0FC', '#A9E34B']

  // 统计每个标签的使用次数
  const usage = new Map<string, number>()
  items.forEach(item => item.tags.forEach(t => usage.set(t, (usage.get(t) || 0) + 1)))

  // 标签列表（有颜色的 + 没颜色但被使用的）
  const allTagNames = new Set(allTags)
  const managedTags = tagStore
    .filter(t => allTagNames.has(t.name))
    .concat(
      allTags.filter(name => !tagStore.find(t => t.name === name)).map(name => ({
        name, color: COLORS[allTags.indexOf(name) % COLORS.length], createdAt: 0,
      }))
    )

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[.02] transition-colors duration-150">
        <span className="text-xs font-medium text-white/50">标签管理</span>
        <span className="text-[11px] text-white/20">{allTags.length} 个标签</span>
      </button>
      {expanded && (
        <div className="border-t border-white/5 px-5 py-3 space-y-2 max-h-[280px] overflow-auto">
          {managedTags.map(tag => (
            <div key={tag.name} className="flex items-center gap-2">
              {/* 颜色选择 */}
              <div className="flex items-center gap-1">
                {COLORS.slice(0, 5).map(c => (
                  <button key={c} onClick={() => setColor(tag.name, c)}
                    className={`w-6 h-6 rounded-full transition-transform duration-150 ${tag.color === c ? 'ring-2 ring-white/40 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="flex-1 text-sm text-white/70 truncate">{tag.name}</span>
              <span className="text-[11px] text-white/25 flex-shrink-0">{usage.get(tag.name) || 0} 次</span>
              <button onClick={() => removeTag(tag.name)} className="p-1 text-white/15 hover:text-red-400 transition-colors duration-150">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ====== Tag 输入组件（自动补全 + 颜色） ======
function TagInput({ tags, tagInput, setTagInput, onAdd, onRemove }: {
  tags: string[]
  tagInput: string
  setTagInput: (v: string) => void
  onAdd: () => void
  onRemove: (t: string) => void
}) {
  const allTags = useInspirationTagStore(s => s.tags)
  const ensureTag = useInspirationTagStore(s => s.ensure)

  // 自动补全候选
  const suggestions = tagInput.trim()
    ? allTags
        .filter(t => t.name.toLowerCase().includes(tagInput.trim().toLowerCase()) && !tags.includes(t.name))
        .slice(0, 5)
    : []

  const handleAdd = () => {
    if (!tagInput.trim()) return
    ensureTag(tagInput.trim()) // 自动注册标签
    onAdd()
  }

  // 获取标签颜色
  const getColor = (name: string) => allTags.find(t => t.name === name)?.color || '#0A84FF'

  return (
    <div className="space-y-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors duration-150"
              style={{ backgroundColor: `${getColor(tag)}18`, borderColor: `${getColor(tag)}40`, color: getColor(tag) }}>
              {tag}
              <button onClick={() => onRemove(tag)} className="hover:opacity-70 p-0.5" style={{ color: getColor(tag) }}>
                <X size={16} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <div className="flex gap-1.5">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
            placeholder="添加标签…"
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm placeholder-white/25 outline-none focus:border-[#0A84FF] transition-colors duration-200"
          />
          <button onClick={handleAdd} disabled={!tagInput.trim()}
            className="px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white/70 hover:bg-white/10 text-sm transition-colors duration-200 disabled:opacity-20 disabled:cursor-not-allowed">
            + 添加
          </button>
        </div>
        {/* 自动补全下拉 */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-[#1c1c1e] border border-white/10 shadow-xl overflow-hidden z-50">
            {suggestions.map(s => (
              <button key={s.name}
                onClick={() => { setTagInput(s.name); handleAdd() }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-white/70 hover:bg-white/5 transition-colors duration-100">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
