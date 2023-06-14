declare namespace Device {
  /** 设备列表项 */
  interface DeviceItem {
    // 接口返回值属性
    deviceId: string
    deviceName: string
    /**
     * 设备类型
     * 1:网关 2:子设备 3:wifi, 4:灯组
     */
    deviceType: number
    /**
     * 灯如果关联了开关，会有一个关联id
     */
    gatewayId: string
    gatewayName: string
    /** 方法列表 */
    methodList: string[]
    /**
     * 设备属性
     * { 每个endpoint: {属性值} }
     * 单路设备只有一个endpoint：1，比如{ 1: {OnOff: 1} }
     */
    mzgdPropertyDTOList: Record<string, IAnyObject>
    /**
     * onLineStatus
     * 0:离线 1:在线
     */
    onLineStatus: number
    orderNum: number
    /** 设备图片 */
    pic: string
    /**
     * 品类码
     * light: '0x13',
     * switch: '0x21',
     * curtain: '0x14',
     * gateway: '0x16',
     */
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
     * 格式： deviceId:ep
     * 如: xxxxx:1 xxxxx:2
     */
    uniId: string

    // 设备状态字段，前端使用
    status?: string

    // 灯分组，包含的列表数据
    groupDeviceList?: GroupDTO[]
    groupName?: string
  }

  interface MzgdPropertyDTO {
    name: string
    propertyId: string
    propertyValue: string
  }

  interface MzgdPanelSwitchInfoDTO {
    houseId: string
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
    switchNum: number
    roomId: string
  }

  interface ActionItem {
    uniId: string
    name: string
    desc: string[]
    pic: string
    proType: string
    deviceType: number
    value: IAnyObject
  }

  /** 批量修改设备 */
  interface DeviceInfoUpdateVo {
    deviceId: string
    deviceName?: string
    houseId: string
    roomId?: string
    type?: string
    switchId?: string
    switchName?: string
  }

  /** 批量删除设备 */
  interface DeviceBaseDeviceVo {
    deviceId: string
    /** 设备类型（1:网关 2:子设备 3:wifi */
    deviceType: string
    /** 网关需要传网关 */
    sn?: string
  }

  // 开关信息
  interface ISwitch {
    switchId: string
    switchName: string
  }

  // 关联的灯列表项
  interface IMzgdLampRelGetDTO {
    lampDeviceId: string
    relId: string
  }

  // 关联的面板ID,开关id,关系id
  interface IMzgdRelGetDTO {
    deviceId: string
    switchId: string
    relId: string
  }

  interface IMzgdLampDeviceInfoDTO {
    panelId: string
    switchId: string
    lampDeviceId: string
  }

  type GroupDTO = Pick<DeviceItem, 'deviceId' | 'deviceType' | 'proType'>
}
