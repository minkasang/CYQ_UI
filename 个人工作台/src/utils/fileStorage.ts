// 文件存储工具
// 调用 server.py API 读写本地文件，实现数据持久化

const API_BASE = 'http://localhost:8090/api'

// 数据文件路径（相对于项目根目录）
const DATA_DIR = '个人工作台/data'

export const FILE_KEYS = {
  TODOS: `${DATA_DIR}/todos.json`,
  DIARIES: `${DATA_DIR}/diaries.json`,
  AI_CONFIG: `${DATA_DIR}/ai_config.json`,
  API_KEYS: `${DATA_DIR}/api_keys.json`,
  WALLPAPER: `${DATA_DIR}/wallpaper.json`,
  SETTINGS: `${DATA_DIR}/settings.json`,
  GLASS_PARAMS: `${DATA_DIR}/glass_params.json`,
  CHATS: `${DATA_DIR}/chats.json`,
  PROJECTS: `${DATA_DIR}/projects.json`,
  TAGS: `${DATA_DIR}/tags.json`,
  ACHIEVEMENTS: `${DATA_DIR}/achievements.json`,
  THEME_PRESETS: `${DATA_DIR}/theme_presets.json`,
} as const

// 从文件读取数据
export async function loadFromFile<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}/read?path=${encodeURIComponent(path)}`)
    const data = await res.json()
    if (!data.ok) {
      console.warn(`[fileStorage] 读取 ${path} 失败:`, data.error)
      return fallback
    }
    if (data.binary) {
      console.warn(`[fileStorage] ${path} 是二进制文件`)
      return fallback
    }
    return JSON.parse(data.content) as T
  } catch (err) {
    console.error(`[fileStorage] 读取 ${path} 异常:`, err)
    return fallback
  }
}

// 写入数据到文件
export async function saveToFile<T>(path: string, value: T): Promise<boolean> {
  try {
    const content = JSON.stringify(value, null, 2)
    const res = await fetch(`${API_BASE}/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content }),
    })
    const data = await res.json()
    if (!data.ok) {
      console.error(`[fileStorage] 写入 ${path} 失败:`, data.error)
      return false
    }
    return true
  } catch (err) {
    console.error(`[fileStorage] 写入 ${path} 异常:`, err)
    return false
  }
}

// 批量读取文件
export async function loadBatch<T extends Record<string, unknown>>(
  paths: Record<string, string>,
  fallbacks: Record<string, unknown>
): Promise<T> {
  try {
    const res = await fetch(`${API_BASE}/read-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths: Object.values(paths) }),
    })
    const data = await res.json()
    if (!data.ok) {
      console.warn('[fileStorage] 批量读取失败:', data.error)
      return fallbacks as T
    }

    const result: Record<string, unknown> = {}
    for (const file of data.files) {
      const key = Object.keys(paths).find(k => paths[k] === file.path)
      if (key && file.ok && !file.binary) {
        try {
          result[key] = JSON.parse(file.content)
        } catch {
          result[key] = fallbacks[key]
        }
      } else if (key) {
        result[key] = fallbacks[key]
      }
    }
    return result as T
  } catch (err) {
    console.error('[fileStorage] 批量读取异常:', err)
    return fallbacks as T
  }
}