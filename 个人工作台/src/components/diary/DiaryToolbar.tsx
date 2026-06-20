// AI 工具栏组件
// 提供润色、续写、改写等 AI 辅助功能

import { useState } from 'react'
import { Sparkles, ArrowRight, RefreshCw, Loader2, Settings } from 'lucide-react'
import { useAIConfigStore } from '../../store/useAIConfigStore'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { polishText, continueText, rewriteText, AIServiceError } from '../ai/aiService'
import { Popover } from '../ui/Popover'
import type { AIConfig } from '../../types'

interface DiaryToolbarProps {
  content: string
  onApply: (newContent: string) => void
}

// 改写风格选项
const REWRITE_STYLES = [
  { value: '正式', label: '正式' },
  { value: '轻松', label: '轻松' },
  { value: '文艺', label: '文艺' },
  { value: '简洁', label: '简洁' },
]

export function DiaryToolbar({ content, onApply }: DiaryToolbarProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AI 配置
  const config = useAIConfigStore(s => s.config)
  const hasKey = useAPIKeysStore(s => s.hasKey)
  const diarySettings = useSettingsStore(s => s.settings.diary)

  // 检查 AI 功能是否启用
  const aiEnabled = diarySettings.enableAIAssist
  const currentProviderHasKey = hasKey(config.provider)

  // 执行 AI 操作
  const handleAIAction = async (
    action: 'polish' | 'continue' | 'rewrite',
    style?: string
  ) => {
    if (!currentProviderHasKey) {
      setError('请先配置 API Key')
      return
    }

    if (!content.trim()) {
      setError('请先输入内容')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const apiKey = useAPIKeysStore.getState().getActiveKey(config.provider) || ''
      const fullConfig: AIConfig = {
        ...config,
        apiKey,
      }

      let result = ''
      switch (action) {
        case 'polish':
          result = await polishText(fullConfig, content)
          break
        case 'continue':
          result = await continueText(fullConfig, content)
          break
        case 'rewrite':
          result = await rewriteText(fullConfig, content, style || '正式')
          break
      }

      // 续写时追加内容，其他操作替换内容
      if (action === 'continue') {
        onApply(content + '\n\n' + result)
      } else {
        onApply(result)
      }
    } catch (err) {
      const msg = err instanceof AIServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'AI 服务出错'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // AI 功能未启用
  if (!aiEnabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-white/50">
        <Settings size={14} />
        <span>AI 辅助功能已关闭，可在设置中开启</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* 润色按钮 */}
        <button
          onClick={() => handleAIAction('polish')}
          disabled={loading || !currentProviderHasKey}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
          title="优化文字表达"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          润色
        </button>

        {/* 续写按钮 */}
        <button
          onClick={() => handleAIAction('continue')}
          disabled={loading || !currentProviderHasKey}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-200 text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
          title="AI 续写后续内容"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
          续写
        </button>

        {/* 改写按钮 */}
        <Popover
          align="left"
          minWidth={120}
          trigger={
            <button
              disabled={loading || !currentProviderHasKey}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
              title="改写为不同风格"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
              改写
            </button>
          }
        >
          <div className="p-2">
            <div className="text-[10px] text-white/30 mb-1 px-1">选择风格</div>
            {REWRITE_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => handleAIAction('rewrite', style.value)}
                className="w-full px-3 py-1.5 rounded text-xs text-white/60 hover:bg-white/[0.08] hover:text-white/80 transition text-left"
              >
                {style.label}
              </button>
            ))}
          </div>
        </Popover>

        {/* API Key 提示 */}
        {!currentProviderHasKey && (
          <span className="text-[10px] text-orange-300/70">请先配置 API Key</span>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="text-xs text-red-300 px-2 py-1 rounded bg-red-500/10">
          {error}
        </div>
      )}
    </div>
  )
}
