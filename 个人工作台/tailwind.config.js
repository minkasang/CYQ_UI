/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          medium: 'rgba(255, 255, 255, 0.2)',
          border: 'rgba(255, 255, 255, 0.18)',
        },
        macos: {
          dock: 'rgba(30, 30, 32, 0.85)',
        },
      },
      boxShadow: {
        'card': '0 0 0 0.5px rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.2)',
        'card-hover': '0 0 0 0.5px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.3)',
        'dock': '0 0 0 0.5px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.2)',
      },
      borderRadius: {
        'dock': '20px',
        'dock-item': '10px',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
