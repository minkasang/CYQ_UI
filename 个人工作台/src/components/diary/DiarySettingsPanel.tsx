// 日记设置面板
// AI 功能开关，尊重用户隐私

import { Settings, Brain, MessageCircle, BarChart2, Sparkles } from 'lucide-react'
import { useSettingsStore } from '../../store/useSettingsStore'

export function DiarySettingsPanel() {
  const diarySettings = useSettingsStore(s => s.settings.diary)
  const setDiarySettings = useSettingsStore(s => s.setDiarySettings)

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
        <Settings size={16} /> 日记设置
      </h3>
      <p className="text-xs text-white/60 mb-4">
        管理日记 AI 功能，所有功能默认关闭以保护隐私
      </p>

      <div className="space-y-3">
        {/* AI 写作辅助 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-3">
            <Sparkles size={16} className="text-purple-300" />
            <div>
              <div className="text-sm text-white/90">AI 写作辅助</div>
              <div className="text-xs text-white/50">润色、续写、改写功能</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={diarySettings.enableAIAssist}
              onChange={(e) => setDiarySettings({ enableAIAssist: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {/* 情绪分析 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-3">
            <Brain size={16} className="text-blue-300" />
            <div>
              <div className="text-sm text-white/90">情绪分析</div>
              <div className="text-xs text-white/50">保存日记时自动分析情绪</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={diarySettings.enableEmotionAnalysis}
              onChange={(e) => setDiarySettings({ enableEmotionAnalysis: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {/* 即时反馈 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-3">
            <MessageCircle size={16} className="text-green-300" />
            <div>
              <div className="text-sm text-white/90">即时反馈</div>
              <div className="text-xs text-white/50">写完日记后 AI 给出温暖回应</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={diarySettings.enableAIFeedback}
              onChange={(e) => setDiarySettings({ enableAIFeedback: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {/* 日记对话 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-3">
            <MessageCircle size={16} className="text-pink-300" />
            <div>
              <div className="text-sm text-white/90">日记对话</div>
              <div className="text-xs text-white/50">和 AI 讨论日记内容</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={diarySettings.enableDiaryChat}
              onChange={(e) => setDiarySettings({ enableDiaryChat: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>

        {/* 数据统计 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-3">
            <BarChart2 size={16} className="text-yellow-300" />
            <div>
              <div className="text-sm text-white/90">数据统计</div>
              <div className="text-xs text-white/50">写作统计、习惯分析</div>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={diarySettings.enableStats}
              onChange={(e) => setDiarySettings({ enableStats: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>
      </div>

      <p className="text-[10px] text-white/40 mt-4">
        💡 提示：开启 AI 功能需要先配置 API Key。所有 AI 功能调用都会消耗 API 额度。
      </p>
    </div>
  )
}
