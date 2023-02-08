import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { roomBinding } from '../../../../store/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(val) {
        if (val) {
          setTimeout(() => {
            this.getHeight()
          }, 100)
        }
        this.setData({
          select: '', // TODO: 根据云端的值设置
        })
      },
    },
    linkType: {
      type: String,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    contentHeight: 0,
    select: '',
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
    deviceList(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return data.roomList[data.currentRoomIndex].deviceList.filter(
          (device: { deviceType: string }) => device.deviceType === data.linkType,
        )
      }
      return []
    },
    sceneList(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return data.roomList[data.currentRoomIndex].sceneList
      }
      return []
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleDeviceCardTap(device: { detail: { deviceId: string } }) {
      console.log(device)
      this.setData({
        select: device.detail.deviceId,
      })
    },
    handleSceneCardTap(scene: { detail: { name: string; value: string } }) {
      this.setData({
        select: scene.detail.value,
      })
    },
    onClickHide() {
      this.triggerEvent('close')
    },
    getHeight() {
      this.createSelectorQuery()
        .select('#content1')
        .boundingClientRect()
        .exec((res) => {
          console.log(res[0])
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
  },
})
