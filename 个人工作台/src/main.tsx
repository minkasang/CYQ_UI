// React 入口文件
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App } from './App'
import './index.css'
import { applyFontFamily } from './utils/fontFamily'

// 初始化字体（从 localStorage 读取，全局生效）
applyFontFamily(
  localStorage.getItem('pw-font-en') || 'geist',
  localStorage.getItem('pw-font-zh') || 'pingfang'
)

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)
