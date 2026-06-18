// 情绪分析 Hook
// 在日记保存时自动分析情绪（根据设置）

import { useCallback } from 'react'
import { useAIConfigStore } from '../store/useAIConfigStore'
import { useAPIKeysStore } from '../store/useAPIKeysStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useDiaryStore } from '../store/useDiaryStore'
import { analyzeEmotion } from '../components/ai/aiService'
import type { EmotionData, AIConfig } from '../types'

export function useEmotionAnalysis() {
  const config = useAIConfigStore(s => s.config)
  const hasKey = useAPIKeysStore(s => s.hasKey)
  const diarySettings = useSettingsStore(s => s.settings.diary)
  const setEmotionData = useDiaryStore(s => s.setEmotionData)

  // 分析日记情绪
  const analyzeDiaryEmotion = useCallback(async (diaryId: string, content: string) => {
    // 检查是否启用情绪分析
    if (!diarySettings.enableEmotionAnalysis) {
      return null
    }

    // 检查是否有 API Key
    if (!hasKey(config.provider)) {
      console.log('[EmotionAnalysis] 未配置 API Key，跳过分析')
      return null
    }

    // 内容太短不分析
    if (content.trim().length < 20) {
      console.log('[EmotionAnalysis] 内容太短，跳过分析')
      return null
    }

    try {
      const apiKey = useAPIKeysStore.getState().getActiveKey(config.provider) || ''
      const fullConfig: AIConfig = {
        ...config,
        apiKey,
      }

      console.log('[EmotionAnalysis] 开始分析情绪...')
      const result = await analyzeEmotion(fullConfig, content)

      const emotionData: EmotionData = {
        type: result.type as EmotionData['type'],
        intensity: result.intensity,
        keywords: result.keywords,
        analyzedAt: Date.now(),
      }

      // 保存情绪数据
      setEmotionData(diaryId, emotionData)
      console.log('[EmotionAnalysis] 分析完成:', emotionData)

      return emotionData
    } catch (err) {
      // 情绪分析失败不影响日记保存
      console.error('[EmotionAnalysis] 分析失败:', err)
      return null
    }
  }, [config, hasKey, diarySettings.enableEmotionAnalysis, setEmotionData])

  return { analyzeDiaryEmotion }
}
