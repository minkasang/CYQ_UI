// 数据导入导出工具
// v0.3: 改用 fileStorage 数据源（JSON 文件），导出完整配置包（主题/API keys/项目/标签/成就）
// 给 AI 的话：导出时从 server.py API 读取 JSON 文件，确保数据完整性

import type { ExportData, Todo, Diary, Project, Tag, APIKeyEntry, AppSettings } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from './fileStorage'
import { formatDateTime } from './date'

const APP_VERSION = '0.1.0'

// 壁纸数据内部格式
interface WallpaperFile {
  current?: { id: string; type: string; value: string; name?: string; createdAt: number }
  history?: { id: string; type: string; value: string; name?: string; createdAt: number }[]
}

// 导出所有数据为 JSON（从 JSON 文件读取，确保数据完整）
export async function exportAllData(): Promise<ExportData> {
  const [todos, diaries, settingsRaw, wallpaperRaw, apiKeys, projects, tags, achievements] =
    await Promise.all([
      loadFromFile<Todo[]>(FILE_KEYS.TODOS, []),
      loadFromFile<Diary[]>(FILE_KEYS.DIARIES, []),
      loadFromFile<AppSettings>(FILE_KEYS.SETTINGS, {} as AppSettings),
      loadFromFile<WallpaperFile>(FILE_KEYS.WALLPAPER, {}),
      loadFromFile<Record<string, APIKeyEntry[]>>(FILE_KEYS.API_KEYS, {}),
      loadFromFile<Project[]>(FILE_KEYS.PROJECTS, []),
      loadFromFile<Tag[]>(FILE_KEYS.TAGS, []),
      loadFromFile<any[]>(FILE_KEYS.ACHIEVEMENTS, []),
    ])

  // 组装壁纸列表
  const wallpapers: any[] = []
  if (wallpaperRaw?.current) wallpapers.push(wallpaperRaw.current)
  if (wallpaperRaw?.history) wallpapers.push(...wallpaperRaw.history)

  return {
    version: APP_VERSION,
    exportedAt: Date.now(),
    todos,
    diaries,
    settings: settingsRaw || {} as AppSettings,
    wallpapers: wallpapers as any,
    apiKeys,
    projects,
    tags,
    achievements,
  }
}

// 触发浏览器下载 JSON 文件
export async function downloadExport(): Promise<void> {
  const data = await exportAllData()
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

// 导入 JSON 文件（写入 JSON 文件，而非 localStorage）
export async function importData(jsonStr: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const data = JSON.parse(jsonStr) as ExportData

    if (typeof data.version !== 'string') {
      return { success: false, count: 0, error: '数据格式不正确（缺少 version）' }
    }

    let count = 0

    if (Array.isArray(data.todos)) {
      await saveToFile(FILE_KEYS.TODOS, data.todos)
      count += data.todos.length
    }

    if (Array.isArray(data.diaries)) {
      await saveToFile(FILE_KEYS.DIARIES, data.diaries)
      count += data.diaries.length
    }

    if (data.settings) {
      await saveToFile(FILE_KEYS.SETTINGS, data.settings)
    }

    if (Array.isArray(data.wallpapers) && data.wallpapers.length > 0) {
      const wallpaperFile: WallpaperFile = {
        current: data.wallpapers[0],
        history: data.wallpapers.slice(1),
      }
      await saveToFile(FILE_KEYS.WALLPAPER, wallpaperFile)
    }

    if (data.apiKeys) {
      await saveToFile(FILE_KEYS.API_KEYS, data.apiKeys)
    }

    if (Array.isArray(data.projects)) {
      await saveToFile(FILE_KEYS.PROJECTS, data.projects)
    }

    if (Array.isArray(data.tags)) {
      await saveToFile(FILE_KEYS.TAGS, data.tags)
    }

    if (Array.isArray(data.achievements)) {
      await saveToFile(FILE_KEYS.ACHIEVEMENTS, data.achievements)
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
