// 主题管理页面 — 三栏布局
// 左：主题列表 | 中：实时预览 | 右：配置面板

import { useEffect, useState, useCallback, useRef } from 'react'
import { ThemeList } from '../../../components/theme/ThemeList'
import { ThemeConfig } from '../../../components/theme/ThemeConfig'
import { useThemePresetStore, type ThemePreset } from '../../../store/useThemePresetStore'
import { LiquidGlassEngine } from '../../../themes/engines/LiquidGlassEngine'
import { FlatThemeEngine } from '../../../themes/engines/FlatThemeEngine'

export function ThemePage() {
  const {
    presets, activeId, loaded,
    loadFromFile, addPreset, removePreset,
    updatePreset, setActive, applyPreset,
  } = useThemePresetStore()

  const [newPresetDraft, setNewPresetDraft] = useState<Omit<ThemePreset, 'id' | 'createdAt' | 'isBuiltin'> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载数据
  useEffect(() => {
    loadFromFile()
  }, [loadFromFile])

  const activePreset = presets.find(p => p.id === activeId) || presets[0] || null

  // 选择主题 → 实时预览
  const handleSelect = useCallback((id: string) => {
    setActive(id)
    applyPreset(id)
  }, [setActive, applyPreset])

  // 参数变更 → 更新预设 + 实时应用
  const handleParamChange = useCallback((key: string, value: number | boolean) => {
    if (!activePreset) return
    const updatedParams = { ...activePreset.params, [key]: value }
    updatePreset(activePreset.id, { params: updatedParams })
    applyPreset(activePreset.id)
  }, [activePreset, updatePreset, applyPreset])

  // 字体变更
  const handleFontChange = useCallback((patch: { fontFamily?: string; fontSize?: number }) => {
    if (!activePreset) return
    updatePreset(activePreset.id, {
      fontFamily: patch.fontFamily ?? activePreset.fontFamily,
      fontSize: patch.fontSize ?? activePreset.fontSize,
    })
    if (patch.fontFamily) document.documentElement.style.fontFamily = patch.fontFamily
    if (patch.fontSize !== undefined) {
      document.documentElement.style.fontSize = `${patch.fontSize}px`
      localStorage.setItem('pw-font-size', String(patch.fontSize))
    }
  }, [activePreset, updatePreset])

  // 新建主题
  const handleCreateNew = useCallback(() => {
    const engine = activePreset?.engine || 'liquid-glass'
    const paramDefs = engine === 'liquid-glass'
      ? new LiquidGlassEngine().getParamDefs()
      : new FlatThemeEngine().getParamDefs()
    const defaultParams: Record<string, number | boolean> = {}
    paramDefs.forEach((d: any) => { defaultParams[d.key] = d.defaultValue })
    setNewPresetDraft({
      name: '未命名主题',
      engine,
      params: defaultParams,
      fontFamily: activePreset?.fontFamily || '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: activePreset?.fontSize || 13,
      wallpaper: activePreset?.wallpaper || { type: 'color', value: '#0a0a0a' },
    })
  }, [activePreset])

  // 保存为新主题
  const handleSaveAsNew = useCallback(() => {
    if (newPresetDraft) {
      const p = addPreset(newPresetDraft)
      setActive(p.id)
      applyPreset(p.id)
      setNewPresetDraft(null)
    } else if (activePreset) {
      const p = addPreset({
        name: activePreset.name + ' (副本)',
        engine: activePreset.engine,
        params: { ...activePreset.params },
        fontFamily: activePreset.fontFamily,
        fontSize: activePreset.fontSize,
        wallpaper: { ...activePreset.wallpaper },
      })
      setActive(p.id)
      applyPreset(p.id)
    }
  }, [newPresetDraft, activePreset, addPreset, setActive, applyPreset])

  // 删除
  const handleDelete = useCallback((id: string) => {
    if (!confirm('确定删除这个主题？')) return
    removePreset(id)
  }, [removePreset])

  // 导出
  const handleExport = useCallback(() => {
    if (!activePreset) return
    const blob = new Blob([JSON.stringify(activePreset, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activePreset.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [activePreset])

  // 导入
  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        if (data.engine && data.params) {
          const p = addPreset({
            name: data.name || '导入主题',
            engine: data.engine,
            params: data.params,
            fontFamily: data.fontFamily || '-apple-system, BlinkMacSystemFont, sans-serif',
            fontSize: data.fontSize || 13,
            wallpaper: data.wallpaper || { type: 'color', value: '#0a0a0a' },
          })
          setActive(p.id)
          applyPreset(p.id)
        }
      } catch {
        alert('无效的主题文件')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [addPreset, setActive, applyPreset])

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[var(--text-tertiary)]">加载中...</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* 隐藏的文件输入 */}
      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />

      {/* 三栏布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左：主题列表 (220px) */}
        <div className="w-[220px] flex-shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <ThemeList
            presets={presets}
            activeId={activeId}
            onSelect={handleSelect}
            onDelete={handleDelete}
            onImport={handleImport}
            onCreateNew={handleCreateNew}
          />
        </div>

        {/* 中：预览区 — 透明让背景透出 */}
        <div className="flex-1 flex items-center justify-center bg-transparent relative overflow-hidden">
          {/* 背景透出 */}
          <div className="absolute inset-0 -z-10 bg-[var(--bg-root)] opacity-50" />
          <div className="text-center z-10">
            <p className="text-6xl mb-3 opacity-30">🎨</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {activePreset ? activePreset.name : '选择一个主题'}
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-2">
              {activePreset?.engine === 'liquid-glass' ? '液态玻璃' : activePreset?.engine === 'flat' ? '扁平' : ''}
            </p>
          </div>
        </div>

        {/* 右：配置面板 (260px) */}
        <div className="w-[260px] flex-shrink-0 border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          <ThemeConfig
            preset={activePreset}
            onParamChange={handleParamChange}
            onFontChange={handleFontChange}
            onSaveAsNew={handleSaveAsNew}
            onExport={handleExport}
          />
        </div>
      </div>
    </div>
  )
}
