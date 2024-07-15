import { ComponentWithComputed } from 'miniprogram-computed'
import { execScene } from '../../../../apis/scene'
// import { roomStore } from '../../../../store/index'
import { sceneImgDir } from '../../../../config/index'
import { runOnJS } from '../../../../skyline-components/common/worklet'

ComponentWithComputed({
  /**
   * 组件的属性列表
   */
  properties: {
    cardInfo: {
      type: Object,
      observer() {},
    },
    editMode: {
      type: Boolean,
      value: false,
    },
  },

  computed: {
    sceneList(data) {
      return data.cardInfo?.sceneList?.map((scene: Scene.SceneBase) => ({
        ...scene,
        sceneName: scene.sceneName.slice(0, 4),
      }))
    },
    isLargeSize(data) {
      return data.cardInfo?.sceneList?.length > 0 && !data.editMode
    },
    desc(data) {
      const { lightCount, lightOnCount } = data.cardInfo ?? {}
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
    handleSceneTap(e: WechatMiniprogram.CustomEvent<IAnyObject, IAnyObject, { index: string }>) {
      if (this.data.sceneClickId) {
        return
      }
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      const { sceneId } = this.data.cardInfo.sceneList[e.currentTarget.dataset.index]
      execScene(sceneId)

      // 交互效果
      this.setData({
        sceneClickId: sceneId,
      })

      setTimeout(() => {
        this.setData({
          sceneClickId: '',
        })
      }, 1050)
    },
    handleCardTap() {
      this.triggerEvent('cardTap', this.data.cardInfo.roomId)
      // roomStore.setCurrentRoom(this.data.cardInfo.roomId)
      // wx.navigateTo({
      //   url: '/package-room-control/index/index',
      // })
    },
    handleTapWorklet() {
      'worklet'
      // runOnJS(this.triggerEvent.bind(this))('cardTap', this.data.cardInfo.roomId)
      runOnJS(this.handleCardTap.bind(this))()
    },
    handleSceneTapWorklet(e: WechatMiniprogram.CustomEvent) {
      'worklet'
      runOnJS(this.handleSceneTap.bind(this))(e)
    },
  },
})
