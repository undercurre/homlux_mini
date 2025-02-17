/**
 * 	房间信息
 */
type roomInfo = {
  /**
   * 灯打开数量
   */
  deviceLightOnNum?: number
  /**
   * 设备数量
   */
  deviceNum: number
  /**
   * 	房间icon
   */
  roomIcon: string | null
  /**
   * 房间id
   */
  roomId: string
  /**
   * 分组id，房间也属于一个分组
   */
  groupId: string
  /**
   * 房间名称
   */
  roomName: string
  /**
   * 房间场景列表
   */
  sceneList: Scene.SceneItem[]
  /**
   * 排序码
   */
  orderNum: number
}
declare namespace Room {
  /**
   * 家庭查询房间列表项
   */
  interface RoomItem {
    roomInfo: roomInfo
    /**
     * 房间场景列表
     */
    roomSceneList: Scene.SceneItem[]
  }
  /**
   * 房间信息
   */
  type RoomInfo = roomInfo

  /**
   * 房间排序
   */
  interface RoomSort {
    roomId: string
    sort: number
  }
}
