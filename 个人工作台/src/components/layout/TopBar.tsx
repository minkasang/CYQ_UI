// 顶部栏
// 给 AI 的话：显示日期、玻璃调参按钮、导出/导入快捷入口

import { useState } from 'react'
import { Sliders, Download, Upload, Menu, Droplets, Square } from 'lucide-react'
import { GlassControlPanel } from '../glass/GlassControlPanel'
import { downloadExport, readFileAsText, importData } from '../../utils/export'
import { friendlyDate } from '../../utils/date'
import { useThemeStore } from '../../store/useThemeStore'

interface TopBarProps {
  onToggleSidebar?: () => void
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const [showGlassPanel, setShowGlassPanel] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const activeThemeId = useThemeStore(s => s.activeThemeId)
  const switchTheme = useThemeStore(s => s.switchTheme)

  // 显示提示消息
  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // 处理导出
  const handleExport = async () => {
    try {
      await downloadExport()
      showToast('✓ 导出成功')
    } catch (err) {
      showToast('✗ 导出失败：' + (err instanceof Error ? err.message : '未知错误'))
    }
  }

  // 处理导入
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await readFileAsText(file)
        const result = await importData(text)
        if (result.success) {
          showToast(`✓ 导入成功（${result.count} 条数据）`)
          setTimeout(() => window.location.reload(), 1000)
        } else {
          showToast('✗ 导入失败：' + result.error)
        }
      } catch (err) {
        showToast('✗ 读取文件失败')
      }
    }
    input.click()
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 bg-black/20 backdrop-blur-[20px] backdrop-saturate-150 border-b border-white/10">
        {/* 左侧：菜单 + 日期 */}
        <div className="flex items-center gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-white/10 text-white/70"
            >
              <Menu size={18} />
            </button>
          )}
          <div className="text-sm text-white/80">
            {friendlyDate(new Date())}
          </div>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => switchTheme('liquid-glass')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition ${
              activeThemeId === 'liquid-glass'
                ? 'bg-blue-500/30 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
            title="液态玻璃主题"
          >
            <Droplets size={13} />
          </button>
          <button
            onClick={() => switchTheme('flat')}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition ${
              activeThemeId === 'flat'
                ? 'bg-purple-500/30 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
            title="扁平主题"
          >
            <Square size={13} />
          </button>
          <ToolbarButton icon={Download} label="导出" onClick={handleExport} />
          <ToolbarButton icon={Upload} label="导入" onClick={handleImport} />
          <ToolbarButton
            icon={Sliders}
            label="玻璃调参"
            onClick={() => setShowGlassPanel(!showGlassPanel)}
            active={showGlassPanel}
          />
        </div>
      </header>

      {/* 玻璃调参面板 */}
      {showGlassPanel && <GlassControlPanel onClose={() => setShowGlassPanel(false)} />}

      {/* 顶部提示 */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm text-white shadow-xl z-50 bg-black/85 backdrop-blur-[20px] border border-white/15"
        >
          {toast}
        </div>
      )}
    </>
  )
}

interface ToolbarButtonProps {
  icon: typeof Download
  label: string
  onClick: () => void
  active?: boolean
}

function ToolbarButton({ icon: Icon, label, onClick, active = false }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition ${
        active
          ? 'bg-blue-500/30 text-white border border-blue-400/40'
          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
      }`}
      title={label}
    >
      <Icon size={14} />
      <span className="hidden md:inline">{label}</span>
    </button>
  )
}
