// 授权相关类型
declare namespace Auth {
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
}
