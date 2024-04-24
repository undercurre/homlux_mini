import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { autosceneStore, deviceStore, homeStore, roomStore, sceneStore } from '../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { strUtil } from '../../utils/strUtil'
import { setAutoSceneEnabled, updateSceneSort } from '../../apis/index'
import { emitter, getCurrentPageParams } from '../../utils/index'
import { sceneImgDir, defaultImgDir } from '../../config/index'

ComponentWithComputed({
  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    tabIndex: 0, // 0-一键场景,1-自动场景
    // 用于存储一键场景列表
    listData: [] as IAnyObject[],
    sceneImgDir,
    defaultImgDir,
    allRoomScene: {} as Record<string, Scene.SceneListItem[]>, // 一键场景
    autoSceneList: [] as AutoScene.AutoSceneItem[], //自动场景

    urls: {
      sceneLog: '/package-automation/automation-log/index',
      sceneEdit: '/package-automation/automation-add/index',
    },
    scrollInfo: {
      scrollTop: 0,
      topSize: 0,
      bottomSize: 0,
    },

    selectedRoomId: '',
  },
  computed: {
    roomTab() {
      const tempRoomList = roomStore.roomList.map((item) => {
        return {
          roomId: item.roomId,
          roomName: item.roomName,
        }
      })
      return tempRoomList
    },
  },
  lifetimes: {
    attached() {
      // 加载一键场景列表
      this.getSceneList()
      // 加载自动化列表
      this.getAutoSceneList()
    },
    ready() {
      this.createSelectorQuery()
        .select('#ScrollView')
        .boundingClientRect()
        .exec((res) => {
          console.log('createSelectorQuery', res)
          if (!res || !res[0]) {
            return
          }
          this.setData({
            'scrollInfo.topSize': res[0].top,
            'scrollInfo.bottomSize': res[0].bottom,
          })
        })

      // 监听场景修改，主动更新一键场景列表
      emitter.off('sceneEdit')
      emitter.on('sceneEdit', () => {
        sceneStore.updateAllRoomSceneList().then(() => {
          this.getSceneList()
        })
      })
    },
  },
  methods: {
    async getSceneList() {
      await sceneStore.updateAllRoomSceneList()
      this.updateSceneList()
    },
    async getAutoSceneList() {
      await autosceneStore.updateAllRoomAutoSceneList()
      this.setData({
        autoSceneList: autosceneStore.allRoomAutoSceneListComputed,
      })
    },
    // 场景类型变更
    handleSceneType(e: { detail: { checkedIndex: number } }) {
      this.setData({
        tabIndex: e.detail.checkedIndex,
      })
    },
    // 默认不允许滑动切换，但切换过程中能中断自动滑动并触发手动滑动，该方法为手动滑动切换时使用的方法
    onTabChanged(e: { detail: { current: number; source: string } }) {
      const { current, source = '' } = e.detail
      if (source === 'touch') {
        this.setData({
          tabIndex: current,
        })
      }
    },
    onRoomChange(event: { detail: { name: string } }) {
      this.setData(
        {
          selectedRoomId: event.detail.name,
        },
        () => {
          const { allRoomScene, selectedRoomId } = this.data
          // 防止场景为空，drag为null·
          if (allRoomScene[selectedRoomId] && allRoomScene[selectedRoomId].length) {
            const drag = this.selectComponent('#yijian')
            if (drag) drag.init()
          }
        },
      )
    },

    updateSceneList() {
      const allRoomScene = {} as Record<string, Scene.SceneListItem[]>
      const deviceMap = deviceStore.allRoomDeviceMap

      sceneStore.allRoomSceneList.forEach((scene) => {
        let linkName = ''
        if (scene.deviceConditions?.length > 0) {
          const device = deviceMap[scene.deviceConditions[0].deviceId]
          const switchName = device.switchInfoDTOList.find(
            (switchItem) => switchItem.switchId === scene.deviceConditions[0].controlEvent[0].modelName.toString(),
          )?.switchName

          linkName = `${switchName} | ${device.deviceName}`
        }
        if (allRoomScene[scene.roomId]) {
          allRoomScene[scene.roomId].push({
            ...scene,
            dragId: scene.sceneId,
            linkName,
          })
        } else {
          allRoomScene[scene.roomId] = [
            {
              ...scene,
              dragId: scene.sceneId,
              linkName,
            },
          ]
        }
      })
      // 对allRoomScene里每个roomId的sceneList根据orderNum进行排序
      Object.keys(allRoomScene).forEach((roomId) => {
        allRoomScene[roomId].sort((a, b) => a.orderNum - b.orderNum)
      })
      this.setData(
        {
          allRoomScene,
        },
        () => {
          if (this.data.selectedRoomId) return
          // 在房间里跳转到场景页时使用
          const { selectedRoomId = '' } = getCurrentPageParams()
          this.setData(
            {
              selectedRoomId: selectedRoomId || this.data.roomTab[0]?.roomId || '',
            },
            () => {
              this.onRoomChange({ detail: { name: this.data.selectedRoomId } })
            },
          )
        },
      )
    },
    toPage(e: { currentTarget: { dataset: { url: string } } }) {
      if (e.currentTarget.dataset.url.includes('automation-add/index') && !homeStore.isManager) {
        Toast('仅创建者与管理员可创建场景')
        return
      }
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    },

    async handleSortEnd(e: { detail: { listData: { sortKey: number; id: string }[] } }) {
      const { allRoomScene, selectedRoomId } = this.data
      // 筛选出与原顺序不一样的项发送更新
      const sceneSortKeyMap = new Map()
      for (const item of e.detail.listData) {
        sceneSortKeyMap.set(item.id, item.sortKey)
      }
      const sceneSortList = []
      for (const scene of allRoomScene[selectedRoomId]) {
        const sortKey = sceneSortKeyMap.get(scene.sceneId)
        if (sortKey !== undefined && scene.orderNum !== sortKey) {
          sceneSortList.push({ orderNum: sortKey, sceneId: scene.sceneId })
        }
      }
      if (sceneSortList.length === 0) {
        return
      }
      const res = await updateSceneSort({ sceneSortList })
      if (!res.success) return

      // 重置本地allRoomScene里的顺序
      const tempList = allRoomScene[selectedRoomId]
      tempList.forEach((item) => {
        item.orderNum = sceneSortKeyMap.get(item.sceneId)
      })
      allRoomScene[selectedRoomId].sort((a, b) => a.orderNum - b.orderNum)
      this.setData({
        [`allRoomScene.${selectedRoomId}`]: tempList,
      })
      // 应该是非必要，先注释
      // await sceneStore.updateAllRoomSceneList()
      // 重置首页卡片的场景顺序
      homeStore.updateRoomCardList()
    },

    async changeAutoSceneEnabled(e: { currentTarget: { dataset: { isenabled: '0' | '1'; sceneid: string } } }) {
      if (!homeStore.isManager) {
        Toast('您当前身份为访客，无法编辑场景')
        return
      }
      const { isenabled, sceneid } = e.currentTarget.dataset
      const isEnabled = isenabled === '0' ? '1' : '0'
      const res = await setAutoSceneEnabled({ sceneId: sceneid, isEnabled })
      if (res.success) {
        ;(this.data.autoSceneList.find((scene) => scene.sceneId === sceneid) as AutoScene.AutoSceneItem).isEnabled =
          isEnabled
        this.setData({
          autoSceneList: [...this.data.autoSceneList],
        })
      }
    },
    toEditAutoScene(e: { currentTarget: { dataset: { autosceneid: string } } }) {
      if (homeStore.isManager) {
        const { autosceneid } = e.currentTarget.dataset

        wx.navigateTo({
          url: strUtil.getUrlWithParams(this.data.urls.sceneEdit, { autosceneid }),
        })
      } else {
        Toast('您当前身份为访客，无法编辑场景')
      }
    },
    toEditYijianScene(e: { currentTarget: { dataset: { sceneid: string } } }) {
      if (homeStore.isManager) {
        const { sceneid } = e.currentTarget.dataset
        wx.navigateTo({
          url: strUtil.getUrlWithParams(this.data.urls.sceneEdit, {
            yijianSceneId: sceneid,
            roomid: roomStore.currentRoomId,
          }),
        })
      } else {
        Toast('您当前身份为访客，无法编辑场景')
      }
    },
    handleScroll(e: { detail: { scrollTop: number } }) {
      this.setData({
        'scrollInfo.scrollTop': e.detail.scrollTop,
      })
    },
    //阻止事件冒泡
    stopPropagation() {},

    onUnload() {
      emitter.off('sceneEdit')
    },
  },
})
