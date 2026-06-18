// 日记页面
import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, BarChart2, List, Calendar } from 'lucide-react'
import { DiaryList } from '../components/diary/DiaryList'
import { DiaryEditor } from '../components/diary/DiaryEditor'
import { EmotionChart } from '../components/diary/EmotionChart'
import { EmotionReport } from '../components/diary/EmotionReport'
import { TagFilter } from '../components/diary/TagFilter'
import { TimelineView } from '../components/diary/TimelineView'
import { DiaryStats } from '../components/diary/DiaryStats'
import { useLiquidGlass } from '../hooks/useLiquidGlass'
import { useWallpaperStore } from '../store/useWallpaperStore'
import { useDiaryStore } from '../store/useDiaryStore'
import { useSettingsStore } from '../store/useSettingsStore'

type ViewMode = 'list' | 'timeline'

export function DiaryPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)
  const loadDiaries = useDiaryStore(s => s.loadDiaries)
  const setCurrent = useDiaryStore(s => s.setCurrent)
  const currentId = useDiaryStore(s => s.currentId)
  const diarySettings = useSettingsStore(s => s.settings.diary)

  const [showEmotionPanel, setShowEmotionPanel] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // 加载日记数据
  useEffect(() => {
    loadDiaries()
  }, [loadDiaries])

  // 检查是否启用统计或情绪分析
  const showEmotionFeatures = diarySettings.enableStats || diarySettings.enableEmotionAnalysis

  // 选择日记
  const handleSelectDiary = (id: string) => {
    setCurrent(id)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">我的日记</h1>
      <p className="text-sm text-white/60 mb-4">
        记录思考、感悟与生活
      </p>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
        {/* 左侧：日记列表 + 标签筛选 + 情绪面板 */}
        <div className="space-y-4">
          {/* 视图切换 */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-white/60">视图</span>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'list'
                    ? 'bg-blue-500/30 text-blue-200'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
                title="列表视图"
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded transition ${
                  viewMode === 'timeline'
                    ? 'bg-blue-500/30 text-blue-200'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
                title="时间轴视图"
              >
                <Calendar size={14} />
              </button>
            </div>
          </div>

          {/* 标签筛选 */}
          <TagFilter selectedTag={selectedTag} onSelectTag={setSelectedTag} />

          {/* 日记列表/时间轴 */}
          <div
            ref={(el) => registerPanel(el, { cornerRadius: 16 })}
            className="overflow-auto rounded-2xl p-4 h-[calc(100vh-420px)]"
          >
            {viewMode === 'list' ? (
              <DiaryList filterTag={selectedTag} />
            ) : (
              <TimelineView
                onSelectDiary={handleSelectDiary}
                selectedId={currentId}
                filterTag={selectedTag}
              />
            )}
          </div>

          {/* 情绪面板（可折叠） */}
          {showEmotionFeatures && (
            <div
              ref={(el) => registerPanel(el, { cornerRadius: 16 })}
              className="rounded-2xl p-4"
            >
              <button
                onClick={() => setShowEmotionPanel(!showEmotionPanel)}
                className="flex items-center justify-between w-full text-sm text-white/80 hover:text-white transition"
              >
                <span className="flex items-center gap-2">
                  <BarChart2 size={16} /> 数据洞察
                </span>
                {showEmotionPanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showEmotionPanel && (
                <div className="mt-4 space-y-4">
                  <DiaryStats />
                  {diarySettings.enableEmotionAnalysis && (
                    <>
                      <EmotionChart />
                      <EmotionReport />
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 右侧：编辑器 */}
        <div
          ref={(el) => registerPanel(el, { cornerRadius: 16 })}
          className="overflow-auto rounded-2xl p-5 h-[calc(100vh-180px)]"
        >
          <DiaryEditor />
        </div>
      </div>
    </div>
  )
}
