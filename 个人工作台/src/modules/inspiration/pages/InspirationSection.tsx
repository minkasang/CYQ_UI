// 灵感模块首页 Section — v3 布局：独立回顾卡 + 多卡片收纳
// 设计参考：Readwise 单条聚焦 + Apple 卡片分组
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useInspirationStore } from '../../../store/useInspirationStore'
import { Heart, RefreshCw, Star, Plus, Trash2, Pencil, Check, X, Search, ChevronDown, ChevronUp } from 'lucide-react'

export function InspirationSection() {
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

  // 抽屉状态
  const [expandedSection, setExpandedSection] = useState<'all' | 'favorites' | null>('all')

  useEffect(() => {
    if (items.length > 0 && !current) setCurrent(getNextReview())
  }, [items, current, getNextReview])

  const allTags = useMemo(() => {
    const set = new Set<string>()
    items.forEach(i => i.tags.forEach(t => set.add(t)))
    return Array.from(set).sort()
  }, [items])

  const filteredAll = useMemo(() => {
    let list = [...items]
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(i => i.content.toLowerCase().includes(q) || i.source?.toLowerCase().includes(q) || i.tags.some(t => t.toLowerCase().includes(q)))
    }
    return list.sort((a, b) => b.createdAt - a.createdAt)
  }, [items, search])

  const favorites = useMemo(() => filteredAll.filter(i => i.isFavorite), [filteredAll])

  const handleNext = useCallback(() => {
    setFading(true)
    setTimeout(() => {
      if (current) markReviewed(current.id)
      setCurrent(getNextReview())
      setFading(false)
    }, 200)
  }, [current, markReviewed, getNextReview])

  const handleAdd = () => {
    if (!content.trim()) return
    const item = add({ content, source: source || undefined, tags: tags ? tags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : undefined, reflection: reflection || undefined })
    setContent(''); setSource(''); setTags(''); setReflection('')
    setShowCapture(false)
    setCurrent(item)
  }

  const startEdit = (item: typeof items[0]) => {
    setEditingId(item.id); setEditContent(item.content); setEditSource(item.source || ''); setEditTags(item.tags.join(', ')); setEditReflection(item.reflection || '')
  }

  const saveEdit = () => {
    if (!editingId || !editContent.trim()) return
    update(editingId, { content: editContent.trim(), source: editSource.trim() || undefined, tags: editTags ? editTags.split(/[,，]/).map(t => t.trim()).filter(Boolean) : [], reflection: editReflection.trim() || undefined })
    setEditingId(null)
    if (current?.id === editingId) { const u = useInspirationStore.getState().items.find(i => i.id === editingId); if (u) setCurrent(u) }
  }

  // 空状态
  if (items.length === 0 && !showCapture) {
    return (
      <div className="rounded-2xl bg-white/[.06] backdrop-blur-[10px] border border-white/10 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">💡 每日灵感</span>
        </div>
        <div className="text-center py-12 px-6">
          <p className="text-lg font-medium text-white/70 mb-2">记下第一句触动你的话</p>
          <p className="text-xs text-white/35 mb-6">一句好话就像一盏灯，别让它熄灭在记忆里</p>
          <button onClick={() => setShowCapture(true)} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm transition-colors duration-200 motion-safe:active:scale-95">
            <Plus size={15} /> 写一句
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ====== 回顾卡片 — 独立，通栏 ====== */}
      <div className="rounded-2xl bg-white/[.06] backdrop-blur-[10px] border border-white/10 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">💡 每日灵感</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/30">{items.length} 条</span>
            {!showCapture && (
              <button onClick={() => setShowCapture(true)} className="text-[10px] text-white/35 hover:text-white/60 transition-colors duration-150 flex items-center gap-1">
                <Plus size={11} /> 新增
              </button>
            )}
          </div>
        </div>

        <div className="px-8 py-7">
          {showCapture ? (
            <div className="space-y-3">
              <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="写下那句触动你的话…" rows={2} autoFocus
                className="w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/25 outline-none focus:border-[#0A84FF] transition-colors duration-200 resize-none"
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
          ) : current ? (
            <div className={`transition-opacity duration-200 ${fading ? 'opacity-0' : 'opacity-100'}`}>
              <blockquote className="text-lg leading-relaxed text-white/90 mb-4 font-medium tracking-wide" style={{ textWrap: 'balance' } as React.CSSProperties}>
                「{current.content}」
              </blockquote>
              {current.source && <p className="text-sm text-white/45 mb-4">— {current.source}</p>}
              {current.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {current.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-white/[.06] text-white/35 border border-white/[.06]">#{tag}</span>
                  ))}
                </div>
              )}
              {current.reflection && (
                <p className="text-xs text-white/40 italic mb-5 border-l-2 border-white/10 pl-3 leading-relaxed">{current.reflection}</p>
              )}
              <div className="flex items-center gap-4 pt-1">
                {[1, 2, 3].map(s => (
                  <button key={s} onClick={() => setImpact(current.id, s)} className="transition-transform duration-150 motion-safe:hover:scale-110 motion-safe:active:scale-90" title={`触动 ${s} 星`}>
                    <Star size={15} className={`transition-colors duration-200 ${s <= current.impact ? 'text-yellow-400 fill-yellow-400' : 'text-white/15 hover:text-white/25'}`} />
                  </button>
                ))}
                <button onClick={() => toggleFavorite(current.id)} className="transition-transform duration-150 motion-safe:hover:scale-110 motion-safe:active:scale-90">
                  <Heart size={15} className={`transition-colors duration-200 ${current.isFavorite ? 'text-red-400 fill-red-400' : 'text-white/20 hover:text-white/35'}`} />
                </button>
                <button onClick={handleNext} className="flex items-center gap-1.5 ml-auto text-xs text-white/30 hover:text-white/55 transition-colors duration-150">
                  <RefreshCw size={13} /> 换一条
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-white/35 text-center py-8">暂无记录</p>
          )}
        </div>
      </div>

      {/* ====== 搜索 + 标签 ====== */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <Search size={13} className="text-white/25 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索…"
            className="flex-1 bg-transparent text-xs text-white/70 placeholder-white/20 outline-none" />
        </div>
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map(tag => (
              <button key={tag} onClick={() => setSearch(search === `#${tag}` ? '' : `#${tag}`)}
                className={`px-2 py-0.5 rounded-full text-[10px] transition-colors duration-150 ${
                  search === `#${tag}` ? 'bg-[#0A84FF]/25 text-[#0A84FF]' : 'bg-white/[.04] text-white/30 hover:bg-white/10 hover:text-white/45'
                }`}>
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ====== 收纳卡片区 ====== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 全部记录 */}
        <CollapsibleCard
          title="全部记录"
          count={filteredAll.length}
          isExpanded={expandedSection === 'all'}
          onToggle={() => setExpandedSection(expandedSection === 'all' ? null : 'all')}
        >
          {filteredAll.length === 0 ? (
            <EmptyHint text="没有匹配的记录" />
          ) : (
            <ItemList items={filteredAll.slice(0, expandedSection === 'all' ? undefined : 3)} editingId={editingId} editContent={editContent} editSource={editSource} editTags={editTags} editReflection={editReflection}
              setEditContent={setEditContent} setEditSource={setEditSource} setEditTags={setEditTags} setEditReflection={setEditReflection}
              onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={() => setEditingId(null)}
              onToggleFavorite={toggleFavorite} onSetImpact={setImpact} onRemove={remove} />
          )}
        </CollapsibleCard>

        {/* 收藏 */}
        <CollapsibleCard
          title="⭐ 收藏"
          count={favorites.length}
          isExpanded={expandedSection === 'favorites'}
          onToggle={() => setExpandedSection(expandedSection === 'favorites' ? null : 'favorites')}
        >
          {favorites.length === 0 ? (
            <EmptyHint text="还没有收藏，点 ❤ 收藏喜欢的记录" />
          ) : (
            <ItemList items={favorites.slice(0, expandedSection === 'favorites' ? undefined : 3)} editingId={editingId} editContent={editContent} editSource={editSource} editTags={editTags} editReflection={editReflection}
              setEditContent={setEditContent} setEditSource={setEditSource} setEditTags={setEditTags} setEditReflection={setEditReflection}
              onStartEdit={startEdit} onSaveEdit={saveEdit} onCancelEdit={() => setEditingId(null)}
              onToggleFavorite={toggleFavorite} onSetImpact={setImpact} onRemove={remove} />
          )}
        </CollapsibleCard>
      </div>
    </div>
  )
}

// ====== 可折叠收纳卡片 ======
function CollapsibleCard({ title, count, isExpanded, onToggle, children }: {
  title: string; count: number; isExpanded: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white/[.06] backdrop-blur-[10px] border border-white/10 shadow-card overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/[.02] transition-colors duration-150">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/60">{title}</span>
          <span className="text-[10px] text-white/25">{count}</span>
        </div>
        {isExpanded ? <ChevronUp size={14} className="text-white/25" /> : <ChevronDown size={14} className="text-white/25" />}
      </button>
      {isExpanded && (
        <div className="border-t border-white/5 divide-y divide-white/[.04] max-h-[360px] overflow-auto">
          {children}
        </div>
      )}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-[10px] text-white/20 text-center py-8">{text}</p>
}

// ====== 列表项列表 ======
function ItemList({ items, editingId, editContent, editSource, editTags, editReflection,
  setEditContent, setEditSource, setEditTags, setEditReflection,
  onStartEdit, onSaveEdit, onCancelEdit, onToggleFavorite, onSetImpact, onRemove
}: {
  items: ReturnType<typeof useInspirationStore.getState>['items']
  editingId: string | null
  editContent: string; editSource: string; editTags: string; editReflection: string
  setEditContent: (v: string) => void; setEditSource: (v: string) => void; setEditTags: (v: string) => void; setEditReflection: (v: string) => void
  onStartEdit: (item: typeof items[0]) => void
  onSaveEdit: () => void; onCancelEdit: () => void
  onToggleFavorite: (id: string) => void; onSetImpact: (id: string, v: number) => void; onRemove: (id: string) => void
}) {
  return (
    <>
      {items.map(item => (
        <div key={item.id} className="group">
          {editingId === item.id ? (
            <div className="px-3 py-2.5 space-y-1.5">
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={2} autoFocus
                className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#0A84FF] transition-colors duration-200 resize-none" />
              <div className="grid grid-cols-2 gap-1.5">
                <input value={editSource} onChange={e => setEditSource(e.target.value)} placeholder="来源" className="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#0A84FF] transition-colors duration-200" />
                <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="标签" className="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#0A84FF] transition-colors duration-200" />
              </div>
              <textarea value={editReflection} onChange={e => setEditReflection(e.target.value)} placeholder="感想" rows={1}
                className="w-full px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs outline-none focus:border-[#0A84FF] transition-colors duration-200 resize-none" />
              <div className="flex justify-end gap-1.5">
                <button onClick={onCancelEdit} className="p-1 rounded text-white/25 hover:text-white/50 hover:bg-white/5 transition-colors duration-150"><X size={13} /></button>
                <button onClick={onSaveEdit} disabled={!editContent.trim()} className="p-1 rounded text-[#0A84FF] hover:bg-[#0A84FF]/10 disabled:opacity-30 transition-colors duration-150"><Check size={13} /></button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/[.02] transition-colors duration-150">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/75 truncate leading-relaxed">{item.content}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {item.source && <span className="text-[9px] text-white/20">{item.source}</span>}
                  {item.tags.slice(0, 2).map(tag => <span key={tag} className="text-[9px] text-white/20">#{tag}</span>)}
                  {[1,2,3].map(s => (
                    <button key={s} onClick={() => onSetImpact(item.id, s)} className="transition-transform duration-150 motion-safe:hover:scale-110">
                      <Star size={9} className={s <= item.impact ? 'text-yellow-400/50 fill-yellow-400/50' : 'text-white/[.06] hover:text-white/15'} />
                    </button>
                  ))}
                  <button onClick={() => onToggleFavorite(item.id)} className="transition-transform duration-150 motion-safe:hover:scale-110">
                    <Heart size={9} className={item.isFavorite ? 'text-red-400/70 fill-red-400/70' : 'text-white/[.06] hover:text-white/20'} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button onClick={() => onStartEdit(item)} className="p-1 rounded text-white/15 hover:text-white/50 hover:bg-white/5 transition-colors duration-150"><Pencil size={12} /></button>
                <button onClick={() => { if (confirm('删除这条记录？')) onRemove(item.id) }} className="p-1 rounded text-white/15 hover:text-red-400 hover:bg-red-400/5 transition-colors duration-150"><Trash2 size={12} /></button>
              </div>
            </div>
          )}
        </div>
      ))}
    </>
  )
}
