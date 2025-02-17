// 授权相关类型
declare namespace Meiju {
  /**
   * 美居家庭列表，列表项
   */
  interface MeijuHome {
    /**
     * 家庭唯一id
     */
    mideaHouseId: string
    /**
     * 家庭名称
     */
    mideaHouseName: string
  }

  /**
   * 美居设备列表，列表项
   */
  interface MeijuDevice {
    deviceId: string
    deviceName: string
    onOffStatus: string
    proType: string
    roomName: string
    sn8: string
    icon: string
  }

  /**
   * 第三方授权列表，列表项
   * @param authStatus 0未授权 1已授权
   */
  interface AuthItem {
    authStatus: 0 | 1
    authStatusName: ''
    thirdPartyName: ''
  }

  /**
   * 美居产品信息
   */
  interface IProductItem {
    proType: string // 品类码，不包含0x
    sn8: string // sn8
    mode: number // 配网模式 （0:AP，1:快连，2:声波，3:蓝牙，4:零配，5:WIFI,6:ZigBee）
    deviceImg?: string // 产品图片
  }
}
