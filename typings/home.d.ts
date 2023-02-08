// 家庭
declare namespace Home {
  /**
   * home
   */
  export interface HomeInfo {
    /**
     * 家庭唯一id
     */
    houseId: string
    /**
     * 家庭名称
     */
    houseName: string

    // 是否默认家庭
    defaultHouseFlag: boolean

    // 是否创建者
    houseCreatorFlag: boolean
  }

  export interface HomeDetail {
    /**
     * 家庭唯一id
     */
    houseId: string
    /**
     * 家庭名称
     */
    houseName: string

    // 设备数量
    deviceCount: number

    // 成员数量
    userCount: number

    // 家庭位置
    houseArea: string

    // 房间数量
    roomCount: number

    // 房间列表
    roomList: Array<Room>
  }

  // 房间
  interface Room {
    /**
     * 房间唯一id
     */
    roomId: string
    /**
     * 房间icon
     */
    roomIcon: string
    /**
     * 房间名称
     */
    roomName: string
  }
  // 家庭选择下拉菜单项
  interface DropdownItem {
    value: string | number
    name: string
    isSelect: boolean
    isCreator: boolean
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
