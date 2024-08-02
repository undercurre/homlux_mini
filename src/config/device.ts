import { rpx2px } from '../utils/index'

// 设备列表，每次加载的条数 应该为4的倍数
export const LIST_PAGE = 20

// 依赖 WebSocket 更新设备数据的最大设备数
export const MAX_DEVICES_USING_WS = 160

// 不依赖 WebSocket 更新时的设备列表更新间隔（ms）
export const NO_WS_REFRESH_INTERVAL = 20000

// 遇到更新延迟标志时，延迟的时长（ms）
export const NO_UPDATE_INTERVAL = 10000

// 最多可以移动和删除的设备数（按卡片计数）
export const MAX_MOVE_CARDS = 20

// 设备弹窗中，控制指令发送后屏蔽设备状态上报的时长（ms）
export const NO_SYNC_DEVICE_STATUS = 2000

// 房间设备列表中，房间灯组控制指令发送后屏蔽设备状态上报的时长（ms）
export const NO_SYNC_DEVICE_STATUS_IN_ROOM = 10000

/**
 * @name 设备卡片更新时间阈值
 * @description 等待时间小于这个值的，均不即时更新，与后面的更新合并，或到到队列清空时一起更新
 */
export const CARD_REFRESH_TIME = 1000

// 卡片尺寸
export const CARD_W = rpx2px(180)
export const CARD_H = rpx2px(236)
export const ROOM_CARD_W = rpx2px(702)
export const ROOM_CARD_H = rpx2px(336)
export const ROOM_CARD_M = rpx2px(152) // 折叠后高度
export const ROOM_CARD_TOP = 170 // 列表顶部距离

// 设备 modelName -> 品类码
export const PRO_TYPE = {
  doorLock: '0x09',
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
export const getModelName = (proType: string, productId?: string) => {
  if (proType === PRO_TYPE.sensor) {
    return SENSOR_MODEL_NAME[productId ?? '']
  }

  return proName[proType]
}

// 设备品类码 -> modelName
export const proName: Record<string, string> = {
  '0x09': 'doorLock',
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

// productId常量集合
export const PRODUCT_ID = {
  screen_4: 'zk527b6c944a454e9fb15d3cc1f4d55b', // 4寸屏
  screen_10: 'ok523b6c941a454e9fb15d3cc1f4d55b', // 10寸屏
  humanSensor: 'midea.ir.201', // 人体传感器
  doorSensor: 'midea.magnet.001.201', // 门磁传感器
  freePad: 'midea.freepad.001.201', // 无线开关
  zhonghong_heat: 'zhonghong.heat.001', // 485地暖
  zhonghong_air: 'zhonghong.air.001', // 485新风
  zhonghong_cac: 'zhonghong.cac.002', // 485空调
  knob: 'midea.knob.001.003', // 一路旋钮面板
  fan_basic: 'M0200005', // 基础款（sn8：M0200005）无亮度、色温功能
  fan_smart: '79010863',
  fan_smart_2: 'M0200008',
}

// 风扇灯pid集合
export const FAN_PID: readonly string[] = [PRODUCT_ID.fan_basic, PRODUCT_ID.fan_smart, PRODUCT_ID.fan_smart_2]

// 旋钮开关pid
export const KNOB_PID: readonly string[] = [PRODUCT_ID.knob]

// 智慧屏pid集合
export const SCREEN_PID: readonly string[] = [PRODUCT_ID.screen_4, PRODUCT_ID.screen_10]

// 中弘485子设备pid集合
export const ZHONGHONG_PID: readonly string[] = [
  PRODUCT_ID.zhonghong_heat,
  PRODUCT_ID.zhonghong_air,
  PRODUCT_ID.zhonghong_cac,
]
