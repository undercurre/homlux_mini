import { BleClient } from "../../utils";

export interface IBleDevice {
  deviceUuid: string
  mac: string
  name: string
  roomId: string
  roomName: string
  icon: string
  client: BleClient
  status: 'waiting' | 'fail' | 'success' // 配网状态
  isChecked?: boolean // 是否被选中
}
