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

  // 房间
  interface Room {
    /**
     * 所属家庭
     */
    houseId?: string
    /**
     * 房间唯一id
     */
    room_id: string
    /**
     * 房间图片
     */
    room_image: string
    /**
     * 房间名称
     */
    room_name: string
  }
  // 设备
  interface Device {
    /**
     * 设备唯一id
     */
    device_id: string
    /**
     * 设备名
     */
    device_name: string
    /**
     * 设备状态，0：离线 1：在线
     */
    device_status: number
    /**
     * 所属家庭
     */
    houseId?: string
    /**
     * 所属房间
     */
    room_id: string
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
