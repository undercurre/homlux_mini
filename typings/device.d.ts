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
    /**
     * 灯如果关联了开关，会有一个关联id
     */
    lightRelId: string
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
    /**
     * 如果需要将开关拆分，需要这个id
     * 格式： deviceId:switchId
     * 如: xxxxx:1 xxxxx:2
     */
    uniId: string
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
    /** 开关关联灯id */
    lightRelId: string
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
    /** 开关关联开关id */
    switchRelId: string
  }

  interface OrderSaveData {
    deviceInfoByDeviceVoList: {
      deviceId: string
      houseId: string
      orderNum: string
      roomId: string
      switchId?: string
    }[]
    /** 类型:0 子设备顺序 1 按键顺序	 */
    type: '1' | '0'
  }

  interface MzgdProTypeDTO {
    deviceIcon: string
    isValid: boolean
    mac: string
    modelId: string
    proType: string
    productIcon: string
    productName: string
    sn: string
  }

  interface ActionItem {
    uniId: string
    name: string
    desc: string[]
    pic: string
    value: IAnyObject
  }
}
