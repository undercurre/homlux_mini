import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { proName, proType } from '../../../config/index'
import { deviceBinding, roomBinding } from '../../../store/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    value: {
      type: Array,
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
        this.setData({
          select: this.data.value,
        })
      },
    },
    linkType: {
      type: String,
    },
    canSelectMulti: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    contentHeight: 0,
    select: [] as string[],
    deviceListCanSelect: [] as Device.DeviceItem[],
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
      if (data.deviceList && data.linkType) {
        return data.deviceList.filter((device: { proType: string }) => proName[device.proType] === data.linkType)
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

  watch: {
    deviceList(value: Device.DeviceItem[]) {
      const lightList = [] as Device.DeviceItem[]
      const switchList = [] as Device.DeviceItem[]
      value.forEach((device) => {
        if (device.proType === proType.light) {
          lightList.push(device)
        } else if (device.proType === proType.switch) {
          device.switchInfoDTOList.forEach((switchItem) => {
            switchList.push({
              ...device,
              mzgdPropertyDTOList: {
                [switchItem.switchId]: device.mzgdPropertyDTOList[switchItem.switchId],
              },
              switchInfoDTOList: [switchItem],
              isSceneSwitch: false, // todo: 需要根据场景判断
              uniId: `${device.deviceId}:${switchItem.switchId}`,
            })
          })
        }
      })
      this.setData({
        lightList,
        switchList,
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleDeviceCardTap(device: { detail: { deviceId: string } }) {
      if (!this.data.canSelectMulti) {
        this.setData({
          select: [device.detail.deviceId],
        })
        return
      }
      console.log(this.data.select)
      if (this.data.select.includes(device.detail.deviceId)) {
        const index = this.data.select.findIndex((deviceId) => deviceId === device.detail.deviceId)
        this.data.select.splice(index, 1)
        this.setData({
          select: [...this.data.select],
        })
      } else {
        this.setData({
          select: [...this.data.select, device.detail.deviceId],
        })
      }
      console.log(this.data.select)
    },
    handleSceneCardTap(scene: { detail: { sceneId: string } }) {
      if (!this.data.canSelectMulti) {
        this.setData({
          select: [scene.detail.sceneId],
        })
        return
      }
      if (this.data.select.includes(scene.detail.sceneId)) {
        const index = this.data.select.findIndex((sceneId) => sceneId === scene.detail.sceneId)
        this.data.select.splice(index, 1)
        this.setData({
          select: [...this.data.select],
        })
      } else {
        this.setData({
          select: [...this.data.select, scene.detail.sceneId],
        })
      }
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', [...this.data.select])
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
  },
})
