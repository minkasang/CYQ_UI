// 字体工具：直接设置 html.style.fontFamily，全局生效
const EN_FONTS: Record<string, string> = {
  geist: "'Geist'", outfit: "'Outfit'", inter: "'Inter'",
  'dm-sans': "'DM Sans'", figtree: "'Figtree'",
  'plus-jakarta': "'Plus Jakarta Sans'", 'space-grotesk': "'Space Grotesk'",
  playfair: "'Playfair Display'", merriweather: "'Merriweather'",
  'bebas-neue': "'Bebas Neue'", 'jetbrains-mono': "'JetBrains Mono'",
  system: '-apple-system',
}
const ZH_FONTS: Record<string, string> = {
  pingfang: "'PingFang SC'", noto: "'Noto Sans SC'",
  'noto-serif': "'Noto Serif SC'", lxgw: "'LXGW WenKai'",
  zcool: "'ZCOOL QingKe HuangYou'", mashan: "'Ma Shan Zheng'",
  system: '-apple-system',
}

export function applyFontFamily(en: string, zh: string) {
  const enFont = EN_FONTS[en] || `'${en}'`
  const zhFont = ZH_FONTS[zh] || `'${zh}'`
  document.documentElement.style.fontFamily = `${enFont}, ${zhFont}, 'Microsoft YaHei', sans-serif`
}

export const EN_FONT_OPTIONS = [
  { value: 'geist', label: 'Geist — 现代精密' },
  { value: 'outfit', label: 'Outfit — 圆润温暖' },
  { value: 'inter', label: 'Inter — 通用干净' },
  { value: 'dm-sans', label: 'DM Sans — 几何人文' },
  { value: 'figtree', label: 'Figtree — 友好圆润' },
  { value: 'plus-jakarta', label: 'Plus Jakarta — 现代优雅' },
  { value: 'space-grotesk', label: 'Space Grotesk — 个性科技' },
  { value: 'playfair', label: 'Playfair Display — 优雅衬线' },
  { value: 'merriweather', label: 'Merriweather — 阅读衬线' },
  { value: 'bebas-neue', label: 'Bebas Neue — 窄粗标题' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono — 等宽代码' },
  { value: 'system', label: '系统默认' },
] as const

export const ZH_FONT_OPTIONS = [
  { value: 'pingfang', label: '苹方 — 现代干净' },
  { value: 'noto', label: 'Noto Sans SC — 均衡' },
  { value: 'noto-serif', label: 'Noto Serif SC — 宋体' },
  { value: 'lxgw', label: '霞鹜文楷 — 手写楷体' },
  { value: 'zcool', label: '站酷黄油 — 创意粗体' },
  { value: 'mashan', label: '马山正 — 毛笔书法' },
  { value: 'system', label: '系统默认' },
] as const
