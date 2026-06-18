// 错误边界组件
// 捕获子组件树的渲染错误，显示友好的错误界面

import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

// 错误日志记录
function logError(error: Error, errorInfo: ErrorInfo): void {
  const errorLog = {
    timestamp: Date.now(),
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    url: window.location.href,
    userAgent: navigator.userAgent,
  }

  // 存储到 localStorage
  try {
    const logs = JSON.parse(localStorage.getItem('error_logs') || '[]')
    logs.push(errorLog)
    // 最多保留 20 条错误日志
    while (logs.length > 20) {
      logs.shift()
    }
    localStorage.setItem('error_logs', JSON.stringify(logs))
  } catch {
    // 存储失败时忽略
  }

  // 控制台输出
  console.error('[ErrorBoundary] 捕获到错误:', error)
  console.error('[ErrorBoundary] 组件堆栈:', errorInfo.componentStack)
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo })

    // 记录错误日志
    logError(error, errorInfo)

    // 调用自定义错误处理
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // 使用自定义 fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误界面
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertTriangle size={32} className="text-red-400" />
            </div>

            <h2 className="text-lg font-semibold text-white mb-2">
              出了点问题
            </h2>

            <p className="text-sm text-white/60 mb-4">
              页面遇到了一个错误，请尝试刷新或重试。
            </p>

            {this.state.error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-left">
                <div className="flex items-center gap-2 text-xs text-red-300 mb-1">
                  <Bug size={12} /> 错误信息
                </div>
                <p className="text-xs text-white/70 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 text-sm transition"
              >
                <RefreshCw size={14} /> 重试
              </button>
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 text-sm transition"
              >
                刷新页面
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 获取错误日志
export function getErrorLogs(): Array<{
  timestamp: number
  message: string
  stack?: string
  componentStack?: string
  url: string
  userAgent: string
}> {
  try {
    return JSON.parse(localStorage.getItem('error_logs') || '[]')
  } catch {
    return []
  }
}

// 清空错误日志
export function clearErrorLogs(): void {
  localStorage.removeItem('error_logs')
}
