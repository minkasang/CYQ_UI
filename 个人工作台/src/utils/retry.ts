// 重试工具函数
// 提供指数退避重试机制，用于 AI 调用等不稳定操作

export interface RetryOptions {
  maxRetries?: number      // 最大重试次数，默认 3
  baseDelay?: number       // 基础延迟（毫秒），默认 1000
  maxDelay?: number        // 最大延迟（毫秒），默认 10000
  shouldRetry?: (error: Error) => boolean  // 自定义重试条件
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
}

/**
 * 判断错误是否可重试
 * 网络错误、超时、5xx 错误可重试
 * 4xx 错误（除 429 外）不重试
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()

  // 网络错误
  if (message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')) {
    return true
  }

  // API 限流
  if (message.includes('429') || message.includes('rate limit')) {
    return true
  }

  // 服务器错误
  if (message.includes('500') ||
      message.includes('502') ||
      message.includes('503') ||
      message.includes('504')) {
    return true
  }

  // 其他错误不重试
  return false
}

/**
 * 计算延迟时间（指数退避 + 抖动）
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  // 指数退避：baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt)

  // 添加随机抖动（±20%）
  const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1)

  // 限制最大延迟
  return Math.min(maxDelay, exponentialDelay + jitter)
}

/**
 * 延迟执行
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 带指数退避的重试函数
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 重试结果
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = isRetryableError,
  } = options

  let lastError: Error | undefined
  let attempts = 0

  for (let i = 0; i <= maxRetries; i++) {
    attempts = i + 1

    try {
      const result = await fn()
      return { success: true, data: result, attempts }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // 检查是否应该重试
      if (i < maxRetries && shouldRetry(lastError)) {
        const delayMs = calculateDelay(i, baseDelay, maxDelay)
        console.log(`[Retry] 第 ${i + 1} 次失败，${delayMs}ms 后重试:`, lastError.message)
        await delay(delayMs)
      } else {
        // 不重试，直接返回错误
        break
      }
    }
  }

  return { success: false, error: lastError, attempts }
}

/**
 * 简单重试（无退避）
 * 适用于快速重试场景
 */
export async function retrySimple<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<RetryResult<T>> {
  return retryWithBackoff(fn, {
    maxRetries,
    baseDelay: 0,
    maxDelay: 0,
  })
}

/**
 * 带超时的执行
 * @param fn 要执行的异步函数
 * @param timeoutMs 超时时间（毫秒）
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 30000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`操作超时（${timeoutMs}ms）`))
    }, timeoutMs)

    fn()
      .then(result => {
        clearTimeout(timer)
        resolve(result)
      })
      .catch(err => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

/**
 * 带重试和超时的执行
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  options: RetryOptions & { timeoutMs?: number } = {}
): Promise<RetryResult<T>> {
  const { timeoutMs = 30000, ...retryOptions } = options

  return retryWithBackoff(
    () => withTimeout(fn, timeoutMs),
    retryOptions
  )
}
