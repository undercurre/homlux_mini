declare namespace Device {
  interface DeviceItem {
    // 接口返回值属性
    deviceId: string
    deviceName: string
    deviceType: number
    gatewayId: string
    gatewayName: string
    methodList: string[]
    mzgdPropertyDTOList: Record<string, MzgdPropertyDTO[]>
    onLineStatus: number
    orderNum: number
    pic: string
    proType: string
    roomId: string
    roomName: string
    switchInfoDTOList: MzgdPanelSwitchInfoDTO[]
    version: string
    sn: string

    // 小程序维护额外属性
    isChecked: boolean
  }

  interface MzgdPropertyDTO {
    name: string
    propertyId: string
    propertyValue: string
  }

  interface MzgdPanelSwitchInfoDTO {
    houseId: string
    isRel: boolean
    orderNum: number
    panelId: string
    pic: string
    roomId: string
    roomName: string
    switchId: string
    switchName: string
  }
}
