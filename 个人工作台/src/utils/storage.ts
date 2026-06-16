// localStorage 封装
// 给 AI 的话：所有 localStorage 操作走这里，统一管理 key 命名

const PREFIX = 'pw_'  // personal workbench 前缀

export const STORAGE_KEYS = {
  TODOS: `${PREFIX}todos`,
  DIARIES: `${PREFIX}diaries`,
  AI_CONFIG: `${PREFIX}ai_config`,
  WALLPAPER: `${PREFIX}wallpaper`,
  SETTINGS: `${PREFIX}settings`,
  GLASS_PARAMS: `${PREFIX}glass_params`,
} as const

// 读取数据（带 JSON 解析和容错）
export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch (err) {
    console.error(`[storage] 读取 ${key} 失败:`, err)
    return fallback
  }
}

// 保存数据（自动 JSON 序列化）
export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (err) {
    console.error(`[storage] 保存 ${key} 失败:`, err)
  }
}

// 删除数据
export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (err) {
    console.error(`[storage] 删除 ${key} 失败:`, err)
  }
}

// 清空所有应用数据
export function clearAllStorage(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    removeFromStorage(key)
  })
}
