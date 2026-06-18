// 写入锁工具
// 防止并发写入导致数据损坏

const LOCK_KEY = 'write_lock'
const LOCK_TIMEOUT = 5000 // 5秒超时

export interface WriteLock {
  id: string
  timestamp: number
  operation: string
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`
}

/**
 * 获取当前锁状态
 */
function getCurrentLock(): WriteLock | null {
  try {
    const data = localStorage.getItem(LOCK_KEY)
    if (!data) return null

    const lock = JSON.parse(data) as WriteLock

    // 检查是否超时
    if (Date.now() - lock.timestamp > LOCK_TIMEOUT) {
      localStorage.removeItem(LOCK_KEY)
      return null
    }

    return lock
  } catch {
    return null
  }
}

/**
 * 尝试获取写入锁
 * @param operation 操作名称，用于调试
 * @returns 锁 ID，用于释放锁
 */
export function acquireWriteLock(operation: string): string | null {
  const current = getCurrentLock()

  // 已有锁
  if (current) {
    console.warn(`[WriteLock] 已有写入操作正在进行: ${current.operation}`)
    return null
  }

  // 获取锁
  const lock: WriteLock = {
    id: generateId(),
    timestamp: Date.now(),
    operation,
  }

  localStorage.setItem(LOCK_KEY, JSON.stringify(lock))
  return lock.id
}

/**
 * 释放写入锁
 * @param lockId 获取锁时返回的 ID
 */
export function releaseWriteLock(lockId: string): void {
  const current = getCurrentLock()

  // 锁不存在或 ID 不匹配
  if (!current || current.id !== lockId) {
    return
  }

  localStorage.removeItem(LOCK_KEY)
}

/**
 * 强制释放锁（谨慎使用）
 */
export function forceReleaseLock(): void {
  localStorage.removeItem(LOCK_KEY)
}

/**
 * 使用写入锁执行操作
 * 自动获取锁、执行操作、释放锁
 */
export async function withWriteLock<T>(
  operation: string,
  fn: () => T | Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  const lockId = acquireWriteLock(operation)

  if (!lockId) {
    return {
      success: false,
      error: '已有写入操作正在进行，请稍后重试',
    }
  }

  try {
    const result = await fn()
    return { success: true, data: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : '操作失败'
    return { success: false, error: msg }
  } finally {
    releaseWriteLock(lockId)
  }
}

/**
 * 检查是否有写入操作正在进行
 */
export function isWriteLocked(): boolean {
  return getCurrentLock() !== null
}

/**
 * 等待写入锁释放
 * @param maxWait 最大等待时间（毫秒）
 */
export function waitForUnlock(maxWait: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const check = () => {
      if (!isWriteLocked()) {
        resolve()
        return
      }

      if (Date.now() - startTime > maxWait) {
        reject(new Error('等待超时'))
        return
      }

      setTimeout(check, 100)
    }

    check()
  })
}
