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
    deviceList(data) {
      if (data.roomDeviceList) {
        return data.roomDeviceList[data.roomInfo.roomId]
      }
    },
    hasBottomPadding(data) {
      return data.roomInfo.subDeviceNum > 0 && data.roomInfo.sceneList.length > 0
    },
    desc(data) {
      if (data.sceneList && data.deviceList) {
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
      this.setData({
        sceneClickId: e.currentTarget.dataset.value,
      })
      execScene(e.currentTarget.dataset.value).then((res) => {
        console.log(res)
      })
      this.execCardBgAnimationStart(e.currentTarget.dataset.value)
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
    execCardBgAnimationStart(value: string) {
      this.animate(
        `#effect-${value}`,
        [
          {
            opacity: 0,
          },
          {
            opacity: 1,
          },
        ],
        30,
        () => {
          setTimeout(() => {
            this.execCardBgAnimationEnd(value)
          }, 30)
        },
      )
    },
    // execIconEnlargeAnimation(value: string) {
    //   console.log(`#effect-${value}-svg`)
    //   this.animate(
    //     `#effect-${value}-svg`,
    //     [
    //       {
    //         scale: [1, 1],
    //       },
    //       {
    //         scale: [1.3, 1.3],
    //       },
    //     ],
    //     60,
    //     () => {
    //       this.execIconSmallerAnimation(value)
    //     },
    //   )
    // },
    // execIconSmallerAnimation(value: string) {
    //   this.animate(
    //     `#effect-${value}-svg`,
    //     [
    //       {
    //         scale: [1.3, 1.3],
    //       },
    //       {
    //         scale: [1, 1],
    //       },
    //     ],
    //     90,
    //     () => {
    //       this.execCardBgAnimationEnd(value)
    //     },
    //   )
    // },
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
