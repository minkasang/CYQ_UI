// 人生图谱 Section — 安静漫游 + 锚定改变的第一版界面
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Anchor,
  ArrowRight,
  BookOpen,
  Check,
  Compass,
  Heart,
  Layers,
  Pencil,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  X,
} from 'lucide-react'
import { useInspirationStore } from '../../../store/useInspirationStore'
import { useInspirationTagStore } from '../../../store/useInspirationTagStore'
import type {
  ActionExperiment,
  ActionExperimentStatus,
  InspirationItem,
  InspirationKind,
  LifeDimension,
} from '../../../types'
import type { LiquidGlassConfig } from '../../../lib/liquid-glass'

const KIND_OPTIONS: Array<{ value: InspirationKind; label: string; hint: string }> = [
  { value: 'fragment', label: '碎片', hint: '先放进来' },
  { value: 'quote', label: '摘录', hint: '来自他处' },
  { value: 'insight', label: '洞察', hint: '看见了什么' },
  { value: 'principle', label: '原则', hint: '想反复记住' },
  { value: 'pattern', label: '模式', hint: '反复出现' },
  { value: 'action', label: '行动', hint: '准备改变' },
]

const DIMENSION_OPTIONS: Array<{ value: LifeDimension; label: string }> = [
  { value: 'values', label: '价值观' },
  { value: 'relationship', label: '关系' },
  { value: 'work', label: '工作' },
  { value: 'emotion', label: '情绪' },
  { value: 'body', label: '身体' },
  { value: 'learning', label: '学习' },
  { value: 'creation', label: '创造' },
  { value: 'principle', label: '原则' },
  { value: 'other', label: '其他' },
]

const ACTION_STATUS_LABELS: Record<ActionExperimentStatus, string> = {
  planned: '准备',
  active: '进行中',
  done: '已完成',
  paused: '暂停',
}

const FIELD_INPUT_CLASS = 'rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70 outline-none transition placeholder:text-white/25 focus:border-[#0A84FF]/70 focus:ring-1 focus:ring-[#0A84FF]/40'
const FIELD_TEXTAREA_CLASS = `${FIELD_INPUT_CLASS} w-full resize-none leading-6`

type SortKey = 'newest' | 'oldest' | 'impact-high' | 'impact-low'
type Mode = 'wander' | 'anchor'

interface InspirationSectionProps {
  registerPanel: (el: HTMLElement | null, overrides?: Partial<LiquidGlassConfig>) => void
}

interface TagInputProps {
  tags: string[]
  value: string
  onChange: (value: string) => void
  onAdd: (value: string) => void
  onRemove: (tag: string) => void
}

interface EditState {
  content: string
  source: string
  tags: string[]
  tagInput: string
  reflection: string
  kind: InspirationKind
  dimensions: LifeDimension[]
  insight: string
  principle: string
  experimentTitle: string
  experimentTrigger: string
  experimentAction: string
}

function getKindLabel(kind?: InspirationKind): string {
  return KIND_OPTIONS.find(option => option.value === (kind ?? 'fragment'))?.label ?? '碎片'
}

function getDimensionLabel(dimension: LifeDimension): string {
  return DIMENSION_OPTIONS.find(option => option.value === dimension)?.label ?? dimension
}

function buildActionExperiment(
  title: string,
  trigger: string,
  action: string,
  previous?: ActionExperiment
): ActionExperiment | undefined {
  if (!title.trim() || !action.trim()) return undefined
  return {
    title: title.trim(),
    trigger: trigger.trim() || undefined,
    action: action.trim(),
    status: previous?.status ?? 'planned',
    createdAt: previous?.createdAt ?? Date.now(),
    completedAt: previous?.completedAt,
  }
}

