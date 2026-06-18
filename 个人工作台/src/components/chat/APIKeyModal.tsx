// APIKeyModal - API Key 管理弹窗
// 每提供商多 Key，支持增删改、激活切换、连接测试、导入导出

import { useState, useRef } from 'react'
import { X, Key, Check, Trash2, Eye, EyeOff, Plus, Download, Upload, Loader2 } from 'lucide-react'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import { AI_PRESETS } from '../../store/useAIConfigStore'
import { GlassPanel } from '../glass/GlassPanel'
import type { AIProvider, APIKeyEntry } from '../../types'

// 提供商信息
const PROVIDER_INFO: Record<AIProvider, { name: string; url: string }> = {
  agnes: { name: 'Agnes AI', url: 'https://platform.agnes-ai.com' },
  deepseek: { name: 'DeepSeek', url: 'https://platform.deepseek.com/api_keys' },
  openai: { name: 'OpenAI', url: 'https://platform.openai.com/api-keys' },
  claude: { name: 'Claude', url: 'https://console.anthropic.com/' },
  kimi: { name: 'Kimi', url: 'https://platform.moonshot.cn/' },
  zhipu: { name: '智谱', url: 'https://open.bigmodel.cn/' },
  custom: { name: '自定义', url: '' },
}

export interface APIKeyModalProps {
  open: boolean
  onClose: () => void
}

