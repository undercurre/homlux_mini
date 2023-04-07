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
   * 成员角色
   * 1：创建者
   * 2：管理员
   * 3：游客
   */
  export type UserRole = 1 | 2 | 3

  /**
   * 成员角色
   * 1：创建者
   * 2：管理员
   * 3：游客
   */
  export const enum TestEnum {
    Create = 1,
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

    // 用户家庭权限 1：创建者 2：管理员 3：游客
    houseUserAuth: 1 | 2 | 3

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

  export interface HouseUserItem {
    /**
     * 成员权限编码
     */
    userHouseAuth: number
    /**
     * 成员权限名称
     */
    userHouseAuthName: string
    /**
     * 	成员id
     */
    userId: string
    /**
     * 成员名称
     */
    userName: string
    /**
     * 成员头像
     */
    headImageUrl: string
  }

  export interface HomeMemberInfo {
    houseUserList: HouseUserItem[]
    totalElements: number
  }
}
