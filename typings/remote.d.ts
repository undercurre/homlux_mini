declare namespace Remoter {
  /**
   * @description 设备属性
   */
  interface DeviceItem {
    dragId?: string // 用于拖拽功能, 直接使用 deviceId
    orderNum?: number // 用于拖拽功能, 排序索引
    deviceId: string // Mac地址
    devicePic: string
    deviceName: string
    deviceType: string // 设备品类
    deviceModel: string // 设备型号
    switchStatus: string // 快捷开关状态
    switchType: string // 快捷开关类型 TODO 改为按命令索引
    saved: boolean // 是否已保存在本地（我的设备）
    discovered?: boolean // 是否被搜索到, 用于我的设备列表
  }

  interface ButtonRes {
    key?: string
    icon: string
    iconActive?: string
    name?: string
  }

  interface ConfigItem {
    deviceName: string
    devicePic: string
    joystick: Record<string, ButtonRes>
    mList: ButtonRes[]
    bList: ButtonRes[]
  }

  type LocalList = Record<string, Pick<DeviceItem, 'deviceModel' | 'deviceType' | 'orderNum'>>
}