export function InspirationSection({ registerPanel }: InspirationSectionProps) {
  const items = useInspirationStore(s => s.items)
  const add = useInspirationStore(s => s.add)
  const remove = useInspirationStore(s => s.remove)
  const update = useInspirationStore(s => s.update)
  const updateActionExperiment = useInspirationStore(s => s.updateActionExperiment)
  const toggleFavorite = useInspirationStore(s => s.toggleFavorite)
  const setImpact = useInspirationStore(s => s.setImpact)
  const markReviewed = useInspirationStore(s => s.markReviewed)
  const getNextReview = useInspirationStore(s => s.getNextReview)
  const ensureTag = useInspirationTagStore(s => s.ensure)

  const [mode, setMode] = useState<Mode>('wander')
  const [current, setCurrent] = useState<InspirationItem | null>(null)
  const [fading, setFading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('newest')
  const [editingId, setEditingId] = useState<string | null>(null)

  const [content, setContent] = useState('')
  const [source, setSource] = useState('')
  const [tagList, setTagList] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [reflection, setReflection] = useState('')
  const [kind, setKind] = useState<InspirationKind>('fragment')
  const [dimensions, setDimensions] = useState<LifeDimension[]>([])
  const [insight, setInsight] = useState('')
  const [principle, setPrinciple] = useState('')
  const [experimentTitle, setExperimentTitle] = useState('')
  const [experimentTrigger, setExperimentTrigger] = useState('')
  const [experimentAction, setExperimentAction] = useState('')

  const [editState, setEditState] = useState<EditState>({
    content: '',
    source: '',
    tags: [],
    tagInput: '',
    reflection: '',
    kind: 'fragment',
    dimensions: [],
    insight: '',
    principle: '',
    experimentTitle: '',
    experimentTrigger: '',
    experimentAction: '',
  })

  useEffect(() => {
    if (items.length > 0 && !current) setCurrent(getNextReview())
  }, [items.length, current, getNextReview])

  useEffect(() => {
    if (!current) return
    const updated = items.find(item => item.id === current.id)
    if (updated) setCurrent(updated)
  }, [items, current?.id])

  useEffect(() => {
    items.forEach(item => item.tags.forEach(tag => ensureTag(tag)))
  }, [items, ensureTag])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const list = query
      ? items.filter(item => {
          const dimensionText = (item.dimensions ?? []).map(getDimensionLabel).join(' ')
          return [
            item.content,
            item.source,
            item.reflection,
            item.insight,
            item.principle,
            item.actionExperiment?.title,
            item.actionExperiment?.action,
            getKindLabel(item.kind),
            dimensionText,
            ...item.tags,
          ].some(value => value?.toLowerCase().includes(query))
        })
      : [...items]

    return list.sort((a, b) => {
      switch (sortKey) {
        case 'oldest':
          return a.createdAt - b.createdAt
        case 'impact-high':
          return b.impact - a.impact || b.createdAt - a.createdAt
        case 'impact-low':
          return a.impact - b.impact || b.createdAt - a.createdAt
        default:
          return b.createdAt - a.createdAt
      }
    })
  }, [items, search, sortKey])

  const visibleItems = filteredItems.slice(0, showAll ? undefined : 6)

  const dimensionStats = useMemo(() => {
    const counts = new Map<LifeDimension, number>()
    items.forEach(item => (item.dimensions ?? []).forEach(dimension => counts.set(dimension, (counts.get(dimension) ?? 0) + 1)))
    return Array.from(counts.entries())
      .map(([dimension, count]) => ({ dimension, label: getDimensionLabel(dimension), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [items])

  const tagStats = useMemo(() => {
    const counts = new Map<string, number>()
    items.forEach(item => item.tags.forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1)))
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [items])

  const principles = useMemo(() => items.filter(item => item.principle?.trim()).slice(0, 4), [items])
  const actionItems = useMemo(
    () => items.filter(item => item.actionExperiment && item.actionExperiment.status !== 'done').slice(0, 4),
    [items]
  )

  const resetDraft = () => {
    setContent('')
    setSource('')
    setTagList([])
    setTagInput('')
    setReflection('')
    setKind('fragment')
    setDimensions([])
    setInsight('')
    setPrinciple('')
    setExperimentTitle('')
    setExperimentTrigger('')
    setExperimentAction('')
    setShowAdvanced(false)
  }

  const handleNext = useCallback(() => {
    setFading(true)
    window.setTimeout(() => {
      if (current) markReviewed(current.id)
      setCurrent(getNextReview())
      setFading(false)
    }, 180)
  }, [current, markReviewed, getNextReview])

  const handleAdd = () => {
    if (!content.trim()) return
    const item = add({
      content,
      source,
      tags: tagList,
      reflection,
      kind,
      dimensions,
      insight,
      principle,
      actionExperiment: experimentTitle.trim() && experimentAction.trim()
        ? { title: experimentTitle, trigger: experimentTrigger, action: experimentAction }
        : undefined,
    })
    setCurrent(item)
    resetDraft()
  }

  const addTag = (tag: string) => {
    const value = tag.trim()
    if (!value || tagList.includes(value)) return
    ensureTag(value)
    setTagList([...tagList, value])
    setTagInput('')
  }

  const toggleDimension = (value: LifeDimension) => {
    setDimensions(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value])
  }

  const startEdit = (item: InspirationItem) => {
    const action = item.actionExperiment
    setEditingId(item.id)
    setEditState({
      content: item.content,
      source: item.source ?? '',
      tags: item.tags,
      tagInput: '',
      reflection: item.reflection ?? '',
      kind: item.kind ?? 'fragment',
      dimensions: item.dimensions ?? [],
      insight: item.insight ?? '',
      principle: item.principle ?? '',
      experimentTitle: action?.title ?? '',
      experimentTrigger: action?.trigger ?? '',
      experimentAction: action?.action ?? '',
    })
  }

  const saveEdit = () => {
    if (!editingId || !editState.content.trim()) return
    const previous = items.find(item => item.id === editingId)
    update(editingId, {
      content: editState.content,
      source: editState.source,
      tags: editState.tags,
      reflection: editState.reflection,
      kind: editState.kind,
      dimensions: editState.dimensions,
      insight: editState.insight,
      principle: editState.principle,
      actionExperiment: buildActionExperiment(
        editState.experimentTitle,
        editState.experimentTrigger,
        editState.experimentAction,
        previous?.actionExperiment
      ),
    })
    setEditingId(null)
  }

  const updateEditTags = (tag: string) => {
    const value = tag.trim()
    if (!value || editState.tags.includes(value)) return
    ensureTag(value)
    setEditState(prev => ({ ...prev, tags: [...prev.tags, value], tagInput: '' }))
  }

  const toggleEditDimension = (value: LifeDimension) => {
    setEditState(prev => ({
      ...prev,
      dimensions: prev.dimensions.includes(value)
        ? prev.dimensions.filter(item => item !== value)
        : [...prev.dimensions, value],
    }))
  }

  return (
    <div className="space-y-5">
      <header className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-5">
        <section ref={(el) => registerPanel(el, { cornerRadius: 28 })} className="rounded-[28px] overflow-hidden">
          <div className="relative min-h-[360px] px-8 py-8 md:px-10 md:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,rgba(10,132,255,0.12),transparent_42%)]" />
            <div className="relative z-10 flex h-full min-h-[300px] flex-col">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.28em] text-white/35">Life Atlas</p>
                  <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">人生图谱</h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">记录那些会慢慢改变你的东西。先安静地留下，准备好时再把它变成方向。</p>
                </div>
                <ModeSwitch mode={mode} onChange={setMode} />
              </div>

              <div className="mt-auto">
                {current ? (
                  <div className={`transition-opacity duration-300 ${fading ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="mb-5 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-xs text-white/55">{getKindLabel(current.kind)}</span>
                      {(current.dimensions ?? []).slice(0, 3).map(dimension => (
                        <span key={dimension} className="rounded-full bg-[#0A84FF]/10 px-3 py-1 text-xs text-[#8ec5ff]">{getDimensionLabel(dimension)}</span>
                      ))}
                    </div>
                    <blockquote className="max-w-3xl text-3xl font-medium leading-tight tracking-[-0.035em] text-white/95 md:text-5xl">
                      「{current.content}」
                    </blockquote>
                    {(current.insight || current.reflection) && (
                      <p className="mt-5 max-w-2xl text-sm leading-6 text-white/48">{current.insight || current.reflection}</p>
                    )}
                    <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-white/[.06] pt-5">
                      {current.source && <span className="text-sm text-white/35">来自 {current.source}</span>}
                      <ImpactStars value={current.impact} onSet={(value) => setImpact(current.id, value)} />
                      <button onClick={() => toggleFavorite(current.id)} className="rounded-full p-1 text-white/25 transition hover:text-red-300 focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50">
                        <Heart size={20} className={current.isFavorite ? 'fill-red-400 text-red-400' : ''} />
                      </button>
                      <button onClick={handleNext} className="ml-auto inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/35 transition hover:border-white/20 hover:text-white/60">
                        <RefreshCw size={14} /> 换一条
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-14 text-center">
                    <p className="text-xl font-medium text-white/70">先不用整理</p>
                    <p className="mt-2 text-sm text-white/35">写下第一件想留下的东西。</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <AtlasPanel
          registerPanel={registerPanel}
          itemCount={items.length}
          principles={principles.length}
          actions={actionItems.length}
          dimensionStats={dimensionStats}
          tagStats={tagStats}
        />
      </header>

      <main className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl">
          <div className="space-y-4 p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/28">Inbox</p>
                <h3 className="mt-1 text-xl font-semibold text-white/90">收集箱</h3>
                <p className="mt-1 text-sm text-white/35">入口要轻，之后再慢慢提炼。</p>
              </div>
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/40 transition hover:text-white/65">
                {showAdvanced || mode === 'anchor' ? '收起提炼' : '展开提炼'}
              </button>
            </div>

            <textarea
              value={content}
              onChange={event => setContent(event.target.value)}
              placeholder="感悟、摘录、提醒、痛苦时的念头、想成为怎样的人……"
              rows={4}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-base leading-7 text-white outline-none transition placeholder:text-white/25 focus:border-[#0A84FF]/70 focus:ring-1 focus:ring-[#0A84FF]/40"
              onKeyDown={event => {
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && content.trim()) handleAdd()
              }}
            />

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input value={source} onChange={event => setSource(event.target.value)} placeholder="来源（可选）" className={FIELD_INPUT_CLASS} />
              <TagInput tags={tagList} value={tagInput} onChange={setTagInput} onAdd={addTag} onRemove={tag => setTagList(tagList.filter(item => item !== tag))} />
            </div>

            <OptionGroup title="这更像什么？">
              {KIND_OPTIONS.map(option => (
                <OptionButton key={option.value} active={kind === option.value} onClick={() => setKind(option.value)}>
                  <span>{option.label}</span>
                  <small>{option.hint}</small>
                </OptionButton>
              ))}
            </OptionGroup>

            <OptionGroup title="它属于哪些人生维度？">
              {DIMENSION_OPTIONS.map(option => (
                <button key={option.value} onClick={() => toggleDimension(option.value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${
                  dimensions.includes(option.value)
                    ? 'border-[#0A84FF]/50 bg-[#0A84FF]/15 text-[#9fd0ff]'
                    : 'border-white/10 bg-white/[.03] text-white/35 hover:text-white/60'
                }`}>
                  {option.label}
                </button>
              ))}
            </OptionGroup>

            {(showAdvanced || mode === 'anchor') && (
              <div className="space-y-3 rounded-2xl border border-white/[.08] bg-white/[.03] p-4">
                <textarea value={reflection} onChange={event => setReflection(event.target.value)} placeholder="我的感想（可选）" rows={2} className={FIELD_TEXTAREA_CLASS} />
                <textarea value={insight} onChange={event => setInsight(event.target.value)} placeholder="它提醒我什么？（洞察）" rows={2} className={FIELD_TEXTAREA_CLASS} />
                <textarea value={principle} onChange={event => setPrinciple(event.target.value)} placeholder="如果要变成一句原则，会是什么？" rows={2} className={FIELD_TEXTAREA_CLASS} />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <input value={experimentTitle} onChange={event => setExperimentTitle(event.target.value)} placeholder="小行动实验" className={FIELD_INPUT_CLASS} />
                  <input value={experimentTrigger} onChange={event => setExperimentTrigger(event.target.value)} placeholder="如果遇到……" className={FIELD_INPUT_CLASS} />
                  <input value={experimentAction} onChange={event => setExperimentAction(event.target.value)} placeholder="我就……" className={FIELD_INPUT_CLASS} />
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={!content.trim()}
              className="w-full rounded-2xl bg-[#0A84FF] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0077ED] disabled:cursor-not-allowed disabled:opacity-30"
            >
              保存到人生图谱
            </button>
          </div>
        </section>

        <section className="space-y-5">
          <PrinciplesPanel registerPanel={registerPanel} items={principles} />
          <ActionsPanel registerPanel={registerPanel} items={actionItems} onStatusChange={updateActionExperiment} />
        </section>
      </main>

      <section ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl">
        <div className="p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-white/28">Archive</p>
              <h3 className="mt-1 text-xl font-semibold text-white/90">记录流</h3>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-2">
              <Search size={16} className="text-white/25" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="搜索内容、洞察、标签…" className="w-full bg-transparent text-sm text-white/70 outline-none placeholder:text-white/25 md:w-56" />
              <button onClick={() => setSortKey(sortKey === 'newest' ? 'oldest' : 'newest')} className="text-xs text-white/30 transition hover:text-white/60">
                {sortKey === 'newest' ? '最新' : '最早'}
              </button>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-sm text-white/30">没有匹配的记录</div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {visibleItems.map(item => (
                <RecordCard
                  key={item.id}
                  item={item}
                  editing={editingId === item.id}
                  editState={editState}
                  onEditStateChange={setEditState}
                  onToggleEditDimension={toggleEditDimension}
                  onAddEditTag={updateEditTags}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={() => setEditingId(null)}
                  onToggleFavorite={toggleFavorite}
                  onSetImpact={setImpact}
                  onRemove={remove}
                />
              ))}
            </div>
          )}

          {filteredItems.length > 6 && !showAll && (
            <button onClick={() => setShowAll(true)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-sm text-white/35 transition hover:text-white/60">
              查看全部 {filteredItems.length} 条 <ArrowRight size={16} />
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="flex rounded-full border border-white/10 bg-black/20 p-1">
      <button onClick={() => onChange('wander')} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${mode === 'wander' ? 'bg-white/12 text-white/80' : 'text-white/35 hover:text-white/60'}`}>
        <Compass size={14} /> 漫游
      </button>
      <button onClick={() => onChange('anchor')} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition ${mode === 'anchor' ? 'bg-[#0A84FF]/25 text-[#9fd0ff]' : 'text-white/35 hover:text-white/60'}`}>
        <Anchor size={14} /> 锚定
      </button>
    </div>
  )
}

