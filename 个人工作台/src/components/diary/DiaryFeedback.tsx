// 日记反馈组件
// 写完日记后 AI 给出温暖回应

import { useState } from 'react'
import { Heart, Loader2, X, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAIConfigStore } from '../../store/useAIConfigStore'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { generateFeedback, AIServiceError } from '../ai/aiService'
import type { AIConfig } from '../../types'

interface DiaryFeedbackProps {
  diaryId: string
  content: string
  onFeedbackGenerated?: (feedback: string) => void
  savedFeedback?: string
}

export function DiaryFeedback({ diaryId: _diaryId, content, onFeedbackGenerated, savedFeedback }: DiaryFeedbackProps) {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState(savedFeedback || '')
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  const config = useAIConfigStore(s => s.config)
  const hasKey = useAPIKeysStore(s => s.hasKey)
  const diarySettings = useSettingsStore(s => s.settings.diary)

  // 检查是否启用即时反馈
  const feedbackEnabled = diarySettings.enableAIFeedback
  const currentProviderHasKey = hasKey(config.provider)

  // 生成反馈
  const handleGenerate = async () => {
    if (!currentProviderHasKey) {
      setError('请先配置 API Key')
      return
    }

    if (content.trim().length < 20) {
      setError('内容太短，无法生成反馈')
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

      const result = await generateFeedback(fullConfig, content)
      setFeedback(result)
      onFeedbackGenerated?.(result)
    } catch (err) {
      const msg = err instanceof AIServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : '生成反馈失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // 功能未启用
  if (!feedbackEnabled) {
    return null
  }

  // 已关闭
  if (dismissed && !feedback) {
    return (
      <button
        onClick={() => setDismissed(false)}
        className="text-xs text-white/40 hover:text-white/60 transition flex items-center gap-1"
      >
        <Heart size={12} /> 显示 AI 反馈
      </button>
    )
  }

  return (
    <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-400/20">
      {/* 标题 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-pink-200 flex items-center gap-1.5">
          <Heart size={12} className="text-pink-300" /> AI 的回应
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/30 hover:text-white/60 transition"
        >
          <X size={14} />
        </button>
      </div>

      {/* 内容 */}
      {feedback ? (
        <div className="text-sm text-white/80 prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {feedback}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleGenerate}
            disabled={loading || !currentProviderHasKey}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-200 text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 size={12} className="animate-spin" /> 生成中...</>
            ) : (
              <><Sparkles size={12} /> 获取 AI 的回应</>
            )}
          </button>

          {!currentProviderHasKey && (
            <p className="text-[10px] text-orange-300/70">请先配置 API Key</p>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="text-xs text-red-300 px-2 py-1 rounded bg-red-500/10 mt-2">
          {error}
        </div>
      )}
    </div>
  )
}
