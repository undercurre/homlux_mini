// pages/index/components/room-card/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { execScene } from '../../../../apis/scene'
import { roomBinding, roomStore } from '../../../../store/index'
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
        let sceneName = scene.sceneName
        if (new RegExp('[\\u4E00-\\u9FFF]+', 'g').test(sceneName)) {
          // 名字有中文，只能显示四个
          sceneName = sceneName.slice(0, 4)
        } else {
          // 全英文，显示7个
          sceneName = sceneName.slice(0, 7)
        }
        return {
          ...scene,
          sceneName,
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
      // this.execCardBgAnimationStart(e.currentTarget.dataset.value)
    },
    handleCardTap() {
      const index = roomStore.roomList.findIndex((room) => room.roomId === this.data.roomInfo.roomId)
      runInAction(() => {
        roomStore.currentRoomIndex = index
      })
      wx.navigateTo({
        url: '/package-room-control/index/index',
      })
    },
    execCardBgAnimationStart() {
      // this.
      // this.animate(
      //   `#effect-${value}`,
      //   [
      //     {
      //       opacity: 0,
      //     },
      //     {
      //       opacity: 1,
      //     },
      //   ],
      //   30,
      //   () => {
      //     setTimeout(() => {
      //       this.execCardBgAnimationEnd(value)
      //     }, 30)
      //   },
      // )
    },
    execCardBgAnimationEnd(value: string) {
      this.animate(
        `#effect-${value}`,
        [
          {
            opacity: 1,
          },
          {
            opacity: 0,
          },
        ],
        60,
        () => {
          this.setData({
            sceneClickId: '',
          })
        },
      )
    },
  },
})
