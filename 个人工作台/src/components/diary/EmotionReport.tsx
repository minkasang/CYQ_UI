// 情绪报告组件
// 生成周报/月报

import { useState, useMemo } from 'react'
import { FileText, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useDiaryStore } from '../../store/useDiaryStore'
import { useAIConfigStore } from '../../store/useAIConfigStore'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { generateEmotionReport, AIServiceError } from '../ai/aiService'
import type { AIConfig } from '../../types'

type Period = 'week' | 'month'

export function EmotionReport() {
  const diaries = useDiaryStore(s => s.diaries)
  const config = useAIConfigStore(s => s.config)
  const hasKey = useAPIKeysStore(s => s.hasKey)
  const diarySettings = useSettingsStore(s => s.settings.diary)

  const [period, setPeriod] = useState<Period>('week')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState('')
  const [error, setError] = useState<string | null>(null)

  // 检查情绪分析是否启用
  const emotionEnabled = diarySettings.enableEmotionAnalysis
  const currentProviderHasKey = hasKey(config.provider)

  // 获取时间范围内的日记
  const periodDiaries = useMemo(() => {
    const days = period === 'week' ? 7 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return diaries.filter(d => {
      const diaryDate = new Date(d.date)
      return diaryDate >= startDate && d.emotionData
    })
  }, [diaries, period])

  // 生成报告
  const handleGenerate = async () => {
    if (!currentProviderHasKey) {
      setError('请先配置 API Key')
      return
    }

    if (periodDiaries.length === 0) {
      setError('暂无情绪数据，请先写日记并开启情绪分析')
      return
    }

    setLoading(true)
    setError(null)
    setReport('')

    try {
      const apiKey = useAPIKeysStore.getState().getActiveKey(config.provider) || ''
      const fullConfig: AIConfig = {
        ...config,
        apiKey,
      }

      const diaryData = periodDiaries.map(d => ({
        date: d.date,
        content: d.content.slice(0, 200),
        emotionType: d.emotionData?.type,
        intensity: d.emotionData?.intensity,
      }))

      await generateEmotionReport(fullConfig, diaryData, period, (chunk) => {
        setReport(prev => prev + chunk)
      })
    } catch (err) {
      const msg = err instanceof AIServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : '生成报告失败'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // 情绪分析未启用
  if (!emotionEnabled) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
        <FileText size={24} className="mx-auto mb-2 text-white/30" />
        <p className="text-sm text-white/50">情绪分析功能已关闭</p>
        <p className="text-xs text-white/30 mt-1">请在设置中开启情绪分析</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 标题和选项 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <FileText size={16} /> 情绪报告
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setPeriod('week')}
            className={`px-2 py-1 rounded text-xs transition ${
              period === 'week'
                ? 'bg-blue-500/30 text-blue-200'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            周报
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-2 py-1 rounded text-xs transition ${
              period === 'month'
                ? 'bg-blue-500/30 text-blue-200'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            月报
          </button>
        </div>
      </div>

      {/* 生成按钮 */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerate}
          disabled={loading || !currentProviderHasKey || periodDiaries.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <><Loader2 size={12} className="animate-spin" /> 生成中...</>
          ) : (
            <><Sparkles size={12} /> 生成报告</>
          )}
        </button>
        <span className="text-xs text-white/40">
          {periodDiaries.length} 篇日记有情绪数据
        </span>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="text-xs text-red-300 px-2 py-1 rounded bg-red-500/10">
          {error}
        </div>
      )}

      {/* 报告内容 */}
      {report && (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 prose prose-invert prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
