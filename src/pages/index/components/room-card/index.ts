import { ComponentWithComputed } from 'miniprogram-computed'
import { execScene } from '../../../../apis/scene'
import { roomStore } from '../../../../store/index'
import { sceneImgDir } from '../../../../config/index'

ComponentWithComputed({
  /**
   * 组件的属性列表
   */
  properties: {
    roomInfo: {
      type: Object,
      observer() {},
    },
    isMoving: {
      type: Boolean,
      value: false,
    },
    roomLightSummary: {
      type: Object,
    },
  },

  computed: {
    showScene(data) {
      return !data.isMoving
    },
    sceneList(data) {
      return data.roomInfo.sceneList.map((scene: Scene.SceneBase) => {
        return {
          ...scene,
          sceneName: scene.sceneName.slice(0, 4),
        }
      })
    },
    hasBottomPadding(data) {
      return data.roomInfo.sceneList.length > 0 && !data.isMoving
    },
    desc(data) {
      const { lightCount, lightOnCount } = data.roomLightSummary ?? {}
      return lightOnCount ? `${lightOnCount}盏灯亮起` : lightCount > 0 ? '灯全部关闭' : ''
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sceneImgDir,
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
      roomStore.setCurrentRoom(this.data.roomInfo.roomId)

      wx.navigateTo({
        url: '/package-room-control/index/index',
      })
    },
    doNothing() {},
  },
})
