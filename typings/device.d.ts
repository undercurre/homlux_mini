declare namespace Device {
  interface DeviceItem {
    deviceId?: string
    name: string
    icon: string
    roomId: string
    roomName: string
    isSelected?: string // 是否被选中
  }
}