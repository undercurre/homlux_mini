enum weekStr {
  Value1 = '1',
  Value2 = '2',
  Value3 = '3',
  Value4 = '4',
  Value5 = '5',
  Value6 = '6',
  Value7 = '7',
}
import { findDevice, sendDevice } from '../../apis/index'
import pageBehavior from '../../behaviors/pageBehaviors'
// import { homeBinding, homeStore, otaBinding, otaStore } from '../../store/index'
// import Toast from '@vant/weapp/toast/toast'
import { ComponentWithComputed } from 'miniprogram-computed'
// import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
// import { getEnv } from '../../config/index'
import { deviceStore, sceneStore } from '../../store/index'
import {
  // maxColorTemp, minColorTemp,
  PRO_TYPE,
} from '../../config/index'
// import Toast from '@vant/weapp/toast/toast'
import {
  // emitter,
  // getCurrentPageParams,
  // transferDeviceProperty,
  toPropertyDesc,
  transferDeviceProperty,
  // toWifiProperty,
  // storage,
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
    //设备列表
    deviceList: [] as Device.DeviceItem[],
    /** 已选中设备或场景 TODO */
    linkSelectList: [] as string[],
    cardType: 'device', //设备卡片：'device'  场景卡片： 'scene'
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
    deviceConditions: {},
    _cacheDeviceMap: {} as IAnyObject, // 缓存设备设置预览前的设备状态，用于退出时恢复
    editIndex: 1,
    /** 是否修改过action */
    _isEditAction: false,
  },

  computed: {
    list(data) {
      return data.cardType === 'device' ? data.deviceList : data.sceneList
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
    async attached() {
      await Promise.all([
        // sceneStore.updateSceneList(),
        sceneStore.updateAllRoomSceneList(),
        deviceStore.updateSubDeviceList(), // deviceStore.updateAllRoomDeviceList(),
      ])
      this.setData({
        sceneList: [...sceneStore.allRoomSceneList],
        deviceList: deviceStore.allRoomDeviceFlattenList.filter(
          (item) =>
            item.proType === PRO_TYPE.light || item.proType === PRO_TYPE.switch || item.proType === PRO_TYPE.curtain,
        ),
      })
    },
    ready() {},
    detached() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    onLoad() {
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

    changeAutoSceneName(event: WechatMiniprogram.CustomEvent) {
      console.log('changeAutoSceneName', event)

      // this.setData({
      //   sceneIcon: event.detail || '',
      // })

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
        showEffectiveTimePopup: false,
        'effectiveTime.startTime': startTime,
        'effectiveTime.endTime': endTime,
        'effectiveTime.timeType': periodType,
        'effectiveTime.timePeriod': week,
      })
    },
    /* 设置场景生效时间段 end */

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
    onConditionClicked(e: { detail: number }) {
      console.log(e.detail)
      if (!e.detail) {
        this.setData({
          showTimeConditionPopup: true,
        })
      }
      this.setData({
        showEditConditionPopup: false,
      })
    },
    /* 时间条件 start */
    handleTimeConditionClose() {
      this.setData({
        showTimeConditionPopup: false,
      })
    },
    handleTimeConditionConfirm(e: { detail: { time: string; periodType: string; week: string } }) {
      const { time, periodType, week } = e.detail
      this.setData({
        showTimeConditionPopup: false,
        'timeCondition.time': time,
        'timeCondition.timeType': periodType,
        'timeCondition.timePeriod': week,
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
    onActionClicked(e: { detail: number }) {
      console.log(e.detail)
      if (e.detail === 2) {
        this.setData({
          showDelayPopup: true,
        })
      } else if (e.detail === 1) {
        this.setData({
          cardType: 'scene',
        })
        this.handleSelectCardShow()
      } else {
        this.setData({
          cardType: 'device',
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
      this.handleActionShow()
    },
    async handleSelectCardConfirm() {
      // console.log('handleSelectCardConfirm', e)
      this.setData({
        showSelectCardPopup: false,
      })
      this.updateSceneDeviceActionsFlatten()
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
          const OnOff = item.mzgdPropertyDTOList[ep].OnOff
          const desc = toPropertyDesc(item.proType, item.mzgdPropertyDTOList[ep])
          //多路开关
          sceneDeviceActionsFlatten.push({
            uniId: item.uniId,
            name: `${item.switchInfoDTOList[0].switchName} | ${item.deviceName}`,
            type: 2,
            desc,
            pic: item.switchInfoDTOList[0].pic,
            delay: delaySec,
            proType: PRO_TYPE.switch,
            value: {
              ep,
              OnOff,
            },
          })
        } else {
          const properties = transferDeviceProperty(item.proType, item.mzgdPropertyDTOList['1'])
          const desc = toPropertyDesc(item.proType, properties)
          sceneDeviceActionsFlatten.push({
            uniId: item.uniId,
            name: item.deviceName,
            type: 2,
            desc,
            pic: item.pic as string,
            delay: delaySec,
            proType: item.proType,
            value: {
              ep: 1,
              ...properties,
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
          pic: `../../assets/img/scene/${item.sceneIcon}.png`,
          delay: delaySec,
        })
      })
      if (delaySec) {
        sceneDeviceActionsFlatten.unshift({
          uniId: 'delay',
          name: '延时',
          desc: [this.formatTime(delaySec)],
          type: 5,
          pic: '../../assets/img/automation/time.png',
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
          pic: '../../assets/img/automation/time.png',
        })
      }
      this.setData({
        sceneDeviceConditionsFlatten,
      })
    },
    handleConditionDelete(e: WechatMiniprogram.TouchEvent) {
      console.log('删除', e)
      const uniId = e.currentTarget.dataset.info.uniId

      if (uniId === 'time') {
        this.setData({
          'timeCondition.time': '',
          'timeCondition.timePeriod': '',
          'timeCondition.timeType': '',
        })
      }
      this.data.sceneDeviceConditionsFlatten.splice(e.currentTarget.dataset.index, 1)
      this.setData({
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
          editIndex: index,
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
      const actionItem = this.data.sceneDeviceActionsFlatten[this.data.editIndex]
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

      actionItem.value = {
        ...actionItem.value,
        ...e.detail,
      }

      actionItem.desc = toPropertyDesc(actionItem.proType as string, actionItem.value)

      this.setData({
        _isEditAction: true,
        sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
      })
    },
    /* 编辑设备动作弹窗 end */
  },
})
