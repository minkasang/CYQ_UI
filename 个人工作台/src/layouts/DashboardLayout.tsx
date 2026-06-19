// 仪表盘布局 — Widget 卡片网格首页
// 规范：doc/macos-design-spec-v1.md §17 + 共享执行规则文件/模块UI设计/dashboard-design.md

import { type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { GlobalBackground } from '../components/layout/GlobalBackground'
import { Dock } from '../components/layout/Dock'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { useTodoStore, selectTodoStats } from '../store/useTodoStore'
import { useDiaryStore } from '../store/useDiaryStore'
import { useChatStore } from '../store/useChatStore'

export function DashboardLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  // 实时数据
  const todoStats = useTodoStore(selectTodoStats)
  const diaries = useDiaryStore(s => s.diaries)
  const chats = useChatStore(s => s.chats)
  const lastDiary = diaries[0]
  const highPriority = useTodoStore(s => s.todos.filter(t => t.priority === 'high' && !t.completed).length)

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <GlobalBackground />

      <main className="flex-1 overflow-auto">
        <div className="max-w-[960px] mx-auto px-8 py-12 space-y-8">
          <ErrorBoundary>
            {/* 标题区 */}
            <div className="text-center space-y-2">
              <h1 className="text-[26px] font-bold text-white">个人工作台</h1>
              <p className="text-xs text-white/50">
                {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
              </p>
            </div>

            {/* 2×2 卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 待办卡片 */}
              <DashboardCard
                icon="✅" title="待办"
                onClick={() => navigate('/todo')}
              >
                <p className="text-[13px] text-white/90">
                  <span className="text-[#0A84FF] font-semibold">{todoStats.pending}</span> 项待完成
                </p>
                <p className="text-[11px] text-white/50">
                  今天 {todoStats.today} 项
                  {highPriority > 0 && (
                    <span style={{ color: '#FF453A' }}> · 🔴 高优先 {highPriority}</span>
                  )}
                </p>
              </DashboardCard>

              {/* 日记卡片 */}
              <DashboardCard
                icon="📖" title="日记"
                onClick={() => navigate('/diary')}
              >
                {lastDiary ? (
                  <>
                    <p className="text-[13px] text-white/90">{lastDiary.title}</p>
                    <p className="text-[11px] text-white/50">{lastDiary.date}</p>
                  </>
                ) : (
                  <p className="text-[13px] text-white/50">还没有日记</p>
                )}
              </DashboardCard>

              {/* AI 卡片 */}
              <DashboardCard
                icon="💬" title="AI"
                onClick={() => navigate('/ai')}
              >
                {chats.length > 0 ? (
                  <>
                    <p className="text-[13px] text-white/90">
                      <span className="text-[#0A84FF] font-semibold">{chats.length}</span> 个对话
                    </p>
                    <p className="text-[11px] text-white/50">{chats[0]?.title}</p>
                  </>
                ) : (
                  <p className="text-[13px] text-white/50">开始新对话</p>
                )}
              </DashboardCard>

              {/* 数据卡片 */}
              <DashboardCard icon="📊" title="数据" onClick={() => {}}>
                <p className="text-[13px] text-white/90">
                  完成 <span className="text-[#0A84FF] font-semibold">{todoStats.completed}</span> 项
                </p>
                <p className="text-[11px] text-white/50">
                  {diaries.length} 篇日记 · 连续打卡
                </p>
              </DashboardCard>
            </div>

            {/* 如果传入了 children（路由内容），也渲染 */}
            {children}
          </ErrorBoundary>
        </div>
      </main>

      <Dock />
    </div>
  )
}

// 仪表盘卡片壳
function DashboardCard({ icon, title, onClick, children }: {
  icon: string; title: string; onClick?: () => void; children: ReactNode
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
      style={{
        minHeight: 160,
        padding: 20,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        boxShadow: [
          '0 0 0 0.5px rgba(255,255,255,0.05)',
          '0 1px 3px rgba(0,0,0,0.2)',
        ].join(', '),
        transition: 'transform 150ms cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 150ms ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = [
          '0 0 0 0.5px rgba(255,255,255,0.08)',
          '0 4px 16px rgba(0,0,0,0.3)',
        ].join(', ')
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = [
          '0 0 0 0.5px rgba(255,255,255,0.05)',
          '0 1px 3px rgba(0,0,0,0.2)',
        ].join(', ')
      }}
    >
      <h3 className="text-[15px] font-semibold text-white mb-3">
        {icon} {title}
      </h3>
      <div className="space-y-1.5">
        {children}
      </div>
    </div>
  )
}
