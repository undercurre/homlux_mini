// 家庭
declare namespace Home {
  /**
   * 家庭列表，列表项
   */
  export interface HomeItem {
    /**
     * 家庭唯一id
     */
    houseId: string
    /**
     * 家庭名称
     */
    houseName: string

    /**
     * 是否默认家庭
     */
    defaultHouseFlag: boolean

    /**
     * 是否创建者
     */
    houseCreatorFlag: boolean
  }

  /**
   * 家庭详细值
   */
  export interface HomeDetail {
    /**
     * 家庭唯一id
     */
    houseId: string
    /**
     * 家庭名称
     */
    houseName: string

    /**
     * 设备数量
     */
    deviceCount: number

    /**
     * 成员数量
     */
    userCount: number

    /**
     * 家庭位置
     */
    houseArea: string

    /**
     * 房间数量
     */
    roomCount: number

    /**
     * 房间列表
     */
    roomList: Room.RoomItem[]
  }

  interface RoomInState {
    roomId: string
    roomName: string
    lightOnNumber: number
    sceneList: {
      value: string
      name: string
    }[]
    deviceList: (Device.LightInfo | Device.SwitchInfo | Device.CurtainInfo)[]
    sceneSelect: string
  }
}
