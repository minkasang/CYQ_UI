// API 配置面板
// 给 AI 的话：让用户配置 AI 服务（API Key、模型、参数）

import { useState } from 'react'
import { Key, ExternalLink, Eye, EyeOff, Check, X } from 'lucide-react'
import { useAIConfigStore, selectIsAIConfigured } from '../../store/useAIConfigStore'
import type { AIProvider } from '../../types'
import { GlassPanel } from '../glass/GlassPanel'
import { chat } from './aiService'

const PROVIDER_LABELS: Record<AIProvider, { name: string; url: string; desc: string }> = {
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
  const setApiKey = useAIConfigStore(s => s.setApiKey)
  const isConfigured = useAIConfigStore(selectIsAIConfigured)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null)

  // 测试连接
  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await chat(config, {
        messages: [{ role: 'user', content: '你好，请回复"OK"' }],
      })
      setTestResult(result.content.toLowerCase().includes('ok') ? 'success' : 'fail')
    } catch (err) {
      console.error('AI 测试失败:', err)
      setTestResult('fail')
    } finally {
      setTesting(false)
    }
  }

  return (
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
                <div className="font-medium">{info.name}</div>
                <div className="text-[10px] text-white/50 mt-0.5">{info.desc}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* API Key */}
      <div className="mb-3">
        <label className="text-xs text-white/70 mb-1.5 block">API Key</label>
        <div className="flex gap-1.5">
          <div className="flex-1 relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 pr-8 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/50 hover:text-white/80"
            >
              {showKey ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
          {PROVIDER_LABELS[config.provider].url && (
            <a
              href={PROVIDER_LABELS[config.provider].url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 text-xs flex items-center gap-1"
              title="获取 API Key"
            >
              获取 <ExternalLink size={10} />
            </a>
          )}
        </div>
        <p className="text-[10px] text-white/40 mt-1">
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
          disabled={!isConfigured || testing}
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

      <p className="text-[10px] text-white/40 mt-3 leading-relaxed">
        💡 提示：DeepSeek 注册送额度，国产服务对中文支持好。OpenAI 需科学上网。
      </p>
    </GlassPanel>
  )
}
