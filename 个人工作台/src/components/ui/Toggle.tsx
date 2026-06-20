// 品牌化 Toggle 开关组件
import { useState } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

export function Toggle({ checked, onChange, disabled, label }: ToggleProps) {
  const [animating, setAnimating] = useState(false)

  const handleClick = () => {
    if (disabled) return
    setAnimating(true)
    onChange(!checked)
  }

  return (
    <label
      className={`relative inline-flex items-center gap-3 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {label && <span className="text-sm text-[var(--text-secondary)]">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        onAnimationEnd={() => setAnimating(false)}
        className={`
          relative w-10 h-6 rounded-full transition-colors duration-200
          ${checked ? 'bg-[var(--accent)]' : 'bg-white/[0.12]'}
          ${animating ? 'scale-95' : ''}
        `}
        style={{ transition: 'background-color 200ms var(--transition-fast), transform 100ms' }}
      >
        <span
          className={`
            absolute top-[2px] left-[2px] w-5 h-5 rounded-full bg-white shadow-sm
            transition-transform duration-200
            ${checked ? 'translate-x-4' : 'translate-x-0'}
          `}
          style={{ transition: 'transform 200ms var(--transition-fast)' }}
        />
      </button>
    </label>
  )
}
