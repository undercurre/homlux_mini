import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { findDevice } from '../../../../apis/index'
import { proType } from '../../../../config/index'
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
    actionEditTitle: '',
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
          actionEditTitle: deviceAction.name,
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
          actionEditTitle: deviceAction.name,
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
