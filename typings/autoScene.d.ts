declare namespace AutoScene {
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
    orderNum: number
    roomId: string
  }
  /**
   * 房间列表里的场景列表项
   */
  interface SceneBase {
    /**
     * 对应的默认场景
     * 0：全开 1：全关 2：明亮 3：柔和
     */
    defaultType: string
    /**
     * 是否默认创建的场景
     * 0：否 1：是
     */
    isDefault: string
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
  /** 拍扁的条件集合 */
  interface AutoSceneFlattenCondition {
    /** 设备或场景id */
    uniId: string
    // 名称
    name: string
    //类型 1-网关，2-子设备，3-wifi设备,4-分组,5-场景,6-延时
    // type: 1 | 2 | 3 | 4 | 5 | 6
    // 图片
    pic: string
    //描述
    desc: string[]
  }
  /** 拍扁的结果集合 */
  interface AutoSceneFlattenAction {
    /** 设备或场景id */
    uniId: string
    // 名称
    name: string
    //类型 1-网关，2-子设备，3-wifi设备,4-分组,5-场景,6-延时
    type: 1 | 2 | 3 | 4 | 5 | 6
    // 图片
    pic: string
    //描述
    desc: string[]
    //延时执行
    delay?: number
    proType?: string
    value?: IAnyObject
  }
  interface DeviceCondition {
    /**
     * 绑定控制集合，
     * 例如："controlEvent":[{"ep":2,"ButtonScene":1}]
     * ButtonScene 电控所需参数，目前固定为1
     */
    controlEvent: { ep: number; ButtonScene: number }[]
    /** 设备id */
    deviceId: string
  }
  interface AddSceneDto {
    /**
     * 条件类型
     * 0-或，1-与，目前全部传0
     */
    conditionType: '0' | '1'

    // 结果集合
    deviceActions: DeviceAction[]

    // 条件集合
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
    orderNum: number
  }
  interface UpdateSceneDto {
    /**
     * 条件类型
     * 0-或，1-与，目前全部传0
     * updateType=3或者updateType=5时，必传
     */
    conditionType?: '0' | '1'
    deviceActions?: DeviceAction[]
    deviceConditions?: DeviceCondition[]
    sceneIcon?: string
    sceneId?: string
    sceneName?: string
    /** 更新类型
     * 0-仅更新名称和icon，1-删除结果 2-取消绑定 3-更新绑定 4-删除结果与取消绑定 5-删除结果与更新绑定
     */
    updateType: '0' | '1' | '2' | '3' | '4' | '5'
  }
}
