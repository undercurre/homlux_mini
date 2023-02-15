declare namespace Room {
  /**
   * 家庭查询房间列表，列表项
   */
  interface RoomItem {
    roomInfo: {
      deviceLightOnNum: number
      roomIcon: string | null
      roomId: string
      roomName: string
    }
    roomSceneList: {
      sceneIcon: string
      sceneId: string
      sceneName: string
    }[]
  }
  interface RoomInfo {
    deviceInfoList: {
      deviceId: string
      deviceName: string
      deviceStatus: string
      deviceStatusName: string
    }[]
    roomInfo: {
      roomId: string
      roomIcon: string
      roomName: string
    }
    roomSceneList: Scene.SceneInfo[]
  }
}
