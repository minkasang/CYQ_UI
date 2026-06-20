// ChatInput - 输入区 + 模型选择器
// 纯展示组件，0 个 store 导入
// 功能：模型选择（按能力分组）、深度思考开关、Key 切换、发送/取消
// v2: 弹窗统一用 Popover 组件（玻璃风格 + 点击外部关闭 + 智能方向）

import { useState } from 'react'
import { Send, ChevronDown, Brain, Key, Image, Video } from 'lucide-react'
import type { AIProvider, APIKeyEntry } from '../../types'
import { PROVIDER_MODELS, getModelName, isReasoningModel } from '../../store/useAIConfigStore'
import { Popover } from '../ui/Popover'

// 提供商显示名
const PROVIDER_NAMES: Record<AIProvider, string> = {
  agnes: 'Agnes AI',
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  claude: 'Claude',
  kimi: 'Kimi',
  zhipu: '智谱',
  custom: '自定义',
}

export interface ChatInputProps {
  provider: AIProvider
  model: string
  loading: boolean
  hasKey: boolean
  availableKeys: APIKeyEntry[]
  activeKeyId: string | null
  reasoningEnabled: boolean
  webSearchEnabled: boolean
  webSearchSupported: boolean
  temperature: number
  maxTokens: number
  onProviderChange: (p: AIProvider) => void
  onModelChange: (m: string) => void
  onSend: (text: string) => void
  onCancel: () => void
  onToggleReasoning: (enabled: boolean) => void
  onToggleWebSearch: (enabled: boolean) => void
  onOpenAPIModal: () => void
  onSwitchKey: (keyId: string) => void
  onTemperatureChange: (t: number) => void
  onMaxTokensChange: (t: number) => void
}

function pillBase(active: boolean): string {
  return `flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
    active
      ? 'bg-white/10 border-white/[0.12] text-white'
      : 'bg-transparent border-white/[0.06] text-white/50 hover:text-white/70 hover:bg-white/5'
  }`
}

