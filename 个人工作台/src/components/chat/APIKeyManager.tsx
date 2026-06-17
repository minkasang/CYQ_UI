// API Key 管理组件
// 管理各 AI 提供商的 API Key

import { useState } from 'react'
import { Key, Eye, EyeOff, Trash2, Check } from 'lucide-react'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import type { AIProvider } from '../../types'
import { GlassPanel } from '../glass/GlassPanel'

// 提供商显示信息
const PROVIDER_INFO: Record<AIProvider, { name: string; url: string; desc: string }> = {
  agnes: { name: 'Agnes AI', url: 'https://platform.agnes-ai.com', desc: '免费，全模态' },
  deepseek: { name: 'DeepSeek', url: 'https://platform.deepseek.com/api_keys', desc: '国产，便宜好用' },
  openai: { name: 'OpenAI', url: 'https://platform.openai.com/api-keys', desc: 'GPT 系列' },
  claude: { name: 'Claude', url: 'https://console.anthropic.com/', desc: 'Anthropic' },
  kimi: { name: 'Kimi', url: 'https://platform.moonshot.cn/', desc: 'Moonshot' },
  zhipu: { name: '智谱', url: 'https://open.bigmodel.cn/', desc: 'GLM 系列' },
  custom: { name: '自定义', url: '', desc: '自定义 API' },
}

export function APIKeyManager() {
  const keys = useAPIKeysStore(s => s.keys)
  const setKey = useAPIKeysStore(s => s.setKey)
  const removeKey = useAPIKeysStore(s => s.removeKey)
  const hasKey = useAPIKeysStore(s => s.hasKey)
  
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [inputKey, setInputKey] = useState('')
  const [showKey, setShowKey] = useState<Record<AIProvider, boolean>>({} as any)

  // 保存 Key
  const handleSave = (provider: AIProvider) => {
    if (inputKey.trim()) {
      setKey(provider, inputKey.trim())
      setEditingProvider(null)
      setInputKey('')
    }
  }

  // 开始编辑
  const startEdit = (provider: AIProvider) => {
    setEditingProvider(provider)
    setInputKey(keys[provider] || '')
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingProvider(null)
    setInputKey('')
  }

  return (
    <div className="space-y-2">
      {(Object.keys(PROVIDER_INFO) as AIProvider[]).map((provider) => {
        const info = PROVIDER_INFO[provider]
        const isEditing = editingProvider === provider
        const configured = hasKey(provider)
        const currentKey = keys[provider] || ''

        return (
          <GlassPanel key={provider} cornerRadius={12} padding="12px">
            <div className="flex items-center justify-between">
              {/* 提供商信息 */}
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: configured ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  {configured ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Key size={14} className="text-white/50" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-medium text-white">{info.name}</div>
                  <div className="text-[10px] text-white/50">{info.desc}</div>
                </div>
              </div>

              {/* Key 输入或显示 */}
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1 ml-4">
                  <input
                    type={showKey[provider] ? 'text' : 'password'}
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="输入 API Key..."
                    className="flex-1 px-2 py-1 rounded text-xs text-white placeholder-white/30 outline-none"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  />
                  <button
                    onClick={() => setShowKey({ ...showKey, [provider]: !showKey[provider] })}
                    className="p-1 rounded text-white/50 hover:text-white"
                  >
                    {showKey[provider] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => handleSave(provider)}
                    className="px-2 py-1 rounded text-xs text-white"
                    style={{ background: 'rgba(59, 130, 246, 0.5)' }}
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-2 py-1 rounded text-xs text-white/60 hover:text-white"
                    style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {configured ? (
                    <>
                      <div className="text-xs text-white/40 font-mono">
                        {showKey[provider] ? currentKey : `${currentKey.slice(0, 8)}...${currentKey.slice(-4)}`}
                      </div>
                      <button
                        onClick={() => setShowKey({ ...showKey, [provider]: !showKey[provider] })}
                        className="p-1 rounded text-white/50 hover:text-white"
                      >
                        {showKey[provider] ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                      <button
                        onClick={() => startEdit(provider)}
                        className="p-1 rounded text-white/50 hover:text-white"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => removeKey(provider)}
                        className="p-1 rounded text-white/50 hover:text-red-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  ) : (
                    <>
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
                      <button
                        onClick={() => startEdit(provider)}
                        className="px-2 py-1 rounded text-xs text-white/60 hover:text-white"
                        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                      >
                        配置
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </GlassPanel>
        )
      })}
    </div>
  )
}