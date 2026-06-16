// 预置网络壁纸
// 给 AI 的话：使用 Unsplash、Pexels 等免费可商用图源
// 所有图片均使用 URL 参数控制尺寸（w=1920），避免加载原图过大

export interface PresetWallpaper {
  id: string
  url: string
  name: string
  category: 'nature' | 'space' | 'abstract' | 'city' | 'art'
  thumb: string  // 缩略图（用于管理面板显示）
}

// 自然风景
const NATURE: PresetWallpaper[] = [
  {
    id: 'nature-mountain',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=60',
    name: '雪山日出',
    category: 'nature',
  },
  {
    id: 'nature-forest',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=60',
    name: '神秘森林',
    category: 'nature',
  },
  {
    id: 'nature-ocean',
    url: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&q=60',
    name: '蓝色海洋',
    category: 'nature',
  },
  {
    id: 'nature-aurora',
    url: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=400&q=60',
    name: '极光',
    category: 'nature',
  },
  {
    id: 'nature-sunset',
    url: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&q=60',
    name: '黄昏',
    category: 'nature',
  },
  {
    id: 'nature-waterfall',
    url: 'https://images.unsplash.com/photo-1432405972618-c6b0cfba3b4a?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1432405972618-c6b0cfba3b4a?w=400&q=60',
    name: '瀑布',
    category: 'nature',
  },
  {
    id: 'nature-lake',
    url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400&q=60',
    name: '湖光山色',
    category: 'nature',
  },
  {
    id: 'nature-desert',
    url: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=60',
    name: '沙漠',
    category: 'nature',
  },
  {
    id: 'nature-beach',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=60',
    name: '热带海滩',
    category: 'nature',
  },
  {
    id: 'nature-canyon',
    url: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=400&q=60',
    name: '大峡谷',
    category: 'nature',
  },
]

// 太空
const SPACE: PresetWallpaper[] = [
  {
    id: 'space-galaxy',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&q=60',
    name: '银河',
    category: 'space',
  },
  {
    id: 'space-nebula',
    url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=400&q=60',
    name: '星云',
    category: 'space',
  },
  {
    id: 'space-moon',
    url: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?w=400&q=60',
    name: '月球',
    category: 'space',
  },
  {
    id: 'space-stars',
    url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&q=60',
    name: '星空',
    category: 'space',
  },
  {
    id: 'space-earth',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&q=60',
    name: '地球',
    category: 'space',
  },
  {
    id: 'space-mars',
    url: 'https://images.unsplash.com/photo-1614728853913-1e22ba0e982c?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1614728853913-1e22ba0e982c?w=400&q=60',
    name: '火星',
    category: 'space',
  },
  {
    id: 'space-aurora',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=60',
    name: '太空极光',
    category: 'space',
  },
  {
    id: 'space-blackhole',
    url: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=400&q=60',
    name: '深空',
    category: 'space',
  },
]

// 抽象
const ABSTRACT: PresetWallpaper[] = [
  {
    id: 'abstract-fluid',
    url: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=400&q=60',
    name: '流体艺术',
    category: 'abstract',
  },
  {
    id: 'abstract-gradient',
    url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=400&q=60',
    name: '彩色烟雾',
    category: 'abstract',
  },
  {
    id: 'abstract-wave',
    url: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=400&q=60',
    name: '极光波浪',
    category: 'abstract',
  },
  {
    id: 'abstract-bubbles',
    url: 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1604079628040-94301bb21b91?w=400&q=60',
    name: '梦幻气泡',
    category: 'abstract',
  },
  {
    id: 'abstract-marble',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=400&q=60',
    name: '大理石纹',
    category: 'abstract',
  },
  {
    id: 'abstract-neon',
    url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=60',
    name: '霓虹光效',
    category: 'abstract',
  },
  {
    id: 'abstract-paint',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&q=60',
    name: '颜料混合',
    category: 'abstract',
  },
  {
    id: 'abstract-geometric',
    url: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1553356084-58ef4a67b2a7?w=400&q=60',
    name: '几何图形',
    category: 'abstract',
  },
  {
    id: 'abstract-crystal',
    url: 'https://images.unsplash.com/photo-1506259091721-347f798196d4?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1506259091721-347f798196d4?w=400&q=60',
    name: '水晶折射',
    category: 'abstract',
  },
  {
    id: 'abstract-fire',
    url: 'https://images.unsplash.com/photo-1567096022668-53b62cec623f?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1567096022668-53b62cec623f?w=400&q=60',
    name: '火焰纹理',
    category: 'abstract',
  },
]

// 城市
const CITY: PresetWallpaper[] = [
  {
    id: 'city-night',
    url: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&q=60',
    name: '城市夜景',
    category: 'city',
  },
  {
    id: 'city-tokyo',
    url: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&q=60',
    name: '东京街景',
    category: 'city',
  },
  {
    id: 'city-skyline',
    url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400&q=60',
    name: '天际线',
    category: 'city',
  },
  {
    id: 'city-rain',
    url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=60',
    name: '雨夜',
    category: 'city',
  },
  {
    id: 'city-hongkong',
    url: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1536599018102-9f803c140fc1?w=400&q=60',
    name: '香港',
    category: 'city',
  },
  {
    id: 'city-paris',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&q=60',
    name: '巴黎',
    category: 'city',
  },
  {
    id: 'city-newyork',
    url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&q=60',
    name: '纽约',
    category: 'city',
  },
  {
    id: 'city-london',
    url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=60',
    name: '伦敦',
    category: 'city',
  },
  {
    id: 'city-dubai',
    url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=60',
    name: '迪拜',
    category: 'city',
  },
  {
    id: 'city-singapore',
    url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=60',
    name: '新加坡',
    category: 'city',
  },
]

// 艺术
const ART: PresetWallpaper[] = [
  {
    id: 'art-painting',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=60',
    name: '油画',
    category: 'art',
  },
  {
    id: 'art-illustration',
    url: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=400&q=60',
    name: '插画',
    category: 'art',
  },
  {
    id: 'art-watercolor',
    url: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&q=60',
    name: '水彩',
    category: 'art',
  },
  {
    id: 'art-mosaic',
    url: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&q=60',
    name: '马赛克',
    category: 'art',
  },
  {
    id: 'art-sculpture',
    url: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=400&q=60',
    name: '雕塑',
    category: 'art',
  },
  {
    id: 'art-street',
    url: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400&q=60',
    name: '街头艺术',
    category: 'art',
  },
  {
    id: 'art-calligraphy',
    url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&q=60',
    name: '书法',
    category: 'art',
  },
  {
    id: 'art-photography',
    url: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&q=60',
    name: '摄影艺术',
    category: 'art',
  },
]

// 全部预设
export const PRESET_WALLPAPERS: PresetWallpaper[] = [
  ...NATURE,
  ...SPACE,
  ...ABSTRACT,
  ...CITY,
  ...ART,
]

// 按分类分组
export const PRESET_CATEGORIES = {
  nature: { label: '自然', items: NATURE },
  space: { label: '太空', items: SPACE },
  abstract: { label: '抽象', items: ABSTRACT },
  city: { label: '城市', items: CITY },
  art: { label: '艺术', items: ART },
}
