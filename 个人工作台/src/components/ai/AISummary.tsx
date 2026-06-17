// AI 总结主组件
// 一键总结日记或长文本，支持模型选择

import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle, ChevronDown, Settings } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAIConfigStore, AI_PRESETS } from '../../store/useAIConfigStore'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import { useDiaryStore, selectSortedDiaries } from '../../store/useDiaryStore'
import { summarizeDiary, summarizeText, AIServiceError } from './aiService'
import { GlassPanel } from '../glass/GlassPanel'
import { friendlyDate } from '../../utils/date'
import type { AIProvider, AIConfig } from '../../types'

// AI 提供商显示名称
const PROVIDER_NAMES: Record<AIProvider, string> = {
  agnes: 'Agnes AI',
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  claude: 'Claude',
  kimi: 'Kimi',
  zhipu: '智谱',
  custom: '自定义',
}

export function AISummary() {
  const diaries = useDiaryStore(selectSortedDiaries)
  const [selectedDiaryId, setSelectedDiaryId] = useState<string>('')
  const [customText, setCustomText] = useState('')
  const [mode, setMode] = useState<'diary' | 'custom'>('diary')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showModelSelect, setShowModelSelect] = useState(false)

  // AI 配置
  const config = useAIConfigStore(s => s.config)
  const setProvider = useAIConfigStore(s => s.setProvider)
  
  // API Keys
  const keys = useAPIKeysStore(s => s.keys)
  const hasKey = useAPIKeysStore(s => s.hasKey)
  const getKey = useAPIKeysStore(s => s.getKey)

  // 当前提供商是否有 API Key
  const currentProviderHasKey = hasKey(config.provider)
  
  // 构建完整的 AI 配置（包含 API Key）
  const getFullConfig = (): AIConfig => {
    const apiKey = getKey(config.provider) || ''
    return {
      ...config,
      apiKey,
    }
  }

  // 检查是否有任何 API Key 配置
  const hasAnyKey = Object.keys(keys).some(p => hasKey(p as AIProvider))

  // 处理总结
  const handleSummarize = async () => {
    if (!hasAnyKey) {
      setError('请先在「设置」页面配置 API Key')
      return
    }
    if (!currentProviderHasKey) {
      setError('当前模型未配置 API Key，请在「设置」页面配置')
      return
    }

    setError(null)
    setResult('')
    setLoading(true)

    try {
      const fullConfig = getFullConfig()
      let summary = ''
      if (mode === 'diary') {
        const diary = diaries.find(d => d.id === selectedDiaryId)
        if (!diary || !diary.content.trim()) {
          throw new Error('请选择有内容的日记')
        }
        summary = await summarizeDiary(fullConfig, diary.content, (chunk) => {
          setResult(prev => prev + chunk)
        })
      } else {
        if (!customText.trim()) {
          throw new Error('请输入要总结的内容')
        }
        summary = await summarizeText(fullConfig, customText, (chunk) => {
          setResult(prev => prev + chunk)
        })
      }

      if (!summary && !result) {
        setResult('（无返回内容）')
      }
    } catch (err) {
      const msg = err instanceof AIServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : '未知错误'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // 如果没有任何 API Key，显示提示
  if (!hasAnyKey) {
    return (
      <GlassPanel cornerRadius={16} padding="32px">
        <div className="text-center text-white/60">
          <Settings size={32} className="mx-auto mb-3 text-white/30" />
          <p className="text-sm">请先在「设置」页面配置 API Key</p>
        </div>
      </GlassPanel>
    )
  }

  return (
    <div className="space-y-3">
      {/* 模型选择 */}
      <div className="flex items-center gap-2 mb-2 relative">
        <button
          onClick={() => setShowModelSelect(!showModelSelect)}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-white/70 hover:bg-white/10"
          style={{
            background: showModelSelect ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span>{PROVIDER_NAMES[config.provider]}</span>
          <span className="text-white/40">{AI_PRESETS[config.provider].model}</span>
          {currentProviderHasKey ? (
            <span className="text-green-400">✓</span>
          ) : (
            <span className="text-red-400">!</span>
          )}
          <ChevronDown size={12} />
        </button>
        
        {/* 模型下拉菜单 */}
        {showModelSelect && (
          <div
            className="absolute top-8 left-0 z-10 rounded-lg p-2"
            style={{
              background: 'rgba(0, 0, 0, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minWidth: '220px',
            }}
          >
            {(Object.keys(AI_PRESETS) as AIProvider[]).map((provider) => {
              const providerHasKey = hasKey(provider)
              return (
                <button
                  key={provider}
                  onClick={() => {
                    setProvider(provider)
                    setShowModelSelect(false)
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left"
                  style={{
                    background: config.provider === provider ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    color: config.provider === provider ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span>{PROVIDER_NAMES[provider]}</span>
                    {providerHasKey ? (
                      <span className="text-green-400 text-[10px]">已配置</span>
                    ) : (
                      <span className="text-red-400/60 text-[10px]">未配置</span>
                    )}
                  </div>
                  <span className="text-white/40">{AI_PRESETS[provider].model}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 模式切换 */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setMode('diary')}
          className={`text-xs px-3 py-1.5 rounded-lg transition ${
            mode === 'diary'
              ? 'bg-blue-500/30 text-white border border-blue-400/50'
              : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
          }`}
        >
          总结日记
        </button>
        <button
          onClick={() => setMode('custom')}
          className={`text-xs px-3 py-1.5 rounded-lg transition ${
            mode === 'custom'
              ? 'bg-blue-500/30 text-white border border-blue-400/50'
              : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
          }`}
        >
          总结文本
        </button>
      </div>

      {/* 内容输入区 */}
      <GlassPanel cornerRadius={12} padding="16px">
        {mode === 'diary' ? (
          <div>
            <label className="text-xs text-white/70 mb-1.5 block">选择日记</label>
            <select
              value={selectedDiaryId}
              onChange={e => setSelectedDiaryId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-blue-400/50"
            >
              <option value="">-- 请选择 --</option>
              {diaries.map(d => (
                <option key={d.id} value={d.id}>
                  {d.title} ({d.date})
                </option>
              ))}
            </select>
            {selectedDiaryId && (() => {
              const diary = diaries.find(d => d.id === selectedDiaryId)
              if (!diary) return null
              return (
                <div className="mt-3 p-3 rounded-lg bg-black/20 text-xs text-white/70 max-h-32 overflow-auto">
                  {diary.content.slice(0, 300)}{diary.content.length > 300 ? '...' : ''}
                </div>
              )
            })()}
          </div>
        ) : (
          <div>
            <label className="text-xs text-white/70 mb-1.5 block">输入要总结的文本</label>
            <textarea
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              placeholder="粘贴或输入一大段文字..."
              rows={8}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50 resize-none"
            />
          </div>
        )}
      </GlassPanel>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSummarize}
          disabled={loading || !currentProviderHasKey}
          className="text-sm px-4 py-2 rounded-lg bg-blue-500/40 hover:bg-blue-500/60 text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" />总结中...</>
          ) : (
            <><Sparkles size={14} />开始总结</>
          )}
        </button>
        {result && (
          <button
            onClick={() => { setResult(''); setError(null) }}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 transition"
          >
            清空
          </button>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/15 border border-red-400/30 text-xs text-red-200">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* 总结结果 */}
      {result && (
        <GlassPanel cornerRadius={12} padding="20px">
          <div className="text-xs text-white/50 mb-2 flex items-center justify-between">
            <span>✨ AI 总结结果</span>
            <span>{friendlyDate(new Date())}</span>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result}
            </ReactMarkdown>
          </div>
        </GlassPanel>
      )}
    </div>
  )
}