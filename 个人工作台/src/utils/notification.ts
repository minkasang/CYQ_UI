// 提醒通知工具
// 使用浏览器 Notification API 发送任务提醒

// 请求通知权限
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[Notification] 浏览器不支持通知')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// 发送通知
export function sendNotification(title: string, options?: NotificationOptions): Notification | null {
  if (!('Notification' in window)) {
    console.warn('[Notification] 浏览器不支持通知')
    return null
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Notification] 未获得通知权限')
    return null
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    })

    // 点击通知时聚焦窗口
    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    return notification
  } catch (err) {
    console.error('[Notification] 发送失败:', err)
    return null
  }
}

// 发送任务提醒
export function sendTodoReminder(todoTitle: string, dueDate?: string): void {
  sendNotification(`任务提醒: ${todoTitle}`, {
    body: dueDate ? `截止日期: ${dueDate}` : '请及时处理',
    tag: 'todo-reminder',
  })
}

// 检查通知权限状态
export function getNotificationPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}
