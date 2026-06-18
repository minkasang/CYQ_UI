// 操作日志工具
// 记录关键操作，便于问题排查和用户行为分析

const LOG_KEY = 'operation_logs'
const MAX_LOGS = 1000

export type OperationType =
  | 'diary:create'
  | 'diary:update'
  | 'diary:delete'
  | 'backup:create'
  | 'backup:restore'
  | 'backup:delete'
  | 'backup:export'
  | 'backup:import'
  | 'ai:polish'
  | 'ai:continue'
  | 'ai:rewrite'
  | 'ai:emotion'
  | 'ai:feedback'
  | 'ai:chat'
  | 'ai:report'
  | 'settings:change'
  | 'error:boundary'

export interface OperationLog {
  id: string
  type: OperationType
  timestamp: number
  detail: Record<string, unknown>
  success: boolean
  duration?: number  // 操作耗时（毫秒）
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/**
 * 获取所有操作日志
 */
export function getOperationLogs(): OperationLog[] {
  try {
    const data = localStorage.getItem(LOG_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * 记录操作日志
 */
export function logOperation(
  type: OperationType,
  detail: Record<string, unknown> = {},
  success: boolean = true
): void {
  const logs = getOperationLogs()

  const log: OperationLog = {
    id: generateId(),
    type,
    timestamp: Date.now(),
    detail,
    success,
  }

  logs.push(log)

  // 保留最新的 MAX_LOGS 条记录
  while (logs.length > MAX_LOGS) {
    logs.shift()
  }

  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs))
  } catch {
    // 存储失败时忽略
    console.warn('[OperationLogger] 存储日志失败')
  }
}

/**
 * 记录带耗时的操作
 */
export function logTimedOperation<T>(
  type: OperationType,
  fn: () => T | Promise<T>,
  getDetail?: (result: T) => Record<string, unknown>
): T | Promise<T> {
  const startTime = Date.now()

  const logResult = (result: T, success: boolean, error?: Error) => {
    const duration = Date.now() - startTime
    const detail = getDetail ? getDetail(result) : {}

    if (error) {
      detail.error = error.message
    }

    const logs = getOperationLogs()
    logs.push({
      id: generateId(),
      type,
      timestamp: Date.now(),
      detail,
      success,
      duration,
    })

    while (logs.length > MAX_LOGS) {
      logs.shift()
    }

    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(logs))
    } catch {
      // 忽略存储错误
    }
  }

  try {
    const result = fn()

    // 处理 Promise
    if (result instanceof Promise) {
      return result
        .then(r => {
          logResult(r, true)
          return r
        })
        .catch(err => {
          logResult(undefined as T, false, err)
          throw err
        })
    }

    // 同步结果
    logResult(result, true)
    return result
  } catch (err) {
    logResult(undefined as T, false, err instanceof Error ? err : new Error(String(err)))
    throw err
  }
}

/**
 * 清空操作日志
 */
export function clearOperationLogs(): void {
  localStorage.removeItem(LOG_KEY)
}

/**
 * 获取指定类型的日志
 */
export function getLogsByType(type: OperationType): OperationLog[] {
  return getOperationLogs().filter(log => log.type === type)
}

/**
 * 获取指定时间范围内的日志
 */
export function getLogsByTimeRange(startTime: number, endTime: number): OperationLog[] {
  return getOperationLogs().filter(log =>
    log.timestamp >= startTime && log.timestamp <= endTime
  )
}

/**
 * 获取失败的日志
 */
export function getFailedLogs(): OperationLog[] {
  return getOperationLogs().filter(log => !log.success)
}

/**
 * 格式化日志时间
 */
export function formatLogTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 获取操作类型的显示名称
 */
export function getOperationLabel(type: OperationType): string {
  const labels: Record<OperationType, string> = {
    'diary:create': '创建日记',
    'diary:update': '更新日记',
    'diary:delete': '删除日记',
    'backup:create': '创建备份',
    'backup:restore': '恢复备份',
    'backup:delete': '删除备份',
    'backup:export': '导出备份',
    'backup:import': '导入备份',
    'ai:polish': 'AI 润色',
    'ai:continue': 'AI 续写',
    'ai:rewrite': 'AI 改写',
    'ai:emotion': '情绪分析',
    'ai:feedback': 'AI 反馈',
    'ai:chat': '日记对话',
    'ai:report': '情绪报告',
    'settings:change': '设置变更',
    'error:boundary': '错误边界',
  }
  return labels[type] || type
}
