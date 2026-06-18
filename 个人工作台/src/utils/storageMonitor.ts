// 存储容量检测工具
// 检测 localStorage 容量，提前预警用户

const STORAGE_KEY_TEST = '__storage_test__'

export interface StorageStatus {
  used: number        // 已使用字节数
  total: number       // 总容量字节数（估算）
  available: number   // 可用字节数
  percentage: number  // 使用百分比
  isWarning: boolean  // 是否需要警告（>80%）
  isCritical: boolean // 是否严重（>95%）
}

/**
 * 计算 localStorage 已使用容量
 */
export function getStorageUsed(): number {
  let total = 0
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key) || ''
      // key 和 value 都占用空间
      total += key.length + value.length
    }
  }
  // UTF-16 编码，每个字符 2 字节
  return total * 2
}

/**
 * 估算 localStorage 总容量
 * 不同浏览器限制不同（通常 5-10MB）
 */
export function estimateStorageTotal(): number {
  // 尝试获取实际限制
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    // 使用 Storage API（如果支持）
    return 5 * 1024 * 1024 // 5MB 作为保守估计
  }
  // 默认 5MB
  return 5 * 1024 * 1024
}

/**
 * 获取存储状态
 */
export function getStorageStatus(): StorageStatus {
  const used = getStorageUsed()
  const total = estimateStorageTotal()
  const available = Math.max(0, total - used)
  const percentage = Math.round((used / total) * 100)

  return {
    used,
    total,
    available,
    percentage,
    isWarning: percentage >= 80,
    isCritical: percentage >= 95,
  }
}

/**
 * 测试剩余可用空间
 * 尝试写入指定大小的数据，检测是否成功
 */
export function testStorageAvailable(requiredBytes: number): boolean {
  try {
    const testData = 'x'.repeat(requiredBytes)
    localStorage.setItem(STORAGE_KEY_TEST, testData)
    localStorage.removeItem(STORAGE_KEY_TEST)
    return true
  } catch {
    return false
  }
}

/**
 * 格式化字节数为人类可读格式
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * 清理过期数据（可选）
 * 删除超过指定天数的临时数据
 */
export function cleanupOldData(maxAgeDays: number = 30): number {
  const now = Date.now()
  const maxAge = maxAgeDays * 24 * 60 * 60 * 1000
  let cleaned = 0

  // 清理过期的临时数据
  for (const key in localStorage) {
    if (key.startsWith('temp_') || key.startsWith('cache_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}')
        if (data.timestamp && (now - data.timestamp > maxAge)) {
          localStorage.removeItem(key)
          cleaned++
        }
      } catch {
        // 解析失败，直接删除
        localStorage.removeItem(key)
        cleaned++
      }
    }
  }

  return cleaned
}
