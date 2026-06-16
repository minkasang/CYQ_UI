// 壁纸管理器
// 给 AI 的话：支持网络图片 URL、本地图片上传、纯色背景
// 本地图片用 base64 存储（v0.1 简化方案）

import { useState, useRef } from 'react'
import { Image as ImageIcon, Link2, Upload, Palette, Trash2, Check, Sparkles } from 'lucide-react'
import { useWallpaperStore } from '../../store/useWallpaperStore'
import { GlassPanel } from '../glass/GlassPanel'
import type { WallpaperType } from '../../types'
import { PRESET_CATEGORIES, type PresetWallpaper } from './presetWallpapers'

const PRESET_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  'linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%)',
  'linear-gradient(135deg, #30d158 0%, #00c896 100%)',
  'linear-gradient(135deg, #ff453a 0%, #ff9f0a 100%)',
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(180deg, #2c3e50 0%, #3498db 100%)',
]

export function WallpaperManager() {
  const current = useWallpaperStore(s => s.current)
  const history = useWallpaperStore(s => s.history)
  const setCurrent = useWallpaperStore(s => s.setCurrent)
  const addCustom = useWallpaperStore(s => s.addCustom)
  const removeFromHistory = useWallpaperStore(s => s.removeFromHistory)

  const [urlInput, setUrlInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [activeTab, setActiveTab] = useState<WallpaperType>('gradient')
  const [activeCategory, setActiveCategory] = useState<keyof typeof PRESET_CATEGORIES>('nature')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理网络 URL 提交
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return
    addCustom('url', urlInput.trim(), nameInput.trim() || '网络壁纸')
    setUrlInput('')
    setNameInput('')
  }

  // 处理本地上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      addCustom('local', dataUrl, file.name.replace(/\.[^.]+$/, ''))
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // 应用预设图片
  const applyPreset = (preset: PresetWallpaper) => {
    addCustom('url', preset.url, preset.name)
  }

  return (
    <div className="space-y-3">
      <GlassPanel cornerRadius={16} padding="20px">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <ImageIcon size={16} /> 添加壁纸
        </h3>

        {/* 标签切换 */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {([
            { value: 'gradient' as WallpaperType, label: '预设渐变', icon: Palette },
            { value: 'preset' as WallpaperType, label: '在线壁纸', icon: Sparkles },
            { value: 'url' as WallpaperType, label: '网络图片', icon: Link2 },
            { value: 'local' as WallpaperType, label: '本地上传', icon: Upload },
          ]).map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              className={`text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === value
                  ? 'bg-blue-500/30 text-white border border-blue-400/50'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
              }`}
            >
              <Icon size={12} /> {label}
            </button>
          ))}
        </div>

        {/* 预设渐变 */}
        {activeTab === 'gradient' && (
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((gradient, idx) => (
              <button
                key={idx}
                onClick={() => addCustom('gradient', gradient, `预设渐变 ${idx + 1}`)}
                className="aspect-video rounded-lg border-2 border-white/10 hover:border-white/40 transition"
                style={{ background: gradient }}
                title={`预设渐变 ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* 在线壁纸（推荐 - 流体玻璃效果最明显） */}
        {activeTab === 'preset' && (
          <div>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {(Object.keys(PRESET_CATEGORIES) as Array<keyof typeof PRESET_CATEGORIES>).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] px-2 py-1 rounded transition ${
                    activeCategory === cat
                      ? 'bg-blue-500/30 text-white border border-blue-400/50'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  {PRESET_CATEGORIES[cat].label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_CATEGORIES[activeCategory].items.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset)}
                  className="relative aspect-video rounded-lg overflow-hidden border-2 border-white/10 hover:border-white/40 transition group"
                  title={preset.name}
                >
                  <img
                    src={preset.thumb}
                    alt={preset.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-1.5">
                    <span className="text-[10px] text-white">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-white/50 mt-2">
              💡 推荐使用网络图片作为背景，能更好展示流体玻璃的变形效果
            </p>
          </div>
        )}

        {/* 网络图片 URL */}
        {activeTab === 'url' && (
          <div className="space-y-2">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="https://example.com/wallpaper.jpg"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50"
            />
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="壁纸名称（可选）"
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50"
            />
            <button
              onClick={handleUrlSubmit}
              disabled={!urlInput.trim()}
              className="w-full text-sm py-2 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              添加
            </button>
          </div>
        )}

        {/* 本地上传 */}
        {activeTab === 'local' && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 rounded-lg border-2 border-dashed border-white/20 hover:border-white/40 text-white/60 hover:text-white/80 transition flex flex-col items-center gap-2"
            >
              <Upload size={24} />
              <span className="text-sm">点击上传图片</span>
              <span className="text-[10px] text-white/40">支持 JPG/PNG/WebP</span>
            </button>
          </div>
        )}
      </GlassPanel>

      {/* 当前壁纸 */}
      <GlassPanel cornerRadius={16} padding="16px">
        <div className="text-xs text-white/50 mb-2">当前壁纸</div>
        <div
          className="aspect-video rounded-lg overflow-hidden"
          style={{ background: getWallpaperCSS(current) }}
        >
          {current.type === 'url' && (
            <img src={current.value} alt={current.name || 'wallpaper'} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="mt-2 text-xs text-white/70 flex items-center justify-between">
          <span>{current.name || '未命名'} · {current.type}</span>
          {current.type === 'gradient' && (
            <span className="text-yellow-300/80 text-[10px]">💡 换张照片效果更好</span>
          )}
        </div>
      </GlassPanel>

      {/* 历史记录 */}
      {history.length > 1 && (
        <GlassPanel cornerRadius={16} padding="16px">
          <div className="text-xs text-white/50 mb-2">历史记录</div>
          <div className="grid grid-cols-4 gap-2">
            {history.slice(0, 12).map(w => {
              const isCurrent = w.id === current.id
              return (
                <div key={w.id} className="relative group">
                  <button
                    onClick={() => setCurrent(w)}
                    className={`w-full aspect-video rounded-lg border-2 transition overflow-hidden ${
                      isCurrent
                        ? 'border-blue-400'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    {w.type === 'url' || w.type === 'local' ? (
                      <img src={w.value} alt={w.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full" style={{ background: w.value }} />
                    )}
                    {isCurrent && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Check size={20} className="text-white" />
                      </div>
                    )}
                  </button>
                  {!isCurrent && (
                    <button
                      onClick={() => removeFromHistory(w.id)}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition"
                      title="删除"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </GlassPanel>
      )}

      <p className="text-[10px] text-white/40 px-2">
        💡 流体玻璃效果在有颜色变化的背景上最明显，推荐使用网络图片
      </p>
    </div>
  )
}

// 工具：根据壁纸生成 CSS
function getWallpaperCSS(w: { type: string; value: string }): string {
  switch (w.type) {
    case 'url':
    case 'local':
      return `url(${w.value}) center/cover no-repeat`
    case 'color':
    case 'gradient':
      return w.value
    default:
      return '#1a1a2e'
  }
}