function AtlasPanel({
  registerPanel,
  itemCount,
  principles,
  actions,
  dimensionStats,
  tagStats,
}: {
  registerPanel: InspirationSectionProps['registerPanel']
  itemCount: number
  principles: number
  actions: number
  dimensionStats: Array<{ dimension: LifeDimension; label: string; count: number }>
  tagStats: Array<[string, number]>
}) {
  return (
    <aside ref={(el) => registerPanel(el, { cornerRadius: 28 })} className="rounded-[28px]">
      <div className="flex h-full flex-col p-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.18em] text-white/28">Inner Map</p>
          <h3 className="mt-1 text-xl font-semibold text-white/85">内在图谱</h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Metric label="记录" value={itemCount} icon={<Layers size={15} />} />
          <Metric label="原则" value={principles} icon={<BookOpen size={15} />} />
          <Metric label="行动" value={actions} icon={<Target size={15} />} />
        </div>

        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-white/55">反复出现的维度</h4>
          {dimensionStats.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/28">维度会随着记录慢慢浮现</p>
          ) : (
            dimensionStats.map(stat => (
              <div key={stat.dimension} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/50">{stat.label}</span>
                  <span className="text-white/25">{stat.count}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[.06]">
                  <div className="h-full rounded-full bg-[#0A84FF]/70" style={{ width: `${Math.min(100, stat.count * 18)}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        {tagStats.length > 0 && (
          <div className="mt-6">
            <h4 className="mb-3 text-sm font-medium text-white/55">常见标签</h4>
            <div className="flex flex-wrap gap-2">
              {tagStats.map(([tag, count]) => <span key={tag} className="rounded-full bg-white/[.05] px-2.5 py-1 text-xs text-white/40">#{tag} {count}</span>)}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[.07] bg-white/[.035] p-3">
      <div className="mb-2 text-white/30">{icon}</div>
      <div className="text-2xl font-semibold text-white/85">{value}</div>
      <div className="mt-0.5 text-[11px] text-white/28">{label}</div>
    </div>
  )
}

function PrinciplesPanel({ registerPanel, items }: { registerPanel: InspirationSectionProps['registerPanel']; items: InspirationItem[] }) {
  return (
    <section ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl">
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={17} className="text-yellow-300/70" />
          <h3 className="text-base font-semibold text-white/80">原则提醒</h3>
        </div>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/30">重要原则会在这里慢慢长出来。</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <article key={item.id} className="rounded-2xl border border-white/[.07] bg-white/[.035] p-4">
                <p className="text-sm leading-6 text-white/75">{item.principle}</p>
                <p className="mt-2 line-clamp-1 text-xs text-white/28">来自：{item.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function ActionsPanel({
  registerPanel,
  items,
  onStatusChange,
}: {
  registerPanel: InspirationSectionProps['registerPanel']
  items: InspirationItem[]
  onStatusChange: (id: string, patch: Partial<ActionExperiment> | null) => void
}) {
  return (
    <section ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl">
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Target size={17} className="text-[#8ec5ff]" />
          <h3 className="text-base font-semibold text-white/80">小行动实验</h3>
        </div>
        {items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/30">准备改变时，再给自己一个很小的实验。</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const action = item.actionExperiment
              if (!action) return null
              return (
                <article key={item.id} className="rounded-2xl border border-white/[.07] bg-white/[.035] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white/80">{action.title}</p>
                      {action.trigger && <p className="mt-2 text-xs leading-5 text-white/35">如果：{action.trigger}</p>}
                      <p className="text-xs leading-5 text-white/45">我就：{action.action}</p>
                    </div>
                    <span className="rounded-full bg-[#0A84FF]/12 px-2 py-1 text-[11px] text-[#9fd0ff]">{ACTION_STATUS_LABELS[action.status]}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {(['active', 'done', 'paused'] as ActionExperimentStatus[]).map(status => (
                      <button key={status} onClick={() => onStatusChange(item.id, { status })} className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/35 transition hover:text-white/65">
                        {ACTION_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function RecordCard({
  item,
  editing,
  editState,
  onEditStateChange,
  onToggleEditDimension,
  onAddEditTag,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onToggleFavorite,
  onSetImpact,
  onRemove,
}: {
  item: InspirationItem
  editing: boolean
  editState: EditState
  onEditStateChange: (state: EditState | ((prev: EditState) => EditState)) => void
  onToggleEditDimension: (dimension: LifeDimension) => void
  onAddEditTag: (tag: string) => void
  onStartEdit: (item: InspirationItem) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onToggleFavorite: (id: string) => void
  onSetImpact: (id: string, impact: number) => void
  onRemove: (id: string) => void
}) {
  if (editing) {
    return (
      <article className="rounded-2xl border border-[#0A84FF]/20 bg-[#0A84FF]/[.04] p-4">
        <textarea value={editState.content} onChange={event => onEditStateChange(prev => ({ ...prev, content: event.target.value }))} rows={3} className={FIELD_TEXTAREA_CLASS} />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <input value={editState.source} onChange={event => onEditStateChange(prev => ({ ...prev, source: event.target.value }))} placeholder="来源" className={FIELD_INPUT_CLASS} />
          <TagInput
            tags={editState.tags}
            value={editState.tagInput}
            onChange={value => onEditStateChange(prev => ({ ...prev, tagInput: value }))}
            onAdd={onAddEditTag}
            onRemove={tag => onEditStateChange(prev => ({ ...prev, tags: prev.tags.filter(item => item !== tag) }))}
          />
        </div>
        <OptionGroup title="类型">
          {KIND_OPTIONS.map(option => (
            <button key={option.value} onClick={() => onEditStateChange(prev => ({ ...prev, kind: option.value }))} className={`rounded-full border px-3 py-1.5 text-xs transition ${editState.kind === option.value ? 'border-[#0A84FF]/50 bg-[#0A84FF]/15 text-[#9fd0ff]' : 'border-white/10 text-white/35'}`}>
              {option.label}
            </button>
          ))}
        </OptionGroup>
        <OptionGroup title="维度">
          {DIMENSION_OPTIONS.map(option => (
            <button key={option.value} onClick={() => onToggleEditDimension(option.value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${editState.dimensions.includes(option.value) ? 'border-[#0A84FF]/50 bg-[#0A84FF]/15 text-[#9fd0ff]' : 'border-white/10 text-white/35'}`}>
              {option.label}
            </button>
          ))}
        </OptionGroup>
        <div className="mt-3 space-y-3">
          <textarea value={editState.reflection} onChange={event => onEditStateChange(prev => ({ ...prev, reflection: event.target.value }))} placeholder="感想" rows={2} className={FIELD_TEXTAREA_CLASS} />
          <textarea value={editState.insight} onChange={event => onEditStateChange(prev => ({ ...prev, insight: event.target.value }))} placeholder="洞察" rows={2} className={FIELD_TEXTAREA_CLASS} />
          <textarea value={editState.principle} onChange={event => onEditStateChange(prev => ({ ...prev, principle: event.target.value }))} placeholder="原则提醒" rows={2} className={FIELD_TEXTAREA_CLASS} />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input value={editState.experimentTitle} onChange={event => onEditStateChange(prev => ({ ...prev, experimentTitle: event.target.value }))} placeholder="小行动实验" className={FIELD_INPUT_CLASS} />
            <input value={editState.experimentTrigger} onChange={event => onEditStateChange(prev => ({ ...prev, experimentTrigger: event.target.value }))} placeholder="如果遇到……" className={FIELD_INPUT_CLASS} />
            <input value={editState.experimentAction} onChange={event => onEditStateChange(prev => ({ ...prev, experimentAction: event.target.value }))} placeholder="我就……" className={FIELD_INPUT_CLASS} />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancelEdit} className="rounded-full p-2 text-white/35 transition hover:bg-white/[.06] hover:text-white/65"><X size={17} /></button>
          <button onClick={onSaveEdit} disabled={!editState.content.trim()} className="rounded-full p-2 text-[#8ec5ff] transition hover:bg-[#0A84FF]/10 disabled:opacity-30"><Check size={17} /></button>
        </div>
      </article>
    )
  }

  return (
    <article className="group rounded-2xl border border-white/[.07] bg-white/[.03] p-4 transition hover:border-white/[.13] hover:bg-white/[.045]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white/[.06] px-2.5 py-1 text-[11px] text-white/35">{getKindLabel(item.kind)}</span>
        {(item.dimensions ?? []).slice(0, 2).map(dimension => <span key={dimension} className="rounded-full bg-[#0A84FF]/10 px-2.5 py-1 text-[11px] text-[#8ec5ff]">{getDimensionLabel(dimension)}</span>)}
        {item.isFavorite && <Heart size={13} className="fill-red-400 text-red-400" />}
      </div>
      <p className="line-clamp-3 text-sm leading-6 text-white/78">{item.content}</p>
      {item.insight && <p className="mt-3 border-l border-[#0A84FF]/35 pl-3 text-xs leading-5 text-white/42">{item.insight}</p>}
      {item.principle && <p className="mt-3 rounded-xl bg-yellow-300/[.07] px-3 py-2 text-xs leading-5 text-yellow-100/55">{item.principle}</p>}
      {item.actionExperiment && (
        <p className="mt-3 rounded-xl bg-[#0A84FF]/[.07] px-3 py-2 text-xs leading-5 text-[#9fd0ff]/70">
          {item.actionExperiment.title} · {ACTION_STATUS_LABELS[item.actionExperiment.status]}
        </p>
      )}
      <div className="mt-4 flex items-center gap-3">
        <ImpactStars value={item.impact} onSet={(value) => onSetImpact(item.id, value)} small />
        <button onClick={() => onToggleFavorite(item.id)} className="text-white/20 transition hover:text-red-300"><Heart size={15} className={item.isFavorite ? 'fill-red-400 text-red-400' : ''} /></button>
        <div className="ml-auto flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={() => onStartEdit(item)} className="rounded-full p-2 text-white/22 transition hover:bg-white/[.06] hover:text-white/65"><Pencil size={15} /></button>
          <button onClick={() => { if (window.confirm('删除这条记录？')) onRemove(item.id) }} className="rounded-full p-2 text-white/22 transition hover:bg-red-400/[.08] hover:text-red-300"><Trash2 size={15} /></button>
        </div>
      </div>
    </article>
  )
}

