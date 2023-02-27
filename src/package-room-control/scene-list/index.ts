// package-room-control/scene-list/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding, sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { runInAction } from 'mobx-miniprogram'
import { execScene } from '../../apis/scene'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    contentHeight: 0,
  },

  computed: {
    sceneList(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return data.roomList[data.currentRoomIndex].sceneList
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

    async handleCollect(e: { currentTarget: { dataset: { info: { sceneId: string } } } }) {
      const res = await execScene(e.currentTarget.dataset.info.sceneId)
      if (res.success) {
        wx.showToast({
          icon: 'success',
          title: '执行成功'
        })
      } else {
        wx.showToast({
          icon: 'error',
          title: '执行失败'
        })
      }
    },

    toSetting(e: { currentTarget: { dataset: { info: Scene.SceneItem } } }) {
      runInAction(() => {
        sceneStore.selectScene = {
          ...e.currentTarget.dataset.info,
        }
      })
      wx.navigateTo({
        url: '/package-room-control/scene-edit/index',
      })
      console.log(e.currentTarget.dataset.info)
    },
  },
})
