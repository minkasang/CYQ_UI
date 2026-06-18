// 数据备份工具
// 支持自动备份、手动备份、导出/导入

import type { Diary } from '../types'

const BACKUP_KEY = 'diary_backups'
const AUTO_BACKUP_INTERVAL = 24 * 60 * 60 * 1000 // 24小时
const MAX_BACKUPS = 7 // 最多保留7个备份

export interface BackupData {
  version: string
  timestamp: number
  diaries: Diary[]
  settings?: Record<string, unknown>
}

export interface BackupRecord {
  id: string
  timestamp: number
  diaryCount: number
  size: number // 字节数
}

/**
 * 创建备份数据
 */
export function createBackupData(diaries: Diary[], settings?: Record<string, unknown>): BackupData {
  return {
    version: '1.0',
    timestamp: Date.now(),
    diaries,
    settings,
  }
}

/**
 * 保存备份到 localStorage
 */
export function saveBackupToLocal(backup: BackupData): string {
  const backups = getBackupRecords()
  const id = `backup_${Date.now()}`
  const json = JSON.stringify(backup)

  // 检查存储空间
  try {
    localStorage.setItem(`${BACKUP_KEY}_${id}`, json)
  } catch (e) {
    // 存储空间不足，删除最旧的备份
    if (backups.length > 0) {
      const oldest = backups[0]
      localStorage.removeItem(`${BACKUP_KEY}_${oldest.id}`)
      // 重试
      localStorage.setItem(`${BACKUP_KEY}_${id}`, json)
    } else {
      throw new Error('存储空间不足，无法创建备份')
    }
  }

  // 更新备份记录
  const record: BackupRecord = {
    id,
    timestamp: backup.timestamp,
    diaryCount: backup.diaries.length,
    size: json.length * 2, // UTF-16
  }

  backups.push(record)

  // 保留最新的 MAX_BACKUPS 个备份
  while (backups.length > MAX_BACKUPS) {
    const removed = backups.shift()
    if (removed) {
      localStorage.removeItem(`${BACKUP_KEY}_${removed.id}`)
    }
  }

  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups))

  return id
}

/**
 * 获取备份记录列表
 */
export function getBackupRecords(): BackupRecord[] {
  try {
    const data = localStorage.getItem(BACKUP_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

/**
 * 加载指定备份
 */
export function loadBackup(id: string): BackupData | null {
  try {
    const data = localStorage.getItem(`${BACKUP_KEY}_${id}`)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

/**
 * 删除指定备份
 */
export function deleteBackup(id: string): void {
  localStorage.removeItem(`${BACKUP_KEY}_${id}`)
  const backups = getBackupRecords().filter(b => b.id !== id)
  localStorage.setItem(BACKUP_KEY, JSON.stringify(backups))
}

/**
 * 导出备份为文件
 */
export function exportBackupToFile(backup: BackupData, filename?: string): void {
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename || `diary_backup_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * 从文件导入备份
 */
export function importBackupFromFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        // 验证数据格式
        if (!data.version || !data.timestamp || !Array.isArray(data.diaries)) {
          throw new Error('无效的备份文件格式')
        }
        resolve(data as BackupData)
      } catch (err) {
        reject(new Error('解析备份文件失败'))
      }
    }
    reader.onerror = () => reject(new Error('读取文件失败'))
    reader.readAsText(file)
  })
}

/**
 * 自动备份检查
 * 返回是否需要备份
 */
export function shouldAutoBackup(): boolean {
  const backups = getBackupRecords()
  if (backups.length === 0) return true

  const latest = backups[backups.length - 1]
  const elapsed = Date.now() - latest.timestamp

  return elapsed >= AUTO_BACKUP_INTERVAL
}

/**
 * 格式化备份时间
 */
export function formatBackupTime(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - timestamp

  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} 天前`

  return date.toLocaleDateString('zh-CN')
}