function ImpactStars({ value, onSet, small = false }: { value: number; onSet: (value: number) => void; small?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3].map(star => (
        <button key={star} onClick={() => onSet(star)} className="rounded-full focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50">
          <Star size={small ? 14 : 19} className={star <= value ? 'fill-yellow-400 text-yellow-400' : 'text-white/15 transition hover:text-white/35'} />
        </button>
      ))}
    </div>
  )
}

function OptionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-white/28">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function OptionButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className={`flex min-w-[74px] flex-col rounded-2xl border px-3 py-2 text-left transition ${
      active ? 'border-[#0A84FF]/50 bg-[#0A84FF]/15 text-[#9fd0ff]' : 'border-white/10 bg-white/[.03] text-white/45 hover:text-white/70'
    }`}>
      {children}
    </button>
  )
}

function TagChip({ name, onRemove }: { name: string; onRemove?: () => void }) {
  const color = useInspirationTagStore(s => s.tags.find(tag => tag.name === name)?.color ?? '#0A84FF')
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `${color}18`, borderColor: `${color}30`, color }}>
      {name}
      {onRemove && (
        <button onClick={onRemove} className="transition hover:opacity-70">
          <X size={12} />
        </button>
      )}
    </span>
  )
}

function TagInput({ tags, value, onChange, onAdd, onRemove }: TagInputProps) {
  const allTags = useInspirationTagStore(s => s.tags)
  const ensureTag = useInspirationTagStore(s => s.ensure)
  const suggestions = value.trim()
    ? allTags.filter(tag => tag.name.toLowerCase().includes(value.trim().toLowerCase()) && !tags.includes(tag.name)).slice(0, 5)
    : []

  const handleAdd = (nextValue: string) => {
    const tag = nextValue.trim()
    if (!tag) return
    ensureTag(tag)
    onAdd(tag)
  }

  return (
    <div className="space-y-2">
      {tags.length > 0 && <div className="flex flex-wrap gap-1.5">{tags.map(tag => <TagChip key={tag} name={tag} onRemove={() => onRemove(tag)} />)}</div>}
      <div className="relative">
        <input
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAdd(value)
            }
          }}
          placeholder="标签"
          className={`${FIELD_INPUT_CLASS} w-full`}
        />
        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-white/10 bg-[#16171b] shadow-xl">
            {suggestions.map(suggestion => (
              <button key={suggestion.name} onClick={() => handleAdd(suggestion.name)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-white/60 transition hover:bg-white/[.05]">
                <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: suggestion.color }} />
                {suggestion.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
