// AgentForm — 新建 / 编辑 Agent
// 模型选择复用 Popover 组件

import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Popover } from '../ui/Popover'
import { PROVIDER_MODELS, getModelName } from '../../store/useAIConfigStore'
import type { AIProvider } from '../../types'
import type { AgentConfig, AgentFormData } from '../../types/agent'

const PROVIDER_NAMES: Record<AIProvider, string> = {
  agnes: 'Agnes AI', deepseek: 'DeepSeek', openai: 'OpenAI',
  claude: 'Claude', kimi: 'Kimi', zhipu: '智谱', custom: '自定义',
}

interface AgentFormProps {
  /** 编辑模式传入已有 Agent */
  initial?: AgentConfig
  onSave: (data: AgentFormData) => void
  onCancel: () => void
}

export function AgentForm({ initial, onSave, onCancel }: AgentFormProps) {
  const [name, setName] = useState(initial?.name || '')
  const [provider, setProvider] = useState<AIProvider>(initial?.provider || 'deepseek')
  const [model, setModel] = useState(initial?.model || 'deepseek-chat')
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt || '')
  const [cooldownMin, setCooldownMin] = useState(initial?.cooldownMin ?? 5000)
  const [cooldownMax, setCooldownMax] = useState(initial?.cooldownMax ?? 15000)

  const models = PROVIDER_MODELS[provider] || []
  const currentModelName = getModelName(provider, model)

  // 切换提供商时自动选第一个模型
  const handleProviderChange = (p: AIProvider) => {
    setProvider(p)
    const firstModel = PROVIDER_MODELS[p]?.[0]
    if (firstModel) setModel(firstModel.id)
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      provider,
      model,
      systemPrompt,
      cooldownMin,
      cooldownMax,
    })
  }

  const isValid = name.trim().length > 0

  return (
    <div className="rounded-2xl bg-white/[0.06] backdrop-blur-[10px] border border-white/10 shadow-card overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/60">
          {initial ? '编辑 Agent' : '新建 Agent'}
        </span>
        <button onClick={onCancel} className="p-1 rounded text-white/25 hover:text-white/60 transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* 表单 */}
      <div className="p-5 space-y-4">
        {/* 名称 */}
        <div>
          <label className="block text-[10px] text-white/30 mb-1">名称</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="给 Agent 起个名字"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/15 outline-none focus:border-[#0A84FF] transition-colors"
          />
        </div>

        {/* 模型选择 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-white/30 mb-1">提供商</label>
            <Popover
              align="left"
              minWidth={180}
              trigger={
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:bg-white/[0.06] transition-colors">
                  <span>{PROVIDER_NAMES[provider]}</span>
                  <ChevronDown size={12} className="text-white/25" />
                </button>
              }
            >
              <div className="p-1.5">
                {(Object.keys(PROVIDER_NAMES) as AIProvider[]).map(p => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={`w-full px-3 py-2 rounded text-xs text-left transition-colors ${
                      provider === p ? 'bg-white/[0.10] text-white' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
                    }`}
                  >
                    {PROVIDER_NAMES[p]}
                  </button>
                ))}
              </div>
            </Popover>
          </div>
          <div>
            <label className="block text-[10px] text-white/30 mb-1">模型</label>
            <Popover
              align="right"
              minWidth={220}
              trigger={
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white/70 hover:bg-white/[0.06] transition-colors">
                  <span className="truncate">{currentModelName}</span>
                  <ChevronDown size={12} className="text-white/25" />
                </button>
              }
            >
              <div className="p-1.5 max-h-56 overflow-y-auto">
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left transition-colors ${
                      model === m.id ? 'bg-white/[0.10] text-white' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
                    }`}
                  >
                    <span>{m.name}</span>
                    <span className="text-white/20 ml-2">{m.desc}</span>
                  </button>
                ))}
              </div>
            </Popover>
          </div>
        </div>

        {/* 人设 */}
        <div>
          <label className="block text-[10px] text-white/30 mb-1">人设 (System Prompt)</label>
          <textarea
            value={systemPrompt}
            onChange={e => setSystemPrompt(e.target.value)}
            placeholder="描述这个 Agent 的性格、说话风格、知识背景..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/15 outline-none focus:border-[#0A84FF] transition-colors resize-none"
          />
        </div>

        {/* 冷却时间 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-white/30">最小冷却</label>
              <span className="text-[10px] text-white/40">{Math.round(cooldownMin / 1000)}s</span>
            </div>
            <input
              type="range"
              min="1000" max="30000" step="1000"
              value={cooldownMin}
              onChange={e => setCooldownMin(parseInt(e.target.value))}
              className="w-full h-1 accent-[#0A84FF]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] text-white/30">最大冷却</label>
              <span className="text-[10px] text-white/40">{Math.round(cooldownMax / 1000)}s</span>
            </div>
            <input
              type="range"
              min="5000" max="60000" step="1000"
              value={cooldownMax}
              onChange={e => setCooldownMax(parseInt(e.target.value))}
              className="w-full h-1 accent-[#0A84FF]"
            />
          </div>
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="flex justify-end gap-2 px-5 py-3 border-t border-white/[0.06]">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="px-5 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {initial ? '保存' : '创建'}
        </button>
      </div>
    </div>
  )
}
