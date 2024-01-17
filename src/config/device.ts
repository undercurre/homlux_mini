import { rpx2px } from '../utils/index'

// 设备列表，每次加载的条数 应该为4的倍数
export const LIST_PAGE = 20

// 依赖 WebSocket 更新设备数据的最大设备数
export const MAX_DEVICES_USING_WS = 20

// 不依赖 WebSocket 更新时的设备列表更新间隔（ms）
export const NO_WS_REFRESH_INTERVAL = 20000

/**
 * @name 设备卡片更新时间阈值
 * @description 等待时间小于这个值的，均不即时更新，与后面的更新合并，或到到队列清空时一起更新
 */
export const CARD_REFRESH_TIME = 1000

// 卡片尺寸
export const CARD_W = rpx2px(180)
export const CARD_H = rpx2px(236)
export const ROOM_CARD_H = rpx2px(336)
export const ROOM_CARD_M = rpx2px(152) // 折叠后高度

// 设备 modelName -> 品类码
export const PRO_TYPE = {
  light: '0x13',
  switch: '0x21',
  curtain: '0x14',
  gateway: '0x16',
  sensor: '0xBC',
  clothesDryingRack: '0x17', // 晾衣机
  bathHeat: '0x26', // 浴霸
  airConditioner: '0xAC', // wifi空调
  freshAir: '0xCE', // 新风
  floorHeating: '0xCF', // 地暖
  centralAirConditioning: '0xCC', // 中弘网关空调，中央空调
} as const

// productId -> 设备modelName，暂时为传感器专用
export const SENSOR_MODEL_NAME = {
  'midea.ir.201': 'irDetector',
  'midea.magnet.001.201': 'magnet',
  'midea.freepad.001.201': 'freepad',
} as Record<string, string>

/**
 * @description 综合获取modelName的方法，proType & productId -> 设备modelName
 * !! 多路面板modelName为wallSwitch\d，直接从switchInfoDTOList获取
 * @param proType
 * @param productId
 */
export const getModelName = (proType: string, productId: string) => {
  if (proType === PRO_TYPE.sensor) {
    return SENSOR_MODEL_NAME[productId]
  }

  return proName[proType]
}

// 智慧屏pid:  四寸屏：pkey:t1ae5ff32ae84b60b159676556aafbf7 psecret: e953d99rb7ef4b55  pid : zk527b6c944a454e9fb15d3cc1f4d55b 十寸屏  pkey:j1ae3ez32ae84b60b159676556aafbf7 psecret: m95fd9grb7ef4b55  pid:ok523b6c941a454e9fb15d3cc1f4d55b
export const SCREEN_PID: readonly string[] = ['zk527b6c944a454e9fb15d3cc1f4d55b', 'ok523b6c941a454e9fb15d3cc1f4d55b']

// 旋钮开关pid
export const KNOB_PID: readonly string[] = ['midea.knob.001.003']

// 设备品类码 -> modelName
export const proName: Record<string, string> = {
  '0x13': 'light',
  '0x14': 'curtain',
  '0x16': 'gateway',
  '0x17': 'clothesDryingRack',
  '0x21': 'switch',
  '0x26': 'bathHeat',
  '0xBC': 'sensor',
  '0xAC': 'airConditioner',
  '0xCE': 'freshAir', // 新风
  '0xCF': 'floorHeating', // 地暖
  '0xCC': 'airConditioner', // 中弘网关空调，中央空调
} as const

// 传感器类型，通过productId区分
export const SENSOR_TYPE = {
  humanSensor: 'midea.ir.201',
  doorsensor: 'midea.magnet.001.201',
  freepad: 'midea.freepad.001.201',
} as const
