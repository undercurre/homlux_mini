// package-room-control/scene-list/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceStore, sceneBinding, sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { runInAction } from 'mobx-miniprogram'
import { execScene } from '../../apis/scene'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [sceneBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    contentHeight: 0,
  },

  computed: {
    sceneListWithLinkName(data) {
      if (data.sceneList) {
        const deviceMap = deviceStore.deviceMap
        return data.sceneList.map((scene: Scene.SceneItem) => {
          if (scene.deviceConditions?.length > 0) {
            const device = deviceMap[scene.deviceConditions[0].deviceId]
            const switchName = device.switchInfoDTOList.find(
              (switchItem) => switchItem.switchId === scene.deviceConditions[0].controlEvent[0].ep.toString(),
            )?.switchName
            return {
              ...scene,
              linkName: `${device.deviceName?.slice(0, 5)}${switchName?.slice(0, 4)} | ${device.roomName}`,
            }
          }
          return {
            ...scene,
            linkName: '',
          }
        })
      }
      return []
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
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
      sceneStore.updateSceneList()
    },

    async onPullDownRefresh() {
      await sceneStore.updateSceneList()
      wx.stopPullDownRefresh()
    },

    async handleExecScene(e: { currentTarget: { dataset: { info: { sceneId: string } } } }) {
      const res = await execScene(e.currentTarget.dataset.info.sceneId)
      if (res.success) {
        wx.showToast({
          icon: 'success',
          title: '执行成功',
        })
      } else {
        wx.showToast({
          icon: 'error',
          title: '执行失败',
        })
      }
    },

    toSetting(e: { currentTarget: { dataset: { index: number } } }) {
      console.log(e.currentTarget.dataset.index)
      runInAction(() => {
        sceneStore.selectSceneIndex = e.currentTarget.dataset.index
      })
      wx.navigateTo({
        url: '/package-room-control/scene-edit/index',
      })
    },
  },
})
