// 灵感模块首页 Section — v5：Magazine Spread 布局
// 左 Hero 卡 + 右紧凑列表卡，液态玻璃双面板
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useInspirationStore } from '../../../store/useInspirationStore'
import { Heart, RefreshCw, Star, Plus, Trash2, Pencil, Check, X, Search, ArrowRight } from 'lucide-react'
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

  const [current, setCurrent] = useState<typeof items[0] | null>(null)
  const [fading, setFading] = useState(false)
  const [showCapture, setShowCapture] = useState(false)
  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [tags, setTags] = useState('')
  const [reflection, setReflection] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editSource, setEditSource] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editReflection, setEditReflection] = useState('')
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  useEffect(() => { if (items.length > 0 && !current) setCurrent(getNextReview()) }, [items, current, getNextReview])

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
    const item = add({ content, source: source || undefined, tags: tags ? tags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : undefined, reflection: reflection || undefined })
    setContent(''); setSource(''); setTags(''); setReflection(''); setShowCapture(false); setCurrent(item)
  }

  const startEdit = (item: typeof items[0]) => { setEditingId(item.id); setEditContent(item.content); setEditSource(item.source || ''); setEditTags(item.tags.join(', ')); setEditReflection(item.reflection || '') }
  const saveEdit = () => {
    if (!editingId || !editContent.trim()) return
    update(editingId, { content: editContent.trim(), source: editSource.trim() || undefined, tags: editTags ? editTags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [], reflection: editReflection.trim() || undefined })
    setEditingId(null); if (current?.id === editingId) { const u = useInspirationStore.getState().items.find(i => i.id === editingId); if (u) setCurrent(u) }
  }

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
                {current.isFavorite && <Heart size={11} className="text-red-400 fill-red-400" />}
              </div>
              <blockquote className="text-xl leading-relaxed text-white/90 mb-5 font-medium tracking-wide" style={{ textWrap: 'balance' } as React.CSSProperties}>
                「{current.content}」
              </blockquote>
              {current.source && <p className="text-base text-white/45 mb-4">— {current.source}</p>}
              {current.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mb-5">{current.tags.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-white/[.06] text-white/35 border border-white/[.06]">#{tag}</span>)}</div>}
              {current.reflection && <p className="text-sm text-white/40 italic mb-6 border-l-2 border-white/10 pl-3 leading-relaxed">{current.reflection}</p>}
              <div className="flex items-center gap-4">
                {[1,2,3].map(s => <button key={s} onClick={() => setImpact(current.id, s)} className="transition-transform duration-150 motion-safe:hover:scale-110 motion-safe:active:scale-90"><Star size={16} className={`transition-colors duration-200 ${s <= current.impact ? 'text-yellow-400 fill-yellow-400' : 'text-white/15 hover:text-white/25'}`} /></button>)}
                <button onClick={() => toggleFavorite(current.id)} className="transition-transform duration-150 motion-safe:hover:scale-110 motion-safe:active:scale-90"><Heart size={16} className={`transition-colors duration-200 ${current.isFavorite ? 'text-red-400 fill-red-400' : 'text-white/20 hover:text-white/35'}`} /></button>
                <button onClick={handleNext} className="flex items-center gap-1.5 ml-auto text-xs text-white/30 hover:text-white/55 transition-colors duration-150"><RefreshCw size={14} /> 换一条</button>
              </div>
            </div>
          ) : <p className="text-sm text-white/35 text-center py-8">暂无记录</p>}
        </div>
      </div>

      {/* ====== 下：列表卡（液态玻璃）— 搜索 + 标签 + 列表 ====== */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl overflow-hidden flex flex-col">
        {/* 搜索 + 标签 */}
        <div className="px-5 py-3 border-b border-white/5 space-y-2">
          <div className="flex items-center gap-2">
            <Search size={13} className="text-white/25 flex-shrink-0" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索…"
              className="flex-1 bg-transparent text-xs text-white/70 placeholder-white/20 outline-none" />
            <button onClick={() => setShowCapture(!showCapture)}
              className="flex items-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors duration-150 flex-shrink-0">
              <Plus size={12} /> 新增
            </button>
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

        {/* 捕获表单（可展开） */}
        {showCapture && (
          <div className="px-5 py-3 border-b border-white/5 space-y-2">
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="写下那句触动你的话…" rows={2} autoFocus
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 outline-none focus:border-[#0A84FF] transition-colors duration-200 resize-none"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && content.trim()) { e.preventDefault(); handleAdd() } }} />
            <div className="grid grid-cols-2 gap-2">
              <input value={source} onChange={e => setSource(e.target.value)} placeholder="来源" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs placeholder-white/25 outline-none focus:border-[#0A84FF] transition-colors duration-200" />
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="标签（逗号分隔）" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs placeholder-white/25 outline-none focus:border-[#0A84FF] transition-colors duration-200" />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowCapture(false); setContent(''); setSource(''); setTags('') }} className="px-3 py-1.5 text-xs text-white/35 hover:text-white/60 transition-colors duration-150">取消</button>
              <button onClick={handleAdd} disabled={!content.trim()} className="px-5 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed motion-safe:active:scale-95">保存</button>
            </div>
          </div>
        )}

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
                    <div className="grid grid-cols-2 gap-1.5"><input value={editSource} onChange={e => setEditSource(e.target.value)} placeholder="来源" className="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#0A84FF]" /><input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="标签" className="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#0A84FF]" /></div>
                    <textarea value={editReflection} onChange={e => setEditReflection(e.target.value)} placeholder="感想" rows={1} className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs outline-none resize-none" />
                    <div className="flex justify-end gap-1.5"><button onClick={() => setEditingId(null)} className="p-1 rounded text-white/25 hover:text-white/50 hover:bg-white/5"><X size={13} /></button><button onClick={saveEdit} disabled={!editContent.trim()} className="p-1 rounded text-[#0A84FF] hover:bg-[#0A84FF]/10 disabled:opacity-30"><Check size={13} /></button></div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/[.02] transition-colors duration-150">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/75 truncate leading-relaxed">{item.content}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.source && <span className="text-[11px] text-white/20">{item.source}</span>}
                        {item.tags.slice(0,2).map((tag: string) => <span key={tag} className="text-[11px] text-white/20">#{tag}</span>)}
                        {[1,2,3].map((s: number) => <Star key={s} size={9} className={s <= item.impact ? 'text-yellow-400/40 fill-yellow-400/40' : 'text-white/[.04]'} />)}
                        {item.isFavorite && <Heart size={9} className="text-red-400/60 fill-red-400/60" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(item)} className="p-1 rounded text-white/15 hover:text-white/50 hover:bg-white/5"><Pencil size={12} /></button>
                      <button onClick={() => { if (confirm('删除这条记录？')) remove(item.id) }} className="p-1 rounded text-white/15 hover:text-red-400 hover:bg-red-400/5"><Trash2 size={12} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {filteredItems.length > 5 && !showAll && (
          <button onClick={() => setShowAll(true)} className="w-full py-2.5 border-t border-white/5 text-xs text-white/25 hover:text-white/45 transition-colors duration-150 flex items-center justify-center gap-1">
            查看全部 {filteredItems.length} 条 <ArrowRight size={10} />
          </button>
        )}
      </div>
    </div>
  )
}
