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
