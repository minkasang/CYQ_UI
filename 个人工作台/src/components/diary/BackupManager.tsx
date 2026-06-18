// 备份管理组件
// 让用户可以创建、恢复、导出、导入备份

import { useState, useEffect } from 'react'
import { Download, Upload, Trash2, Clock, FileText, AlertCircle, Check } from 'lucide-react'
import {
  getBackupRecords,
  loadBackup,
  deleteBackup,
  exportBackupToFile,
  importBackupFromFile,
  createBackupData,
  saveBackupToLocal,
  formatBackupTime,
  shouldAutoBackup,
  type BackupRecord,
} from '../../utils/backupManager'
import { formatBytes } from '../../utils/storageMonitor'
import { useDiaryStore } from '../../store/useDiaryStore'

export function BackupManager() {
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const diaries = useDiaryStore(s => s.diaries)
  const loadDiariesFromData = useDiaryStore(s => s.loadDiariesFromData)

  // 加载备份列表
  useEffect(() => {
    setBackups(getBackupRecords())
  }, [])

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // 创建备份
  const handleCreateBackup = () => {
    setLoading(true)
    try {
      const backup = createBackupData(diaries)
      saveBackupToLocal(backup)
      setBackups(getBackupRecords())
      showMessage('success', `备份创建成功，共 ${diaries.length} 篇日记`)
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : '备份失败')
    } finally {
      setLoading(false)
    }
  }

  // 恢复备份
  const handleRestoreBackup = async (id: string) => {
    if (!confirm('恢复备份将覆盖当前所有日记，确定要继续吗？')) return

    setLoading(true)
    try {
      const backup = loadBackup(id)
      if (!backup) {
        throw new Error('备份不存在')
      }

      // 恢复日记
      loadDiariesFromData(backup.diaries)
      showMessage('success', `已恢复 ${backup.diaries.length} 篇日记`)
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : '恢复失败')
    } finally {
      setLoading(false)
    }
  }

  // 删除备份
  const handleDeleteBackup = (id: string) => {
    if (!confirm('确定要删除这个备份吗？')) return

    deleteBackup(id)
    setBackups(getBackupRecords())
    showMessage('success', '备份已删除')
  }

  // 导出备份
  const handleExportBackup = (id: string) => {
    const backup = loadBackup(id)
    if (backup) {
      exportBackupToFile(backup)
      showMessage('success', '备份已导出')
    }
  }

  // 导入备份
  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const backup = await importBackupFromFile(file)

      // 保存到本地
      saveBackupToLocal(backup)
      setBackups(getBackupRecords())
      showMessage('success', `已导入 ${backup.diaries.length} 篇日记的备份`)
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : '导入失败')
    } finally {
      setLoading(false)
      // 清空 input
      e.target.value = ''
    }
  }

  // 导出当前数据
  const handleExportCurrent = () => {
    const backup = createBackupData(diaries)
    exportBackupToFile(backup)
    showMessage('success', '当前数据已导出')
  }

  return (
    <div className="space-y-4">
      {/* 消息提示 */}
      {message && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
        }`}>
          {message.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {message.text}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCreateBackup}
          disabled={loading || diaries.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-xs transition disabled:opacity-40"
        >
          <FileText size={12} /> 创建备份
        </button>

        <button
          onClick={handleExportCurrent}
          disabled={loading || diaries.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs transition disabled:opacity-40"
        >
          <Download size={12} /> 导出当前数据
        </button>

        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-200 text-xs transition cursor-pointer">
          <Upload size={12} /> 导入备份
          <input
            type="file"
            accept=".json"
            onChange={handleImportBackup}
            className="hidden"
            disabled={loading}
          />
        </label>
      </div>

      {/* 自动备份提示 */}
      {shouldAutoBackup() && diaries.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-200 text-xs">
          <AlertCircle size={12} />
          超过 24 小时未备份，建议创建备份
        </div>
      )}

      {/* 备份列表 */}
      {backups.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs text-white/60 font-medium">备份记录（最多保留 7 个）</h4>
          {backups.map((backup) => (
            <div
              key={backup.id}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <Clock size={14} className="text-white/40" />
                <div>
                  <div className="text-sm text-white/80">
                    {backup.diaryCount} 篇日记
                  </div>
                  <div className="text-xs text-white/40">
                    {formatBackupTime(backup.timestamp)} · {formatBytes(backup.size)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRestoreBackup(backup.id)}
                  disabled={loading}
                  className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
                  title="恢复此备份"
                >
                  <Upload size={12} />
                </button>
                <button
                  onClick={() => handleExportBackup(backup.id)}
                  disabled={loading}
                  className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
                  title="导出此备份"
                >
                  <Download size={12} />
                </button>
                <button
                  onClick={() => handleDeleteBackup(backup.id)}
                  disabled={loading}
                  className="p-1.5 rounded hover:bg-red-500/20 text-white/60 hover:text-red-300 transition"
                  title="删除此备份"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-white/40 text-xs">
          <FileText size={24} className="mx-auto mb-2 opacity-50" />
          暂无备份记录
        </div>
      )}
    </div>
  )
}
