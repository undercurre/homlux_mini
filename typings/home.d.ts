// 家庭
declare namespace Home {
  /**
   * 家庭列表，列表项
   */
  export interface IHomeItem {
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
  export interface IHomeDetail {
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
    roomList: IRoomInfo[]
  }

  export interface IRoomInfo {
    deviceLightOnNum: number
    roomIcon: string
    roomId: string
    roomName: string
  }
}
