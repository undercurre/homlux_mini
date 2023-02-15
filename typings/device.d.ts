declare namespace Device {
  interface DeviceItem {
    // 接口返回值属性
    deviceId: string
    deviceName: string
    deviceType: string
    gatewayId: string
    gatewayName: string
    methodList: string[]
    mzgdPropertyDTOList: {
      name: string
      propertyId: string
      propertyValue: string
    }[]
    onLineStatus: number
    orderNum: number
    pic: string
    proType: string
    roomId: string
    roomName: string
    switchInfoDTOList: MzgdPanelSwitchInfoDTO[]
    version: string

    // 客户端额外属性
    isChecked: boolean
  }

  interface MzgdPanelSwitchInfoDTO {
    houseId: string
    isRel: boolean
    panelId: string
    pic: string
    roomId: string
    roomName: string
    switchId: string
    switchName: string
  }
}
