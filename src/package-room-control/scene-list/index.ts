// package-room-control/scene-list/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceStore, homeStore, sceneBinding, sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { runInAction } from 'mobx-miniprogram'
import { execScene, updateSceneSort } from '../../apis/scene'
import { emitter } from '../../utils/eventBus'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [sceneBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    isInit: false,
    contentHeight: 0,
    isRefresh: false,
    listData: [] as IAnyObject[],
    pageMetaScrollTop: 0,
    scrollTop: 0,
  },

  computed: {
    opacity(data) {
      if (data.scrollTop) {
        return 20 - data.scrollTop < 0 ? 0 : (20 - data.scrollTop) / 20
      }
      return 1
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      this.updateSceneList()
      emitter.off('sceneEdit')
      emitter.on('sceneEdit', () => {
        this.updateSceneList()
      })
    },

    onUnload() {
      emitter.off('sceneEdit')
    },

    // 页面滚动
    onPageScroll(e: { scrollTop: number }) {
      this.setData({
        scrollTop: e.scrollTop,
      })
    },

    async updateSceneList() {
      await sceneStore.updateSceneList()
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
          return
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
        Toast('执行成功')
      } else {
        Toast('执行失败')
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

    // handleScroll(e: { detail: { scrollTop: number } }) {
    //   this.setData({
    //     pageMetaScrollTop: e.detail.scrollTop,
    //   })
    // },

    async handleSortEnd(e: { detail: { listData: Scene.SceneItem[] } }) {
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
      await updateSceneSort({ sceneSortList })
      this.updateSceneList()
      homeStore.updateRoomCardList()
    },
  },
})
