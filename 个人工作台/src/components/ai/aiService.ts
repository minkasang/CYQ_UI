// AI 服务封装
// 给 AI 的话：统一的 AI 调用接口，支持多种 AI 服务（DeepSeek、OpenAI、Claude 等）
// 关键：API Key 仅在客户端使用，绝不上传任何服务器

import type { AIConfig, AIMessage } from '../../types'

export interface ChatOptions {
  messages: AIMessage[]
  stream?: boolean
  onChunk?: (text: string) => void
  signal?: AbortSignal
}

export interface ImageOptions {
  prompt: string
  size?: string
  n?: number
}

export interface VideoOptions {
  prompt: string
  width?: number
  height?: number
  numFrames?: number
  frameRate?: number
  onProgress?: (status: string) => void
}

export interface ChatResult {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface ImageResult {
  url: string
}

export interface VideoResult {
  url: string
  taskId: string
}

// 通用错误类型
export class AIServiceError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AIServiceError'
  }
}

// 判断是否是图片模型
export function isImageModel(model: string): boolean {
  return model.includes('image') || model.includes('vision') || model.startsWith('agnes-image')
}

// 判断是否是视频模型
export function isVideoModel(model: string): boolean {
  return model.includes('video') || model.startsWith('agnes-video')
}

// 统一的 AI 调用入口
// 给 AI 的话：根据 provider 和 model 类型分发到不同适配器
export async function chat(config: AIConfig, options: ChatOptions): Promise<ChatResult> {
  if (!config.apiKey) {
    throw new AIServiceError('未配置 API Key，请先在设置中配置', 'NO_API_KEY')
  }
  if (!config.baseUrl) {
    throw new AIServiceError('未配置 API 地址', 'NO_BASE_URL')
  }
  if (!config.model) {
    throw new AIServiceError('未选择模型', 'NO_MODEL')
  }

  // 图片模型使用图片生成接口
  if (isImageModel(config.model)) {
    throw new AIServiceError('图片模型不支持对话，请使用 generateImage 函数', 'WRONG_MODEL_TYPE')
  }

  // 视频模型使用视频生成接口
  if (isVideoModel(config.model)) {
    throw new AIServiceError('视频模型不支持对话，请使用 generateVideo 函数', 'WRONG_MODEL_TYPE')
  }

  // 统一走 OpenAI 兼容接口（DeepSeek、Moonshot、智谱 GLM 等都兼容）
  if (config.provider !== 'claude') {
    return callOpenAICompatible(config, options)
  } else {
    return callAnthropic(config, options)
  }
}

// 图片生成
export async function generateImage(config: AIConfig, options: ImageOptions): Promise<ImageResult> {
  if (!config.apiKey) {
    throw new AIServiceError('未配置 API Key，请先在设置中配置', 'NO_API_KEY')
  }
  if (!config.baseUrl) {
    throw new AIServiceError('未配置 API 地址', 'NO_BASE_URL')
  }
  if (!isImageModel(config.model)) {
    throw new AIServiceError('当前模型不支持图片生成，请选择图片模型', 'WRONG_MODEL_TYPE')
  }

  const url = `${config.baseUrl.replace(/\/$/, '')}/images/generations`

  const body = {
    model: config.model,
    prompt: options.prompt,
    size: options.size || '1024x1024',
    n: options.n || 1,
  }

  console.log('[AI] 图片生成请求:', url, body)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    let errMsg = `HTTP ${response.status}`
    try {
      const errJson = JSON.parse(errText)
      errMsg = errJson.error?.message || errJson.message || errJson.detail || errText
    } catch {
      errMsg = errText || errMsg
    }
    throw new AIServiceError(`图片生成失败: ${errMsg}`, `HTTP_${response.status}`)
  }

  const data = await response.json()
  const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json
  
  if (!imageUrl) {
    throw new AIServiceError('图片生成返回空结果', 'EMPTY_RESULT')
  }

  return { url: imageUrl }
}

// 视频生成（异步任务）
export async function generateVideo(config: AIConfig, options: VideoOptions): Promise<VideoResult> {
  if (!config.apiKey) {
    throw new AIServiceError('未配置 API Key，请先在设置中配置', 'NO_API_KEY')
  }
  if (!config.baseUrl) {
    throw new AIServiceError('未配置 API 地址', 'NO_BASE_URL')
  }
  if (!isVideoModel(config.model)) {
    throw new AIServiceError('当前模型不支持视频生成，请选择视频模型', 'WRONG_MODEL_TYPE')
  }

  const baseUrl = config.baseUrl.replace(/\/$/, '')
  
  // Step 1: 创建视频任务
  const createUrl = `${baseUrl}/videos`
  const createBody = {
    model: config.model,
    prompt: options.prompt,
    width: options.width || 1152,
    height: options.height || 768,
    num_frames: options.numFrames || 121, // 5秒 @ 24fps
    frame_rate: options.frameRate || 24,
  }

  console.log('[AI] 创建视频任务:', createUrl, createBody)
  options.onProgress?.('创建视频任务...')

  const createResp = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(createBody),
  })

  if (!createResp.ok) {
    const errText = await createResp.text()
    let errMsg = `HTTP ${createResp.status}`
    try {
      const errJson = JSON.parse(errText)
      errMsg = errJson.error?.message || errJson.message || errJson.detail || errText
    } catch {
      errMsg = errText || errMsg
    }
    throw new AIServiceError(`视频任务创建失败: ${errMsg}`, `HTTP_${createResp.status}`)
  }

  const createData = await createResp.json()
  const taskId = createData.id || createData.task_id || createData.data?.id
  
  if (!taskId) {
    throw new AIServiceError('视频任务创建返回空 task_id', 'EMPTY_TASK_ID')
  }

  console.log('[AI] 视频任务已创建:', taskId)
  options.onProgress?.(`任务已创建，等待生成...`)

  // Step 2: 轮询任务状态
  const statusUrl = `${baseUrl}/videos/${taskId}`
  const maxAttempts = 120 // 最多等待 4 分钟（每 2 秒轮询一次）
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)) // 等待 2 秒
    
    const statusResp = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    })

    if (!statusResp.ok) {
      console.warn('[AI] 状态查询失败:', statusResp.status)
      continue
    }

    const statusData = await statusResp.json()
    const status = statusData.status || statusData.data?.status
    
    console.log('[AI] 视频状态:', status)
    options.onProgress?.(`生成中... (${i + 1}/${maxAttempts})`)

    if (status === 'completed' || status === 'succeeded') {
      // 获取视频 URL（兼容不同字段名）
      const videoUrl = statusData.video_url || 
                       statusData.remixed_from_video_id || 
                       statusData.data?.video_url ||
                       statusData.data?.remixed_from_video_id
      
      if (!videoUrl) {
        throw new AIServiceError('视频生成完成但返回空 URL', 'EMPTY_VIDEO_URL')
      }

      console.log('[AI] 视频生成完成:', videoUrl)
      options.onProgress?.('生成完成!')
      return { url: videoUrl, taskId }
    }

    if (status === 'failed' || status === 'error') {
      const errorMsg = statusData.error || statusData.message || '视频生成失败'
      throw new AIServiceError(`视频生成失败: ${errorMsg}`, 'VIDEO_FAILED')
    }
  }

  throw new AIServiceError('视频生成超时（等待超过 4 分钟）', 'VIDEO_TIMEOUT')
}

