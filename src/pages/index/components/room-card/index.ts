// pages/index/components/room-card/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { roomStore } from '../../../../store/index'
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    roomInfo: {
      type: Object,
    },
    roomName: {
      type: String,
      value: '',
    },
    lightOnNumber: {
      type: Number,
      value: 0,
    },
    sceneList: {
      type: Array,
      value: [],
    },
    showScene: {
      type: Boolean,
      value: false,
    },
  },

  computed: {
    cardList(data) {
      return data.sceneList.slice(0, 4)
    },
    hasBottomPadding(data) {
      return data.sceneList.length > 0
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
      this.execCardBgAnimationStart(e.currentTarget.dataset.value)
    },
    handleCardTap() {
      const index = roomStore.roomList.findIndex((room) => room.roomInfo.roomId === this.data.roomInfo.roomId)
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
            this.execIconEnlargeAnimation(value)
          }, 30)
        },
      )
    },
    execIconEnlargeAnimation(value: string) {
      console.log(`#effect-${value}-svg`)
      this.animate(
        `#effect-${value}-svg`,
        [
          {
            scale: [1, 1],
          },
          {
            scale: [1.3, 1.3],
          },
        ],
        60,
        () => {
          this.execIconSmallerAnimation(value)
        },
      )
    },
    execIconSmallerAnimation(value: string) {
      this.animate(
        `#effect-${value}-svg`,
        [
          {
            scale: [1.3, 1.3],
          },
          {
            scale: [1, 1],
          },
        ],
        90,
        () => {
          this.execCardBgAnimationEnd(value)
        },
      )
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
