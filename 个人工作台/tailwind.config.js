/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ========================================
      // 色彩
      // ========================================
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.2)',
          border: 'rgba(255, 255, 255, 0.18)',
        },
        macos: {
          dock: 'rgba(30, 30, 32, 0.85)',
        },
        accent: {
          DEFAULT: '#0A84FF',
          hover: '#409CFF',
        },
      },

      // ========================================
      // 字体系统 — 保持 Tailwind 默认 + Apple 扩展
      // 注意：不覆盖 text-xs/sm/base/lg/xl/2xl/3xl/4xl 默认值
      //       避免影响已有组件。Apple 字号通过 CSS 变量使用
      // ========================================
      fontSize: {
        // 仅扩展 Apple 专用字号（不覆盖默认）
        'apple-xs':   ['11px', { lineHeight: '14px', fontWeight: '400' }],
        'apple-sm':   ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'apple-base': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'apple-md':   ['15px', { lineHeight: '20px', fontWeight: '600' }],
        'apple-lg':   ['17px', { lineHeight: '22px', fontWeight: '400' }],
        'apple-xl':   ['22px', { lineHeight: '28px', fontWeight: '400' }],
        'apple-2xl':  ['26px', { lineHeight: '32px', fontWeight: '700' }],
        'apple-3xl':  ['34px', { lineHeight: '41px', fontWeight: '700' }],
        'apple-4xl':  ['48px', { lineHeight: '52px', fontWeight: '700' }],
      },

      // ========================================
      // 字重
      // ========================================
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      // ========================================
      // 间距 — 8px 基网格
      // ========================================
      spacing: {
        '0':   '0',
        '0.5': '2px',
        '1':   '4px',
        '1.5': '6px',
        '2':   '8px',
        '2.5': '10px',
        '3':   '12px',
        '3.5': '14px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
        '7':   '28px',
        '8':   '32px',
        '9':   '36px',
        '10':  '40px',
        '11':  '44px',
        '12':  '48px',
        '14':  '56px',
        '16':  '64px',
        '18':  '72px',
        '20':  '80px',
        '24':  '96px',
        '30':  '120px',
      },

      // ========================================
      // 圆角 — 4级体系
      // ========================================
      borderRadius: {
        'none':  '0',
        'btn':   '6px',    // Button, Input
        'card':  '8px',    // Card
        'panel': '12px',   // Panel, Modal
        'bento': '16px',   // Bento 卡片
        'dock':  '20px',   // Dock, 大容器
        'item':  '10px',   // Dock item
        'full':  '9999px',
      },

      // ========================================
      // 阴影 — macOS 分层体系
      // ========================================
      boxShadow: {
        'none': 'none',
        // Cards & buttons
        'card':       '0 0 0 0.5px rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.2)',
        'card-hover': '0 0 0 0.5px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.25)',
        // Panels & popovers
        'panel':      '0 0 0 0.5px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3)',
        // Dock
        'dock':       '0 0 0 0.5px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.2)',
        // Floating elements
        'float':      '0 0 0 0.5px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.3), 0 16px 48px rgba(0,0,0,0.15)',
      },

      // ========================================
      // 动效 — cubic-bezier + 三级时长
      // ========================================
      transitionTimingFunction: {
        'apple':  'cubic-bezier(0.25, 0.46, 0.45, 0.94)',   // ease-out
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',       // spring overshoot
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',            // standard easing
      },
      transitionDuration: {
        'fast':   '150ms',
        'normal': '300ms',
        'slow':   '400ms',
      },
      animation: {
        'fade-in':      'fadeIn 300ms cubic-bezier(0.4,0,0.2,1)',
        'slide-up':     'slideUp 400ms cubic-bezier(0.25,0.46,0.45,0.94)',
        'fade-slide-up': 'fadeSlideUp 400ms cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'popover':      'popoverIn 150ms cubic-bezier(0.25,0.46,0.45,0.94) forwards',
        'accordion-down': 'accordionDown 300ms cubic-bezier(0.4,0,0.2,1)',
        'accordion-up':   'accordionUp 300ms cubic-bezier(0.4,0,0.2,1)',
        'bounce-subtle':  'bounceSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeSlideUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popoverIn: {
          '0%':   { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        accordionDown: {
          '0%':   { height: '0', opacity: '0' },
          '100%': { height: 'var(--accordion-height)', opacity: '1' },
        },
        accordionUp: {
          '0%':   { height: 'var(--accordion-height)', opacity: '1' },
          '100%': { height: '0', opacity: '0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
