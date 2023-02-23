declare namespace Room {
  /**
   * 家庭查询房间列表项
   */
  interface RoomItem {
    /**
     * 	房间信息
     */
    roomInfo: {
      /**
       * 灯打开数量
       */
      deviceLightOnNum: number

      // 设备数量
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
       * 房间名称
       */
      roomName: string
    }
    /**
     * 房间场景列表
     */
    roomSceneList: Scene.SceneItem[]
  }
  /**
   * 房间信息
   */
  interface RoomInfo {
    /**
     * 灯打开数量
     */
    deviceLightOnNum: number
    /**
     * 	房间icon
     */
    roomIcon: string | null
    /**
     * 房间id
     */
    roomId: string
    /**
     * 房间名称
     */
    roomName: string
    /**
     * 房间场景列表
     */
    sceneList: Scene.SceneItem[]
  }
}
