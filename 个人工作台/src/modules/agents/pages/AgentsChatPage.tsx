// AgentsChatPage — 多 Agent 聊天页面 v4
// 1v1 对话（agentChatStore）+ 群聊（groupChatStore）完全分离

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Plus, Trash2, Bot, Loader2, Check, Users, User, X, MessageSquare, Pencil } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAgentChatStore, type AChat } from '../stores/agentChatStore'
import { useGroupChatStore, type GChat } from '../stores/groupChatStore'
import { useAgentStore } from '../../../store/useAgentStore'
import { useAPIKeysStore } from '../../../store/useAPIKeysStore'
import { AI_PRESETS, getModelName } from '../../../store/useAIConfigStore'
import { chat } from '../../../components/ai/aiService'
import { EventDrivenStrategy } from '../../ai/strategies/EventDrivenStrategy'
import { SerialStrategy } from '../../ai/strategies/SerialStrategy'
import { AgentForm } from '../../../components/agents/AgentForm'
import type { ChatStrategy, AgentConfig, ChatAgent, AgentFormData } from '../../../types/agent'
import type { AIConfig } from '../../../types'

const STRATEGIES: Record<string, ChatStrategy> = { 'event-driven': EventDrivenStrategy, 'serial': SerialStrategy }

export function AgentsChatPage() {
  const agentChatStore = useAgentChatStore()
  const groupChatStore = useGroupChatStore()
  const agents = useAgentStore(s => s.agents)
  const addAgent = useAgentStore(s => s.add)

  useEffect(() => {
    console.log('[AgentsChatPage] init')
    agentChatStore.load()
    groupChatStore.load()
    useAgentStore.getState().load()
  }, [])

  const [tab, setTab] = useState<'1v1' | 'group'>('1v1')
  const [input, setInput] = useState('')     // 竞态守卫：记录当前请求的对话ID
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AgentConfig | undefined>(undefined)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sidebarWidth, setSidebarWidth] = useState(270)
  const [dragging, setDragging] = useState(false)
  const [inputBase, setInputBase] = useState(80)
  const [draggingInput, setDraggingInput] = useState(false)
  const [contentHeight, setContentHeight] = useState(80)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const active1v1 = agentChatStore.chats.find(c => c.id === agentChatStore.activeId) || null
  const activeGroup = groupChatStore.chats.find(c => c.id === groupChatStore.activeId) || null
  const activeChat = tab === '1v1' ? active1v1 : activeGroup
  const [processing, setProcessing] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [statusText, setStatusText] = useState('')
  const activeIdRef = useRef<string | null>(null)

  const MAX_INPUT = 200
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    requestAnimationFrame(() => {
      const el = e.target; el.style.height = 'auto'
      setContentHeight(Math.min(Math.max(inputBase, el.scrollHeight + 4), MAX_INPUT))
    })
  }
  useEffect(() => { setContentHeight(inputBase) }, [inputBase])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    // 切对话：清流式 + 中断请求
    setStreamContent('')
    setProcessing(false)
    setStatusText('')
    activeIdRef.current = null
  }, [activeChat?.id, tab])
  useEffect(() => {
    if (!dragging) return; const h = (e: MouseEvent) => { e.preventDefault(); setSidebarWidth(Math.max(200, Math.min(500, e.clientX))) }
    const u = () => setDragging(false); window.addEventListener('mousemove', h); window.addEventListener('mouseup', u)
    return () => { window.removeEventListener('mousemove', h); window.removeEventListener('mouseup', u) }
  }, [dragging])
  useEffect(() => {
    if (!draggingInput) return; const h = (e: MouseEvent) => { e.preventDefault(); setInputBase(Math.max(60, Math.min(300, window.innerHeight - e.clientY))) }
    const u = () => setDraggingInput(false); window.addEventListener('mousemove', h); window.addEventListener('mouseup', u)
    return () => { window.removeEventListener('mousemove', h); window.removeEventListener('mouseup', u) }
  }, [draggingInput])

  function getMessages(): any[] {
    if (!activeChat) return []
    if (tab === '1v1') return (activeChat as AChat).messages
    return (activeChat as GChat).messages
  }

  // ========== 创建 Agent ==========
  const handleCreateAgent = (data: AgentFormData) => {
    if (editingAgent) {
      useAgentStore.getState().update(editingAgent.id, data)
    } else {
      const r = addAgent(data); if (!r) { alert('Agent 名称已存在'); return }
    }
    setShowCreateAgent(false); setEditingAgent(undefined)
  }

  // ========== 1v1 发送（流式） ==========
  const send1v1 = useCallback(async (text: string) => {
    if (!active1v1 || processing) return
    const chatId = active1v1.id
    activeIdRef.current = chatId
    setInput(''); setProcessing(true); setStreamContent(''); setStatusText('')
    agentChatStore.addMessage(chatId, 'user', text)
    const agent = active1v1.agent

    const keys = useAPIKeysStore.getState()
    const key = keys.keys[agent.provider]?.find(k => k.id === keys.activeKeyId[agent.provider])?.key
    if (!key) { setStatusText(`${agent.name}：未配置 Key`); setProcessing(false); return }

    const config: AIConfig = {
      provider: agent.provider, apiKey: key, baseUrl: AI_PRESETS[agent.provider]?.baseUrl || '',
      model: agent.model, temperature: agent.temperature ?? 0.7, maxTokens: agent.maxTokens ?? 500,
    }
    const msgs = [
      { role: 'system' as const, content: agent.systemPrompt },
      ...active1v1.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: text },
    ]
    let full = ''
    try {
      const ctrl = new AbortController()
      const t = setTimeout(() => ctrl.abort(), 60000)
      await chat(config, {
        messages: msgs, stream: true, signal: ctrl.signal,
        onChunk: (chunk) => {
          if (activeIdRef.current !== chatId) { ctrl.abort(); return }
          full += chunk; setStreamContent(full)
        }
      })
      clearTimeout(t)
      agentChatStore.addMessage(chatId, 'assistant', full)
    } catch {
      if (full) agentChatStore.addMessage(chatId, 'assistant', full)
      else setStatusText(`${agent.name}：请求失败`)
    }
    setStreamContent(''); setProcessing(false); activeIdRef.current = null
  }, [active1v1, processing])

  // ========== 群聊发送 ==========
  const sendGroup = useCallback(async (text: string) => {
    if (!activeGroup || processing) return
    setInput(''); setProcessing(true)
    groupChatStore.addMessage(activeGroup.id, 'user', text)
    const updated = useGroupChatStore.getState().chats.find(c => c.id === activeGroup.id)
    if (!updated) { setProcessing(false); return }

    const callLLM = async (agent: ChatAgent, sp: string, hist: any, instr: string) => {
      setStatusText(`正在问 ${agent.name}...`)
      const keys = useAPIKeysStore.getState()
      const key = keys.keys[agent.provider]?.find(k => k.id === keys.activeKeyId[agent.provider])?.key
      if (!key) { setStatusText(`${agent.name}：未配置 Key`); return null }
      const config: AIConfig = {
        provider: agent.provider, apiKey: key, baseUrl: AI_PRESETS[agent.provider]?.baseUrl || '',
        model: agent.model, temperature: agent.temperature ?? 0.7, maxTokens: agent.maxTokens ?? 500,
      }
      const msgs = [{ role: 'system', content: sp }, ...hist.map((m: any) => ({ role: m.role, content: m.content })), { role: 'user', content: instr }]
      try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 15000); const r = await chat(config, { messages: msgs as any, stream: false, signal: c.signal }); clearTimeout(t); return r.content || null }
      catch { return null }
    }

    const strategy = STRATEGIES[activeGroup.strategy] || EventDrivenStrategy
    setStatusText('Agent 思考中...')
    const replies = await strategy.execute({
      agents: activeGroup.agents, history: updated.messages.slice(0, -1),
      newMessage: updated.messages[updated.messages.length - 1], callLLM: callLLM as any,
    })
    const skipped = activeGroup.agents.length - replies.length
    setStatusText(replies.length === 0 ? (skipped > 0 ? '所有 Agent 未回复（可能是 API 异常或沉默）' : '') : (skipped > 0 ? `${skipped} 个未回复` : ''))
    for (const r of replies) groupChatStore.addMessage(activeGroup.id, 'assistant', r.content, (r as any).senderName)
    setProcessing(false)
  }, [activeGroup, processing])

  // ========== 创建群聊 ==========
  const handleCreateGroup = () => {
    if (selectedIds.length === 0) return
    const sel = agents.filter(a => selectedIds.includes(a.id)).map(a => ({
      agentId: a.id, name: a.name, provider: a.provider, model: a.model, systemPrompt: a.systemPrompt,
      cooldownMin: a.cooldownMin, cooldownMax: a.cooldownMax, temperature: a.temperature, maxTokens: a.maxTokens,
      description: a.description || '', avatar: a.avatar || '🤖', modules: a.modules,
    }))
    groupChatStore.create(sel)
    setShowNewGroup(false); setSelectedIds([])
  }

  // ========== 聊天渲染 ==========
  const messages = getMessages()

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* 侧边栏 */}
      <aside className="flex-shrink-0 flex flex-col border-r border-white/[0.06] relative"
        style={{ width: sidebarWidth, background: 'rgba(20, 20, 22, 0.7)', backdropFilter: 'saturate(180%) blur(24px)' }}>
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-semibold text-white/70">Agent</h1>
            <button onClick={() => { setEditingAgent(undefined); setShowCreateAgent(true) }}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] text-white/30 hover:text-white/60"><Plus size={16} /></button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mb-3">
            {(['1v1', 'group'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tab === t ? 'bg-white/[0.08] text-white' : 'text-white/30 hover:text-white/50'
                }`}>{t === '1v1' ? '1v1 对话' : '群聊'}</button>
            ))}
          </div>
          {tab === 'group' && (
            <button onClick={() => setShowNewGroup(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/80 transition-all hover:scale-[1.01]"
              style={{ background: 'rgba(10, 132, 255, 0.2)', border: '0.5px solid rgba(10, 132, 255, 0.15)' }}>
              <Plus size={15} /> 新建群聊
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-0.5">
          {tab === '1v1' ? (
            <>
              <p className="px-2 py-1 text-[11px] font-medium text-white/20 uppercase tracking-wider">对话</p>
              {agentChatStore.chats.length === 0 && <p className="px-2 py-6 text-sm text-white/15 text-center">点击 Agent 开始对话</p>}
              {agentChatStore.chats.map(c => (
                <button key={c.id} onClick={() => agentChatStore.setActive(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                    c.id === agentChatStore.activeId ? 'bg-white/[0.08] text-white' : 'text-white/45 hover:bg-white/[0.04] hover:text-white/65'
                  }`}>
                  <span className="text-xs">{c.agent.avatar || '🤖'}</span>
                  <span className="text-sm truncate flex-1">{c.agent.name}</span>
                  <span onClick={e => { e.stopPropagation(); agentChatStore.delete(c.id) }}
                    className="p-0.5 rounded text-white/0 group-hover:text-white/25 hover:text-red-400 cursor-pointer"><Trash2 size={11} /></span>
                </button>
              ))}
            </>
          ) : (
            <>
              <p className="px-2 py-1 text-[11px] font-medium text-white/20 uppercase tracking-wider">群聊</p>
              {groupChatStore.chats.length === 0 && <p className="px-2 py-6 text-sm text-white/15 text-center">暂无群聊</p>}
              {groupChatStore.chats.map(c => (
                <button key={c.id} onClick={() => groupChatStore.setActive(c.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all group ${
                    c.id === groupChatStore.activeId ? 'bg-white/[0.08] text-white' : 'text-white/45 hover:bg-white/[0.04] hover:text-white/65'
                  }`}>
                  <Users size={14} className={c.id === groupChatStore.activeId ? 'text-[#0A84FF]' : ''} />
                  <span className="text-sm truncate flex-1">{c.title}</span>
                  <span className="text-[11px] text-white/15">{c.agents.length}</span>
                  <span onClick={e => { e.stopPropagation(); groupChatStore.delete(c.id) }}
                    className="p-0.5 rounded text-white/0 group-hover:text-white/25 hover:text-red-400 cursor-pointer"><Trash2 size={11} /></span>
                </button>
              ))}
            </>
          )}
          {/* Agent 列表 */}
          <div className="h-px bg-white/[0.06] my-2" />
          <p className="px-2 py-1 text-[11px] font-medium text-white/20 uppercase tracking-wider">Agent</p>
          {agents.map(a => (
            <div key={a.id} className="flex items-center gap-2 px-3 py-2 rounded-lg group hover:bg-white/[0.02] transition-colors">
              <button onClick={() => {
                const snap: ChatAgent = { agentId: a.id, name: a.name, provider: a.provider, model: a.model, systemPrompt: a.systemPrompt,
                  cooldownMin: a.cooldownMin, cooldownMax: a.cooldownMax, temperature: a.temperature, maxTokens: a.maxTokens,
                  description: a.description || '', avatar: a.avatar || '🤖', modules: a.modules }
                agentChatStore.findOrCreate(snap)
                setTab('1v1')
              }} className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs">{a.avatar || '🤖'}</span>
                <span className="text-[11px] text-white/50 truncate">{a.name}</span>
              </button>
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                <span onClick={() => { setEditingAgent(a); setShowCreateAgent(true) }}
                  className="p-1 text-white/20 hover:text-white/50 cursor-pointer"><Pencil size={11} /></span>
                <span onClick={() => { if (confirm(`删除「${a.name}」？`)) useAgentStore.getState().remove(a.id) }}
                  className="p-1 text-white/20 hover:text-red-400 cursor-pointer"><Trash2 size={11} /></span>
              </div>
            </div>
          ))}
        </div>
        <div onMouseDown={() => setDragging(true)}
          className="absolute top-0 right-0 w-3 h-full cursor-col-resize hover:bg-[#0A84FF]/10 z-10 group" style={{ transform: 'translateX(50%)' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-white/[0.06] group-hover:bg-[#0A84FF]/30" />
        </div>
      </aside>

      {/* 聊天区 */}
      <main className="flex-1 flex flex-col min-w-0" style={{ background: 'rgba(14, 14, 16, 0.9)' }}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <MessageSquare size={36} className="text-white/10" />
            <p className="text-base text-white/25">{tab === '1v1' ? '选择或点击 Agent 开始 1v1 对话' : '选择或创建群聊'}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.04]" style={{ background: 'rgba(0,0,0,0.2)' }}>
              {tab === '1v1' ? (
                <><span className="text-xs">{active1v1?.agent.avatar}</span><span className="text-sm text-white/55">{active1v1?.agent.name}</span>
                  <span className="text-xs text-white/20 ml-2">{getModelName(active1v1!.agent.provider, active1v1!.agent.model)}</span></>
              ) : (
                <><span className="w-2 h-2 rounded-full bg-[#30D158]" /><span className="text-sm text-white/55">{activeGroup?.title}</span>
                  <select value={activeGroup?.strategy} onChange={e => groupChatStore.updateStrategy(activeGroup!.id, e.target.value)}
                    className="ml-auto text-xs px-2 py-1 rounded-md text-white/30 bg-white/[0.03] border border-white/[0.05]">
                    <option value="event-driven">并行</option>
                    <option value="serial">串行</option>
                  </select>
                  {activeGroup?.agents.slice(0, 4).map(a => <span key={a.agentId} className="px-2 py-0.5 rounded-md text-xs text-white/30 bg-white/[0.03]">{a.name}</span>)}
                </>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
              {messages.map((msg: any) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role !== 'user' && <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.03]"><Bot size={14} className="text-white/20" /></div>}
                  <div className={`max-w-[65%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                    {msg.senderName && <p className="text-xs text-white/18 mb-1 ml-1">{msg.senderName}</p>}
                    <div className={`px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[#0A84FF]/12 text-white/85 rounded-br-md' : 'bg-white/[0.03] text-white/75 rounded-bl-md'}`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  {msg.role === 'user' && <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#0A84FF]/12"><User size={13} className="text-[#0A84FF]" /></div>}
                </div>
              ))}
              {processing && (
                <div className="flex gap-3">
                    <Loader2 size={13} className="animate-spin text-white/15 mt-1 flex-shrink-0" />
                    <div className="px-4 py-3 rounded-2xl bg-white/[0.02] text-sm text-white/75 min-w-0">
                      {streamContent ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamContent}</ReactMarkdown> : (statusText || '思考中...')}
                    </div>
                  </div>
                )}
              {!processing && statusText && <div className="text-center text-[11px] text-white/10">{statusText}</div>}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-white/[0.04] relative" style={{ background: 'rgba(0,0,0,0.15)' }}>
              <div onMouseDown={() => setDraggingInput(true)} className="absolute top-0 left-0 right-0 h-3 cursor-row-resize hover:bg-[#0A84FF]/10 z-10" style={{ transform: 'translateY(-50%)' }}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-1 rounded-full bg-white/[0.06] group-hover:bg-[#0A84FF]/30" />
              </div>
              <div className="px-8 py-4"><div className="flex gap-3 items-end">
                <textarea value={input} onChange={handleInputChange}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); tab === '1v1' ? send1v1(input) : sendGroup(input) } }}
                  placeholder={tab === '1v1' ? '输入消息...' : '输入消息... (@Agent名 提及)'}
                  rows={1} disabled={processing}
                  className="flex-1 px-5 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none resize-none bg-white/[0.03] border border-white/[0.04] disabled:opacity-30"
                  style={{ height: contentHeight }} />
                <button onClick={() => tab === '1v1' ? send1v1(input) : sendGroup(input)}
                  disabled={(!processing && !input.trim())}
                  className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#0A84FF]/15 disabled:opacity-20">
                  {processing ? <Loader2 size={18} className="animate-spin text-white/40" /> : <Send size={18} className="text-[#0A84FF]" />}
                </button>
                {processing && (
                  <button onClick={() => { setProcessing(false); setStreamContent(''); activeIdRef.current = null }}
                    className="px-3 py-2.5 rounded-xl text-xs text-white/60 hover:text-white bg-red-500/20 hover:bg-red-500/30 transition-colors">
                    取消
                  </button>
                )}
              </div></div>
            </div>
          </>
        )}
      </main>

      {/* 新建群聊弹窗 */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewGroup(false)} />
          <div className="relative z-10 w-[460px] rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/[0.05] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
              <span className="text-base font-medium text-white/55">新建群聊</span>
              <button onClick={() => setShowNewGroup(false)} className="p-1 text-white/15 hover:text-white/50"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
              {agents.map(a => {
                const sel = selectedIds.includes(a.id)
                return (
                  <button key={a.id} onClick={() => setSelectedIds(p => p.includes(a.id) ? p.filter(i => i !== a.id) : [...p, a.id])}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left ${sel ? 'bg-[#0A84FF]/08 border border-[#0A84FF]/15' : 'hover:bg-white/[0.02] border border-transparent'}`}>
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center border ${sel ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-white/[0.08]'}`}>
                      {sel && <Check size={11} className="text-white" />}
                    </span>
                    <span className="text-xs">{a.avatar || '🤖'}</span>
                    <div className="min-w-0 flex-1"><span className="text-sm text-white/65 block truncate">{a.name}</span><span className="text-[11px] text-white/18">{getModelName(a.provider, a.model)}</span></div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-white/[0.04]">
              <button onClick={() => setShowNewGroup(false)} className="px-4 py-2 text-sm text-white/25 hover:text-white/45">取消</button>
              <button onClick={handleCreateGroup} disabled={selectedIds.length === 0} className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-[#0A84FF]/25 disabled:opacity-15">创建 ({selectedIds.length})</button>
            </div>
          </div>
        </div>
      )}

      {/* 创建 Agent 弹窗 */}
      {showCreateAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateAgent(false)} />
          <div className="relative z-10 w-[480px]"><AgentForm initial={editingAgent} onSave={handleCreateAgent} onCancel={() => { setShowCreateAgent(false); setEditingAgent(undefined) }} /></div>
        </div>
      )}
    </div>
  )
}
