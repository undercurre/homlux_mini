// pages/index/components/room-card/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { execScene } from '../../../../apis/scene'
import { proType } from '../../../../config/index'
import { deviceStore, roomBinding, roomStore } from '../../../../store/index'
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    roomInfo: {
      type: Object,
      observer() {},
    },
  },

  computed: {
    showScene(data) {
      return data.roomInfo.subDeviceNum > 0
    },
    sceneList(data) {
      return data.roomInfo.sceneList.map((scene: Scene.SceneBase) => {
        return {
          ...scene,
          sceneName: scene.sceneName.slice(0, 4),
        }
      })
    },
    deviceListComputed(data) {
      if (data.roomDeviceList && data.roomInfo && data.roomInfo.roomId) {
        return data.roomDeviceList[data.roomInfo.roomId] ?? []
      }
      return []
    },
    hasBottomPadding(data) {
      return data.roomInfo.subDeviceNum > 0 && data.roomInfo.sceneList.length > 0
    },
    desc(data) {
      if (data.sceneList && data.deviceListComputed) {
        return data.roomInfo.deviceLightOnNum
          ? data.roomInfo.deviceLightOnNum + '盏灯亮起'
          : data.roomInfo.subDeviceNum > 0
          ? '灯全部关闭'
          : ''
      }
      return ''
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sceneClickId: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleSceneTap(e: { currentTarget: { dataset: { value: string } } }) {
      if (this.data.sceneClickId) {
        return
      }
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      this.setData({
        sceneClickId: e.currentTarget.dataset.value,
      })
      setTimeout(() => {
        this.setData({
          sceneClickId: '',
        })
      }, 1050)
      execScene(e.currentTarget.dataset.value)
    },
    handleCardTap() {
      const index = roomStore.roomList.findIndex((room) => room.roomId === this.data.roomInfo.roomId)
      runInAction(() => {
        roomStore.currentRoomIndex = index
        deviceStore.deviceList = deviceStore.allRoomDeviceList.filter(
          (device) =>
            device.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId &&
            device.proType !== proType.gateway,
        )
      })
      wx.navigateTo({
        url: '/package-room-control/index/index',
      })
    },
  },
})
