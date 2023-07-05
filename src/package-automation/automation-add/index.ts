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
    isLoading: false,
    contentHeight: 0,
    showEditIconPopup: false,
    showEditConditionPopup: false, //展示添加条件popup
    showEditActionPopup: false, //展示添加执行动作popup
    showPeriodPopup: false, //展示周期popup
    showDelayPopup: false, //展示延时popup
    showEffectiveTimePopup: false, //设置场景生效时间段
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
    //延时
    delay: [0, 0],
    //场景的生效时间段
    effectiveTime: {
      timePeriod: '',
      timeType: '1', //时间类型，0-仅一次，1-自定义，2-法定工作日，3-法定节假日
      startTime: '00:00:00',
      endTime: '23:59:59',
    },
  },

  computed: {
    list(data) {
      return data.cardType === 'device' ? data.deviceList : data.sceneList
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
    handleEffectiveTimeConfirm() {
      // console.log('handleEffectiveTimeConfirm', e)
      this.setData({
        showEffectiveTimePopup: false,
      })
    },
    /* 设置场景生效时间段 start */

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
          showPeriodPopup: true,
        })
      }
      this.setData({
        showEditConditionPopup: false,
      })
    },
    handlePeriodClose() {
      this.setData({
        showPeriodPopup: false,
      })
    },
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
          //多路开关
          sceneDeviceActionsFlatten.push({
            uniId: item.uniId,
            name: `${item.switchInfoDTOList[0].switchName} | ${item.deviceName}`,
            type: 2,
            desc: toPropertyDesc(item.proType, item.property as IAnyObject),
            pic: item.switchInfoDTOList[0].pic,
            delay: delaySec,
          })
        } else {
          sceneDeviceActionsFlatten.push({
            uniId: item.uniId,
            name: item.deviceName,
            type: 2,
            desc: toPropertyDesc(item.proType, item.property as IAnyObject),
            pic: item.pic as string,
            delay: delaySec,
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
    /**
     * 传入秒数，转化为时分秒格式
     * @param seconds
     */
    formatTime(seconds: number) {
      return `${Math.trunc(seconds / 3600) > 0 ? Math.trunc(seconds / 3600) + '小时' : ''}${
        Math.trunc((seconds % 3600) / 60) > 0 ? Math.trunc((seconds % 3600) / 60) + '分' : ''
      }${Math.trunc((seconds % 3600) % 60) > 0 ? Math.trunc((seconds % 3600) % 60) + '秒' : ''}`
    },
  },
})
