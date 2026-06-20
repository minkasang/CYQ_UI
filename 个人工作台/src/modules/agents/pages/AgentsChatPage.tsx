// AgentsChatPage — 多 Agent 群聊页面 v3
// 全宽布局 · macOS 毛玻璃 · Agent 卡片网格 · 宽侧边栏

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Plus, Trash2, Bot, Loader2, Check, Users, User, X, MessageSquare } from 'lucide-react'
import { useMAChatStore } from '../store'
import { useAgentStore } from '../../../store/useAgentStore'
import { useAPIKeysStore } from '../../../store/useAPIKeysStore'
import { AI_PRESETS, getModelName } from '../../../store/useAIConfigStore'
import { chat } from '../../../components/ai/aiService'
import { EventDrivenStrategy } from '../../ai/strategies/EventDrivenStrategy'
import { AgentForm } from '../../../components/agents/AgentForm'
import type { ChatStrategy } from '../../../types/agent'
import type { AIConfig } from '../../../types'
import type { AgentFormData } from '../../../types/agent'

export function AgentsChatPage() {
  const store = useMAChatStore()
  const agents = useAgentStore(s => s.agents)
  const addAgent = useAgentStore(s => s.add)

  useEffect(() => {
    store.load()
    useAgentStore.getState().load()
  }, [])

  // 侧边栏拖拽调整宽度
  const [sidebarWidth, setSidebarWidth] = useState(270)
  const [dragging, setDragging] = useState(false)
  const [inputHeight, setInputHeight] = useState(80)
  const [draggingInput, setDraggingInput] = useState(false)

  // 输入框自动撑高（不超过手动拖的高度和最大高度）
  const [autoHeight, setAutoHeight] = useState(80)
  const MAX_INPUT = 200
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    const prev = el.style.height
    el.style.height = 'auto'
    const scrollH = el.scrollHeight + 4
    const effective = Math.max(inputHeight, Math.min(scrollH, MAX_INPUT))
    setAutoHeight(effective)
    el.style.height = prev // 恢复，由 React state 控制
  }

  // 手动拖后同步基准
  useEffect(() => { setAutoHeight(inputHeight) }, [inputHeight])
  useEffect(() => {
    if (!dragging) return
    const h = (e: MouseEvent) => { e.preventDefault(); setSidebarWidth(Math.max(200, Math.min(500, e.clientX))) }
    const u = () => setDragging(false)
    window.addEventListener('mousemove', h)
    window.addEventListener('mouseup', u)
    return () => { window.removeEventListener('mousemove', h); window.removeEventListener('mouseup', u) }
  }, [dragging])
  useEffect(() => {
    if (!draggingInput) return
    const h = (e: MouseEvent) => { e.preventDefault(); setInputHeight(Math.max(60, Math.min(300, window.innerHeight - e.clientY))) }
    const u = () => setDraggingInput(false)
    window.addEventListener('mousemove', h)
    window.addEventListener('mouseup', u)
    return () => { window.removeEventListener('mousemove', h); window.removeEventListener('mouseup', u) }
  }, [draggingInput])

  const activeChat = store.chats.find(c => c.id === store.activeChatId) || null
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages])

  useEffect(() => {
    if (activeChat && !processing) inputRef.current?.focus()
  }, [activeChat?.id, processing])

  const handleCreate = () => {
    if (selectedIds.length === 0) return
    const selected = agents.filter(a => selectedIds.includes(a.id)).map(a => ({
      agentId: a.id, name: a.name, provider: a.provider, model: a.model,
      systemPrompt: a.systemPrompt, cooldownMin: a.cooldownMin, cooldownMax: a.cooldownMax, modules: a.modules,
    }))
    store.create(selected)
    setShowNewChat(false)
    setSelectedIds([])
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeChat || processing) return
    const text = input.trim()
    setInput('')
    setProcessing(true)
    store.addMessage(activeChat.id, 'user', text)

    const updated = useMAChatStore.getState().chats.find(c => c.id === activeChat.id)
    if (!updated) { setProcessing(false); return }

    const callLLM: Parameters<ChatStrategy['execute']>[0]['callLLM'] = async (agent, sp, hist, instr) => {
      const keys = useAPIKeysStore.getState()
      const key = keys.keys[agent.provider]?.find(k => k.id === keys.activeKeyId[agent.provider])?.key
      if (!key) return null
      const config: AIConfig = {
        provider: agent.provider, apiKey: key, baseUrl: AI_PRESETS[agent.provider]?.baseUrl || '',
        model: agent.model, temperature: 0.7, maxTokens: 500,
      }
      const msgs = [
        { role: 'system' as const, content: sp },
        ...hist.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: instr },
      ]
      try {
        const ctrl = new AbortController()
        const t = setTimeout(() => ctrl.abort(), 15000)
        const r = await chat(config, { messages: msgs, stream: false, signal: ctrl.signal })
        clearTimeout(t)
        return r.content || null
      } catch { return null }
    }

    const replies = await EventDrivenStrategy.execute({
      agents: activeChat.agents,
      history: updated.messages.slice(0, -1),
      newMessage: updated.messages[updated.messages.length - 1],
      callLLM: callLLM as any,
    })
    for (const reply of replies) store.addMessage(activeChat.id, 'assistant', reply.content)
    setProcessing(false)
  }, [input, activeChat, processing])

  const handleCreateAgent = (data: AgentFormData) => {
    const result = addAgent(data)
    if (!result) { alert('Agent 名称已存在'); return }
    setShowCreateAgent(false)
  }

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* ================================================================ */}
      {/* 侧边栏 — 270px，Agent 管理 + 群聊列表                             */}
      {/* ================================================================ */}
      <aside className="flex-shrink-0 flex flex-col border-r border-white/[0.06] relative"
        style={{ width: sidebarWidth, background: 'rgba(20, 20, 22, 0.7)', backdropFilter: 'saturate(180%) blur(24px)' }}>

        {/* 标题 + 操作 */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-semibold text-white/70">多 Agent 群聊</h1>
            <button onClick={() => setShowCreateAgent(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-colors"
              title="创建 Agent">
              <Plus size={16} />
            </button>
          </div>
          <button onClick={() => setShowNewChat(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white/80 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'rgba(10, 132, 255, 0.2)', border: '0.5px solid rgba(10, 132, 255, 0.15)' }}>
            <Plus size={15} /> 新建群聊
          </button>
        </div>

        {/* 群聊列表 */}
        <div className="flex-1 overflow-y-auto px-4 space-y-0.5">
          <p className="px-2 py-1 text-[11px] font-medium text-white/20 uppercase tracking-wider">群聊</p>
          {store.chats.length === 0 && (
            <p className="px-2 py-6 text-sm text-white/15 text-center">暂无群聊</p>
          )}
          {store.chats.map(c => (
            <button key={c.id} onClick={() => store.setActive(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-150 group ${
                c.id === store.activeChatId
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/45 hover:bg-white/[0.04] hover:text-white/65'
              }`}>
              <Users size={14} className={`flex-shrink-0 ${c.id === store.activeChatId ? 'text-[#0A84FF]' : ''}`} />
              <span className="text-sm truncate flex-1">{c.title}</span>
              <span className="text-[11px] text-white/15 tabular-nums">{c.agents.length}</span>
              <button
                onClick={e => { e.stopPropagation(); store.delete(c.id) }}
                className="p-0.5 rounded text-white/0 group-hover:text-white/25 hover:text-red-400 hover:bg-red-400/5 transition-all">
                <Trash2 size={11} />
              </button>
            </button>
          ))}
        </div>

        {/* Agent 列表 */}
        <div className="border-t border-white/[0.05] px-4 py-4">
          <div className="flex items-center justify-between px-2 mb-3">
            <span className="text-[11px] font-medium text-white/20 uppercase tracking-wider">Agent</span>
            <span className="text-[11px] text-white/15">{agents.length}</span>
          </div>
          {agents.length === 0 ? (
            <p className="text-xs text-white/12 text-center py-6">点击右上角 + 创建 Agent</p>
          ) : (
            <div className="space-y-1">
              {agents.map(a => {
                // 检查是否已有与该 Agent 的 1v1 对话
                const existing1v1 = store.chats.find(c =>
                  c.agents.length === 1 && c.agents[0].agentId === a.id
                )
                return (
                  <button key={a.id}
                    onClick={() => {
                      if (existing1v1) {
                        store.setActive(existing1v1.id)
                      } else {
                        const snapshot = [{
                          agentId: a.id, name: a.name, provider: a.provider, model: a.model,
                          systemPrompt: a.systemPrompt, cooldownMin: a.cooldownMin, cooldownMax: a.cooldownMax,
                          modules: a.modules,
                        }]
                        store.create(snapshot)
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-white/[0.04] group text-left"
                    style={{ background: existing1v1?.id === store.activeChatId ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.01)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(10,132,255,0.12)' }}>
                      <Bot size={11} className="text-[#0A84FF]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-medium text-white/50 block truncate">{a.name}</span>
                      <span className="text-[10px] text-white/18">{getModelName(a.provider, a.model)}</span>
                    </div>
                    <MessageSquare size={12} className="text-white/0 group-hover:text-white/20 transition-colors flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
        {/* 拖拽手柄 */}
        <div
          onMouseDown={() => setDragging(true)}
          className="absolute top-0 right-0 w-3 h-full cursor-col-resize hover:bg-[#0A84FF]/10 transition-colors z-10 group"
          style={{ transform: 'translateX(50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-white/[0.06] group-hover:bg-[#0A84FF]/30 transition-colors" />
        </div>
      </aside>

      {/* ================================================================ */}
      {/* 聊天区 — 全宽剩余空间                                            */}
      {/* ================================================================ */}
      <main className="flex-1 flex flex-col min-w-0" style={{ background: 'rgba(14, 14, 16, 0.9)' }}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <MessageSquare size={36} className="text-white/10" />
            </div>
            <div className="text-center">
              <p className="text-base font-medium text-white/25 mb-1.5">多 Agent 群聊</p>
              <p className="text-sm text-white/12 max-w-xs leading-relaxed">
                创建多个 AI Agent，让它们在群聊中根据自己的人设自主交流。支持 @提及、多轮互动。
              </p>
            </div>
            <button onClick={() => setShowNewChat(true)}
              className="mt-3 px-6 py-2.5 rounded-xl text-sm font-medium text-white/80 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'rgba(10, 132, 255, 0.2)', border: '0.5px solid rgba(10, 132, 255, 0.15)' }}>
              开始群聊
            </button>
          </div>
        ) : (
          <>
            {/* Agent 标签栏 */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.04]" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <span className={`w-2 h-2 rounded-full ${activeChat.isActive ? 'bg-[#30D158] shadow-[0_0_8px_rgba(48,209,88,0.3)]' : 'bg-white/[0.10]'}`} />
              <span className="text-sm font-medium text-white/55">{activeChat.title}</span>
              <div className="flex items-center gap-1.5 ml-auto">
                {activeChat.agents.slice(0, 4).map(a => (
                  <span key={a.agentId} className="px-2 py-0.5 rounded-md text-[10px] text-white/30"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>{a.name}</span>
                ))}
                {activeChat.agents.length > 4 && (
                  <span className="text-[10px] text-white/15">+{activeChat.agents.length - 4}</span>
                )}
              </div>
            </div>

            {/* 消息区 */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
              {activeChat.messages.length === 0 && (
                <div className="text-center py-20">
                  <p className="text-sm text-white/15 mb-1">发送第一条消息，触发 Agent 自主对话</p>
                  <p className="text-xs text-white/08">可用 @名称 提及特定 Agent</p>
                </div>
              )}
              {activeChat.messages.map(msg => {
                const isUser = msg.role === 'user'
                return (
                  <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <Bot size={14} className="text-white/20" />
                      </div>
                    )}
                    <div className={`max-w-[65%] ${isUser ? 'order-first' : ''}`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#0A84FF]/12 text-white/85 rounded-br-md'
                          : 'text-white/75 rounded-bl-md'
                      }`} style={!isUser ? { background: 'rgba(255,255,255,0.03)' } : {}}>
                        {msg.content}
                      </div>
                    </div>
                    {isUser && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'rgba(10,132,255,0.12)' }}>
                        <User size={13} className="text-[#0A84FF]" />
                      </div>
                    )}
                  </div>
                )
              })}
              {processing && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <Loader2 size={13} className="animate-spin text-white/15" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md text-sm text-white/20"
                    style={{ background: 'rgba(255,255,255,0.02)' }}>
                    Agent 思考中...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区 */}
            <div className="border-t border-white/[0.04] relative" style={{ background: 'rgba(0,0,0,0.15)' }}>
              {/* 拖拽手柄 */}
              <div
                onMouseDown={() => setDraggingInput(true)}
                className="absolute top-0 left-0 right-0 h-3 cursor-row-resize hover:bg-[#0A84FF]/10 transition-colors z-10 group"
                style={{ transform: 'translateY(-50%)' }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 rounded-full bg-white/[0.06] group-hover:bg-[#0A84FF]/30 transition-colors" />
              </div>
              <div className="px-8 py-4">
                <div className="flex gap-3 items-end">
                <textarea ref={inputRef} value={input} onChange={handleInputChange}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
                  }}
                  placeholder="输入消息... (@Agent名 提及)"
                  rows={1}
                  disabled={processing}
                  className="flex-1 px-5 py-3 rounded-xl text-sm text-white placeholder-white/12 outline-none resize-none transition-colors disabled:opacity-25"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.04)', height: autoHeight }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(10,132,255,0.25)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)' }} />
                <button onClick={handleSend} disabled={processing || !input.trim()}
                  className="w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-15 disabled:scale-100 flex-shrink-0"
                  style={{ background: 'rgba(10,132,255,0.15)' }}>
                  {processing
                    ? <Loader2 size={18} className="animate-spin text-white/40" />
                    : <Send size={18} className="text-[#0A84FF]" />}
                </button>
              </div>
            </div>
            </div>
          </>
        )}
      </main>

      {/* ===== 新建群聊弹窗 ===== */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewChat(false)} />
          <div className="relative z-10 w-[460px] rounded-2xl overflow-hidden"
            style={{ background: 'rgba(28,28,30,0.95)', backdropFilter: 'blur(24px) saturate(180%)', border: '0.5px solid rgba(255,255,255,0.05)', boxShadow: '0 0 0 0.5px rgba(0,0,0,0.1), 0 16px 48px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
              <span className="text-base font-medium text-white/55">新建群聊</span>
              <button onClick={() => setShowNewChat(false)} className="p-1 rounded text-white/15 hover:text-white/50 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
              {agents.length === 0 ? (
                <p className="text-sm text-white/20 py-12 text-center">还没有 Agent，请先在侧边栏创建</p>
              ) : (
                agents.map(a => {
                  const sel = selectedIds.includes(a.id)
                  return (
                    <button key={a.id} onClick={() => setSelectedIds(p => p.includes(a.id) ? p.filter(i => i !== a.id) : [...p, a.id])}
                      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-150 ${
                        sel ? 'bg-[#0A84FF]/08 border border-[#0A84FF]/15' : 'hover:bg-white/[0.02] border border-transparent'
                      }`}>
                      <span className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors border ${
                        sel ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-white/[0.08]'
                      }`}>
                        {sel && <Check size={11} className="text-white" />}
                      </span>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(10,132,255,0.1)' }}>
                        <Bot size={11} className="text-[#0A84FF]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-sm text-white/65 block truncate">{a.name}</span>
                        <span className="text-[11px] text-white/18 mt-0.5">{getModelName(a.provider, a.model)}</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.04]">
              <button onClick={() => setShowNewChat(false)} className="px-4 py-2 rounded-lg text-sm text-white/25 hover:text-white/45 transition-colors">取消</button>
              <button onClick={handleCreate} disabled={selectedIds.length === 0}
                className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-15 disabled:scale-100"
                style={{ background: 'rgba(10,132,255,0.25)' }}>
                创建 ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 创建 Agent 弹窗 ===== */}
      {showCreateAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateAgent(false)} />
          <div className="relative z-10 w-[480px]">
            <AgentForm onSave={handleCreateAgent} onCancel={() => setShowCreateAgent(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
