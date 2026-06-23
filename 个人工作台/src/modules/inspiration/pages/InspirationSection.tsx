// 灵感模块首页 Section — v6：全屏布局，Hero 居中 + 底部工具箱
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useInspirationStore } from '../../../store/useInspirationStore'
import { useInspirationTagStore } from '../../../store/useInspirationTagStore'
import { Heart, RefreshCw, Star, Trash2, Pencil, Check, X, Search, ArrowRight } from 'lucide-react'
import type { LiquidGlassConfig } from '../../../lib/liquid-glass'

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
  const ensureTag = useInspirationTagStore(s => s.ensure)

  const [current, setCurrent] = useState<typeof items[0] | null>(null)
  const [fading, setFading] = useState(false)
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [tagList, setTagList] = useState<string[]>([])
  const [reflection, setReflection] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSource, setEditSource] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editTagInput, setEditTagInput] = useState('')
  const [editReflection, setEditReflection] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'newest' | 'oldest' | 'impact-high' | 'impact-low'>('newest')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => { if (items.length > 0 && !current) setCurrent(getNextReview()) }, [items, current, getNextReview])
  // 当 items 更新时同步 current（星星/收藏操作后刷新）
  useEffect(() => {
    if (current) {
      const updated = items.find(i => i.id === current.id)
      if (updated) setCurrent(updated)
    }
  }, [items, current?.id])
  useEffect(() => { items.forEach(i => i.tags.forEach(t => ensureTag(t))) }, [items.length])

  const allTags = useMemo(() => { const s = new Set<string>(); items.forEach(i => i.tags.forEach(t => s.add(t))); return Array.from(s).sort() }, [items])
  const filteredItems = useMemo(() => {
    let list = [...items]
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter(i => i.content.toLowerCase().includes(q) || i.source?.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q))) }
    return list.sort((a, b) => {
      switch (sortKey) {
        case 'oldest': return a.createdAt - b.createdAt
        case 'impact-high': return b.impact - a.impact || b.createdAt - a.createdAt
        case 'impact-low': return a.impact - b.impact || b.createdAt - a.createdAt
        default: return b.createdAt - a.createdAt
      }
    })
  }, [items, search, sortKey])
  const recentItems = filteredItems.slice(0, showAll ? undefined : 8)

  const handleNext = useCallback(() => { setFading(true); setTimeout(() => { if (current) markReviewed(current.id); setCurrent(getNextReview()); setFading(false) }, 200) }, [current, markReviewed, getNextReview])
  const handleAdd = () => {
    if (!content.trim()) return
    add({ content, source: source || undefined, tags: tagList, reflection: reflection || undefined })
    setContent(''); setSource(''); setTagList([]); setReflection(''); setTagInput('')
    if (!current) setCurrent(getNextReview())
  }
  const addTag = () => { const t = tagInput.trim(); if (t && !tagList.includes(t)) { setTagList([...tagList, t]); setTagInput('') } }
  const removeTag = (t: string) => setTagList(tagList.filter(x => x !== t))
  const removeEditTag = (t: string) => setEditTags(editTags.filter(x => x !== t))

  const startEdit = (item: typeof items[0]) => { setEditingId(item.id); setEditContent(item.content); setEditSource(item.source || ''); setEditTags(item.tags); setEditTagInput(''); setEditReflection(item.reflection || '') }
  const saveEdit = () => {
    if (!editingId || !editContent.trim()) return
    update(editingId, { content: editContent.trim(), source: editSource.trim() || undefined, tags: editTags, reflection: editReflection.trim() || undefined })
    setEditingId(null); if (current?.id === editingId) { const u = useInspirationStore.getState().items.find(i => i.id === editingId); if (u) setCurrent(u) }
  }

  const itemListProps = { editingId, editContent, editSource, editTags, editTagInput, editReflection, setEditContent, setEditSource, setEditTags, setEditTagInput, setEditReflection, onStartEdit: startEdit, onSaveEdit: saveEdit, onCancelEdit: () => setEditingId(null), onToggleFavorite: toggleFavorite, onSetImpact: setImpact, removeItem: remove, removeEditTag }

  return (
    <div className="flex flex-col justify-center gap-16">
      {/* ====== Hero 区：居中展示 ====== */}
      <div className="flex-1 flex items-center justify-center">
        <div ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl max-w-3xl w-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] bg-gradient-to-b from-white/[.02] to-transparent">
          <div className="px-12 py-16">
            {current ? (
              <div className={`transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
                <blockquote className="text-5xl leading-tight text-white/95 mb-8 font-medium tracking-wide" style={{ textWrap: 'balance' } as React.CSSProperties}>
                  「{current.content}」
                </blockquote>
                <div className="flex items-start justify-between gap-8 mb-8">
                  <div>
                    {current.reflection && <p className="text-sm text-white/35 italic max-w-sm leading-relaxed">{current.reflection}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {current.source && <p className="text-base text-[#0A84FF]/60 font-medium mb-2">— {current.source}</p>}
                    {current.tags.length > 0 && (
                      <div className="flex flex-wrap justify-end gap-2">
                        {current.tags.map(tag => <TagChip key={tag} name={tag} />)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-5 pt-4 border-t border-white/[.04]">
                  {[1,2,3].map(s => (
                    <button key={s} onClick={() => setImpact(current.id, s)} className="transition-transform duration-150 motion-safe:hover:scale-110 motion-safe:active:scale-90 focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40 rounded-full"
                      aria-label={`触动 ${s} 星`}>
                      <Star size={22} className={`transition-colors duration-200 ${s <= current.impact ? 'text-yellow-400 fill-yellow-400' : 'text-white/12 hover:text-white/25'}`} />
                    </button>
                  ))}
                  <button onClick={() => toggleFavorite(current.id)} className="transition-transform duration-150 motion-safe:hover:scale-110 motion-safe:active:scale-90 focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40 rounded-full"
                    aria-label={current.isFavorite ? '取消收藏' : '收藏'}>
                    <Heart size={22} className={`transition-colors duration-200 ${current.isFavorite ? 'text-red-400 fill-red-400' : 'text-white/15 hover:text-white/30'}`} />
                  </button>
                  <button onClick={handleNext} className="flex items-center gap-2 ml-auto text-sm text-white/25 hover:text-white/50 transition-colors duration-150 rounded-lg focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40"
                    aria-label="换一条推荐">
                    <RefreshCw size={18} /> 换一条
                  </button>
                </div>
              </div>
            ) : items.length > 0 ? (
              <p className="text-sm text-white/30 py-12 text-center">暂无推荐</p>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xl font-medium text-white/60 mb-2">记下第一句触动你的话</p>
                <p className="text-sm text-white/30">在下方输入框中开始记录</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== 底部：捕获 + 工具箱（不对称双栏） ====== */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-5">
        {/* 捕获栏 */}
        <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl">
          <div className="px-5 py-4 space-y-3">
            <textarea value={content} onChange={e => setContent(e.target.value)}
              placeholder="想写点什么…" rows={2}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-base placeholder-white/30 outline-none focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]/30 focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40 transition-all duration-200 resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && content.trim()) { e.preventDefault(); handleAdd() } }} />
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-2">
                <input value={source} onChange={e => setSource(e.target.value)} placeholder="来源（可选）"
                  className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm placeholder-white/25 outline-none focus:border-[#0A84FF] focus-visible:ring-1 focus-visible:ring-[#0A84FF]/30 transition-all duration-200" />
                <TagInput tags={tagList} tagInput={tagInput} setTagInput={setTagInput} onAdd={addTag} onRemove={removeTag} />
              </div>
              <button onClick={handleAdd} disabled={!content.trim()}
                className="px-6 py-3 rounded-lg bg-[#0A84FF] hover:bg-[#0077ED] active:bg-[#0066CC] text-white text-sm font-medium transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50 motion-safe:active:scale-[0.98] flex-shrink-0">
                保存
              </button>
            </div>
            <textarea value={reflection} onChange={e => setReflection(e.target.value)}
              placeholder="我的感想（可选）…" rows={2}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-sm placeholder-white/20 outline-none focus:border-[#0A84FF] focus-visible:ring-1 focus-visible:ring-[#0A84FF]/30 transition-all duration-200 resize-none" />
            </div>
          </div>

        {/* 右侧：工具箱 + 标签管理 */}
        <div className="space-y-4">
          <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl flex flex-col max-h-[480px]">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5">
              <Search size={18} className="text-white/25 flex-shrink-0" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索…"
                className="flex-1 bg-transparent text-sm text-white/70 placeholder-white/20 outline-none" />
              <button onClick={() => setSortKey(sortKey === 'newest' ? 'oldest' : 'newest')}
                className="text-[11px] text-white/25 hover:text-white/50 transition-colors flex-shrink-0" title="排序">
                {sortKey === 'newest' ? '最新' : '最早'}
              </button>
              <span className="text-[11px] text-white/20 flex-shrink-0">{filteredItems.length}</span>
            </div>
            <div className="flex-1 overflow-auto divide-y divide-white/[.04]">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-white/20 text-center py-8">没有匹配的记录</p>
              ) : (
                recentItems.map(item => <ItemRow key={item.id} item={item} {...itemListProps} />)
              )}
            </div>
            {filteredItems.length > 8 && !showAll &&
              <button onClick={() => setShowAll(true)} className="w-full py-3 border-t border-white/5 text-sm text-white/25 hover:text-white/45 transition-colors duration-150 flex items-center justify-center gap-1.5">
                查看全部 {filteredItems.length} 条 <ArrowRight size={16} />
              </button>
            }
          </div>
          {allTags.length > 0 && <TagManager allTags={allTags} items={items as { tags: string[] }[]} />}
        </div>
      </div>
    </div>
  )
}

// ====== 子组件 ======

function TagChip({ name, onRemove }: { name: string; onRemove?: () => void }) {
  const color = useInspirationTagStore(s => s.tags.find(t => t.name === name)?.color || '#0A84FF')
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border" style={{ backgroundColor: `${color}18`, borderColor: `${color}30`, color }}>
      {name}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70" style={{ color }}>
          <X size={12} />
        </button>
      )}
    </span>
  )
}

function TagInput({ tags, tagInput, setTagInput, onAdd, onRemove }: {
  tags: string[]; tagInput: string; setTagInput: (v: string) => void; onAdd: () => void; onRemove: (t: string) => void
}) {
  const allTags = useInspirationTagStore(s => s.tags)
  const ensureTag = useInspirationTagStore(s => s.ensure)
  const suggestions = tagInput.trim() ? allTags.filter(t => t.name.toLowerCase().includes(tagInput.trim().toLowerCase()) && !tags.includes(t.name)).slice(0, 5) : []
  const handleAdd = () => { if (!tagInput.trim()) return; ensureTag(tagInput.trim()); onAdd() }

  return (
    <div className="space-y-1.5">
      {tags.length > 0 && <div className="flex flex-wrap gap-1.5">{tags.map(tag => <TagChip key={tag} name={tag} onRemove={() => onRemove(tag)} />)}</div>}
      <div className="relative flex gap-1.5">
        <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          placeholder="添加标签…" className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-sm placeholder-white/20 outline-none focus:border-[#0A84FF] transition-colors duration-200" />
        <button onClick={handleAdd} disabled={!tagInput.trim()} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white/60 text-sm transition-colors disabled:opacity-15">+</button>
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-[#1c1c1e] border border-white/10 shadow-xl overflow-hidden z-50">
            {suggestions.map(s => (
              <button key={s.name} onClick={() => { setTagInput(s.name); handleAdd() }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-white/60 hover:bg-white/5 transition-colors">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />{s.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ItemRow({ item, ...p }: any) {
  return (
    <div className="group">
      {p.editingId === item.id ? (
        <div className="px-4 py-3 space-y-2">
          <textarea value={p.editContent} onChange={e => p.setEditContent(e.target.value)} rows={2} autoFocus className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#0A84FF] resize-none" />
          <input value={p.editSource} onChange={e => p.setEditSource(e.target.value)} placeholder="来源" className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#0A84FF]" />
          <TagInput tags={p.editTags} tagInput={p.editTagInput} setTagInput={p.setEditTagInput} onAdd={() => { const t = p.editTagInput.trim(); if (t && !p.editTags.includes(t)) { p.setEditTags([...p.editTags, t]); p.setEditTagInput('') } }} onRemove={p.removeEditTag} />
          <textarea value={p.editReflection} onChange={e => p.setEditReflection(e.target.value)} placeholder="感想" rows={1} className="w-full px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm outline-none resize-none" />
          <div className="flex justify-end gap-2">
            <button onClick={p.onCancelEdit} className="p-2 rounded text-white/25 hover:text-white/50 hover:bg-white/5"><X size={18} /></button>
            <button onClick={p.onSaveEdit} disabled={!p.editContent.trim()} className="p-2 rounded text-[#0A84FF] hover:bg-[#0A84FF]/10 disabled:opacity-30"><Check size={18} /></button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[.02] transition-colors duration-150">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white/75 truncate leading-relaxed">{item.content}</p>
            <div className="flex items-center gap-2 mt-1">
              {item.source && <span className="text-[11px] text-white/20">{item.source}</span>}
              {item.tags.slice(0,2).map((tag: string) => <TagChip key={tag} name={tag} />)}
              {[1,2,3].map((s: number) => <Star key={s} size={12} className={s <= item.impact ? 'text-yellow-400/40 fill-yellow-400/40' : 'text-white/[.04]'} />)}
              {item.isFavorite && <Heart size={12} className="text-red-400/60 fill-red-400/60" />}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => p.onStartEdit(item)} className="p-2 rounded text-white/15 hover:text-white/50 hover:bg-white/5"><Pencil size={16} /></button>
            <button onClick={() => { if (confirm('删除这条记录？')) p.removeItem(item.id) }} className="p-2 rounded text-white/15 hover:text-red-400 hover:bg-red-400/5"><Trash2 size={16} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

function TagManager({ allTags, items }: { allTags: string[]; items: { tags: string[] }[] }) {
  const tagStore = useInspirationTagStore(s => s.tags)
  const setColor = useInspirationTagStore(s => s.setColor)
  const removeTag = useInspirationTagStore(s => s.remove)
  const [expanded, setExpanded] = useState(false)
  const COLORS = ['#0A84FF','#FF6B6B','#51CF66','#FFD43B','#CC5DE8','#FF922B','#20C997','#F06595','#74C0FC','#A9E34B']
  const usage = new Map<string, number>()
  items.forEach(i => i.tags.forEach(t => usage.set(t, (usage.get(t)||0)+1)))

  return (
    <div className="rounded-2xl bg-white/[.06] backdrop-blur-[10px] border border-white/10 shadow-card">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[.02] transition-colors">
        <span className="text-sm font-medium text-white/45">标签管理</span>
        <span className="text-[11px] text-white/20">{allTags.length} 个</span>
      </button>
      {expanded && (
        <div className="border-t border-white/5 px-5 py-3 space-y-2 max-h-[240px] overflow-auto">
          {allTags.map(name => {
            const meta = tagStore.find(t => t.name === name)
            const color = meta?.color || COLORS[allTags.indexOf(name) % COLORS.length]
            return (
              <div key={name} className="flex items-center gap-3">
                <div className="flex items-center gap-0.5">{COLORS.slice(0,5).map(c => <button key={c} onClick={() => setColor(name, c)} className={`w-6 h-6 rounded-full transition-transform duration-150 ${color === c ? 'ring-2 ring-white/40 scale-110' : 'hover:scale-110'}`} style={{ backgroundColor: c }} />)}</div>
                <span className="flex-1 text-sm text-white/65 truncate">{name}</span>
                <span className="text-[11px] text-white/20">{usage.get(name)||0} 次</span>
                <button onClick={() => removeTag(name)} className="p-2 text-white/15 hover:text-red-400 transition-colors"><X size={16} /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
