// AgentsChatPage — 多 Agent 聊天独立页面
// 路由: /agents

import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Plus, Trash2, Bot, Loader2, Check, Users, User, X } from 'lucide-react'
import { useMAChatStore } from '../store'
import { useAgentStore } from '../../../store/useAgentStore'
import { useAPIKeysStore } from '../../../store/useAPIKeysStore'
import { AI_PRESETS } from '../../../store/useAIConfigStore'
import { chat } from '../../../components/ai/aiService'
import { EventDrivenStrategy } from '../../ai/strategies/EventDrivenStrategy'
import type { ChatStrategy } from '../../../types/agent'
import type { AIConfig } from '../../../types'
import { AgentForm } from '../../../components/agents/AgentForm'
import type { AgentFormData } from '../../../types/agent'

export function AgentsChatPage() {
  const store = useMAChatStore()
  const agents = useAgentStore(s => s.agents)
  const loadAgents = useAgentStore(s => s.load)
  const addAgent = useAgentStore(s => s.add)

  useEffect(() => { store.load(); loadAgents() }, [])

  const activeChat = store.chats.find(c => c.id === store.activeChatId) || null
  const [input, setInput] = useState('')
  const [processing, setProcessing] = useState(false)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showCreateAgent, setShowCreateAgent] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [activeChat?.messages])

  // ========== 创建对话 ==========
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

  // ========== 发送消息 ==========
  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeChat || processing) return
    const text = input.trim()
    setInput('')
    setProcessing(true)

    store.addMessage(activeChat.id, 'user', text)
    const updated = useMAChatStore.getState().chats.find(c => c.id === activeChat.id)
    if (!updated) { setProcessing(false); return }

    const callLLM: Parameters<ChatStrategy['execute']>[0]['callLLM'] = async (agent, systemPrompt, history, instruction) => {
      const keys = useAPIKeysStore.getState()
      const key = keys.keys[agent.provider]?.find(k => k.id === keys.activeKeyId[agent.provider])?.key
      if (!key) return null
      const config: AIConfig = {
        provider: agent.provider, apiKey: key, baseUrl: AI_PRESETS[agent.provider]?.baseUrl || '',
        model: agent.model, temperature: 0.7, maxTokens: 500,
      }
      const msgs = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: instruction },
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

    for (const reply of replies) {
      store.addMessage(activeChat.id, 'assistant', reply.content)
    }
    setProcessing(false)
  }, [input, activeChat, processing])

  // ========== 创建 Agent ==========
  const handleCreateAgent = (data: AgentFormData) => {
    const result = addAgent(data)
    if (!result) { alert('Agent 名称已存在'); return }
    setShowCreateAgent(false)
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-140px)] max-w-6xl mx-auto px-4 pt-4">
      {/* 侧边栏 */}
      <div className="w-52 flex-shrink-0 flex flex-col rounded-2xl bg-white/[0.06] backdrop-blur-[10px] border border-white/10 overflow-hidden">
        <div className="p-3 space-y-1.5">
          <button onClick={() => setShowNewChat(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.08] text-xs text-white/70 hover:bg-white/[0.12] transition">
            <Plus size={13} /> 新建群聊
          </button>
          <button onClick={() => setShowCreateAgent(true)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/[0.04] transition">
            <Bot size={12} /> 创建 Agent
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
          {store.chats.map(chat => (
            <button key={chat.id} onClick={() => store.setActive(chat.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition ${
                chat.id === store.activeChatId ? 'bg-white/[0.10] text-white' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/70'
              }`}>
              <Users size={12} className="flex-shrink-0" />
              <span className="truncate flex-1">{chat.title}</span>
              <span className="text-[9px] text-white/15">{chat.agents.length}</span>
              <Trash2 size={11} className="text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 flex-shrink-0"
                onClick={e => { e.stopPropagation(); store.delete(chat.id) }} />
            </button>
          ))}
        </div>
      </div>

      {/* 聊天区 */}
      <div className="flex-1 flex flex-col rounded-2xl bg-white/[0.06] backdrop-blur-[10px] border border-white/10 overflow-hidden">
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center text-white/25 text-sm">
            选择或创建一个群聊
          </div>
        ) : (
          <>
            {/* 顶部横幅——Agent 标签 */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06] flex-wrap">
              <span className={`w-1.5 h-1.5 rounded-full ${activeChat.isActive ? 'bg-[#30D158]' : 'bg-white/[0.15]'}`} />
              <span className="text-xs text-white/50">成员：</span>
              {activeChat.agents.map(a => (
                <span key={a.agentId} className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04] text-white/40">{a.name}</span>
              ))}
              <span className="text-[10px] text-white/20 ml-auto">{activeChat.strategy}</span>
            </div>
            {/* 消息区 */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
              {activeChat.messages.map(msg => {
                const isUser = msg.role === 'user'
                return (
                  <div key={msg.id} className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && <Bot size={14} className="text-white/25 mt-0.5 flex-shrink-0" />}
                    <div className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${isUser ? 'bg-[#0A84FF]/20 text-white/90' : 'bg-white/[0.06] text-white/80'}`}>
                      {msg.content}
                    </div>
                    {isUser && <User size={14} className="text-[#0A84FF] mt-0.5 flex-shrink-0" />}
                  </div>
                )
              })}
              {processing && (
                <div className="flex gap-2">
                  <Loader2 size={14} className="animate-spin text-white/30 mt-0.5" />
                  <div className="px-3 py-2 rounded-xl bg-white/[0.04] text-white/30 text-sm">Agent 思考中...</div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* 输入区 */}
            <div className="border-t border-white/[0.06] px-4 py-3">
              <div className="flex gap-2">
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="输入消息... (@Agent名 提及)"
                  rows={1} disabled={processing}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/15 outline-none focus:border-[#0A84FF] resize-none disabled:opacity-30" />
                <button onClick={handleSend} disabled={processing || !input.trim()}
                  className="px-4 py-2 rounded-lg bg-[#0A84FF] hover:bg-[#0077ED] text-white text-sm disabled:opacity-30">
                  {processing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 新建群聊弹窗 */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNewChat(false)} />
          <div className="relative z-10 rounded-2xl bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl w-[400px] max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <span className="text-sm text-white/70">新建群聊 — 选择 Agent</span>
              <button onClick={() => setShowNewChat(false)} className="p-1 text-white/25 hover:text-white/60"><X size={14} /></button>
            </div>
            <div className="p-4 space-y-2 max-h-[50vh] overflow-y-auto">
              {agents.length === 0 ? <p className="text-xs text-white/30 py-8 text-center">还没有 Agent，请先创建</p> :
                agents.map(a => {
                  const sel = selectedIds.includes(a.id)
                  return (
                    <button key={a.id} onClick={() => setSelectedIds(p => p.includes(a.id) ? p.filter(i => i !== a.id) : [...p, a.id])}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                        sel ? 'bg-[#0A84FF]/15 border border-[#0A84FF]/30' : 'bg-white/[0.03] border border-transparent hover:bg-white/[0.06]' }`}>
                      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${sel ? 'bg-[#0A84FF] border-[#0A84FF]' : 'border-white/[0.15]'}`}>
                        {sel && <Check size={10} className="text-white" />}
                      </span>
                      <div className="min-w-0"><span className="text-xs text-white/70 block truncate">{a.name}</span>
                        <span className="text-[9px] text-white/25">{a.provider}</span></div>
                    </button>
                  )
                })}
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-white/[0.06]">
              <button onClick={() => setShowNewChat(false)} className="px-4 py-1.5 text-xs text-white/40 hover:text-white/60">取消</button>
              <button onClick={handleCreate} disabled={selectedIds.length === 0}
                className="px-5 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0077ED] text-white text-xs font-medium disabled:opacity-30">
                创建群聊 ({selectedIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 创建 Agent 弹窗 */}
      {showCreateAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCreateAgent(false)} />
          <div className="relative z-10 w-[420px]">
            <AgentForm onSave={handleCreateAgent} onCancel={() => setShowCreateAgent(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
