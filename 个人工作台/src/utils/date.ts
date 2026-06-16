// 日期工具函数
// 给 AI 的话：所有日期格式化、解析、计算都走这里

import { format, isToday, isYesterday, startOfDay, differenceInDays } from 'date-fns'
import { zhCN } from 'date-fns/locale/zh-CN'

// 格式化为 YYYY-MM-DD
export function formatDate(timestamp: number | Date): string {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
  return format(d, 'yyyy-MM-dd')
}

// 格式化为 YYYY-MM-DD HH:mm
export function formatDateTime(timestamp: number | Date): string {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
  return format(d, 'yyyy-MM-dd HH:mm')
}

// 友好的相对时间显示
export function relativeTime(timestamp: number): string {
  const date = new Date(timestamp)
  if (isToday(date)) {
    return `今天 ${format(date, 'HH:mm')}`
  }
  if (isYesterday(date)) {
    return `昨天 ${format(date, 'HH:mm')}`
  }
  const days = differenceInDays(new Date(), date)
  if (days < 7) {
    return `${days}天前`
  }
  return format(date, 'yyyy-MM-dd')
}

// 友好的日期显示（如"2026年6月15日 星期日"）
export function friendlyDate(timestamp: number | Date): string {
  const d = typeof timestamp === 'number' ? new Date(timestamp) : timestamp
  return format(d, 'yyyy年M月d日 EEEE', { locale: zhCN })
}

// 获取今天的日期字符串
export function getToday(): string {
  return formatDate(new Date())
}

// 获取时间戳
export function now(): number {
  return Date.now()
}

// 获取一天的开始时间戳
export function startOfToday(): number {
  return startOfDay(new Date()).getTime()
}
