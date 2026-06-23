// 底部浮动 Dock — macOS 风格导航
// 支持拖拽排序 + 长按切换图标 + 图标选择持久化

import { useEffect, useRef, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getGlobalLG } from '../../hooks/useLiquidGlass'
import {
  House, HouseLine, HouseSimple,
  Lightbulb, LightbulbFilament, Flame, Star,
  CheckSquare, CheckCircle, ListChecks, ClipboardText,
  BookOpen, Notebook, PencilLine, Scroll,
  Image, ImageSquare, Mountains, PictureInPicture,
  Sparkle, Brain, Lightning, MagicWand,
  Chats, ChatTeardrop, ChatCentered, ChatCircle,
  Robot, Detective, UserCircleGear,
  PaintBrush, Palette, PaintBucket, DropHalf,
  Gear, GearSix, Sliders, Wrench,
  X,
} from '@phosphor-icons/react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── 图标库 ──
type IconKey = string
const ICON_FACTORY: Record<IconKey, (s: number) => ReactNode> = {
  house: (s) => <House size={s} />, houseLine: (s) => <HouseLine size={s} />, houseSimple: (s) => <HouseSimple size={s} />,
  lightbulb: (s) => <Lightbulb size={s} />, lightbulbFilament: (s) => <LightbulbFilament size={s} />, flame: (s) => <Flame size={s} />, star: (s) => <Star size={s} />,
  checkSquare: (s) => <CheckSquare size={s} />, checkCircle: (s) => <CheckCircle size={s} />, listChecks: (s) => <ListChecks size={s} />, clipboardText: (s) => <ClipboardText size={s} />,
  bookOpen: (s) => <BookOpen size={s} />, notebook: (s) => <Notebook size={s} />, pencilLine: (s) => <PencilLine size={s} />, scroll: (s) => <Scroll size={s} />,
  image: (s) => <Image size={s} />, imageSquare: (s) => <ImageSquare size={s} />, mountains: (s) => <Mountains size={s} />, pictureInPicture: (s) => <PictureInPicture size={s} />,
  sparkle: (s) => <Sparkle size={s} />, brain: (s) => <Brain size={s} />, lightning: (s) => <Lightning size={s} />, magicWand: (s) => <MagicWand size={s} />,
  chats: (s) => <Chats size={s} />, chatTeardrop: (s) => <ChatTeardrop size={s} />, chatCentered: (s) => <ChatCentered size={s} />, chatCircle: (s) => <ChatCircle size={s} />,
  robot: (s) => <Robot size={s} />, detective: (s) => <Detective size={s} />, userCircleGear: (s) => <UserCircleGear size={s} />,
  paintBrush: (s) => <PaintBrush size={s} />, palette: (s) => <Palette size={s} />, paintBucket: (s) => <PaintBucket size={s} />, dropHalf: (s) => <DropHalf size={s} />,
  gear: (s) => <Gear size={s} />, gearSix: (s) => <GearSix size={s} />, sliders: (s) => <Sliders size={s} />, wrench: (s) => <Wrench size={s} />,
}

const ICON_OPTIONS: Record<string, IconKey[]> = {
  home: ['house', 'houseLine', 'houseSimple'],
  inspiration: ['lightbulb', 'lightbulbFilament', 'flame', 'star'],
  todo: ['checkSquare', 'checkCircle', 'listChecks', 'clipboardText'],
  diary: ['bookOpen', 'notebook', 'pencilLine', 'scroll'],
  wallpaper: ['image', 'imageSquare', 'mountains', 'pictureInPicture'],
  ai: ['sparkle', 'brain', 'lightning', 'magicWand'],
  chat: ['chats', 'chatTeardrop', 'chatCentered', 'chatCircle'],
  agents: ['robot', 'detective', 'userCircleGear'],
  theme: ['paintBrush', 'palette', 'paintBucket', 'dropHalf'],
  settings: ['gear', 'gearSix', 'sliders', 'wrench'],
}

const DEFAULT_ICONS: Record<string, IconKey> = {
  home: 'house', inspiration: 'lightbulb', todo: 'checkSquare', diary: 'bookOpen',
  wallpaper: 'image', ai: 'sparkle', chat: 'chats', agents: 'robot',
  theme: 'paintBrush', settings: 'gear',
}

function loadIcons(): Record<string, IconKey> {
  try {
    const saved = localStorage.getItem('pw-dock-icons')
    if (saved) return { ...DEFAULT_ICONS, ...JSON.parse(saved) }
  } catch { /* ignore */ }
  return { ...DEFAULT_ICONS }
}

// ── Dock Item ──
const DEFAULT_ORDER = ['home', 'inspiration', 'todo', 'diary', 'wallpaper', 'ai', 'chat', 'agents', 'theme', 'settings']
const ORDER_KEY = 'pw-dock-order'
const S = 22

interface DockItemDef {
  id: string; to: string; label: string
}

const ITEM_DEFS: Record<string, DockItemDef> = {
  home: { id: 'home', to: '/', label: '首页' },
  inspiration: { id: 'inspiration', to: '/inspiration', label: '灵感' },
  todo: { id: 'todo', to: '/todo', label: '待办' },
  diary: { id: 'diary', to: '/diary', label: '日记' },
  wallpaper: { id: 'wallpaper', to: '/wallpaper', label: '壁纸' },
  ai: { id: 'ai', to: '/ai', label: 'AI 总结' },
  chat: { id: 'chat', to: '/ai', label: 'AI 聊天' },
  agents: { id: 'agents', to: '/agents', label: '智能体' },
  settings: { id: 'settings', to: '/settings', label: '设置' },
  theme: { id: 'theme', to: '/theme', label: '主题' },
}

