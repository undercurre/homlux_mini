import { rpx2px } from '../utils/index'

// 设备列表，每次加载的条数 应该为4的倍数
export const LIST_PAGE = 20

// 卡片尺寸
export const CARD_W = rpx2px(180)
export const CARD_H = rpx2px(236)

// 设备品类码
export const proType = {
  light: '0x13',
  switch: '0x21',
  // curtain: '0x13', // todo：窗帘品类码未确定
  gateway: '0x16',
} as const

export const proName: Record<string, string> = {
  '0x13': 'light',
  '0x21': 'switch',
  '0x16': 'gateway',
} as const