export function ChatInput({
  provider,
  model,
  loading,
  hasKey,
  availableKeys,
  activeKeyId,
  reasoningEnabled,
  webSearchEnabled,
  webSearchSupported,
  temperature,
  maxTokens,
  onProviderChange,
  onModelChange,
  onSend,
  onCancel,
  onToggleReasoning,
  onToggleWebSearch,
  onOpenAPIModal,
  onSwitchKey,
  onTemperatureChange,
  onMaxTokensChange,
}: ChatInputProps) {
  const [input, setInput] = useState('')

  const modelSupportsReasoning = isReasoningModel(provider, model)
  const currentModelName = getModelName(provider, model)
  const currentModels = PROVIDER_MODELS[provider] || []

  // 模型按能力分组
  const textModels = currentModels.filter(m => !m.capabilities?.reasoning && !m.capabilities?.imageGen && !m.capabilities?.videoGen)
  const reasoningModels = currentModels.filter(m => m.capabilities?.reasoning)
  const imageModels = currentModels.filter(m => m.capabilities?.imageGen)
  const videoModels = currentModels.filter(m => m.capabilities?.videoGen)

  const activeKeyLabel = availableKeys.find(k => k.id === activeKeyId)?.label || ''

  const handleSend = () => {
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="px-4 py-3 border-t border-white/5">
      {/* 模型选择栏 */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {/* 提供商选择 */}
        <Popover
          align="left"
          minWidth={180}
          trigger={
            <button className={pillBase(false)}>
              <span>{PROVIDER_NAMES[provider]}</span>
              {hasKey ? <span className="text-green-400 text-[10px]">✓</span> : <span className="text-red-400 text-[10px]">!</span>}
              <ChevronDown size={12} />
            </button>
          }
        >
          <div className="p-1.5">
            {(Object.keys(PROVIDER_NAMES) as AIProvider[]).map((p) => (
              <button
                key={p}
                onClick={() => onProviderChange(p)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left transition-colors ${
                  provider === p ? 'bg-white/[0.12] text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                }`}
              >
                <span>{PROVIDER_NAMES[p]}</span>
                {hasKey ? (
                  <span className="text-green-400/70 text-[10px]">已配置</span>
                ) : (
                  <span className="text-red-400/40 text-[10px]">未配置</span>
                )}
              </button>
            ))}
          </div>
        </Popover>

        {/* 模型选择 */}
        <Popover
          align="left"
          minWidth={240}
          trigger={
            <button className={pillBase(false)}>
              <span>{currentModelName}</span>
              <ChevronDown size={12} />
            </button>
          }
        >
          <div className="py-1 max-h-64 overflow-y-auto">
            {reasoningModels.length > 0 && (
              <div className="mb-1">
                <div className="px-3 py-1 text-[10px] text-purple-400/60 flex items-center gap-1">
                  <Brain size={10} /> 推理模型
                </div>
                {reasoningModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onModelChange(m.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left transition-colors ${
                      model === m.id ? 'bg-white/[0.12] text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-white/30">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
            {textModels.length > 0 && (
              <div className="mb-1">
                <div className="px-3 py-1 text-[10px] text-white/30">文本模型</div>
                {textModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onModelChange(m.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left transition-colors ${
                      model === m.id ? 'bg-white/[0.12] text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-white/30">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
            {imageModels.length > 0 && (
              <div className="mb-1">
                <div className="px-3 py-1 text-[10px] text-blue-400/60 flex items-center gap-1">
                  <Image size={10} /> 图片生成
                </div>
                {imageModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onModelChange(m.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left transition-colors ${
                      model === m.id ? 'bg-white/[0.12] text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-white/30">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
            {videoModels.length > 0 && (
              <div>
                <div className="px-3 py-1 text-[10px] text-red-400/60 flex items-center gap-1">
                  <Video size={10} /> 视频生成
                </div>
                {videoModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onModelChange(m.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left transition-colors ${
                      model === m.id ? 'bg-white/[0.12] text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-white/30">{m.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Popover>

        {/* 深度思考开关 */}
        {modelSupportsReasoning && (
          <button
            onClick={() => onToggleReasoning(!reasoningEnabled)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
              reasoningEnabled
                ? 'bg-purple-500/20 border-purple-500/30 text-purple-200'
                : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            <Brain size={12} />
            <span>深度思考</span>
          </button>
        )}

        {/* 联网搜索开关（仅智谱/Kimi） */}
        {webSearchSupported && (
          <button
            onClick={() => onToggleWebSearch(!webSearchEnabled)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
              webSearchEnabled
                ? 'bg-blue-500/20 border-blue-500/30 text-blue-200'
                : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            <span className="text-[10px]">🌐</span>
            <span>联网搜索</span>
          </button>
        )}

        {/* 参数设置 */}
        <Popover
          align="right"
          minWidth={200}
          trigger={
            <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/40 hover:text-white/70 transition-colors border border-white/[0.04] hover:bg-white/5">
              <span className="text-[10px]">⚙</span>
            </button>
          }
        >
          <div className="p-3 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/40">Temperature</span>
                <span className="text-[10px] text-white/30">{temperature.toFixed(1)}</span>
              </div>
              <input
                type="range" min="0" max="2" step="0.1"
                value={temperature}
                onChange={e => onTemperatureChange(parseFloat(e.target.value))}
                className="w-full h-1 accent-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/40">Max Tokens</span>
                <span className="text-[10px] text-white/30">{maxTokens}</span>
              </div>
              <input
                type="range" min="256" max="8192" step="256"
                value={maxTokens}
                onChange={e => onMaxTokensChange(parseInt(e.target.value))}
                className="w-full h-1 accent-blue-500"
              />
            </div>
          </div>
        </Popover>

        {/* Key 切换 */}
        {availableKeys.length > 1 && (
          <Popover
            align="left"
            minWidth={160}
            trigger={
              <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/50 hover:text-white/70 transition-colors border border-white/[0.04] hover:bg-white/5">
                <Key size={10} />
                <span>{activeKeyLabel || 'Key'}</span>
                <ChevronDown size={10} />
              </button>
            }
          >
            <div className="p-1.5">
              {availableKeys.map((k) => (
                <button
                  key={k.id}
                  onClick={() => onSwitchKey(k.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left transition-colors ${
                    k.id === activeKeyId ? 'bg-white/[0.12] text-white' : 'text-white/60 hover:bg-white/[0.06] hover:text-white/80'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {k.id === activeKeyId && <span className="text-green-400 text-[8px]">●</span>}
                    <span>{k.label}</span>
                  </div>
                  <span className="text-white/25 text-[10px] font-mono">
                    {k.key.slice(0, 6)}...
                  </span>
                </button>
              ))}
            </div>
          </Popover>
        )}
      </div>

      {/* 未配置 Key 提示 */}
      {!hasKey && (
        <div className="text-xs text-red-400/80 mb-2 flex items-center gap-1">
          <span>未配置 API Key —</span>
          <button onClick={onOpenAPIModal} className="underline hover:text-red-300">
            立即配置
          </button>
        </div>
      )}

      {/* 输入区 */}
      <div className="flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
          disabled={loading || !hasKey}
          rows={2}
          className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder-white/40 outline-none disabled:opacity-50 resize-none"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />
        {loading && (
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded-lg text-xs text-white flex items-center gap-1.5"
            style={{ background: 'rgba(239, 68, 68, 0.5)' }}
          >
            取消
          </button>
        )}
        <button
          onClick={handleSend}
          disabled={loading || !input.trim() || !hasKey}
          className="px-3 py-2 rounded-lg text-xs text-white flex items-center gap-1.5 disabled:opacity-50"
          style={{
            background: loading ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.5)',
          }}
        >
          <Send size={12} />
          发送
        </button>
      </div>
    </div>
  )
}
