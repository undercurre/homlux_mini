// 家庭
declare namespace Home {
  /**
   * home
   */
  export interface HomeInfo {
    /**
     * 家庭唯一id
     */
    home_id: string
    /**
     * 家庭名称
     */
    home_name: string
    /**
     * 家庭主人
     */
    master_uid: string
  }

  // 房间
  interface Room {
    /**
     * 所属家庭
     */
    home_id?: string
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
    home_id?: string
    /**
     * 所属房间
     */
    room_id: string
  }
}
