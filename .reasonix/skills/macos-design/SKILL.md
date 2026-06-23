---
name: "macos-design"
description: "macOS原生设计系统：毛玻璃效果、SF风格字体、原生配色、阴影、动画、交互模式。适用于任何UI设计/样式/布局/动效任务。"
---

# macOS Native App Design Skill

Build interfaces that feel like native macOS apps — not websites crammed into a window.

## Core Philosophy

A native app is not a destination. It is a **system tool**: appear when needed, get out of the way immediately after.

## Quick-Start Checklist

Before writing any UI code, verify:

1. **Layout**: Top bar + optional sidebar + centered content
2. **Drag zone**: Top ~50px must be draggable, keep uncluttered
3. **Empty states**: Show them. Only reveal UI when useful (progressive disclosure)
4. **Keyboard shortcuts**: Every primary action needs one. Show with `<kbd>` hint.
5. **Light + Dark mode**: Design both independently. Do NOT directly invert colors.
6. **Search**: Always prominent. Floating bar / command palette / inline top bar.
7. **Drag and drop**: Support content in AND out.
8. **Micro-animations**: Every state change gets a transition. No interaction without feedback.
9. **Optimistic UI**: Update UI immediately, process in background, revert on failure.

## References

Read these based on what you're building (all paths relative to this skill directory):

- **All macOS apps** → `references/layout-and-composition.md` (required)
- **Colors, typography, blur, shadows** → `references/visual-design.md`
- **Keyboard shortcuts, animations, search, drag-drop** → `references/interaction-patterns.md`

## Implementation Notes (React + Tailwind + Vite)

- Font: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", 'PingFang SC', 'Microsoft YaHei'`
- Body size: 13px (macOS uses smaller type than web)
- 8px base grid for spacing
- Rounded corners: window 10px, card 8px, button 6px, input 6px
- Shadows: layered with `0 0 0 0.5px` edge definition
- Blur: `backdrop-filter: saturate(180%) blur(20px)` for vibrancy
- Dark mode: use `prefers-color-scheme`; spread background levels out (not just invert)
- Border: 0.5px low-opacity for subtle definition, never thick/dark
- Accent: blue #007AFF (light) / #0A84FF (dark), for interactive elements only
