// 底部浮动 Dock — macOS 风格导航
// 规范来源：doc/macos-design-spec-v1.md §4
// 除首页和设置外，所有模块图标点击后滚动到首页对应 section
// 支持拖拽调整图标顺序（@dnd-kit）

import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { getGlobalLG } from '../../hooks/useLiquidGlass'
import { useLayoutRegistry } from '../../store/useLayoutRegistry'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DockItem {
  id: string
  to: string
  icon: string
  label: string
  scrollTo?: string
}

const DEFAULT_ORDER = ['home', 'inspiration', 'todo', 'diary', 'wallpaper', 'ai', 'chat', 'agents', 'theme', 'settings']

const ITEM_MAP: Record<string, DockItem> = {
  home: { id: 'home', to: '/', icon: '🏠', label: '首页' },
  inspiration: { id: 'inspiration', to: '/', icon: '💡', label: '灵感', scrollTo: 'inspiration' },
  todo: { id: 'todo', to: '/', icon: '✅', label: '待办', scrollTo: 'todo' },
  diary: { id: 'diary', to: '/', icon: '📖', label: '日记', scrollTo: 'diary' },
  wallpaper: { id: 'wallpaper', to: '/', icon: '🖼', label: '壁纸', scrollTo: 'wallpaper' },
  ai: { id: 'ai', to: '/', icon: '✨', label: 'AI 总结', scrollTo: 'ai' },
  chat: { id: 'chat', to: '/', icon: '💬', label: 'AI 聊天', scrollTo: 'chat' },
  agents: { id: 'agents', to: '/', icon: '🤖', label: '智能体', scrollTo: 'agents' },
  settings: { id: 'settings', to: '/settings', icon: '⚙️', label: '设置' },
  theme: { id: 'theme', to: '/theme', icon: '🎨', label: '主题' },
}

const ORDER_KEY = 'pw-dock-order'

function loadOrder(): string[] {
  try {
    const saved = localStorage.getItem(ORDER_KEY)
    if (saved) {
      const arr = JSON.parse(saved) as string[]
      // 确保所有 id 都在
      if (arr.length === DEFAULT_ORDER.length && DEFAULT_ORDER.every(id => arr.includes(id))) {
        return arr
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_ORDER
}

function saveOrder(order: string[]) {
  localStorage.setItem(ORDER_KEY, JSON.stringify(order))
}

export function Dock() {
  const location = useLocation()
  const navigate = useNavigate()
  const dockRef = useRef<HTMLDivElement>(null)
  const [order, setOrder] = useState<string[]>(loadOrder)
  const activeLayout = useLayoutRegistry(s => s.activeId)
  const isBento = activeLayout === 'bento'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // 注册为液态玻璃面板
  useEffect(() => {
    const el = dockRef.current
    if (!el) return
    let tries = 0
    const tryRegister = setInterval(() => {
      const lg = getGlobalLG()
      if (lg) {
        clearInterval(tryRegister)
        if (!lg.panels.find(p => p.el === el)) {
          lg.addPanel(el, { cornerRadius: 20, blurAmount: 3 })
        }
      } else if (++tries > 30) {
        clearInterval(tryRegister)
      }
    }, 100)
    return () => {
      clearInterval(tryRegister)
      const lg = getGlobalLG()
      if (lg) {
        const idx = lg.panels.findIndex(p => p.el === el)
        if (idx >= 0) lg.panels.splice(idx, 1)
      }
    }
  }, [])

  const scrollToSection = (id: string) => {
    // Bento 布局：派发手风琴展开事件
    if (isBento && location.pathname === '/') {
      window.dispatchEvent(new CustomEvent('bento-accordion-expand', { detail: { id } }))
      return
    }
    // 原有逻辑：滚动到 section
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  const items = order.map(id => ITEM_MAP[id]).filter(Boolean)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = order.indexOf(active.id as string)
    const newIndex = order.indexOf(over.id as string)
    const newOrder = [...order]
    newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, active.id as string)
    setOrder(newOrder)
    saveOrder(newOrder)
  }

  return (
    <div
      ref={dockRef}
      className="fixed z-50 flex items-center gap-1 bottom-3 left-1/2 -translate-x-1/2 px-3 py-2 h-12 rounded-dock bg-macos-dock backdrop-blur-[20px] backdrop-saturate-[180%] shadow-dock"
    >
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={horizontalListSortingStrategy}>
          {items.map(item => (
            <SortableDockItem
              key={item.id}
              item={item}
              isActive={
                item.scrollTo
                  ? location.pathname === '/'
                  : item.id === 'settings'
                    ? location.pathname.startsWith('/settings')
                    : location.pathname === item.to
              }
              onClick={() => {
                if (item.id === 'home') {
                  if (location.pathname === '/') {
                    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
                  } else {
                    navigate('/')
                  }
                } else if (item.scrollTo) {
                  scrollToSection(item.scrollTo)
                }
              }}
              isLink={!item.scrollTo && item.id !== 'home'}
              to={item.to}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableDockItem({ item, isActive, onClick, isLink, to }: {
  item: DockItem
  isActive: boolean
  onClick: () => void
  isLink: boolean
  to: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    zIndex: isDragging ? 60 : undefined,
  }

  const baseClass = "relative flex flex-col items-center justify-center w-9 h-9 rounded-dock-item transition-all duration-150 ease-apple hover:bg-white/10 hover:scale-110 cursor-grab active:cursor-grabbing"

  const inner = (
    <>
      <span className={`text-[20px] transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
        {item.icon}
      </span>
      {isActive && <span className="absolute -bottom-0.5 w-[3px] h-[3px] rounded-full bg-[#0A84FF]" />}
    </>
  )

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {isLink ? (
        <NavLink to={to} className={baseClass} onClick={(e) => { if (isDragging) e.preventDefault() }}>
          {inner}
        </NavLink>
      ) : (
        <button onClick={onClick} className={baseClass}>
          {inner}
        </button>
      )}
    </div>
  )
}
