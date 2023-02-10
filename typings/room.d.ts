declare namespace Room {
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