// OpenAI 兼容协议（DeepSeek、OpenAI、Moonshot、智谱）
async function callOpenAICompatible(config: AIConfig, options: ChatOptions): Promise<ChatResult> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`

  const body = {
    model: config.model,
    messages: options.messages,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: options.stream ?? false,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
    signal: options.signal,
  })

  if (!response.ok) {
    const errText = await response.text()
    let errMsg = `HTTP ${response.status}`
    try {
      const errJson = JSON.parse(errText)
      errMsg = errJson.error?.message || errJson.message || errText
    } catch {
      errMsg = errText || errMsg
    }
    throw new AIServiceError(`AI 请求失败: ${errMsg}`, `HTTP_${response.status}`)
  }

  // 流式响应
  if (options.stream && options.onChunk) {
    return handleStream(response, options.onChunk)
  }

  // 非流式响应
  const data = await response.json()
  return {
    content: data.choices?.[0]?.message?.content || '',
    usage: data.usage ? {
      promptTokens: data.usage.prompt_tokens,
      completionTokens: data.usage.completion_tokens,
      totalTokens: data.usage.total_tokens,
    } : undefined,
  }
}

// Anthropic Claude 协议
async function callAnthropic(config: AIConfig, options: ChatOptions): Promise<ChatResult> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/v1/messages`

  // 转换消息格式（Anthropic 不支持 system role 在 messages 中）
  const systemMsg = options.messages.find(m => m.role === 'system')
  const userMessages = options.messages.filter(m => m.role !== 'system')

  const body = {
    model: config.model,
    system: systemMsg?.content,
    messages: userMessages.map(m => ({
      role: m.role,
      content: m.content,
    })),
    max_tokens: config.maxTokens,
    temperature: config.temperature,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
    signal: options.signal,
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new AIServiceError(`Claude 请求失败: ${errText}`, `HTTP_${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.content?.[0]?.text || '',
  }
}

// 处理 SSE 流式响应
async function handleStream(response: Response, onChunk: (text: string) => void): Promise<ChatResult> {
  const reader = response.body?.getReader()
  if (!reader) throw new AIServiceError('无法读取响应流', 'NO_READER')

  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') continue
      try {
        const json = JSON.parse(data)
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          fullContent += delta
          onChunk(delta)
        }
      } catch {
        // 忽略解析错误的行
      }
    }
  }

  return { content: fullContent }
}

// ============= 业务封装 =============

// 总结日记
export async function summarizeDiary(config: AIConfig, diaryContent: string, onChunk?: (text: string) => void): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: '你是一个贴心的私人助理，帮助用户总结和反思日记内容。回复要简洁、有温度，使用中文。',
    },
    {
      role: 'user',
      content: `请帮我总结以下日记的要点，提取关键事件、情绪变化和收获：\n\n${diaryContent}`,
    },
  ]

  const result = await chat(config, { messages, stream: !!onChunk, onChunk })
  return result.content
}

// 总结长文本
export async function summarizeText(config: AIConfig, text: string, onChunk?: (text: string) => void): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: '你是一个专业的内容总结助手，能够将长文本提炼为简洁的中文摘要。',
    },
    {
      role: 'user',
      content: `请将以下内容总结为简洁的要点（不超过 300 字）：\n\n${text}`,
    },
  ]

  const result = await chat(config, { messages, stream: !!onChunk, onChunk })
  return result.content
}

// 生成日记（基于零散想法）
export async function generateDiary(config: AIConfig, thoughts: string, onChunk?: (text: string) => void): Promise<string> {
  const messages: AIMessage[] = [
    {
      role: 'system',
      content: '你是一个贴心的写作助手，帮助用户把零散的想法整理成结构化的日记。回复使用中文，Markdown 格式。',
    },
    {
      role: 'user',
      content: `请基于以下零散想法，帮我写一篇结构清晰的日记：\n\n${thoughts}\n\n请按以下结构输出：\n## 今日要点\n## 感悟\n## 明日计划`,
    },
  ]

  const result = await chat(config, { messages, stream: !!onChunk, onChunk })
  return result.content
}
