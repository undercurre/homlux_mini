declare namespace Scene {
  /**
   * 查询房间的场景列表项
   */
  interface SceneItem extends SceneBase {
    /**
     * 条件类型
     * 0-或，1-与
     */
    conditionType: string
    deviceActions: DeviceAction[]
    deviceConditions: DeviceCondition[]
    houseId: string
    orderNum: string
    roomId: string
  }
  /**
   * 房间列表里的场景列表项
   */
  interface SceneBase {
    /**
     * 	场景Icon
     */
    sceneIcon: string
    /**
     * 场景id
     */
    sceneId: string
    /**
     * 场景名称
     */
    sceneName: string
  }
  /** 结果集合 */
  interface DeviceAction {
    /**
     * 动作控制集合
     * 例如："controlAction":[{"ep":1,"OnOff":0},{"ep":2,"OnOff":1}]
     */
    controlAction: Record<string, number>[]
    /** 设备id */
    deviceId: string
    /** 设备类型 */
    deviceType: string
    /** 品类码 */
    proType: string
  }
  interface DeviceCondition {
    /**
     * 绑定控制集合，
     * 例如："controlEvent":[{"ep":2,"ButtonScene":1}]
     */
    controlEvent: string
    /** 设备id */
    deviceId: string
    /** 设备名称 */
    deviceName: string
    /** 设备类型 */
    deviceType: string
    /** 品类码 */
    proType: string
  }
  interface AddSceneDto {
    /**
     * 条件类型
     * 0-或，1-与，目前全部传0
     */
    conditionType: '0' | '1'
    deviceActions: DeviceAction[]
    deviceConditions: DeviceCondition[]
    houseId: string
    roomId: string
    sceneIcon: string
    sceneName: string
    /**
     * 场景类型
     * 0-没有条件，1-有条件
     */
    sceneType: string
  }
}
