import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { findDevice } from '../../../../apis/index'
import { maxColorTempK, minColorTempK, proType } from '../../../../config/index'
import { deviceStore, roomBinding, sceneBinding, sceneStore } from '../../../../store/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [BehaviorWithStore({ storeBindings: [sceneBinding, roomBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          setTimeout(() => {
            this.getHeight()
          }, 100)
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    editIndex: 0,
    contentHeight: 0,
    sceneEditTitle: '',
    showSceneEditLightPopup: false,
    showSceneEditSwitchPopup: false,
    sceneLightEditInfo: {} as IAnyObject,
    sceneSwitchEditInfo: {} as IAnyObject,
  },

  computed: {
    roomName(data) {
      if (data.roomList && data.roomList[data.currentRoomIndex]) {
        return data.roomList[data.currentRoomIndex].roomName
      }
      return ''
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getHeight() {
      this.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleNext() {
      this.triggerEvent('next')
    },
    handleActionDelete(e: WechatMiniprogram.TouchEvent) {
      sceneStore.addSceneActions.splice(e.currentTarget.dataset.index, 1)
      runInAction(() => {
        sceneStore.addSceneActions = [...sceneStore.addSceneActions]
      })
    },
    handleSceneActionEdit(e: WechatMiniprogram.TouchEvent) {
      const deviceAction = sceneStore.addSceneActions[e.currentTarget.dataset.index]
      const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
      const device = allRoomDeviceMap[deviceAction.uniId]
      if (deviceAction.proType === proType.light) {
        findDevice({ gatewayId: device.gatewayId, devId: device.deviceId })
        this.setData({
          sceneEditTitle: deviceAction.name,
          sceneLightEditInfo: deviceAction.value,
          showSceneEditLightPopup: true,
          editIndex: e.currentTarget.dataset.index,
        })
      } else if (deviceAction.proType === proType.switch) {
        findDevice({
          gatewayId: device.gatewayId,
          devId: device.deviceId,
          ep: Number(device.switchInfoDTOList[0].switchId),
        })
        this.setData({
          sceneEditTitle: deviceAction.name,
          sceneSwitchEditInfo: deviceAction.value,
          showSceneEditSwitchPopup: true,
          editIndex: e.currentTarget.dataset.index,
        })
      }
    },
    handleSceneLightEditPopupClose() {
      this.setData({
        showSceneEditLightPopup: false,
      })
    },
    handleSceneSwitchEditPopupClose() {
      this.setData({
        showSceneEditSwitchPopup: false,
      })
    },
    handleSceneEditConfirm(e: { detail: IAnyObject }) {
      sceneStore.addSceneActions[this.data.editIndex].value = {
        ep: sceneStore.addSceneActions[this.data.editIndex].value.ep,
        ...e.detail,
      }
      if (sceneStore.addSceneActions[this.data.editIndex].proType === proType.light) {
        if (e.detail.OnOff) {
          const desc = e.detail.OnOff ? ['打开'] : ['关闭']
          const color = (e.detail.ColorTemp / 100) * (maxColorTempK - minColorTempK) + minColorTempK
          desc.push(`亮度${e.detail.Level}%`)
          desc.push(`色温${color}K`)
          sceneStore.addSceneActions[this.data.editIndex].desc = desc
        } else {
          sceneStore.addSceneActions[this.data.editIndex].desc = ['关闭']
        }
      } else if (sceneStore.addSceneActions[this.data.editIndex].proType === proType.switch) {
        sceneStore.addSceneActions[this.data.editIndex].desc = e.detail.OnOff ? ['打开'] : ['关闭']
      }
      runInAction(() => {
        sceneStore.addSceneActions = [...sceneStore.addSceneActions]
      })
      this.setData({
        showSceneEditLightPopup: false,
        showSceneEditSwitchPopup: false,
      })
    },
  },
})
