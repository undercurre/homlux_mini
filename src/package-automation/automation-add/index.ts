enum weekStr {
  Value1 = '1',
  Value2 = '2',
  Value3 = '3',
  Value4 = '4',
  Value5 = '5',
  Value6 = '6',
  Value7 = '7',
}
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import {
  deleteScene,
  findDevice,
  //sendDevice
  addScene,
  updateScene,
} from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'
// import { homeBinding, homeStore, otaBinding, otaStore } from '../../store/index'
// import Toast from '@vant/weapp/toast/toast'
import { ComponentWithComputed } from 'miniprogram-computed'
// import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
// import { getEnv } from '../../config/index'
import { deviceStore, sceneStore, homeStore, autosceneStore } from '../../store/index'
import {
  // maxColorTemp, minColorTemp,
  PRO_TYPE,
  SENSOR_TYPE,
} from '../../config/index'
// import Toast from '@vant/weapp/toast/toast'
import {
  // emitter,
  // getCurrentPageParams,
  // transferDeviceProperty,
  toPropertyDesc,
  toWifiProperty,
  // storage,
  getCurrentPageParams,
  // strUtil,
} from '../../utils/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    _autosceneInfo: {} as AutoScene.AutoSceneItem, //待编辑的自动化
    autoSceneId: '',
    sceneIcon: 'general',
    sceneName: '',
    //场景的生效时间段
    effectiveTime: {
      timePeriod: '1,2,3,4,5,6,7', //周日-周六
      timeType: '1', //时间类型，0-仅一次，1-自定义，2-法定工作日，3-法定节假日
      startTime: '00:00',
      endTime: '23:59',
    },
    contentHeight: 0,
    showEditIconPopup: false, //展示编辑场景图标popup
    showEditConditionPopup: false, //展示添加条件popup
    showEditActionPopup: false, //展示添加执行动作popup
    showTimeConditionPopup: false, //展示时间条件popup
    showDelayPopup: false, //展示延时popup
    showEffectiveTimePopup: false, //设置场景生效时间段
    showEditPopup: '', // 要展示的编辑弹窗类型
    sceneEditTitle: '',
    sceneEditInfo: {} as IAnyObject,

    //场景和设备的组合列表
    // list: [] as (Device.DeviceItem | Scene.SceneItem)[],
    //场景列表
    sceneList: [] as Scene.SceneItem[],
    //设备列表 //除网关智慧屏和传感器
    deviceList: [] as Device.DeviceItem[],
    //传感器列表
    sensorList: [] as Device.DeviceItem[],
    /** 已选中设备或场景 TODO */
    linkSelectList: [] as string[],
    selectCardType: 'device', //设备卡片：'device'  场景卡片： 'scene'  传感器卡片：'sensor'
    showSelectCardPopup: false,
    /** 将当前场景里多路的action拍扁 */
    sceneDeviceActionsFlatten: [] as AutoScene.AutoSceneFlattenAction[],
    /** 将当前场景里多路的Condition拍扁 */
    sceneDeviceConditionsFlatten: [] as AutoScene.AutoSceneFlattenCondition[],
    //延时
    delay: [0, 0],
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

    editingSensorType: 'midea.ir.201',
    editingSensorAbility: ['有人移动'],
    editingUniId: '',
  },

  computed: {
    list(data) {
      if (data.selectCardType === 'scene') {
        return data.sceneList
      } else if (data.selectCardType === 'sensor') {
        return data.sensorList
      } else {
        return data.deviceList
      }
    },
    cardType(data) {
      return data.selectCardType === 'device' || data.selectCardType === 'sensor' ? 'device' : 'scene'
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
      if (data.effectiveTime.timeType === '0') {
        return '仅一次'
      } else if (data.effectiveTime.timeType === '2') {
        return '法定工作日'
      } else if (data.effectiveTime.timeType === '3') {
        return '法定节假日'
      } else {
        const weekMap = {
          '1': '周日',
          '2': '周一',
          '3': '周二',
          '4': '周三',
          '5': '周四',
          '6': '周五',
          '7': '周六',
        }
        const weekArr = data.effectiveTime.timePeriod.split(',') as weekStr[]
        if (weekArr.length === 7) {
          return '每天'
        }
        const newWeekArr: string[] = []
        weekArr.forEach((item) => {
          newWeekArr.push(weekMap[item])
        })
        return newWeekArr.join('、')
      }
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
  },
  lifetimes: {
    attached() {
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
    ready() {},
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async onLoad() {
      const { autosceneid } = getCurrentPageParams()
      this.setData({ autoSceneId: autosceneid })

      await Promise.all([
        sceneStore.updateAllRoomSceneList(),
        deviceStore.updateSubDeviceList(), // deviceStore.updateAllRoomDeviceList(),
      ])
      const sensorList = deviceStore.allRoomDeviceFlattenList.filter((item) => item.proType === PRO_TYPE.sensor)
      sensorList.forEach((item) => {
        if (item.productId === SENSOR_TYPE.humanSensor) {
          item.property = { Occupancy: 1 }
        } else if (item.productId === SENSOR_TYPE.doorsensor) {
          item.property = { ZoneStatus: 1 }
        } else {
          item.property = { OnOff: 1 }
        }
      })
      this.setData({
        sceneList: [...sceneStore.allRoomSceneList],
        deviceList: deviceStore.allRoomDeviceFlattenList.filter(
          (item) =>
            item.proType === PRO_TYPE.light || item.proType === PRO_TYPE.switch || item.proType === PRO_TYPE.curtain,
        ),
        sensorList,
      })

      if (autosceneid) {
        const linkSelectList = [] as string[]
        const delay = [0, 0] as number[]

        const autoSceneInfo = autosceneStore.allRoomAutoSceneList.find(
          (item) => item.sceneId === autosceneid,
        ) as AutoScene.AutoSceneItem
        console.log('autoSceneInfo', autoSceneInfo)
        console.log('typeof', typeof autoSceneInfo.deviceConditions, !autoSceneInfo.deviceConditions)

        this.data._autosceneInfo = autoSceneInfo
        this.setData({
          sceneIcon: autoSceneInfo.sceneIcon,
          sceneName: autoSceneInfo.sceneName,
          'effectiveTime.startTime': autoSceneInfo.effectiveTime.startTime.substring(0, 5),
          'effectiveTime.endTime': autoSceneInfo.effectiveTime.endTime.substring(0, 5),
          'effectiveTime.timePeriod': autoSceneInfo.effectiveTime.timePeriod,
          'effectiveTime.timeType': autoSceneInfo.effectiveTime.timeType,
        })
        // autoSceneInfo.deviceConditions = autoSceneInfo.deviceConditions || []
        // autoSceneInfo.deviceActions = autoSceneInfo.deviceActions || []
        console.log('看看', autoSceneInfo.deviceConditions, autoSceneInfo.deviceConditions.length)
        //处理执行条件
        if (autoSceneInfo.deviceConditions.length) {
          //传感器条件
          autoSceneInfo.deviceConditions.forEach((action) => {
            const index = this.data.sensorList.findIndex((item) => item.uniId === action.deviceId)
            if (index !== -1) {
              linkSelectList.push(action.deviceId)

              this.data.sensorList[index].property = {
                ...action.controlEvent[0],
              }
            } else {
              console.log('设备不存在', action)
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
        autoSceneInfo.deviceActions.forEach((action) => {
          if (action.delayTime) {
            delay[0] = Math.trunc(action.delayTime / 60)
            delay[1] = Math.trunc(action.delayTime % 60)
          }
          if (action.deviceType === 5) {
            //场景
            linkSelectList.push(action.deviceId)
          } else {
            //设备
            if (action.proType === PRO_TYPE.switch) {
              // 多路开关
              action.controlAction.forEach((ep: { OnOff: number; ep: number }) => {
                // 将当前选中编辑的场景，拍扁action加入list
                const index = this.data.deviceList.findIndex((item) => item.uniId === `${action.deviceId}:${ep.ep}`)
                if (index !== -1) {
                  linkSelectList.push(`${action.deviceId}:${ep.ep}`)
                  this.data.deviceList[index].property = {
                    ...this.data.deviceList[index].property,
                    OnOff: ep.OnOff,
                  }
                } else {
                  console.log('设备不存在', action, ep)
                }
              })
            } else {
              const index = this.data.deviceList.findIndex((item) => item.uniId === action.deviceId)
              if (index !== -1) {
                linkSelectList.push(action.deviceId)

                this.data.deviceList[index].property = {
                  ...this.data.deviceList[index].property,
                  ...action.controlAction[0],
                }
              } else {
                console.log('设备不存在', action)
              }
            }
          }
        })

        this.setData(
          {
            linkSelectList,
            delay,
            deviceList: [...this.data.deviceList],
          },
          () => {
            this.updateSceneDeviceActionsFlatten()
            this.updateSceneDeviceConditionsFlatten()
            console.log('aaa', linkSelectList)
          },
        )
      }
    },

    inputAutoSceneName(e: { detail: string }) {
      console.log('changeAutoSceneName', e)

      this.setData({
        sceneName: e.detail || '',
      })

      // this.triggerEvent('change', Object.assign({}, this.data.deviceInfo))
    },
    /* 设置自动化场景图标 start */
    handleEditIconShow() {
      this.setData({
        showEditIconPopup: true,
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
    onConditionClicked(e: { detail: string }) {
      console.log(e.detail)
      if (e.detail === 'time') {
        this.setData({
          showTimeConditionPopup: true,
        })
      } else {
        this.addSensorPopup()
      }
      this.setData({
        showEditConditionPopup: false,
      })
    },
    /* 设置场景条件弹窗 end */
    /**
     * 增加传感器做场景条件
     */
    addSensorPopup() {
      this.setData({
        selectCardType: 'sensor',
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
      this.setData({
        showEditActionPopup: true,
      })
    },
    handleActionClose() {
      this.setData({
        showEditActionPopup: false,
      })
    },
    onActionClicked(e: { detail: string }) {
      console.log(e.detail)
      if (e.detail === 'delay') {
        this.setData({
          showDelayPopup: true,
        })
      } else if (e.detail === 'scene') {
        this.setData({
          selectCardType: 'scene',
        })
        this.handleSelectCardShow()
      } else {
        this.setData({
          selectCardType: 'device',
        })
        this.handleSelectCardShow()
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
    handleDelayChange(e: { detail: number[] }) {
      console.log('handleDelayChange', e.detail)
      this.setData({
        delay: e.detail,
      })
    },
    handleDelayConfirm() {
      this.updateSceneDeviceActionsFlatten()
      this.setData({
        _isEditAction: true,
        showDelayPopup: false,
      })
    },
    /* 延时弹窗 end */

    /**
     * 弹出添加场景或设备弹窗
     * @returns
     */
    handleSelectCardShow() {
      // const switchUniId = this.data.checkedList[0]
      console.log('111')
      this.setData({
        showSelectCardPopup: true,
      })
    },
    async handleSelectCardSelect(e: { detail: string }) {
      console.log('handleSelectCardSelect', e, e.detail)

      const selectId = e.detail

      // 取消选择逻辑
      if (this.data.linkSelectList.includes(selectId)) {
        const index = this.data.linkSelectList.findIndex((id) => id === selectId)
        this.data.linkSelectList.splice(index, 1)
        this.setData({
          linkSelectList: [...this.data.linkSelectList],
        })
        return
      }

      this.setData({
        linkSelectList: [...this.data.linkSelectList, selectId],
      })
    },
    handleSelectCardClose() {
      this.setData({
        showSelectCardPopup: false,
      })
    },
    handleSelectCardReturn() {
      this.setData({
        showSelectCardPopup: false,
      })
      if (this.data.selectCardType === 'sensor') {
        this.handleConditionShow()
      } else {
        this.handleActionShow()
      }
    },
    async handleSelectCardConfirm() {
      // console.log('handleSelectCardConfirm', e)
      this.setData({
        showSelectCardPopup: false,
      })
      if (this.data.selectCardType === 'sensor') {
        this.updateSceneDeviceConditionsFlatten()
        this.setData({
          _isEditCondition: true,
        })
      } else {
        this.updateSceneDeviceActionsFlatten()
        this.setData({
          _isEditAction: true,
        })
      }
    },
    handleActionDelete(e: WechatMiniprogram.TouchEvent) {
      console.log('删除', e)
      const uniId = e.currentTarget.dataset.info.uniId
      if (this.data.linkSelectList.includes(uniId)) {
        const index = this.data.linkSelectList.findIndex((id) => id === uniId)
        this.data.linkSelectList.splice(index, 1)
        this.setData({
          linkSelectList: [...this.data.linkSelectList],
        })
      }
      if (uniId === 'delay') {
        this.setData({
          delay: [0, 0],
        })
      }
      this.data.sceneDeviceActionsFlatten.splice(e.currentTarget.dataset.index, 1)
      this.setData({
        _isEditAction: true,
        sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
      })
    },
    updateSceneDeviceActionsFlatten() {
      console.log('updateSceneDeviceActionsFlatten')
      const delaySec = this.data.delay[0] * 60 + this.data.delay[1]
      console.log('delaySec', delaySec)

      const sceneDeviceActionsFlatten = [] as AutoScene.AutoSceneFlattenAction[]

      //已选中的设备
      const deviceSelected = this.data.linkSelectList
        .map((id) => {
          return this.data.deviceList.find((item) => item.uniId === id)
        })
        .filter((item) => item !== undefined) as Device.DeviceItem[]

      //已选中的场景
      const sceneSelected = this.data.linkSelectList
        .map((id) => {
          return this.data.sceneList.find((item) => item.sceneId === id)
        })
        .filter((item) => item !== undefined) as Scene.SceneItem[]

      deviceSelected.forEach((item) => {
        if (item.proType === PRO_TYPE.switch) {
          const ep = parseInt(item.uniId.split(':')[1])
          const OnOff = item.property!.OnOff
          const desc = toPropertyDesc(item.proType, item.property!)
          //多路开关
          sceneDeviceActionsFlatten.push({
            uniId: item.uniId,
            name: `${item.switchInfoDTOList[0].switchName} | ${item.deviceName}`,
            type: item.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
            desc,
            pic: item.switchInfoDTOList[0].pic,
            proType: PRO_TYPE.switch,
            value: {
              ep,
              OnOff,
            },
          })
        } else {
          const desc = toPropertyDesc(item.proType, item.property!)
          sceneDeviceActionsFlatten.push({
            uniId: item.uniId,
            name: item.deviceName,
            type: item.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
            desc,
            pic: item.pic as string,
            proType: item.proType,
            value: {
              ep: 1,
              ...item.property,
            },
          })
        }
      })
      sceneSelected.forEach((item) => {
        sceneDeviceActionsFlatten.push({
          uniId: item.sceneId,
          name: item.sceneName,
          desc: [item.roomName],
          type: 5,
          pic: `../../assets/img/scene/${item.sceneIcon}-gray.png`,
          value: {},
        })
      })
      if (delaySec) {
        sceneDeviceActionsFlatten.unshift({
          uniId: 'delay',
          name: '延时',
          desc: [this.formatTime(delaySec)],
          type: 6,
          pic: '../../assets/img/automation/stopwatch-materialized.png',
          value: { delaySec },
        })
      }
      console.log('handleSelectCardConfirm333', this.data.sceneDeviceActionsFlatten)
      this.setData({
        sceneDeviceActionsFlatten,
      })
    },
    /* 条件方法 start */
    updateSceneDeviceConditionsFlatten() {
      const sceneDeviceConditionsFlatten = [] as AutoScene.AutoSceneFlattenCondition[]

      if (this.data.timeCondition.time !== '') {
        sceneDeviceConditionsFlatten.push({
          uniId: 'time',
          name: this.data.timeCondition.time,
          desc: [this.formatPeriodDesc(this.data.timeCondition.timeType, this.data.timeCondition.timePeriod)],
          pic: '../../assets/img/automation/time-materialized.png',
          productId: 'time',
          property: {},
          type: 6,
        })
      }

      //已选中的传感器
      const sensorSelected = this.data.linkSelectList
        .map((id) => {
          return this.data.sensorList.find((item) => item.uniId === id)
        })
        .filter((item) => item !== undefined) as Device.DeviceItem[]

      sensorSelected.forEach((item) => {
        sceneDeviceConditionsFlatten.push({
          uniId: item.uniId,
          name: item.deviceName,
          desc: toPropertyDesc(item.proType, item.property!),
          pic: item.pic,
          productId: item.productId,
          property: item.property!,
          proType: item.proType,
          type: item.deviceType as 1 | 2 | 3 | 4 | 5 | 6,
        })
      })

      this.setData({
        sceneDeviceConditionsFlatten,
      })
    },
    handleConditionDelete(e: WechatMiniprogram.TouchEvent) {
      console.log('删除', e)
      const uniId = e.currentTarget.dataset.info.uniId
      if (this.data.linkSelectList.includes(uniId)) {
        const index = this.data.linkSelectList.findIndex((id) => id === uniId)
        this.data.linkSelectList.splice(index, 1)
        this.setData({
          linkSelectList: [...this.data.linkSelectList],
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

    /**
     * 传入秒数，转化为时分秒格式
     * @param seconds
     */
    formatTime(seconds: number) {
      return `${Math.trunc(seconds / 3600) > 0 ? Math.trunc(seconds / 3600) + '小时' : ''}${
        Math.trunc((seconds % 3600) / 60) > 0 ? Math.trunc((seconds % 3600) / 60) + '分' : ''
      }${Math.trunc((seconds % 3600) % 60) > 0 ? Math.trunc((seconds % 3600) % 60) + '秒' : ''}`
    },
    formatPeriodDesc(timeType: string, timePeriod: string) {
      if (timeType === '0') {
        return '仅一次'
      } else if (timeType === '2') {
        return '法定工作日'
      } else if (timeType === '3') {
        return '法定节假日'
      } else {
        const weekMap = {
          '1': '周日',
          '2': '周一',
          '3': '周二',
          '4': '周三',
          '5': '周四',
          '6': '周五',
          '7': '周六',
        }
        const weekArr = timePeriod.split(',') as weekStr[]
        if (weekArr.length === 7) {
          return '每天'
        }
        const newWeekArr: string[] = []
        weekArr.forEach((item) => {
          newWeekArr.push(weekMap[item])
        })
        return newWeekArr.join('、')
      }
    },
    /* 传感器条件编辑 start */
    handleEditSensorClose() {
      this.setData({
        showEditSensorPopup: false,
      })
    },
    handleEditSensorConfirm(e: { detail: IAnyObject }) {
      const listEditIndex = this.data.sensorList.findIndex((item) => item.uniId === this.data.editingUniId)
      const flattenEditIndex = this.data.sceneDeviceConditionsFlatten.findIndex(
        (item) => item.uniId === this.data.editingUniId,
      )
      const listItem = this.data.sensorList[listEditIndex]

      const conditionItem = this.data.sceneDeviceConditionsFlatten[flattenEditIndex]

      conditionItem.property = {
        ...e.detail,
      }
      conditionItem.desc = toPropertyDesc(conditionItem.proType!, conditionItem.property)
      listItem.property = {
        ...e.detail,
      }
      this.setData({
        _isEditCondition: true,
        showEditSensorPopup: false,
        sceneDeviceConditionsFlatten: [...this.data.sceneDeviceConditionsFlatten],
        sensorList: [...this.data.sensorList],
      })
    },
    /* 传感器条件编辑 end */

    handleAutoSceneConditionEdit(e: WechatMiniprogram.TouchEvent) {
      const { index } = e.currentTarget.dataset
      const action = this.data.sceneDeviceConditionsFlatten[index]

      if (action.productId === 'time') {
        this.setData({
          showTimeConditionPopup: true,
        })
      } else {
        this.setData({
          editingSensorType: action.productId,
          editingSensorAbility: action.desc,
          editingUniId: action.uniId,
          showEditSensorPopup: true,
        })
      }
    },

    /**
     * 编辑场景延时/设备动作结果
     * @param e
     * @returns
     */
    handleAutoSceneActionEdit(e: WechatMiniprogram.TouchEvent) {
      const { index } = e.currentTarget.dataset
      const action = this.data.sceneDeviceActionsFlatten[index]
      console.log('handleAutoSceneActionEdit', action)
      if (action.uniId === 'delay') {
        this.setData({
          showDelayPopup: true,
        })
      } else {
        const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
        const device = allRoomDeviceMap[action.uniId]
        console.log('device', device)
        let ep = 1

        if (action.proType === PRO_TYPE.switch) {
          ep = Number(device.switchInfoDTOList[0].switchId)
        }

        device.deviceType === 2 && findDevice({ gatewayId: device.gatewayId, devId: device.deviceId, ep })

        this.setData({
          sceneEditTitle: action.name,
          sceneEditInfo: {
            ...action.value,
            deviceType: device.deviceType,
            gatewayId: device.gatewayId,
            deviceId: device.deviceId,
          },
          showEditPopup: device.proType,
          editingUniId: action.uniId,
        })
      }
    },
    /* 编辑设备动作弹窗 start */
    handleEditPopupClose() {
      this.setData({
        showEditPopup: '',
      })
    },
    handleSceneEditConfirm(e: { detail: IAnyObject }) {
      const { _cacheDeviceMap } = this.data
      const listEditIndex = this.data.deviceList.findIndex((item) => item.uniId === this.data.editingUniId)
      const flattenEditIndex = this.data.sceneDeviceActionsFlatten.findIndex(
        (item) => item.uniId === this.data.editingUniId,
      )
      const listItem = this.data.deviceList[listEditIndex]
      const actionItem = this.data.sceneDeviceActionsFlatten[flattenEditIndex]
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
          ep: actionItem.value?.ep,
          property: oldProperty,
        }
      }
      listItem.property = {
        ...listItem.property,
        ...e.detail,
      }

      actionItem.value = {
        ...actionItem.value,
        ...e.detail,
      }

      actionItem.desc = toPropertyDesc(actionItem.proType as string, actionItem.value)

      this.setData({
        _isEditAction: true,
        sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
        deviceList: [...this.data.deviceList],
      })
    },

    async handleSave() {
      if (
        this.data.autoSceneId &&
        (this.data.sceneDeviceActionsFlatten.length === 0 || this.data.sceneDeviceConditionsFlatten.length === 0)
      ) {
        // 删完actions或conditions按照删除场景处理
        const res = await Dialog.confirm({
          message: '清空条件或操作将会删除场景，确定删除该场景？',
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
      if (!this.data.sceneName) {
        Toast({
          message: '场景名不能为空',
          zIndex: 99999,
        })
        return
      }
      if (this.data.sceneName.length > 15) {
        Toast({
          message: '场景名称不能超过15个字符',
          zIndex: 99999,
        })
        return
      }

      // this.setData({
      //   isAddingScene: true,
      // })

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

      // storage.set('autoscene_data', newSceneData)
      // storage.set('autosceneDeviceActionsFlatten', this.data.sceneDeviceActionsFlatten)
      // storage.set('autosceneDeviceConditionsFlatten', this.data.sceneDeviceConditionsFlatten)

      // this.setData({
      //   isAddingScene: false,
      // })

      // wx.navigateTo({
      //   url: '/package-automation/automation-request-list/index',
      // })

      // 处理发送请求的deviceActions字段数据
      const deviceMap = deviceStore.allRoomDeviceMap
      // switch需要特殊处理
      const switchDeviceMap = {} as Record<string, IAnyObject[]>
      let delaySec = 0
      this.data.sceneDeviceActionsFlatten.forEach((action) => {
        if (action.uniId === 'delay') {
          delaySec = action.value.delaySec
        } else {
          const device = deviceMap[action.uniId] || deviceMap[action.uniId.split(':')[0]]

          if (device) {
            if (action.proType === PRO_TYPE.switch) {
              const deviceId = action.uniId.split(':')[0]
              if (switchDeviceMap[deviceId]) {
                switchDeviceMap[deviceId].push(action.value)
              } else {
                switchDeviceMap[deviceId] = [action.value]
              }
            } else {
              const property = action.value
              let ctrlAction = {} as IAnyObject

              if (device.deviceType === 2) {
                ctrlAction.ep = 1
              }

              if (device.proType === PRO_TYPE.light) {
                ctrlAction.OnOff = property.OnOff

                if (property.OnOff === 1) {
                  ctrlAction.ColorTemp = property.ColorTemp
                  ctrlAction.Level = property.Level
                }

                if (device.deviceType === 3) {
                  ctrlAction = toWifiProperty(device.proType, ctrlAction)
                }
              } else if (device.proType === PRO_TYPE.curtain) {
                ctrlAction.curtain_position = property.curtain_position
              }

              newSceneData?.deviceActions?.push({
                controlAction: [ctrlAction],
                deviceId: action.uniId,
                deviceType: device.deviceType,
                proType: device.proType,
              })
            }
          } else {
            //场景
            newSceneData?.deviceActions?.push({
              controlAction: [],
              deviceId: action.uniId,
              deviceType: action.type,
            })
          }
        }
      })

      // 再将switch放到要发送的数据里面
      newSceneData?.deviceActions?.push(
        ...Object.entries(switchDeviceMap).map(([deviceId, actions]) => ({
          controlAction: actions,
          deviceId: deviceId,
          deviceType: deviceMap[deviceId].deviceType,
          proType: deviceMap[deviceId].proType,
        })),
      )
      //是否有延时操作
      if (delaySec !== 0) {
        newSceneData.deviceActions.forEach((item) => {
          item.delayTime = delaySec
        })
      }

      //处理发送请求的deviceConditions字段数据
      this.data.sceneDeviceConditionsFlatten.forEach((action) => {
        const device = deviceMap[action.uniId]
        if (device) {
          newSceneData?.deviceConditions?.push({
            controlEvent: [{ ep: 1, ...action.property }],
            deviceId: action.uniId,
          })
        }
      })

      console.log('创建更新自动化', newSceneData)
      const promise = this.data.autoSceneId
        ? updateScene(newSceneData as AutoScene.AddAutoSceneDto)
        : addScene(newSceneData as AutoScene.AddAutoSceneDto)

      const res = await promise
      if (!res.success) {
        Toast({
          message: this.data.autoSceneId ? '更新失败' : '创建失败',
        })
      } else {
        autosceneStore.updateAllRoomAutoSceneList()
        Toast({
          message: this.data.autoSceneId ? '更新成功' : '创建成功',
          onClose: () => {
            wx.navigateBack()
          },
        })
      }
    },
    async handleAutoSceneDelete() {
      const res = await Dialog.confirm({
        message: '确定删除该自动化？',
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
    },
  },
})
