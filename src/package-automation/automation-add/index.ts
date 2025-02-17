import Dialog from '../../skyline-components/mz-dialog/dialog'
import Toast from '../../skyline-components/mz-toast/toast'
import { addScene, deleteScene, findDevice, updateScene } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { autosceneStore, deviceStore, homeStore, roomStore, sceneStore } from '../../store/index'
import { autoSceneConditionPropertyOptions, getModelName, PRO_TYPE, sceneImgDir, SCREEN_PID } from '../../config/index'
import {
  checkInputNameIllegal,
  emitter,
  getCurrentPageParams,
  storage,
  strUtil,
  toPropertyDesc,
} from '../../utils/index'
import { adviceSceneNameList, FAN_PID } from '../../config/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    dialogConfirmBtnColor: '#27282A',
    sceneImgDir,
    opearationType: 'yijian', // yijian是一键场景，auto是自动化场景
    roomId: '',
    showEditRoomPopup: false,
    adviceSceneNameList: adviceSceneNameList,
    _sceneInfo: {} as Scene.SceneItem, //原有的一键场景
    _autosceneInfo: {} as AutoScene.AutoSceneItem, //原有的自动化
    yijianSceneId: '',
    isDefaultYijianScene: false, //是否是一键场景
    autoSceneId: '',
    sceneIcon: 'icon-1',
    sceneName: '',
    //场景的生效时间段
    effectiveTime: {
      timePeriod: '1,2,3,4,5,6,7', //周日-周六
      timeType: '1', //时间类型，0-仅一次，1-自定义，2-法定工作日，3-法定节假日
      startTime: '00:00',
      endTime: '23:59',
    },
    showEditIconPopup: false, //展示编辑场景图标popup
    showEditConditionPopup: false, //展示添加条件popup
    showEditActionPopup: false, //展示添加执行动作popup
    showTimeConditionPopup: false, //展示时间条件popup
    showEditDeviceConditionPopup: false, // 展示编辑场景条件属性popup
    showDelayPopup: false, //展示延时popup
    showEffectiveTimePopup: false, //设置场景生效时间段
    showEditPopup: '', // 要展示的编辑弹窗类型
    sceneEditTitle: '',
    sceneEditInfo: {} as IAnyObject,

    //设备列表 //除网关智慧屏和传感器和门锁
    deviceList: [] as Device.DeviceItem[],
    //可作为条件的设备列表
    conditionDeviceList: [] as Device.DeviceItem[],
    /** 已选中设备或场景 TODO */
    sceneDevicelinkSelectList: [] as string[],
    /** 已选中的可作为条件的设备 */
    conditionDevicelinkSelectList: [] as string[],
    selectCardType: 'device', //设备卡片：'device'  场景卡片： 'scene'  可作为条件的设备卡片：'conditionDevice'
    showSelectCardPopup: false,
    /** 将当前场景里多路的action拍扁 */
    sceneDeviceActionsFlatten: [] as AutoScene.AutoSceneFlattenAction[],
    /** 将当前场景里多路的Condition拍扁 */
    sceneDeviceConditionsFlatten: [] as AutoScene.AutoSceneFlattenCondition[],
    //延时
    delay: 0,
    //时间条件
    timeCondition: {
      time: '',
      timePeriod: '',
      timeType: '',
    },
    _cacheDeviceMap: {} as IAnyObject, // 缓存设备设置预览前的设备状态，用于退出时恢复
    /** 是否修改过action */
    _isEditAction: false,
    /** 是否修改过Condition */
    _isEditCondition: false,
    /** 是否修改过图标或名称 */
    // _isEditIconOrName: false,
    // 正在控制的场景条件
    editingPropertyInfo: {} as IAnyObject,

    editingUniId: '',
    editingDelayId: '',
    scrollInfo: {
      scrollTop: 0,
      topSize: 0,
      bottomSize: 0,
    },
  },

  computed: {
    list(data) {
      if (data.selectCardType === 'scene') {
        return JSON.parse(JSON.stringify(sceneStore.allRoomSceneList))
      } else if (data.selectCardType === 'conditionDevice') {
        return data.conditionDeviceList
      } else {
        return data.deviceList.filter((item) => !data.sceneDevicelinkSelectList.includes(item.uniId))
      }
    },
    cardType(data) {
      return data.selectCardType === 'device' || data.selectCardType === 'conditionDevice' ? 'device' : 'scene'
    },

    isAllday(data) {
      const start = data.effectiveTime.startTime.split(':')
      const startMin = Number(start[0]) * 60 + Number(start[1])
      const end = data.effectiveTime.endTime.split(':')
      const endMin = Number(end[0]) * 60 + Number(end[1])
      if (startMin - endMin === 1 || (startMin === 0 && endMin === 1439)) {
        return true
      } else {
        return false
      }
    },
    timePeriodDesc(data) {
      return strUtil.transPeriodDesc(data.effectiveTime.timeType, data.effectiveTime.timePeriod)
    },
    endTimeDesc(data) {
      const startTimeHour = parseInt(data.effectiveTime.startTime.substring(0, 2))
      const endTimeHour = parseInt(data.effectiveTime.endTime.substring(0, 2))
      const startTimeMin = parseInt(
        data.effectiveTime.startTime.substring(data.effectiveTime.startTime.indexOf(':') + 1),
      )
      const endTimeMin = parseInt(data.effectiveTime.endTime.substring(data.effectiveTime.endTime.indexOf(':') + 1))

      if (endTimeHour < startTimeHour) {
        return `次日${data.effectiveTime.endTime}`
      } else if (endTimeHour === startTimeHour) {
        if (endTimeMin <= startTimeMin) {
          return `次日${data.effectiveTime.endTime}`
        } else {
          return data.effectiveTime.endTime
        }
      } else {
        return data.effectiveTime.endTime
      }
    },
    linkSelectList(data) {
      if (data.selectCardType === 'conditionDevice') {
        return data.conditionDevicelinkSelectList
      } else {
        return data.sceneDevicelinkSelectList
      }
    },
    //只包含场景和设备的动作列表长度
    sceneDeviceActionsLength(data) {
      return data.sceneDeviceActionsFlatten.filter((item) => item.uniId.indexOf('DLY') === -1).length
    },
    okBtnText(data) {
      return data.autoSceneId ? '确定' : '设置好了'
    },
  },
  lifetimes: {
    async ready() {
      deviceStore.updateAllRoomDeviceList()

      this.setData({
        deviceList: deviceStore.allRoomDeviceFlattenList.filter(
          (item) =>
            item.proType !== PRO_TYPE.gateway && item.proType !== PRO_TYPE.sensor && item.proType !== PRO_TYPE.doorLock,
        ),
        conditionDeviceList: JSON.parse(JSON.stringify(deviceStore.allRoomCanSetSceneConditionDeviceList)),
      })
      const { roomid, sceneInfo } = getCurrentPageParams()

      console.log('getCurrentPageParams', getCurrentPageParams())
      if (!sceneInfo && !roomid) {
        // 新建场景
        return
      }
      if (!sceneInfo && roomid) {
        // 房间内快速新建手动场景
        const onlineDeviceListInRoom: Device.DeviceItem[] = deviceStore.allRoomDeviceFlattenList.filter(
          (item) => item.roomId === roomid && item.onLineStatus === 1,
        )
        this.setData(
          {
            roomId: roomid,
            _isEditCondition: true,
            sceneDevicelinkSelectList: onlineDeviceListInRoom.map((item) => item.uniId),
            opearationType: 'yijian',
          },
          () => {
            this.updateSceneDeviceActionsFlatten()
            this.updateSceneDeviceConditionsFlatten()
          },
        )
        return
      }
      const currentSceneInfo = JSON.parse(sceneInfo) as AutoScene.AutoSceneItem | Scene.SceneItem
      if (currentSceneInfo.sceneCategory === '1') {
        console.log('自动场景')
        const conditionDevicelinkSelectList = [] as string[]
        const autoSceneInfo = currentSceneInfo as AutoScene.AutoSceneItem
        this.data._autosceneInfo = autoSceneInfo
        this.setData({
          autoSceneId: autoSceneInfo.sceneId,
          opearationType: 'auto',
          sceneIcon: autoSceneInfo.sceneIcon,
          sceneName: autoSceneInfo.sceneName,
          isDefaultYijianScene: false,
          'effectiveTime.startTime': autoSceneInfo.effectiveTime.startTime.substring(0, 5),
          'effectiveTime.endTime': autoSceneInfo.effectiveTime.endTime.substring(0, 5),
          'effectiveTime.timePeriod': autoSceneInfo.effectiveTime.timePeriod,
          'effectiveTime.timeType': autoSceneInfo.effectiveTime.timeType,
        })
        //处理执行条件
        if (autoSceneInfo.deviceConditions.length) {
          autoSceneInfo.deviceConditions.forEach((action) => {
            conditionDevicelinkSelectList.push(action.deviceId)
            try {
              const device = this.data.conditionDeviceList.find((item) => item.uniId === action.deviceId)
              device!.property = action.controlEvent[0]
              this.setData({
                conditionDeviceList: [...this.data.conditionDeviceList],
              })
            } catch (error) {
              console.error(error)
            }
          })
        } else {
          //时间条件
          const timeConditions = autoSceneInfo.timeConditions[0]
          this.setData({
            'timeCondition.time': timeConditions.time,
            'timeCondition.timePeriod': timeConditions.timePeriod,
            'timeCondition.timeType': timeConditions.timeType,
          })
        }
        //处理执行结果
        const tempSceneDeviceActionsFlatten = [] as AutoScene.AutoSceneFlattenAction[]
        autoSceneInfo.deviceActions.forEach((action, index) => {
          if (action.deviceType === 6) {
            tempSceneDeviceActionsFlatten.push({
              uniId: action.deviceId,
              name: '延时',
              desc: [strUtil.formatTime(action.delayTime)],
              type: action.deviceType,
              pic: '/package-automation/assets/imgs/automation/stopwatch-materialized.png',
              value: { delayTime: action.delayTime },
              orderNum: index,
              dragId: action.deviceId,
            })
          } else if (action.deviceType === 5) {
            // 场景，无法使用在自动场景已存的名称，因为手动场景可能会已改名称
            const scene = sceneStore.allRoomSceneList.find((item) => item.sceneId === action.deviceId)
            if (!scene) return
            tempSceneDeviceActionsFlatten.push({
              uniId: scene.sceneId,
              name: scene.sceneName,
              type: 5,
              desc: [scene.roomName],
              pic: `https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/auto-scene/${scene.sceneIcon}.png`,
              value: {},
              orderNum: index,
              dragId: scene.sceneId + Math.floor(Math.random() * 1001),
            })
          } else {
            // 设备，无法使用在自动场景已存的名称，因为设备可能会已改名称，只能再次查询
            let deviceUniId = action.deviceId
            if (action.proType === PRO_TYPE.switch) {
              deviceUniId = `${action.deviceId}:${action.controlAction[0].modelName}`
            }
            const device = this.data.deviceList.find((item) => item.uniId === deviceUniId)
            if (!device) return
            //是设备
            if (device.proType === PRO_TYPE.switch) {
              //是开关面板
              const power = action.controlAction[0].power
              const desc = toPropertyDesc({ proType: device.proType, property: action.controlAction[0] })
              tempSceneDeviceActionsFlatten.push({
                uniId: device.uniId,
                name: `${device.switchInfoDTOList[0].switchName} | ${device.deviceName}`,
                type: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
                desc,
                pic: device.switchInfoDTOList[0].pic,
                proType: PRO_TYPE.switch,
                value: {
                  modelName: action.controlAction[0].modelName,
                  power,
                },
                orderNum: 0,
                dragId: device.uniId + Math.floor(Math.random() * 1001),
              })
            } else {
              const property = {
                ...action.controlAction[0],
              }
              const modelName = getModelName(device.proType, device.productId)

              if (device.proType === PRO_TYPE.light) {
                property.colorTempRange = device.mzgdPropertyDTOList[modelName].colorTempRange
              }

              const desc = toPropertyDesc({ proType: device.proType, property: property })
              tempSceneDeviceActionsFlatten.push({
                uniId: device.uniId,
                name: device.deviceName,
                type: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
                desc,
                pic: device.pic as string,
                proType: device.proType,
                value: {
                  ...property,
                  modelName,
                },
                sceneProperty: {
                  ...property,
                },
                orderNum: 0,
                dragId: device.uniId + Math.floor(Math.random() * 1001),
              })
            }
          }
        })

        this.setData(
          {
            conditionDevicelinkSelectList,
            sceneDeviceActionsFlatten: tempSceneDeviceActionsFlatten,
          },
          () => {
            this.updateSceneDeviceActionsFlatten(false)
            this.updateSceneDeviceConditionsFlatten()
          },
        )
      } else {
        console.log('手动场景')
        const sceneInfo = currentSceneInfo as Scene.SceneItem
        this.data._sceneInfo = sceneInfo
        this.setData({
          yijianSceneId: sceneInfo.sceneId,
          opearationType: 'yijian',
          sceneIcon: sceneInfo.sceneIcon,
          sceneName: sceneInfo.sceneName,
          roomId: sceneInfo.roomId,
          isDefaultYijianScene: sceneInfo.isDefault === '1',
        })

        //处理执行结果
        const tempSceneDeviceActionsFlatten = [] as AutoScene.AutoSceneFlattenAction[]
        //手动场景的执行结果不可选相同设备
        const tempSceneDevicelinkSelectList: string[] = []
        //手动场景里的执行动作全都是设备
        sceneInfo.deviceActions.forEach((action) => {
          // 设备，无法使用在自动场景已存的名称，因为设备可能会已改名称，只能再次查询
          let deviceUniId = action.deviceId
          if (action.proType === PRO_TYPE.switch) {
            deviceUniId = `${action.deviceId}:${action.controlAction[0].modelName}`
          }
          let device = this.data.deviceList.find((item) => item.uniId === deviceUniId)
          if (!device) return
          //是设备
          if (device.proType === PRO_TYPE.switch) {
            //TODO：是开关面板, 手动场景的开关面板action.controlAction格式不一样，不知道能不能改成商照一样，还需要评估是否对以前的造成影响
            action.controlAction.forEach((_switchInPanel, switchIndex) => {
              deviceUniId = `${action.deviceId}:${action.controlAction[switchIndex].modelName}`
              device = this.data.deviceList.find((item) => item.uniId === deviceUniId)
              if (!device) return
              const power = action.controlAction[switchIndex].power
              const desc = toPropertyDesc({ proType: device.proType, property: action.controlAction[switchIndex] })
              tempSceneDevicelinkSelectList.push(device.uniId)
              tempSceneDeviceActionsFlatten.push({
                uniId: device.uniId,
                name: `${device.switchInfoDTOList[0].switchName} | ${device.deviceName}`,
                type: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
                desc,
                pic: device.switchInfoDTOList[0].pic,
                proType: PRO_TYPE.switch,
                value: {
                  modelName: action.controlAction[switchIndex].modelName,
                  power,
                },
                orderNum: 0,
                dragId: device.uniId + Math.floor(Math.random() * 1001),
              })
            })
          } else {
            const property = {
              ...action.controlAction[0],
            }

            const modelName = getModelName(device.proType, device.productId)

            if (device.proType === PRO_TYPE.light) {
              property.colorTempRange = device.mzgdPropertyDTOList[modelName].colorTempRange
            }

            const desc = toPropertyDesc({ proType: device.proType, property })

            tempSceneDevicelinkSelectList.push(device.uniId)
            tempSceneDeviceActionsFlatten.push({
              uniId: device.uniId,
              name: device.deviceName,
              type: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
              desc,
              pic: device.pic as string,
              proType: device.proType,
              value: {
                ...property,
                modelName,
              },
              sceneProperty: {
                ...property,
              },
              orderNum: 0,
              dragId: device.uniId + Math.floor(Math.random() * 1001),
            })
          }
        })
        this.setData(
          {
            sceneDevicelinkSelectList: tempSceneDevicelinkSelectList,
            sceneDeviceActionsFlatten: tempSceneDeviceActionsFlatten,
          },
          () => {
            this.updateSceneDeviceActionsFlatten(false)
            this.updateSceneDeviceConditionsFlatten()
          },
        )
      }
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    inputAutoSceneName(e: { detail: string }) {
      this.setData({
        sceneName: e.detail || '',
      })
    },
    /* 设置自动化场景图标 start */
    handleEditIconShow() {
      this.setData({
        showEditIconPopup: true,
      })
    },
    /* 选择建议的房间名称 start */
    selectAdviceName(e: { currentTarget: { dataset: { text: string } } }) {
      const name = e.currentTarget.dataset.text
      this.setData({
        sceneName: name,
      })
    },

    handleEditIconClose() {
      this.setData({
        showEditIconPopup: false,
      })
    },
    handleEditIconConfirm(e: { detail: string }) {
      console.log(e)
      this.setData({
        showEditIconPopup: false,
        sceneIcon: e.detail,
      })
    },
    /* 设置自动化场景图标 end */
    /* 设置场景生效时间段 start */
    handleEffectiveTimeShow() {
      this.setData({
        showEffectiveTimePopup: true,
      })
    },
    handleEffectiveTimeClose() {
      this.setData({
        showEffectiveTimePopup: false,
      })
    },
    handleEffectiveTimeConfirm(e: {
      detail: { startTime: string; endTime: string; periodType: string; week: string }
    }) {
      const { startTime, endTime, periodType, week } = e.detail
      this.setData({
        _isEditCondition: true,
        showEffectiveTimePopup: false,
        'effectiveTime.startTime': startTime,
        'effectiveTime.endTime': endTime,
        'effectiveTime.timeType': periodType,
        'effectiveTime.timePeriod': week,
      })
    },
    /* 设置场景生效时间段 end */
    /* 设置场景条件弹窗 start */
    handleConditionShow() {
      this.setData({
        showEditConditionPopup: true,
      })
    },
    handleConditionClose() {
      this.setData({
        showEditConditionPopup: false,
      })
    },
    /* 条件弹窗点击回调 */
    onConditionClicked(e: { detail: string }) {
      if (e.detail === 'time') {
        this.setData({
          opearationType: 'auto',
          showTimeConditionPopup: true,
        })
      } else if (e.detail === 'touch') {
        this.setData({
          opearationType: 'yijian',
          showEditRoomPopup: true,
        })
      } else {
        this.setData({
          opearationType: 'auto',
        })
        if (deviceStore.allRoomCanSetSceneConditionDeviceList.length) {
          this.addSensorPopup()
        } else {
          Toast({ message: '尚未添加传感器和门锁', zIndex: 9999 })
          return
        }
      }
      this.setData({
        showEditConditionPopup: false,
      })
    },
    /* 设置场景条件弹窗 end */
    /* 设置手动场景——房间 */
    handleSceneRoomEditCancel() {
      this.setData({
        showEditRoomPopup: false,
      })
    },
    handleRoomReturn() {
      this.setData({
        showEditRoomPopup: false,
      })
      this.handleConditionShow()
    },
    async handleSceneRoomEditConfirm(e: { detail: string }) {
      const onlineDeviceListInRoom: Device.DeviceItem[] = deviceStore.allRoomDeviceFlattenList.filter(
        (item) => item.roomId === e.detail && item.onLineStatus === 1,
      )
      this.setData(
        {
          roomId: e.detail,
          showEditRoomPopup: false,
          _isEditCondition: true,
          sceneDevicelinkSelectList: onlineDeviceListInRoom.map((item) => item.uniId),
        },
        () => {
          this.updateSceneDeviceActionsFlatten()
          this.updateSceneDeviceConditionsFlatten()
        },
      )
    },
    /* 设置手动场景——房间 */
    /**
     * 增加传感器做场景条件
     */
    addSensorPopup() {
      this.setData({
        selectCardType: 'conditionDevice',
      })
      this.handleSelectCardShow()
    },
    /* 时间条件 start */
    handleTimeConditionClose() {
      this.setData({
        showTimeConditionPopup: false,
      })
    },
    handleTimeConditionReturn() {
      this.setData({
        showTimeConditionPopup: false,
      })
      this.handleConditionShow()
    },
    handleTimeConditionConfirm(e: { detail: { time: string; periodType: string; week: string } }) {
      const { time, periodType, week } = e.detail
      this.setData({
        showTimeConditionPopup: false,
        _isEditCondition: true,
        'timeCondition.time': time,
        'timeCondition.timeType': periodType,
        'timeCondition.timePeriod': week,
        'effectiveTime.startTime': '00:00',
        'effectiveTime.endTime': '23:59',
        'effectiveTime.timeType': '1',
        'effectiveTime.timePeriod': '1,2,3,4,5,6,7',
      })
      this.updateSceneDeviceConditionsFlatten()
    },
    /* 时间条件 end */
    handleActionShow() {
      if (this.data.opearationType === 'auto') {
        this.setData({
          showEditActionPopup: true,
        })
      } else {
        this.handleSelectCardShow()
      }
    },
    handleActionClose() {
      this.setData({
        showEditActionPopup: false,
      })
    },
    onActionClicked(e: { detail: string }) {
      if (e.detail === 'delay') {
        this.setData({
          showDelayPopup: true,
          delay: 0,
        })
      } else if (e.detail === 'scene') {
        if (sceneStore.allRoomSceneList.length) {
          this.setData({
            selectCardType: 'scene',
          })
          this.handleSelectCardShow()
        } else {
          Toast({ message: '暂无可执行场景', zIndex: 9999 })
          return
        }
      } else {
        if (this.data.deviceList.length) {
          this.setData({
            selectCardType: 'device',
          })
          this.handleSelectCardShow()
        } else {
          Toast({ message: '暂无可执行设备', zIndex: 9999 })
          return
        }
      }
      this.setData({
        showEditActionPopup: false,
      })
    },
    /* 延时弹窗 start */
    handleDelayClose() {
      this.setData({
        showDelayPopup: false,
      })
    },
    handleDelayReturn() {
      this.setData({
        showDelayPopup: false,
      })
      this.handleActionShow()
    },
    handleDelayConfirm(e: { detail: number }) {
      if (!e.detail) {
        if (this.data.editingDelayId) {
          const index = this.data.sceneDeviceActionsFlatten.findIndex((item) => item.uniId === this.data.editingDelayId)
          this.data.sceneDeviceActionsFlatten.splice(index, 1)
        }
      } else {
        if (this.data.editingDelayId) {
          //更新原来的延时Id
          const index = this.data.sceneDeviceActionsFlatten.findIndex((item) => item.uniId === this.data.editingDelayId)
          this.setData({
            [`sceneDeviceActionsFlatten[${index}].desc`]: [strUtil.formatTime(e.detail)],
            [`sceneDeviceActionsFlatten[${index}].value`]: { delayTime: e.detail },
          })
        } else {
          //新增一个Id并push到列表后
          this.data.sceneDeviceActionsFlatten.push({
            uniId: new Date().getTime() + 'DLY',
            name: '延时',
            desc: [strUtil.formatTime(e.detail)],
            type: 6,
            pic: '/package-automation/assets/imgs/automation/stopwatch-materialized.png',
            value: { delayTime: e.detail },
            orderNum: 0,
            dragId: new Date().getTime() + 'DLY',
          })
        }
      }
      this.updateSceneDeviceActionsFlatten()
      this.setData({
        editingDelayId: '',
        showDelayPopup: false,
      })
    },
    /* 延时弹窗 end */

    /**
     * 弹出添加场景或设备弹窗
     * @returns
     */
    handleSelectCardShow() {
      if (
        this.data.opearationType === 'yijian' &&
        this.data.deviceList.filter((item) => !this.data.sceneDevicelinkSelectList.includes(item.uniId)).length === 0
      ) {
        Toast({ message: '手动点击场景已无设备选择', zIndex: 9999 })
      } else {
        this.setData({
          showSelectCardPopup: true,
        })
      }
    },
    handleSelectCardOfflineTap() {
      Toast({ message: '设备已离线', zIndex: 9999 })
    },
    handleSelectCardSelect(e: { detail: string }) {
      if (this.data.selectCardType === 'device') {
        const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
        const device = allRoomDeviceMap[e.detail]
        //只有开关面板和zigbee灯需要下发找一找
        if (
          (device.proType === PRO_TYPE.switch && !SCREEN_PID.includes(device.productId)) ||
          device.proType === PRO_TYPE.light
        ) {
          device.deviceType === 2 &&
            findDevice({
              proType: device.proType,
              gatewayId: device.gatewayId,
              devId: device.deviceId,
              switchInfoDTOList: device.switchInfoDTOList,
            })
        }
      }
    },
    handleSelectCardClose() {
      this.setData({
        showSelectCardPopup: false,
      })
    },
    handleSelectCardReturn() {
      this.handleSelectCardClose()
      if (this.data.selectCardType === 'conditionDevice') {
        this.handleConditionShow()
      } else {
        this.handleActionShow()
      }
    },
    async handleSelectCardConfirm(e: { detail: { selectList: string[] } }) {
      console.log('handleSelectCardConfirm', e)
      this.setData({
        showSelectCardPopup: false,
      })
      if (this.data.selectCardType === 'conditionDevice') {
        this.setData(
          {
            _isEditCondition: true,
            conditionDevicelinkSelectList: e.detail.selectList,
          },
          () => {
            this.updateSceneDeviceConditionsFlatten()
          },
        )
      } else {
        this.setData(
          {
            sceneDevicelinkSelectList: e.detail.selectList,
          },
          () => {
            this.updateSceneDeviceActionsFlatten()
          },
        )
      }
    },
    handleActionDelete(dragId: string) {
      const index = this.data.sceneDeviceActionsFlatten.findIndex((item) => item.dragId === dragId)
      const deleteId = this.data.sceneDeviceActionsFlatten[index].uniId
      this.data.sceneDeviceActionsFlatten.splice(index, 1)
      const afterSelected = this.data.sceneDevicelinkSelectList.filter((item) => item !== deleteId)
      this.setData(
        {
          sceneDevicelinkSelectList: afterSelected,
        },
        () => {
          this.updateSceneDeviceActionsFlatten()
        },
      )
    },
    updateSceneDeviceActionsFlatten(isEditAction = true) {
      console.log('updateSceneDeviceActionsFlatten')
      const tempSceneDeviceActionsFlatten = this.data.sceneDeviceActionsFlatten as AutoScene.AutoSceneFlattenAction[]

      //删除取消选中的设备和场景 //可选多设备改造后无需删除
      // tempSceneDeviceActionsFlatten = tempSceneDeviceActionsFlatten.filter((item) => {
      //   const index = this.data.linkSelectList.findIndex((id) => id === item.uniId)
      //   return index !== -1 || item.type === 6
      // })
      const sceneDeviceActionsFlattenIds = this.data.sceneDeviceActionsFlatten.map((item) => item.uniId)
      //从后面插入已选中的设备和场景
      this.data.sceneDevicelinkSelectList.forEach((id) => {
        // 手动场景，已选择的设备无需再插入
        if (this.data.opearationType === 'yijian' && sceneDeviceActionsFlattenIds.includes(id)) {
          return
        }
        //每次选中的都push到最后
        const device = this.data.deviceList.find((item) => item.uniId === id)
        if (device) {
          //是设备
          // console.log('是设备', device)
          let name = ''
          let modelName = ''
          let pic = ''
          let desc: string[] = []
          if (device.proType === PRO_TYPE.switch) {
            name = `${device.switchInfoDTOList[0].switchName} | ${device.deviceName}`
            modelName = device.uniId.split(':')[1]
            pic = device.switchInfoDTOList[0].pic
            desc = toPropertyDesc({ proType: device.proType, property: device.property! })
          } else {
            name = device.deviceName
            modelName = getModelName(device.proType, device.productId)
            pic = device.pic
            if (this.isNewScenarioSettingSupported(device.proType)) {
              device.sceneProperty = device.sceneProperty || { power: 0 } // 场景控制属性初始化
              if (device.proType === PRO_TYPE.light) {
                device.sceneProperty.colorTempRange = device.property?.colorTempRange // 灯具设备需要该属性计算色温显示标签
              }
              if (FAN_PID.includes(device.productId)) {
                device.sceneProperty.fan_power = 'off'
              }
              desc = toPropertyDesc({ proType: device.proType, property: device.sceneProperty })
            } else {
              desc = toPropertyDesc({ proType: device.proType, property: device.property! })
            }
          }

          tempSceneDeviceActionsFlatten.push({
            uniId: device.uniId,
            name,
            type: device.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
            desc,
            pic,
            proType: device.proType,
            value: {
              modelName,
              ...device.property,
            },
            sceneProperty: {
              modelName,
              ...device.sceneProperty,
            },
            orderNum: 0,
            dragId: device.uniId + Math.floor(Math.random() * 1001),
          })
        } else {
          const scene = sceneStore.allRoomSceneList.find((item) => item.sceneId === id)
          if (scene) {
            //是场景
            // console.log('是场景', scene)
            tempSceneDeviceActionsFlatten.push({
              uniId: scene.sceneId,
              name: scene.sceneName,
              type: 5,
              desc: [scene.roomName],
              pic: `https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/auto-scene/${scene.sceneIcon}.png`,
              value: {},
              orderNum: 0,
              dragId: scene.sceneId + Math.floor(Math.random() * 1001),
            })
          }
        }
      })
      // console.log('tempSceneDeviceActionsFlatten', tempSceneDeviceActionsFlatten)

      //增加排序顺序字段
      const sceneDeviceActionsFlatten = tempSceneDeviceActionsFlatten.map((item, index) => {
        return { ...item, orderNum: index }
      })
      this.setData(
        {
          sceneDeviceActionsFlatten,
          _isEditAction: isEditAction,
          sceneDevicelinkSelectList: this.data.opearationType === 'auto' ? [] : this.data.sceneDevicelinkSelectList,
        },
        async () => {
          // 防止场景为空，drag为null·
          const drag = this.selectComponent('#drag')
          if (drag) {
            if (this.data.scrollInfo.bottomSize === 0) {
              const res: Array<IAnyObject> = await new Promise((resolve) => {
                wx.createSelectorQuery()
                  .select('#ScrollView')
                  .boundingClientRect()
                  .exec((res) => {
                    console.log('createSelectorQuery', res)
                    resolve(res)
                  })
              })

              if (!res || !res[0]) {
                return
              }
              this.setData(
                {
                  'scrollInfo.topSize': res[0].top,
                  'scrollInfo.bottomSize': res[0].bottom,
                },
                () => {
                  drag.init()
                },
              )
            } else {
              drag.updateList()
            }
          }
        },
      )
    },
    /* 条件方法 start */
    async updateSceneDeviceConditionsFlatten() {
      const sceneDeviceConditionsFlatten = [] as AutoScene.AutoSceneFlattenCondition[]
      console.log('this.data.roomId', this.data.roomId, this.data.opearationType)

      if (this.data.roomId !== '' && this.data.opearationType === 'yijian') {
        sceneDeviceConditionsFlatten.push({
          uniId: 'room',
          name: '手动点击场景',
          desc: [
            roomStore.roomList.find((item) => item.roomId === this.data.roomId)?.roomName ??
              roomStore.roomList[0].roomName,
          ],
          pic: '/package-automation/assets/imgs/automation/touch-materialized.png',
          productId: 'touch',
          property: {},
          type: 5,
        })
        //删除已设置的时间条件
        if (this.data.timeCondition.time !== '') {
          this.setData({
            'timeCondition.time': '',
            'timeCondition.timePeriod': '',
            'timeCondition.timeType': '',
          })
        }
      }

      if (this.data.timeCondition.time !== '') {
        sceneDeviceConditionsFlatten.push({
          uniId: 'time',
          name: this.data.timeCondition.time,
          desc: [strUtil.transPeriodDesc(this.data.timeCondition.timeType, this.data.timeCondition.timePeriod)],
          pic: '/package-automation/assets/imgs/automation/time-materialized.png',
          productId: 'time',
          property: {},
          type: 6,
        })
      }
      //已选中的条件设备
      const conditionDeviceSelected = this.data.conditionDevicelinkSelectList
        .map((id) => this.data.conditionDeviceList.find((item) => item.deviceId === id))
        .filter((obj) => obj !== undefined) as Device.DeviceItem[]

      for (const item of conditionDeviceSelected) {
        console.log('item', item)
        await autosceneStore.updateDeviceConditionPropertyList({ productId: item.productId, deviceId: item.deviceId })

        if (item.property === undefined) {
          item.property = autoSceneConditionPropertyOptions[item.productId][0]['value']
        }
        sceneDeviceConditionsFlatten.push({
          uniId: item.deviceId,
          name: item.deviceName,
          desc: toPropertyDesc({
            proType: item.proType,
            property: item.property,
            productId: item.productId,
            deviceId: item.deviceId,
          }),
          pic: item.pic,
          productId: item.productId,
          property: item.property,
          proType: item.proType,
          type: item.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
        })
      }

      this.setData({
        sceneDeviceConditionsFlatten,
      })
    },
    handleConditionDelete(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        sceneDeviceActionsFlatten: [],
        sceneDevicelinkSelectList: [],
      })
      const uniId = e.currentTarget.dataset.info.uniId
      console.log('删除条件', uniId)
      if (this.data.conditionDevicelinkSelectList.includes(uniId)) {
        const index = this.data.conditionDevicelinkSelectList.findIndex((id) => id === uniId)
        this.data.conditionDevicelinkSelectList.splice(index, 1)
        this.setData({
          conditionDevicelinkSelectList: [...this.data.conditionDevicelinkSelectList],
        })
      }
      if (uniId === 'time') {
        this.setData({
          'timeCondition.time': '',
          'timeCondition.timePeriod': '',
          'timeCondition.timeType': '',
        })
      }
      this.data.sceneDeviceConditionsFlatten.splice(e.currentTarget.dataset.index, 1)
      this.setData({
        _isEditCondition: true,
        sceneDeviceConditionsFlatten: [...this.data.sceneDeviceConditionsFlatten],
      })
    },
    /* 条件方法 end */

    /* 传感器条件编辑 start */
    onDeviceConditionPropertyPopupClose() {
      this.setData({
        showEditDeviceConditionPopup: false,
      })
    },
    onDeviceConditionPropertyPopupConfirm(e: { detail: IAnyObject }) {
      console.log(e)

      const listEditIndex = this.data.conditionDeviceList.findIndex((item) => item.uniId === this.data.editingUniId)

      const listItem = this.data.conditionDeviceList[listEditIndex]
      listItem.property = e.detail.value
      this.setData(
        {
          _isEditCondition: true,
          showEditDeviceConditionPopup: false,
          conditionDeviceList: [...this.data.conditionDeviceList],
        },
        () => {
          this.updateSceneDeviceConditionsFlatten()
        },
      )
    },
    /* 传感器条件编辑 end */

    handleAutoSceneConditionEdit(e: WechatMiniprogram.TouchEvent) {
      const { index } = e.currentTarget.dataset
      const action = this.data.sceneDeviceConditionsFlatten[index]

      console.log('condition type', this.data.sceneDeviceConditionsFlatten[index])

      if (action.productId === 'time') {
        this.setData({
          showTimeConditionPopup: true,
        })
      } else if (action.productId === 'touch') {
        if (this.data.isDefaultYijianScene) return
        this.setData({
          showEditRoomPopup: true,
        })
      } else {
        this.setData({
          editingUniId: action.uniId,
          editingPropertyInfo: {
            title: action.name,
            propertyKey: action.productId + '|' + action.uniId,
            value: action.property,
          },
          showEditDeviceConditionPopup: true,
        })
      }
    },

    /**
     * 编辑场景延时/设备动作结果
     * @param e
     * @returns
     */
    handleAutoSceneActionEdit(dragId: string) {
      const action = this.data.sceneDeviceActionsFlatten.find((item) => item.dragId === dragId)

      console.log('handleAutoSceneActionEdit', action)
      if (!action) return
      if (action.type === 6) {
        this.setData({
          delay: action.value.delayTime,
          editingDelayId: action.uniId,
          showDelayPopup: true,
        })
      } else if (action.type === 5) {
        return
      } else {
        const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
        const device = allRoomDeviceMap[action.uniId]
        console.log('device', device)

        device.deviceType === 2 &&
          findDevice({
            proType: device.proType,
            gatewayId: device.gatewayId,
            devId: device.deviceId,
            switchInfoDTOList: device.switchInfoDTOList,
          })

        this.setData({
          sceneEditTitle: action.name,
          sceneEditInfo: {
            ...action.value,
            deviceType: device.deviceType,
            gatewayId: device.gatewayId,
            deviceId: device.deviceId,
            proType: device.proType,
            productId: device.productId,
            sceneProperty: { ...action.sceneProperty },
          },
          showEditPopup: device.proType,
          editingUniId: action.dragId,
        })
      }
    },
    /* 编辑设备动作弹窗 start */
    handleEditPopupClose() {
      this.setData({
        showEditPopup: '',
      })
    },
    handleSceneDeviceEditConfirm(e: { detail: IAnyObject }) {
      console.log('handleSceneDeviceEditConfirm', e)
      const flattenEditIndex = this.data.sceneDeviceActionsFlatten.findIndex(
        (item) => item.dragId === this.data.editingUniId,
      )
      const actionItem = this.data.sceneDeviceActionsFlatten[flattenEditIndex]
      actionItem.sceneProperty = e.detail
      actionItem.desc = toPropertyDesc({ proType: actionItem.proType as string, property: actionItem.sceneProperty })
      this.setData(
        {
          showEditPopup: '',
        },
        () => {
          this.updateSceneDeviceActionsFlatten()
        },
      )
    },
    handleSceneEditConfirm(e: { detail: IAnyObject }) {
      console.log('handleSceneEditConfirm', e)
      const { _cacheDeviceMap } = this.data
      const flattenEditIndex = this.data.sceneDeviceActionsFlatten.findIndex(
        (item) => item.dragId === this.data.editingUniId,
      )
      const actionItem = this.data.sceneDeviceActionsFlatten[flattenEditIndex]
      const listEditIndex = this.data.deviceList.findIndex((item) => item.uniId === actionItem.uniId)
      const listItem = this.data.deviceList[listEditIndex]
      const device = deviceStore.allRoomDeviceFlattenMap[actionItem.uniId]

      if (!_cacheDeviceMap[actionItem.uniId]) {
        let oldProperty = {
          ...device.property,
        }

        delete oldProperty.minColorTemp
        delete oldProperty.maxColorTemp

        if (oldProperty.proType === PRO_TYPE.curtain) {
          oldProperty = { curtain_position: oldProperty.curtain_position }
        }

        _cacheDeviceMap[actionItem.uniId] = {
          gatewayId: device.gatewayId,
          deviceId: device.deviceId,
          proType: device.proType,
          deviceType: device.deviceType,
          modelName: actionItem.value?.modelName,
          property: oldProperty,
        }
      }
      listItem.property = {
        ...listItem.property,
        ...e.detail,
      }

      const _proType = _cacheDeviceMap[actionItem.uniId].proType
      const coverTypes = _proType === PRO_TYPE.bathHeat || _proType === PRO_TYPE.clothesDryingRack
      actionItem.value = coverTypes
        ? e.detail
        : {
            ...actionItem.value,
            ...e.detail,
          }

      actionItem.desc = toPropertyDesc({ proType: actionItem.proType as string, property: actionItem.value })

      this.setData(
        {
          sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
          deviceList: [...this.data.deviceList],
          showEditPopup: '',
        },
        () => {
          this.updateSceneDeviceActionsFlatten()
        },
      )
    },

    async handleSave() {
      if (this.data.opearationType === 'yijian') {
        this.editYijianScene()
        return
      }
      // 判断是否有非法重复的动作
      // 在自动化的时候，找到队列中最后一个相同的设备，看他后面有没有延时，有就不return，没有就依旧return
      const condition = (element: AutoScene.AutoSceneFlattenAction) => element.type === 6
      // 按延时分段
      const segmentedArray = this.data.sceneDeviceActionsFlatten.reduce(
        (result: Array<Array<AutoScene.AutoSceneFlattenAction>>, obj) => {
          const lastSegment = result[result.length - 1]
          if (condition(obj)) {
            result.push([])
          } else {
            lastSegment.push(obj)
          }
          return result
        },
        [[]],
      )
      console.log('分段结果', segmentedArray)
      let isToast = false
      // 检查分段中是否存在相同的设备
      segmentedArray.forEach((item) => {
        const actionIds = item.map((item) => item.uniId)
        const quchongSet = new Set(actionIds)
        const quchongIds = Array.from(quchongSet)
        console.log(actionIds, quchongIds)
        if (quchongIds.length !== actionIds.length) {
          console.log('弹出警告')
          isToast = true
        }
      })

      if (isToast) {
        this.setData(
          {
            dialogConfirmBtnColor: '#488FFF',
          },
          () => {
            Dialog.confirm({
              title: '创建失败',
              message: '同一时间段内，同一设备或场景不能重复选择。请增加延时或删除设备/场景。',
              showCancelButton: false,
              confirmButtonText: '我知道了',
              zIndex: 9999,
            }).then(() => {
              this.setData({
                dialogConfirmBtnColor: '#27282A',
              })
            })
          },
        )
        return
      }

      if (
        this.data.autoSceneId &&
        (this.data.sceneDeviceActionsLength === 0 || this.data.sceneDeviceConditionsFlatten.length === 0)
      ) {
        // 删完actions或conditions按照删除场景处理

        const res = await Dialog.confirm({
          title: '清空条件或动作将会删除场景，是否确定？',
          confirmButtonText: '确定',
          zIndex: 9999,
        }).catch(() => 'cancel')

        console.log('delAutoScene', res)

        if (res === 'cancel') return

        const delRes = await deleteScene(this.data.autoSceneId)
        if (delRes.success) {
          await autosceneStore.updateAllRoomAutoSceneList()
          wx.navigateBack()
        } else {
          Toast({ message: '删除失败', zIndex: 9999 })
        }

        return
      }
      // 检查场景名是否合法
      const isLegal = this.isSceneNameLegal(this.data.sceneName)
      if (!isLegal) return

      const newSceneData = {
        conditionType: '1',
        deviceActions: [],
        deviceConditions: [],
        timeConditions: [],
        effectiveTime: {
          startTime: this.data.effectiveTime.startTime + ':00',
          endTime: this.data.effectiveTime.endTime + ':59',
          timeType: this.data.effectiveTime.timeType === '4' ? '1' : this.data.effectiveTime.timeType, //前端用4表示自定义 1表示每天，云端全用1
          timePeriod: this.data.effectiveTime.timePeriod,
        },
        houseId: homeStore.currentHomeDetail.houseId,
        sceneIcon: this.data.sceneIcon,
        sceneName: this.data.sceneName,
        sceneCategory: '1',
        sceneType: '1',
      } as AutoScene.AddAutoSceneDto
      if (this.data.timeCondition.time !== '') {
        newSceneData.timeConditions.push({
          time: this.data.timeCondition.time,
          timeType: this.data.timeCondition.timeType === '4' ? '1' : this.data.timeCondition.timeType,
          timePeriod: this.data.timeCondition.timePeriod,
        })
      }

      if (this.data.autoSceneId) {
        //是要准备更新场景
        let _isEditIconOrName = false
        if (
          this.data.sceneIcon !== this.data._autosceneInfo.sceneIcon ||
          this.data.sceneName !== this.data._autosceneInfo.sceneName
        ) {
          _isEditIconOrName = true
        }

        if (!_isEditIconOrName && !this.data._isEditAction && !this.data._isEditCondition) {
          //全都没更改过则直接返回
          wx.navigateBack()
          return
        }
        //更新场景
        newSceneData.updateType = '0' //0-只更新名称，icon 1-更新结果  6-更新条件 7-更新条件与更新结果
        newSceneData.sceneId = this.data.autoSceneId
        if (this.data._isEditAction && !this.data._isEditCondition) {
          newSceneData.updateType = '1'
        } else if (!this.data._isEditAction && this.data._isEditCondition) {
          newSceneData.updateType = '6'
        } else if (this.data._isEditAction && this.data._isEditCondition) {
          newSceneData.updateType = '7'
        }
      }

      console.log('newSceneData保存', newSceneData)
      console.log('sceneDeviceActionsFlatten保存', this.data.sceneDeviceActionsFlatten)
      console.log('sceneDeviceConditionsFlatten保存', this.data.sceneDeviceConditionsFlatten)

      // 处理发送请求的deviceActions字段数据
      const deviceMap = deviceStore.allRoomDeviceMap
      this.data.sceneDeviceActionsFlatten.forEach((action) => {
        if (action.uniId.indexOf('DLY') !== -1) {
          newSceneData.deviceActions.push({
            controlAction: [],
            delayTime: action.value.delayTime,
            deviceId: action.uniId,
            deviceType: action.type,
            orderNum: action.orderNum,
          })
        } else {
          const device = deviceMap[action.uniId] || deviceMap[action.uniId.split(':')[0]]
          if (device) {
            //是设备
            if (action.proType === PRO_TYPE.switch) {
              //是开关面板
              const deviceId = action.uniId.split(':')[0]
              newSceneData?.deviceActions?.push({
                controlAction: [action.value],
                deviceId,
                deviceType: action.type,
                proType: action.proType,
                orderNum: action.orderNum,
              })
            } else {
              const property = action.value
              let ctrlAction = {} as IAnyObject

              if (device.deviceType === 2) {
                ctrlAction.modelName = device.proType === PRO_TYPE.light ? 'light' : 'wallSwitch1'
              }

              if (device.proType === PRO_TYPE.curtain) {
                ctrlAction.curtain_position = property.curtain_position
              } else if (device.proType === PRO_TYPE.bathHeat) {
                ctrlAction.light_mode = property.light_mode
                ctrlAction.heating_temperature = property.heating_temperature
                ctrlAction.mode = property.mode
              } else if (device.proType === PRO_TYPE.clothesDryingRack) {
                ctrlAction.updown = property.updown
                ctrlAction.laundry = property.laundry
                ctrlAction.light = property.light
              } else if (this.isNewScenarioSettingSupported(device.proType)) {
                ctrlAction = action.sceneProperty!
                delete ctrlAction?.colorTempRange
              }
              newSceneData.deviceActions.push({
                controlAction: [ctrlAction],
                deviceId: action.uniId,
                deviceType: device.deviceType,
                proType: device.proType,
                orderNum: action.orderNum,
              })
            }
          } else {
            //场景
            newSceneData.deviceActions.push({
              controlAction: [],
              deviceId: action.uniId,
              deviceType: action.type,
              orderNum: action.orderNum,
            })
          }
        }
      })

      //处理发送请求的deviceConditions字段数据
      this.data.sceneDeviceConditionsFlatten.forEach((action) => {
        const device = deviceMap[action.uniId]
        if (device) {
          newSceneData?.deviceConditions?.push({
            controlEvent: [{ ...(action.property as { modelName: string }) }],
            deviceId: action.uniId,
          })
        }
      })

      console.log('创建更新自动化', newSceneData)
      // return
      const promise = this.data.autoSceneId
        ? updateScene(newSceneData as AutoScene.AddAutoSceneDto)
        : addScene(newSceneData as AutoScene.AddAutoSceneDto)

      const res = await promise
      if (!res.success) {
        Toast({
          message: this.data.autoSceneId ? '更新失败' : '创建失败',
        })
      } else {
        emitter.emit('sceneEdit', { sceneType: 'auto' })
        Toast({
          message: this.data.autoSceneId ? '更新成功' : '创建成功',
          onClose: () => {
            wx.navigateBack()
          },
        })
      }
    },
    async editYijianScene() {
      // 检查场景名是否合法
      const isLegal = this.isSceneNameLegal(this.data.sceneName)
      if (!isLegal) return
      if (this.data.yijianSceneId) {
        //编辑
        if (this.data.sceneDeviceActionsFlatten.length === 0) {
          // 删完actions按照删除场景处理
          Dialog.confirm({
            title: '清空操作将会删除场景，确定删除该场景？',
          }).then(async () => {
            const res = await deleteScene(this.data._sceneInfo.sceneId)
            if (res.success) {
              emitter.emit('sceneEdit', { sceneType: 'yijian' })
              homeStore.updateRoomCardList()
              Toast({
                message: '删除成功',
                onClose: () => {
                  wx.navigateBack()
                },
              })
            } else {
              Toast({ message: '删除失败', zIndex: 9999 })
            }
          })
          return
        }
        // 准备好数据内存
        const data = {
          sceneId: this.data._sceneInfo.sceneId,
          updateType: '0',
          conditionType: '0',
          roomId: this.data.roomId,
        } as Scene.UpdateSceneDto
        let _isEditIconOrName = false
        // 检查场景名字是否变更
        if (this.data.sceneName !== this.data._sceneInfo.sceneName) {
          data.sceneName = this.data.sceneName
          _isEditIconOrName = true
        }
        // 检查场景icon是否变更
        if (this.data.sceneIcon !== this.data._sceneInfo.sceneIcon) {
          data.sceneIcon = this.data.sceneIcon
          _isEditIconOrName = true
        }

        if (this.data._isEditAction) {
          data.deviceActions = []
          data.updateType = '1'

          // 场景动作数据统一在scene-request-list页面处理
          storage.set('scene_data', data)
          storage.set('sceneDeviceActionsFlatten', this.data.sceneDeviceActionsFlatten)
          console.log('scene_data11111', this.data.sceneDeviceActionsFlatten)

          // 需要更新结果的情况，需要跳转页面等待上报结果
          wx.redirectTo({
            url: strUtil.getUrlWithParams('/package-automation/scene-request-list-yijian/index', {
              sceneId: data.sceneId,
            }),
          })

          return
        }
        if (!_isEditIconOrName) {
          //全都没更改过则直接返回
          wx.navigateBack()
          return
        }
        const res = await updateScene(data)
        if (res.success) {
          emitter.emit('sceneEdit', { sceneType: 'yijian' })
          homeStore.updateRoomCardList()
          Toast({
            message: '更新成功',
            onClose: () => {
              wx.navigateBack()
            },
          })
        } else {
          Toast({ message: '更新失败', zIndex: 9999 })
        }
      } else {
        //新建
        // 场景动作数据统一在scene-request-list页面处理
        const newSceneData = {
          conditionType: '0',
          deviceActions: [],
          deviceConditions: [],
          houseId: homeStore.currentHomeDetail.houseId,
          roomId: this.data.roomId === '' ? roomStore.currentRoomId : this.data.roomId,
          sceneIcon: this.data.sceneIcon,
          sceneName: this.data.sceneName,
          sceneType: '0',
          orderNum: 0,
        } as Scene.AddSceneDto

        // 将新场景排到最后,orderNum可能存在跳号的情况
        sceneStore.sceneList.forEach((scene) => {
          if (scene.orderNum && scene.orderNum >= newSceneData.orderNum) {
            newSceneData.orderNum = scene.orderNum + 1
          }
        })

        storage.set('scene_data', newSceneData)
        storage.set('sceneDeviceActionsFlatten', this.data.sceneDeviceActionsFlatten)

        wx.redirectTo({
          url: '/package-automation/scene-request-list-yijian/index',
        })
      }
    },
    async handleAutoSceneDelete() {
      if (this.data.autoSceneId) {
        const res = await Dialog.confirm({
          title: '确定删除该自动化？',
          zIndex: 9999,
        }).catch(() => 'cancel')

        console.log('delAutoScene', res)

        if (res === 'cancel') return

        const delRes = await deleteScene(this.data.autoSceneId)
        if (delRes.success) {
          emitter.emit('sceneEdit', { sceneType: 'auto' })
          Toast({
            message: '删除成功',
            onClose: () => {
              wx.navigateBack()
            },
          })
        } else {
          Toast({ message: '删除失败', zIndex: 9999 })
        }
        return
      }
      if (this.data.yijianSceneId) {
        const res = await Dialog.confirm({
          title: this.data.isDefaultYijianScene ? '默认场景删除后不可恢复，确定删除该默认场景？' : '确定删除该场景？',
          zIndex: 9999,
        }).catch(() => 'cancel')

        console.log('delAutoScene', res)

        if (res === 'cancel') return

        const delRes = await deleteScene(this.data._sceneInfo.sceneId)
        if (delRes.success) {
          emitter.emit('sceneEdit', { sceneType: 'yijian' })
          homeStore.updateRoomCardList()
          Toast({
            message: '删除成功',
            onClose: () => {
              wx.navigateBack()
            },
          })
        } else {
          Toast({ message: '删除失败', zIndex: 9999 })
        }
        return
      }
    },
    /* 执行结果拖拽相关方法 start */
    handleScroll(e: { detail: { scrollTop: number } }) {
      this.setData({
        'scrollInfo.scrollTop': e.detail.scrollTop,
      })
    },
    async handleSortEnd(e: { detail: { listData: { data: AutoScene.AutoSceneFlattenAction; sortKey: number }[] } }) {
      console.log('handleSortEndhandleSortEnd', e)

      const sceneDeviceActionsFlatten = e.detail.listData
        .map((item) => {
          return {
            ...item.data,
            orderNum: item.sortKey,
          }
        })
        .sort((a, b) => a.orderNum - b.orderNum)
      this.setData({
        _isEditAction: true,
        sceneDeviceActionsFlatten,
      })
    },
    /* 执行结果拖拽相关方法 end */
    /**
     * 是否支持新的场景设置方案
     */
    isNewScenarioSettingSupported(proType: string) {
      return (
        proType === PRO_TYPE.airConditioner ||
        proType === PRO_TYPE.freshAir ||
        proType === PRO_TYPE.floorHeating ||
        proType === PRO_TYPE.centralAirConditioning ||
        proType === PRO_TYPE.light
      )
    },
    onItemClick(e: { detail: { type: string; data: unknown } }) {
      const { type, data } = e.detail
      if (type === 'actionDelete') {
        this.handleActionDelete(data as string)
      } else if (type === 'actionEdit') {
        this.handleAutoSceneActionEdit(data as string)
      }
    },
    // 检查场景名是否合法
    isSceneNameLegal(sceneName: string) {
      if (!sceneName) {
        Toast({
          message: '场景名不能为空',
          zIndex: 99999,
        })
        return false
      }
      if (checkInputNameIllegal(sceneName)) {
        Toast({
          message: '场景名称不能用特殊符号或表情',
          zIndex: 99999,
        })
        return false
      }
      if (sceneName.length > 15) {
        Toast({
          message: '场景名称不能超过15个字符',
          zIndex: 99999,
        })
        return false
      }
      return true
    },
  },
})
