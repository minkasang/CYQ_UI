// 提醒设置组件
// 配置任务的提醒时间和提前天数

import { useState, useEffect } from 'react'
import { Bell, BellOff } from 'lucide-react'
import type { ReminderConfig } from '../../types'
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from '../../utils/notification'

interface ReminderEditorProps {
  value?: ReminderConfig
  dueDate?: string
  onChange: (value: ReminderConfig | undefined) => void
}

export function ReminderEditor({ value, dueDate, onChange }: ReminderEditorProps) {
  const [permissionStatus, setPermissionStatus] = useState(getNotificationPermissionStatus())

  // 检查权限状态
  useEffect(() => {
    const status = getNotificationPermissionStatus()
    setPermissionStatus(status)
  }, [])

  // 请求权限
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    setPermissionStatus(getNotificationPermissionStatus())
    if (!granted) {
      alert('无法获取通知权限，请在浏览器设置中允许通知')
    }
  }

  // 切换提醒开关
  const handleToggle = () => {
    if (value?.enabled) {
      // 关闭提醒
      onChange(undefined)
    } else {
      // 开启提醒
      if (permissionStatus !== 'granted') {
        handleRequestPermission()
      }
      onChange({
        enabled: true,
        time: '09:00',
        advanceDays: 0,
      })
    }
  }

  // 权限不可用
  if (permissionStatus === 'unsupported') {
    return (
      <div className="text-xs text-white/40 flex items-center gap-2">
        <BellOff size={14} />
        浏览器不支持通知
      </div>
    )
  }

  // 权限被拒绝
  if (permissionStatus === 'denied') {
    return (
      <div className="text-xs text-white/40 flex items-center gap-2">
        <BellOff size={14} />
        通知权限被拒绝，请在浏览器设置中允许通知
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* 开关按钮 */}
      <button
        onClick={handleToggle}
        disabled={!dueDate}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition ${
          value?.enabled
            ? 'bg-blue-500/20 text-blue-300'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
        } disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {value?.enabled ? <Bell size={14} /> : <BellOff size={14} />}
        {value?.enabled ? '提醒已开启' : '开启提醒'}
      </button>

      {!dueDate && (
        <p className="text-xs text-white/40">需要设置截止日期才能开启提醒</p>
      )}

      {/* 提醒配置 */}
      {value?.enabled && dueDate && (
        <div className="flex items-center gap-2 pl-2">
          <select
            value={value.advanceDays}
            onChange={e => onChange({ ...value, advanceDays: Number(e.target.value) })}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white outline-none"
          >
            <option value={0}>当天</option>
            <option value={1}>提前1天</option>
            <option value={2}>提前2天</option>
            <option value={3}>提前3天</option>
            <option value={7}>提前1周</option>
          </select>

          <input
            type="time"
            value={value.time}
            onChange={e => onChange({ ...value, time: e.target.value })}
            className="px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white outline-none"
          />

          <span className="text-xs text-white/40">提醒</span>
        </div>
      )}
    </div>
  )
}
