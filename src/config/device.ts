import { rpx2px } from '../utils/index'

// 设备列表，每次加载的条数 应该为4的倍数
export const LIST_PAGE = 20

// 卡片尺寸
export const CARD_W = rpx2px(180)
export const CARD_H = rpx2px(236)
export const ROOM_CARD_H = rpx2px(336)
export const ROOM_CARD_M = rpx2px(152) // 折叠后高度

// 设备品类码
export const PRO_TYPE = {
  light: '0x13',
  switch: '0x21',
  curtain: '0x14',
  gateway: '0x16',
} as const

export const proName: Record<string, string> = {
  '0x13': 'light',
  '0x21': 'switch',
  '0x16': 'gateway',
} as const
