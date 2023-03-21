import { BleClient } from '../../utils'

export interface IBleDevice {
  proType: string // 品类码
  deviceUuid: string
  mac: string
  zigbeeMac: string
  name: string
  roomId: string
  roomName: string
  icon: string
  switchList: ISwitch[]
  client: BleClient
  status: 'waiting' | 'fail' | 'success' // 配网状态
  isChecked: boolean // 是否被选中
  requestTimes: number // 查询云端在线次数
  requesting: boolean
  zigbeeRepeatTimes: number // 配网自动重试次数
}

export interface ISwitch {
  switchId: string
  switchName: string
}
