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
  sensor: '0xBC',
} as const

// proType -> 设备modelName，// !! 多路面板modelName为wallSwitch\d，直接从switchInfoDTOList获取
export const MODEL_NAME = {
  '0x13': 'light',
  '0x14': 'curtain'
} as Record<string, string>

// 智慧屏pid:  四寸屏：pkey:t1ae5ff32ae84b60b159676556aafbf7 psecret: e953d99rb7ef4b55  pid : zk527b6c944a454e9fb15d3cc1f4d55b 十寸屏  pkey:j1ae3ez32ae84b60b159676556aafbf7 psecret: m95fd9grb7ef4b55  pid:ok523b6c941a454e9fb15d3cc1f4d55b
export const SCREEN_PID: readonly string[] = ['zk527b6c944a454e9fb15d3cc1f4d55b', 'ok523b6c941a454e9fb15d3cc1f4d55b']

export const proName: Record<string, string> = {
  '0x13': 'light',
  '0x14': 'curtain',
  '0x21': 'switch',
  '0x16': 'gateway',
} as const

// 传感器类型，通过productId区分
export const SENSOR_TYPE = {
  humanSensor: 'midea.ir.201',
  doorsensor: 'midea.magnet.001.201',
  freepad: 'midea.freepad.001.201',
} as const

export const sensorList: Record<string, string>[] = [
  {
    icon: '/package-distribution/assets/guide/sensor-body.png',
    img: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/sensor_body.gif',
    name: '人体传感器',
    desc: '① 确认传感器电池已安装好\n② 长按球体顶部「配网按键」5秒以上，至指示灯开始闪烁（1秒/次）',
    path: 'sensor_door.gif',
    productId: 'midea.ir.201',
  },
  {
    icon: '/package-distribution/assets/guide/sensor-door.png',
    img: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/sensor_door.gif',
    name: '门磁传感器',
    desc: '① 确认传感器电池已安装好\n② 长按顶部「配网按键」5秒以上，至指示灯开始闪烁（1秒/次）',
    path: '',
    productId: 'midea.magnet.001.201',
  },
  {
    icon: '/package-distribution/assets/guide/sensor-switch.png',
    img: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/sensor_switch.gif',
    name: '无线开关',
    desc: '① 确认传感器电池已安装好\n② 点击「开关键」，随后立刻长按5秒以上，至指示灯开始闪烁（1秒/次）',
    path: '',
    productId: 'midea.freepad.001.201',
  },
]
