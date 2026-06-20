// 字体文件浏览器 + 上传组件
import { useState, useEffect, useCallback } from 'react'
import { X, Folder, File, ArrowUp, Check } from '@phosphor-icons/react'

const API = 'http://localhost:8090/api'
const PUBLIC_FONTS = '个人工作台/public/fonts'

interface DirItem {
  name: string
  path: string
  type: 'dir' | 'file'
  size: number
}

interface FontUploadModalProps {
  open: boolean
  onClose: () => void
  onFontLoaded: (fontName: string, fontPath: string) => void
}

export function FontUploadModal({ open, onClose, onFontLoaded }: FontUploadModalProps) {
  const [step, setStep] = useState<'browse' | 'confirm'>('browse')
  const [currentDir, setCurrentDir] = useState('/')
  const [items, setItems] = useState<DirItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<DirItem | null>(null)
  const [mode, setMode] = useState<'copy' | 'move'>('copy')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 加载目录
  const loadDir = useCallback(async (dir: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/list?dir=${encodeURIComponent(dir)}`)
      const data = await res.json()
      if (data.ok) {
        setItems(data.items.filter((i: DirItem) => {
          if (i.type === 'dir') return !i.name.startsWith('.')
          if (i.type === 'file') {
            const ext = i.name.split('.').pop()?.toLowerCase()
            return ['ttf', 'otf', 'woff', 'woff2', 'ttc'].includes(ext || '')
          }
          return false
        }))
      }
    } catch { setError('无法连接服务器') }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) {
      setStep('browse')
      setSelectedFile(null)
      setCurrentDir('/')
      setStatus(null)
      setError(null)
      loadDir('/')
    }
  }, [open, loadDir])

  const enterDir = (dir: string) => {
    setCurrentDir(dir)
    loadDir(dir)
  }
  const goUp = () => {
    const parent = currentDir.split('/').slice(0, -1).join('/') || '/'
    setCurrentDir(parent)
    loadDir(parent)
  }

  const selectFile = (file: DirItem) => {
    setSelectedFile(file)
    setStep('confirm')
  }

  const handleLoad = async () => {
    if (!selectedFile) return
    setStatus('加载中...')
    setError(null)

    const fileName = selectedFile.name
    const destDir = PUBLIC_FONTS
    const destPath = `${destDir}/${fileName}`

    try {
      const endpoint = mode === 'copy' ? 'copy' : 'move'
      const res = await fetch(`${API}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: selectedFile.path, dest: destPath }),
      })
      const data = await res.json()
      if (!data.ok) { setError(data.error); setStatus(null); return }

      // 动态注册 @font-face
      const fontName = fileName.replace(/\.(ttf|otf|woff|woff2|ttc)$/i, '')
      const ext = fileName.split('.').pop()?.toLowerCase()
      const formatMap: Record<string, string> = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype', ttc: 'truetype' }
      const format = formatMap[ext || ''] || 'truetype'

      const style = document.createElement('style')
      style.id = `font-face-${fontName}`
      style.textContent = `
        @font-face {
          font-family: '${fontName}';
          src: url('/fonts/${fileName}') format('${format}');
          font-display: swap;
        }
      `
      document.head.appendChild(style)

      setStatus(`✓ 已加载「${fontName}」`)
      setTimeout(() => {
        onFontLoaded(fontName, `/fonts/${fileName}`)
        onClose()
      }, 1000)
    } catch { setError('操作失败'); setStatus(null) }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[520px] max-h-[80vh] rounded-2xl bg-[#1c1c1e]/98 backdrop-blur-2xl border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            {step === 'browse' ? '选择字体文件' : '确认加载'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/[0.06] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          {step === 'browse' && (
            <>
              {/* 当前路径 */}
              <div className="flex items-center gap-2 mb-3 text-xs text-[var(--text-tertiary)]">
                {currentDir !== '/' && (
                  <button onClick={goUp} className="p-1 rounded hover:bg-white/[0.06] transition" title="上级目录">
                    <ArrowUp size={14} />
                  </button>
                )}
                <span className="font-mono">{currentDir}</span>
              </div>

              {loading && <div className="text-sm text-[var(--text-tertiary)] py-8 text-center">加载中...</div>}

              {!loading && items.length === 0 && !error && (
                <div className="text-sm text-[var(--text-tertiary)] py-8 text-center">此目录下没有字体文件</div>
              )}

              {error && <div className="text-sm text-red-400 py-4">{error}</div>}

              <div className="space-y-0.5">
                {items.map(item => (
                  <button
                    key={item.path}
                    onClick={() => item.type === 'dir' ? enterDir(item.path) : selectFile(item)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left hover:bg-white/[0.04] transition"
                  >
                    {item.type === 'dir' ? (
                      <Folder size={18} weight="fill" className="text-[var(--accent)]/70 flex-shrink-0" />
                    ) : (
                      <File size={18} className="text-[var(--text-tertiary)] flex-shrink-0" />
                    )}
                    <span className="text-[var(--text-primary)] truncate">{item.name}</span>
                    {item.type === 'file' && (
                      <span className="text-[var(--text-tertiary)] text-xs ml-auto flex-shrink-0">
                        {(item.size / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 'confirm' && selectedFile && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">选中文件</p>
                <p className="text-sm font-mono text-[var(--text-primary)] break-all">{selectedFile.path}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">{(selectedFile.size / 1024).toFixed(0)} KB</p>
              </div>

              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-2">操作方式</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('copy')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm border transition ${
                      mode === 'copy'
                        ? 'bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]'
                        : 'bg-white/[0.03] border-white/[0.06] text-[var(--text-secondary)] hover:bg-white/[0.05]'
                    }`}
                  >
                    复制（保留原件）
                  </button>
                  <button
                    onClick={() => setMode('move')}
                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm border transition ${
                      mode === 'move'
                        ? 'bg-[var(--accent)]/15 border-[var(--accent)]/30 text-[var(--accent)]'
                        : 'bg-white/[0.03] border-white/[0.06] text-[var(--text-secondary)] hover:bg-white/[0.05]'
                    }`}
                  >
                    移动（删除原件）
                  </button>
                </div>
              </div>

              {status && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
                  <Check size={16} weight="fill" />
                  {status}
                </div>
              )}
              {error && <div className="text-sm text-red-400">{error}</div>}

              <button
                onClick={handleLoad}
                disabled={!!status}
                className="w-full py-2.5 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition active:scale-[0.98] disabled:opacity-50"
              >
                确定加载
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