function loadOrder(): string[] {
  try {
    const saved = localStorage.getItem(ORDER_KEY)
    if (saved) {
      const arr = JSON.parse(saved) as string[]
      if (arr.length === DEFAULT_ORDER.length && DEFAULT_ORDER.every(id => arr.includes(id))) return arr
    }
  } catch { /* ignore */ }
  return DEFAULT_ORDER
}

// ── Dock 主体 ──
export function Dock() {
  const location = useLocation()
  const navigate = useNavigate()
  const dockRef = useRef<HTMLDivElement>(null)
  const [order, setOrder] = useState<string[]>(loadOrder)
  const [icons, setIcons] = useState<Record<string, IconKey>>(loadIcons)

  // Dock 导航 — 直接跳转路由
  const handleNavigate = useCallback((item: { id: string; to: string }) => {
    if (item.id === 'home' && location.pathname === '/') {
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (location.pathname === item.to) return
    navigate(item.to)
  }, [location.pathname, navigate])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    const el = dockRef.current; if (!el) return
    let tries = 0
    const tryRegister = setInterval(() => {
      const lg = getGlobalLG()
      if (lg) { clearInterval(tryRegister); if (!lg.panels.find(p => p.el === el)) lg.addPanel(el, { cornerRadius: 20, blurAmount: 3 }) }
      else if (++tries > 30) clearInterval(tryRegister)
    }, 100)
    return () => { clearInterval(tryRegister); const lg = getGlobalLG(); if (lg) { const idx = lg.panels.findIndex(p => p.el === el); if (idx >= 0) lg.panels.splice(idx, 1) } }
  }, [])

  const setIcon = useCallback((id: string, key: IconKey) => {
    const next = { ...icons, [id]: key }
    setIcons(next)
    localStorage.setItem('pw-dock-icons', JSON.stringify(next))
  }, [icons])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = order.indexOf(active.id as string)
    const newIdx = order.indexOf(over.id as string)
    const next = [...order]; next.splice(oldIdx, 1); next.splice(newIdx, 0, active.id as string)
    setOrder(next); localStorage.setItem(ORDER_KEY, JSON.stringify(next))
  }

  const items = order.map(id => ({ ...ITEM_DEFS[id], iconKey: icons[id] || DEFAULT_ICONS[id] })).filter(Boolean)

  return (
    <div ref={dockRef} className="fixed z-50 flex items-center gap-1 bottom-3 left-1/2 -translate-x-1/2 px-3 py-2 h-12 rounded-dock bg-macos-dock backdrop-blur-[20px] backdrop-saturate-[180%] shadow-dock">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={horizontalListSortingStrategy}>
          {items.map(item => (
            <SortableDockItem
              key={item.id}
              item={item}
              iconNode={ICON_FACTORY[item.iconKey]?.(S)}
              iconKey={item.iconKey}
              isActive={location.pathname === item.to || (item.id === 'home' && location.pathname === '/')}
              onClick={() => handleNavigate(item)}
              isLink={item.id !== 'home'}
              to={item.to}
              onIconChange={(key) => setIcon(item.id, key)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ── 单个 Dock 项（长按弹出图标选择器） ──
function SortableDockItem({ item, iconNode, iconKey, isActive, onClick, isLink, to, onIconChange }: {
  item: DockItemDef
  iconNode: ReactNode
  iconKey: IconKey
  isActive: boolean; onClick: () => void; isLink: boolean; to: string
  onIconChange: (key: IconKey) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [pickerOpen, setPickerOpen] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const moved = useRef(false)

  const clearTimer = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null } }

  const onPointerDown = () => {
    moved.current = false
    longPressTimer.current = setTimeout(() => {
      if (!moved.current) setPickerOpen(true)
    }, 500)
  }
  const onPointerMove = () => { moved.current = true; clearTimer() }
  const onPointerUp = () => { clearTimer() }

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : undefined, zIndex: isDragging ? 60 : undefined }
  const baseClass = "relative flex flex-col items-center justify-center w-9 h-9 rounded-dock-item transition-all duration-150 ease-apple hover:bg-white/10 hover:scale-110 cursor-grab active:cursor-grabbing"
  const options = ICON_OPTIONS[item.id] || []

  const inner = (
    <>
      <span className={`transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-50'}`}>{iconNode}</span>
      {isActive && <span className="absolute -bottom-0.5 w-[3px] h-[3px] rounded-full bg-[#0A84FF]" />}
    </>
  )

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={clearTimer}>
      {isLink ? (
        <NavLink to={to} className={baseClass} onClick={(e) => { if (isDragging) e.preventDefault() }}>{inner}</NavLink>
      ) : (
        <button onClick={onClick} className={baseClass}>{inner}</button>
      )}

      {/* 图标选择器 */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center pb-20" onClick={() => setPickerOpen(false)}>
          <div className="bg-[#1c1c1e]/98 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl p-3 flex gap-1.5" onClick={e => e.stopPropagation()}>
            {options.map(key => (
              <button key={key} onClick={() => { onIconChange(key); setPickerOpen(false) }}
                className={`w-9 h-9 flex items-center justify-center rounded-lg transition ${key === iconKey ? 'bg-white/15' : 'hover:bg-white/8'}`}>
                {ICON_FACTORY[key]?.(20)}
              </button>
            ))}
            <div className="w-px bg-white/[0.08] mx-1" />
            <button onClick={() => setPickerOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/8 text-[var(--text-tertiary)]"><X size={18} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
