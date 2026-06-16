// 数据导入导出工具
// 给 AI 的话：所有数据以 JSON 格式导出，方便用户备份和多设备同步（v0.3）

import type { ExportData, Todo, Diary, Wallpaper, AppSettings } from '../types'
import { loadFromStorage, STORAGE_KEYS } from './storage'
import { formatDateTime } from './date'

const APP_VERSION = '0.1.0'

// 导出所有数据为 JSON
export function exportAllData(): ExportData {
  const todos = loadFromStorage<Todo[]>(STORAGE_KEYS.TODOS, [])
  const diaries = loadFromStorage<Diary[]>(STORAGE_KEYS.DIARIES, [])
  const settings = loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, {} as AppSettings)
  const wallpaperCurrent = localStorage.getItem(`${STORAGE_KEYS.WALLPAPER}_current`)
  const wallpaperHistory = loadFromStorage<Wallpaper[]>(`${STORAGE_KEYS.WALLPAPER}_history`, [])

  return {
    version: APP_VERSION,
    exportedAt: Date.now(),
    todos,
    diaries,
    settings,
    wallpapers: wallpaperCurrent
      ? [{ id: 'current', type: 'url', value: wallpaperCurrent, name: '当前壁纸', createdAt: Date.now() }, ...wallpaperHistory]
      : wallpaperHistory,
  }
}

// 触发浏览器下载 JSON 文件
export function downloadExport(): void {
  const data = exportAllData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `personal-workbench-backup-${formatDateTime(Date.now()).replace(/[: ]/g, '-')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 导入 JSON 文件
export function importData(jsonStr: string): { success: boolean; count: number; error?: string } {
  try {
    const data = JSON.parse(jsonStr) as ExportData

    // 验证数据格式
    if (typeof data.version !== 'string') {
      return { success: false, count: 0, error: '数据格式不正确（缺少 version）' }
    }

    let count = 0

    if (Array.isArray(data.todos)) {
      localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(data.todos))
      count += data.todos.length
    }

    if (Array.isArray(data.diaries)) {
      localStorage.setItem(STORAGE_KEYS.DIARIES, JSON.stringify(data.diaries))
      count += data.diaries.length
    }

    if (data.settings) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings))
    }

    if (Array.isArray(data.wallpapers) && data.wallpapers.length > 0) {
      const current = data.wallpapers[0]
      localStorage.setItem(`${STORAGE_KEYS.WALLPAPER}_current`, JSON.stringify(current))
      localStorage.setItem(`${STORAGE_KEYS.WALLPAPER}_history`, JSON.stringify(data.wallpapers))
    }

    return { success: true, count }
  } catch (err) {
    return {
      success: false,
      count: 0,
      error: err instanceof Error ? err.message : '未知错误'
    }
  }
}

// 读取文件内容（用于导入按钮）
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