export function APIKeyModal({ open, onClose }: APIKeyModalProps) {
  const keys = useAPIKeysStore(s => s.keys)
  const activeKeyId = useAPIKeysStore(s => s.activeKeyId)
  const addKey = useAPIKeysStore(s => s.addKey)
  const removeKey = useAPIKeysStore(s => s.removeKey)
  const setActiveKey = useAPIKeysStore(s => s.setActiveKey)

  const [addingProvider, setAddingProvider] = useState<AIProvider | null>(null)
  const [newKeyValue, setNewKeyValue] = useState('')
  const [newKeyLabel, setNewKeyLabel] = useState('')
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [testingProvider, setTestingProvider] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const providers: AIProvider[] = ['deepseek', 'openai', 'claude', 'kimi', 'zhipu', 'agnes', 'custom']

  const handleAddKey = (provider: AIProvider) => {
    if (!newKeyValue.trim()) return
    addKey(provider, newKeyValue.trim(), newKeyLabel.trim() || '默认')
    setAddingProvider(null)
    setNewKeyValue('')
    setNewKeyLabel('')
  }

  const handleTest = async (provider: AIProvider, keyEntry: APIKeyEntry) => {
    setTestingProvider(keyEntry.id)
    setTestResult(prev => ({ ...prev, [keyEntry.id]: undefined as any }))
    try {
      const baseUrl = AI_PRESETS[provider]?.baseUrl || ''
      const url = provider === 'claude'
        ? `${baseUrl}/v1/messages`
        : `${baseUrl}/models`
      const resp = await fetch(url, {
        method: 'GET',
        headers: provider === 'claude'
          ? { 'x-api-key': keyEntry.key, 'anthropic-version': '2023-06-01' }
          : { 'Authorization': `Bearer ${keyEntry.key}` },
      })
      if (resp.ok || resp.status === 404) {
        setTestResult(prev => ({ ...prev, [keyEntry.id]: { ok: true, msg: '连接成功' } }))
      } else {
        setTestResult(prev => ({ ...prev, [keyEntry.id]: { ok: false, msg: `HTTP ${resp.status}` } }))
      }
    } catch (err: any) {
      setTestResult(prev => ({ ...prev, [keyEntry.id]: { ok: false, msg: err.message || '连接失败' } }))
    } finally {
      setTestingProvider(null)
      setTimeout(() => setTestResult(prev => {
        const next = { ...prev }
        delete next[keyEntry.id]
        return next
      }), 3000)
    }
  }

  const handleExport = () => {
    const data = { ...keys, _activeKeyId: activeKeyId }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `api_keys_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        const providers: AIProvider[] = ['deepseek', 'openai', 'claude', 'kimi', 'zhipu', 'agnes', 'custom']
        for (const provider of providers) {
          const value = data[provider]
          if (typeof value === 'string' && value.length > 0) {
            addKey(provider, value, '导入')
          } else if (Array.isArray(value)) {
            for (const entry of value) {
              if (entry.key) addKey(provider, entry.key, entry.label || '导入')
            }
          }
        }
        if (data._activeKeyId) {
          for (const [provider, id] of Object.entries(data._activeKeyId)) {
            if (id && providers.includes(provider as AIProvider)) {
              setActiveKey(provider as AIProvider, id as string)
            }
          }
        }
      } catch {
        // 忽略解析错误
      }
    }
    reader.readAsText(file)
    // 重置 input 以允许重复选同一文件
    e.target.value = ''
  }

  const maskKey = (key: string) => {
    if (key.length <= 12) return '***'
    return `${key.slice(0, 6)}...${key.slice(-4)}`
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <GlassPanel
        cornerRadius={16}
        padding="24px"
        className="relative max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key size={16} className="text-blue-400" />
            <h3 className="text-base font-semibold text-white">API Key 管理</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-white/50 hover:text-white hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        {/* 提供商列表 */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {providers.map((provider) => {
            const providerKeys = keys[provider]
            const activeId = activeKeyId[provider]
            const info = PROVIDER_INFO[provider]
            const isAdding = addingProvider === provider

            return (
              <div
                key={provider}
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{info.name}</span>
                    {info.url && (
                      <a
                        href={info.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-blue-400/70 hover:text-blue-400"
                      >
                        获取 Key
                      </a>
                    )}
                  </div>
                  {providerKeys.length === 0 && !isAdding && (
                    <span className="text-[10px] text-white/30">未配置</span>
                  )}
                </div>

                {/* Key 列表 */}
                {providerKeys.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {providerKeys.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        {/* 激活标记 */}
                        <button
                          onClick={() => setActiveKey(provider, entry.id)}
                          className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{
                            border: `2px solid ${entry.id === activeId ? 'rgb(74, 222, 128)' : 'rgba(255,255,255,0.3)'}`,
                          }}
                          title={entry.id === activeId ? '当前使用' : '点击激活'}
                        >
                          {entry.id === activeId && <div className="w-2 h-2 rounded-full bg-green-400" />}
                        </button>

                        {/* Key 显示 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-white/50">{entry.label}</span>
                          </div>
                          <div className="text-xs text-white/70 font-mono">
                            {showKeys[entry.id] ? entry.key : maskKey(entry.key)}
                          </div>
                        </div>

                        {/* 操作按钮 */}
                        <button
                          onClick={() => setShowKeys({ ...showKeys, [entry.id]: !showKeys[entry.id] })}
                          className="p-1 rounded text-white/40 hover:text-white"
                          title="显示/隐藏"
                        >
                          {showKeys[entry.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                        <button
                          onClick={() => handleTest(provider, entry)}
                          className="p-1 rounded text-white/40 hover:text-blue-400"
                          title="测试连接"
                          disabled={testingProvider === entry.id}
                        >
                          {testingProvider === entry.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <span className="text-[10px]">测试</span>
                          )}
                        </button>
                        <button
                          onClick={() => removeKey(provider, entry.id)}
                          className="p-1 rounded text-white/40 hover:text-red-400"
                          title="删除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 测试结果 */}
                {providerKeys.some(k => testResult[k.id]) && (
                  <div className="space-y-0.5 mb-2">
                    {providerKeys.map(entry => {
                      const r = testResult[entry.id]
                      if (!r) return null
                      return (
                        <div
                          key={entry.id}
                          className="text-[10px] px-2 py-1 rounded flex items-center gap-1"
                          style={{
                            background: r.ok ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                            color: r.ok ? '#4ade80' : '#f87171',
                          }}
                        >
                          {r.ok ? <Check size={10} /> : <X size={10} />}
                          {r.msg}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* 添加 Key */}
                {isAdding ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={newKeyValue}
                      onChange={e => setNewKeyValue(e.target.value)}
                      placeholder="输入 API Key..."
                      className="flex-1 px-2 py-1 rounded text-xs text-white placeholder-white/30 outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleAddKey(provider)}
                    />
                    <input
                      type="text"
                      value={newKeyLabel}
                      onChange={e => setNewKeyLabel(e.target.value)}
                      placeholder="标签"
                      className="w-16 px-2 py-1 rounded text-xs text-white placeholder-white/30 outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    />
                    <button
                      onClick={() => handleAddKey(provider)}
                      disabled={!newKeyValue.trim()}
                      className="px-2 py-1 rounded text-xs text-white disabled:opacity-40"
                      style={{ background: 'rgba(59, 130, 246, 0.5)' }}
                    >
                      保存
                    </button>
                    <button
                      onClick={() => { setAddingProvider(null); setNewKeyValue(''); setNewKeyLabel('') }}
                      className="px-2 py-1 rounded text-xs text-white/60 hover:text-white"
                      style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingProvider(provider)}
                    className="flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70"
                  >
                    <Plus size={10} />
                    添加 Key
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-white/5">
          <button
            onClick={handleImport}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-white/60 hover:text-white hover:bg-white/10"
          >
            <Upload size={12} />
            导入
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs text-white/60 hover:text-white hover:bg-white/10"
          >
            <Download size={12} />
            导出
          </button>
        </div>

        {/* 隐藏的文件选择器 */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />
      </GlassPanel>
    </div>
  )
}
