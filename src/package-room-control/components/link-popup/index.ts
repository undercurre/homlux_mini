import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding, roomBinding, roomStore } from '../../../store/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    /**
     * 展示的列表
     * linkType 是 switch light 传入 Device.DeviceItem[]
     * linkType 是 scene 传入 Scene.SceneItem[]
     */
    list: {
      type: Array,
    },
    /**
     * 选中的设备的uniId
     * 灯：deviceId ；开关：deviceId:switchId
     */
    selectList: {
      type: Array,
    },
    /**
     * 选中的场景id
     */
    selectSceneId: {
      type: String,
    },
    show: {
      type: Boolean,
      value: false,
      observer(val) {
        if (val) {
          setTimeout(() => {
            this.getHeight()
          }, 100)
        }
        if (roomStore.roomList.length > 0) {
          if (!this.data.roomSelect) {
            this.setData({
              roomSelect: roomStore.roomList[0].roomId,
            })
          }
        }
      },
    },
    /** 展示类型：light switch scene */
    linkType: {
      type: String,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    contentHeight: 0,
    roomSelect: '',
  },

  computed: {
    title(data) {
      if (data.linkType === 'light') {
        return '关联智能灯'
      } else if (data.linkType === 'switch') {
        return '关联智能开关'
      } else if (data.linkType === 'scene') {
        return '关联场景'
      }
      return ''
    },
    deviceListMatrix(data: { list: Device.DeviceItem[]; roomSelect: string }) {
      if (data.list) {
        let pageCount = 0
        let deviceCount = 0
        const pageList = [] as Device.DeviceItem[][]
        data.list
          .filter((device) => device.roomId === data.roomSelect)
          .forEach((device) => {
            if (pageCount === 0) {
              deviceCount = 1
              pageCount++
              pageList.push([device])
            } else if (deviceCount === 8) {
              deviceCount = 1
              pageCount++
              pageList.push([device])
            } else {
              deviceCount++
              pageList[pageCount - 1].push(device)
            }
          })
        return pageList
      }
      return []
    },
    sceneListMatrix(data: { list: Scene.SceneItem[]; roomSelect: string }) {
      if (data.list) {
        let pageCount = 0
        let sceneCount = 0
        const pageList = [] as Scene.SceneItem[][]
        data.list
          .filter((scene) => scene.roomId === data.roomSelect)
          .forEach((scene) => {
            if (pageCount === 0) {
              sceneCount = 1
              pageCount++
              pageList.push([scene])
            } else if (sceneCount === 6) {
              sceneCount = 1
              pageCount++
              pageList.push([scene])
            } else {
              sceneCount++
              pageList[pageCount - 1].push(scene)
            }
          })
        return pageList
      }
      return []
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleCardTap(e: { detail: { uniId?: string; sceneId?: string } }) {
      this.triggerEvent('select', this.data.linkType === 'scene' ? e.detail.sceneId : e.detail.uniId)
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm')
    },
    getHeight() {
      this.createSelectorQuery()
        .select('#content1')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
    handleContentDragging(e: WechatMiniprogram.ScrollViewDragging) {
      console.log(e.detail.scrollTop)
    },
    handleRoomSelect(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        roomSelect: e.currentTarget.dataset.item.roomId,
      })
    },
    black() {},
  },
})
