import { storage } from '../../utils/storage'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { autosceneBinding, deviceStore, roomStore, sceneBinding, sceneStore, userBinding } from '../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { strUtil } from '../../utils/strUtil'
import { execScene } from '../../apis/index'
import { emitter } from '../../utils/index'
import { sceneImgDir, defaultImgDir } from '../../config/index'
// import { reaction } from 'mobx-miniprogram'
// import { emitter } from '../../utils/index'

// pages/login/index.ts
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [autosceneBinding, userBinding] }), pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    sceneImgDir,
    defaultImgDir,
    editBack: false,
    hasAutoScene: true,
    // autoSceneList: [] as AutoScene.AutoSceneItem[],

    urls: {
      automationLogYijian: '/package-automation/automation-log/index',
      automationAddYijian: '/package-automation/automation-add/index',
      automationEditYijian: '/package-automation/automation-edit-yijian/index',
      automationLog: '/package-automation/automation-log/index',
      automationAdd: '/package-automation/automation-add/index',
    },
    // 导航栏和状态栏高度
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    tabClientTop:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      31 +
      32 +
      'px',
    // 当前为一键场景/自动场景
    isYijian: true,
    active: 1,
    scrollTop: 0,
    selectedRoomId: 'all',
  },
  computed: {
    allRoomYijianSceneListComputed() {
      return sceneStore.allRoomSceneList
        .filter((item) => item !== null)
        .map((item) => {
          return {
            desc: '描述',
            sceneIcon: 'icon-1',
            sceneId: item.sceneId,
            sceneName: item.sceneName,
            isEnabled: true,
          }
        })
    },
    roomYijianSceneListComputed(data) {
      const listData = [] as IAnyObject[]
      const deviceMap = deviceStore.allRoomDeviceMap

      sceneStore.allRoomSceneList.forEach((scene: Scene.SceneItem) => {
        let linkName = ''
        if (scene.deviceConditions?.length > 0) {
          const device = deviceMap[scene.deviceConditions[0].deviceId]
          const switchName = device.switchInfoDTOList.find(
            (switchItem) => switchItem.switchId === scene.deviceConditions[0].controlEvent[0].modelName.toString(),
          )?.switchName

          linkName = `${switchName} | ${device.deviceName}`
        }

        listData.push({
          ...scene,
          dragId: scene.sceneId,
          linkName,
          sceneIcon: scene.sceneIcon,
        })
      })

      function getDesc(data: IAnyObject) {
        if (data.linkName) {
          return '已关联：' + data.linkName
        }
        return '暂未关联开关'
      }

      function getSceneName(data: IAnyObject) {
        if (data?.sceneName?.length && data?.sceneName?.length > 10) {
          return data.sceneName.slice(0, 8) + '...'
        } else {
          return data.sceneName
        }
      }

      if (data.editBack) {
        data.editBack = false
      }

      if (data.selectedRoomId === 'all') {
        return listData.map((item) => {
          return {
            ...item,
            desc: getDesc(item),
            sceneName: getSceneName(item),
          }
        })
      }
      return listData
        .filter((item) => item.roomId === data.selectedRoomId)
        .map((item) => {
          return {
            ...item,
            desc: getDesc(item),
            sceneName: getSceneName(item),
          }
        })
    },
    roomTab() {
      const tempRoomList = roomStore.roomList.map((item) => {
        return {
          roomId: item.roomId,
          roomName: item.roomName,
        }
      })
      tempRoomList.unshift({
        roomId: 'all',
        roomName: '全屋',
      })
      return tempRoomList
    },
  },
  methods: {
    onPageScroll(e: { scrollTop: number }) {
      this.setData({
        scrollTop: e.scrollTop,
      })
    },
    onYijianRoomChange(event: { detail: { name: string } }) {
      this.setData({
        selectedRoomId: event.detail.name,
      })
    },
    onLoad() {
      // 更新tabbar状态
      // if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      //   this.getTabBar().setData({
      //     selected: 1,
      //   })
      // }
      // 监听houseId变化，重新请求对应家庭的自动化列表
      // reaction(
      //   () => homeStore.currentHomeDetail.houseId,
      //   () => {
      //     autosceneBinding.store.updateAllRoomAutoSceneList()
      //   },
      // )
      // emitter.on('scene_add', () => {
      //   autosceneBinding.store.updateAllRoomAutoSceneList()
      // })
      // emitter.on('scene_del', () => {
      //   autosceneBinding.store.updateAllRoomAutoSceneList()
      // })
      // emitter.on('scene_upt', () => {
      //   autosceneBinding.store.updateAllRoomAutoSceneList()
      // })
      // emitter.on('scene_enabled', () => {
      //   autosceneBinding.store.updateAllRoomAutoSceneList()
      // })
      // 加载一键场景列表
      sceneBinding.store.updateAllRoomSceneList()
      // 加载自动化列表
      autosceneBinding.store.updateAllRoomAutoSceneList()
    },
    // onShow() {

    // },
    // onUnload() {
    //   emitter.off('scene_add')
    //   emitter.off('scene_del')
    //   emitter.off('scene_upt')
    //   emitter.off('scene_enabled')
    // },
    toPage(e: { currentTarget: { dataset: { url: string } } }) {
      wx.navigateTo({
        url: e.currentTarget.dataset.url,
      })
    },

    async execYijianScene(e: { detail: Scene.SceneItem }) {
      const res = await execScene(e.detail.sceneId)
      if (res.success) {
        Toast('执行成功')
      } else {
        Toast('执行失败')
      }
    },

    changeAutoSceneEnabled(e: { currentTarget: { dataset: { isenabled: '0' | '1'; sceneid: string } } }) {
      const { isenabled, sceneid } = e.currentTarget.dataset
      const isEnabled = isenabled === '0' ? '1' : '0'
      autosceneBinding.store.changeAutoSceneEnabled({ sceneId: sceneid, isEnabled })
    },
    toEditAutoScene(e: { currentTarget: { dataset: { autosceneid: string } } }) {
      const { autosceneid } = e.currentTarget.dataset

      wx.navigateTo({
        url: strUtil.getUrlWithParams(this.data.urls.automationAdd, { autosceneid }),
      })
    },
    toEditYijianScene(e: { currentTarget: { dataset: { sceneid: string } } }) {
      const { sceneid } = e.currentTarget.dataset

      wx.navigateTo({
        url: strUtil.getUrlWithParams(this.data.urls.automationEditYijian, { yijianSceneId: sceneid }),
      })
    },
    //阻止事件冒泡
    stopPropagation() {},

    // 场景类型变更
    handleSceneType() {
      this.setData({
        // 修改switch标记
        isYijian: !this.data.isYijian,
        // 修改按钮的地址
        automationLog: !this.data.isYijian
          ? '/package-automation/automation-log/index'
          : '/package-automation/automation-log/index',
        automationAdd: !this.data.isYijian
          ? '/package-automation/automation-add-yijian/index'
          : '/package-automation/automation-add/index',
      })
    },
    onUnload() {
      emitter.off('sceneEdit')
    },
  },
  lifetimes: {
    ready() {
      emitter.off('sceneEdit')
      emitter.on('sceneEdit', () => {
        sceneBinding.store.updateAllRoomSceneList().then(() => (this.data.editBack = true))
      })
    },
  },
})
