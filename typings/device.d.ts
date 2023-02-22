declare namespace Device {
  /** 设备列表项 */
  interface DeviceItem {
    // 接口返回值属性
    deviceId: string
    deviceName: string
    /**
     * 设备类型
     * 1:网关 2:子设备 3:wifi
     */
    deviceType: number
    gatewayId: string
    gatewayName: string
    /** 方法列表 */
    methodList: string[]
    /**
     * 设备属性
     * { 每个endpoint: {属性值} }
     * 单路设备只有一个endpoint：1，比如{ 1: {OnOff: 1} }
     */
    mzgdPropertyDTOList: Record<string, Record<string, number>>
    /**
     * onLineStatus
     * 0:离线 1:在线
     */
    onLineStatus: number
    orderNum: number
    /** 设备图片 */
    pic: string
    /** 品类码 */
    proType: string
    /** 产品Id */
    productId: string
    roomId: string
    roomName: string
    switchInfoDTOList: MzgdPanelSwitchInfoDTO[]
    version: string
    sn: string

    // 小程序维护额外属性
    isChecked: boolean
    /** 是否为场景开关 */
    isSceneSwitch?: boolean
  }

  interface MzgdPropertyDTO {
    name: string
    propertyId: string
    propertyValue: string
  }

  interface MzgdPanelSwitchInfoDTO {
    houseId: string
    /** 是否已经关联 */
    isRel: boolean
    orderNum: number
    /** 面板Id */
    panelId: string
    /** 设备图片 */
    pic: string
    roomId: string
    roomName: string
    /** 开关Id */
    switchId: string
    /** 开关名称 */
    switchName: string
  }
}
