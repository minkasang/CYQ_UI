// API 配置面板
// 给 AI 的话：让用户配置 AI 服务（模型选择），API Key 由 useAPIKeysStore 管理

import { useState } from 'react'
import { Key, Check, X, Settings } from 'lucide-react'
import { useAIConfigStore, selectIsAIConfigured } from '../../store/useAIConfigStore'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import type { AIProvider } from '../../types'
import { GlassPanel } from '../glass/GlassPanel'
import { APIKeyModal } from '../chat/APIKeyModal'
import { chat } from './aiService'

const PROVIDER_LABELS: Record<AIProvider, { name: string; url: string; desc: string }> = {
  agnes: { name: 'Agnes AI', url: 'https://platform.agnes-ai.com', desc: '免费，全模态' },
  deepseek: { name: 'DeepSeek', url: 'https://platform.deepseek.com/api_keys', desc: '国产，便宜好用' },
  openai: { name: 'OpenAI', url: 'https://platform.openai.com/api-keys', desc: 'GPT 系列' },
  claude: { name: 'Claude', url: 'https://console.anthropic.com/', desc: 'Anthropic' },
  kimi: { name: 'Kimi (月之暗面)', url: 'https://platform.moonshot.cn/console/api-keys', desc: '国产，长文本' },
  zhipu: { name: '智谱 GLM', url: 'https://open.bigmodel.cn/usercenter/apikeys', desc: '国产，GLM-4' },
  custom: { name: '自定义', url: '', desc: '兼容 OpenAI 协议' },
}

export function APIConfig() {
  const config = useAIConfigStore(s => s.config)
  const setProvider = useAIConfigStore(s => s.setProvider)
  const setConfig = useAIConfigStore(s => s.setConfig)
  const isConfigured = useAIConfigStore(selectIsAIConfigured)
  
  // API Key 状态
  const hasKey = useAPIKeysStore(s => s.hasKey)
  const getActiveKey = useAPIKeysStore(s => s.getActiveKey)
  
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null)
  const [showKeyModal, setShowKeyModal] = useState(false)

  // 当前提供商是否有 Key
  const currentProviderHasKey = hasKey(config.provider)

  // 测试连接
  const handleTest = async () => {
    const activeKey = getActiveKey(config.provider)
    if (!activeKey) {
      setTestResult('fail')
      return
    }
    
    setTesting(true)
    setTestResult(null)
    try {
      const result = await chat(
        { ...config, apiKey: activeKey },
        { messages: [{ role: 'user', content: '你好，请回复"OK"' }] }
      )
      setTestResult(result.content.toLowerCase().includes('ok') ? 'success' : 'fail')
    } catch (err) {
      console.error('AI 测试失败:', err)
      setTestResult('fail')
    } finally {
      setTesting(false)
    }
  }

  return (
    <>
      <GlassPanel cornerRadius={16} padding="20px">
        <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Key size={16} /> AI 服务配置
        </h3>

        {/* 服务商选择 */}
        <div className="mb-4">
          <label className="text-xs text-white/70 mb-2 block">AI 服务商</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {(Object.keys(PROVIDER_LABELS) as AIProvider[]).map(p => {
              const info = PROVIDER_LABELS[p]
              const providerHasKey = hasKey(p)
              return (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`text-left p-2.5 rounded-lg text-xs transition ${
                    config.provider === p
                      ? 'bg-blue-500/30 border border-blue-400/50 text-white'
                      : 'bg-white/5 border border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{info.name}</span>
                    {providerHasKey ? (
                      <Check size={12} className="text-green-400" />
                    ) : (
                      <span className="text-xs text-red-400/60">未配置</span>
                    )}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">{info.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* API Key 状态 */}
        <div className="mb-3 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">API Key 状态：</span>
              {currentProviderHasKey ? (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Check size={12} /> 已配置
                </span>
              ) : (
                <span className="text-xs text-red-400">未配置</span>
              )}
            </div>
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/60 hover:text-white hover:bg-white/10"
            >
              <Settings size={12} />
              管理 Key
            </button>
          </div>
          <p className="text-xs text-white/40 mt-2">
            🔒 API Key 仅存浏览器本地，不会上传到任何服务器
          </p>
        </div>

        {/* 自定义参数 */}
        {config.provider === 'custom' && (
          <>
            <div className="mb-3">
              <label className="text-xs text-white/70 mb-1.5 block">API Base URL</label>
              <input
                type="text"
                value={config.baseUrl}
                onChange={e => setConfig({ baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50"
              />
            </div>
            <div className="mb-3">
              <label className="text-xs text-white/70 mb-1.5 block">模型名称</label>
              <input
                type="text"
                value={config.model}
                onChange={e => setConfig({ model: e.target.value })}
                placeholder="gpt-3.5-turbo"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50"
              />
            </div>
          </>
        )}

        {/* 测试连接 */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={handleTest}
            disabled={!isConfigured || !currentProviderHasKey || testing}
            className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
          >
            {testing ? '测试中...' : '测试连接'}
          </button>
          {testResult === 'success' && (
            <span className="text-xs text-green-300 flex items-center gap-1">
              <Check size={12} /> 连接成功
            </span>
          )}
          {testResult === 'fail' && (
            <span className="text-xs text-red-300 flex items-center gap-1">
              <X size={12} /> 连接失败，请检查 API Key
            </span>
          )}
        </div>

        <p className="text-xs text-white/40 mt-3 leading-relaxed">
          💡 提示：DeepSeek 注册送额度，国产服务对中文支持好。OpenAI 需科学上网。
        </p>
      </GlassPanel>

      {/* API Key 管理弹窗 */}
      <APIKeyModal open={showKeyModal} onClose={() => setShowKeyModal(false)} />
    </>
  )
}
