// package-room-control/scene-list/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceStore, sceneBinding, sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { runInAction } from 'mobx-miniprogram'
import { execScene, updateSceneSort } from '../../apis/scene'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [sceneBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    contentHeight: 0,
    isRefresh: false,
    listData: [] as IAnyObject[],
    pageMetaScrollTop: 0,
    scrollTop: 0,
  },

  watch: {
    sceneList() {
      if (sceneStore.sceneList) {
        const listData = [] as IAnyObject[]
        const deviceMap = deviceStore.deviceMap
        sceneStore.sceneList.forEach((scene: Scene.SceneItem) => {
          if (scene.deviceConditions?.length > 0) {
            const device = deviceMap[scene.deviceConditions[0].deviceId]
            const switchName = device.switchInfoDTOList.find(
              (switchItem) => switchItem.switchId === scene.deviceConditions[0].controlEvent[0].ep.toString(),
            )?.switchName
            listData.push({
              ...scene,
              dragId: scene.sceneId,
              linkName: `${device.deviceName?.slice(0, 5)}${switchName?.slice(0, 4)} | ${device.roomName}`,
            })
          }
          listData.push({
            ...scene,
            dragId: scene.sceneId,
            linkName: '',
          })
        })
        this.setData({
          listData,
        })
        const drag = this.selectComponent('#drag')
        drag.init()
      }
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      sceneStore.updateSceneList()
    },

    // 页面滚动
    onPageScroll(e: { scrollTop: number }) {
      this.setData({
        scrollTop: e.scrollTop,
      })
    },

    async onPullDownRefresh() {
      try {
        await sceneStore.updateSceneList()
      } finally {
        this.setData({
          isRefresh: false,
        })
      }
      wx.stopPullDownRefresh()
    },

    async handleExecScene(e: { detail: Scene.SceneItem }) {
      // console.log('handleExecScene', e)
      const res = await execScene(e.detail.sceneId)
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

    toSetting(e: { detail: Scene.SceneItem }) {
      console.log('toSetting', e)
      const index = sceneStore.sceneList.findIndex((scene) => scene.sceneId === e.detail.sceneId)
      runInAction(() => {
        sceneStore.selectSceneIndex = index
      })
      wx.navigateTo({
        url: '/package-room-control/scene-edit/index',
      })
    },

    // handleChange(e) {
    //   console.log('handleChange', e)
    // },

    handleScroll(e: { detail: { scrollTop: number } }) {
      this.setData({
        pageMetaScrollTop: e.detail.scrollTop,
      })
    },

    handleSortEnd(e: { detail: { listData: Scene.SceneItem[] } }) {
      console.log('handleSortEnd', e)
      const sceneSortList = [] as { orderNum: number; sceneId: string }[]
      e.detail.listData.forEach((item, index) => {
        if (item.orderNum != index) {
          sceneSortList.push({
            orderNum: index,
            sceneId: item.sceneId,
          })
        }
      })
      updateSceneSort({ sceneSortList })
    },
  },
})
