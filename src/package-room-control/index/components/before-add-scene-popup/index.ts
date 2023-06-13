import { ComponentWithComputed } from 'miniprogram-computed'
import { runInAction } from 'mobx-miniprogram'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { findDevice, sendDevice } from '../../../../apis/index'
import { maxColorTempK, minColorTempK, PRO_TYPE } from '../../../../config/index'
import { deviceStore, roomBinding, sceneBinding, sceneStore } from '../../../../store/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
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
    _cacheDeviceMap: {} as IAnyObject, // 缓存设备设置预览前的设备状态，用于退出时恢复
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
    async handleClose() {
      this.triggerEvent('close')

      const { _cacheDeviceMap } = this.data

      console.log('handleClose', _cacheDeviceMap)

      for (const cacheDevice of Object.values(_cacheDeviceMap)) {
        await sendDevice({
          deviceId: cacheDevice.deviceId,
          gatewayId: cacheDevice.gatewayId,
          proType: cacheDevice.proType,
          deviceType: cacheDevice.deviceType,
          ep: cacheDevice.ep,
          property: cacheDevice.property,
        })
      }
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
      if (deviceAction.proType === PRO_TYPE.light) {
        // 目前仅子设备单控支持闪烁指令
        deviceAction.deviceType === 2 && findDevice({ gatewayId: device.gatewayId, devId: device.deviceId })

        this.setData({
          actionEditTitle: deviceAction.name,
          sceneLightEditInfo: {
            ...deviceAction.value,
            deviceType: deviceAction.deviceType,
            gatewayId: device.gatewayId,
            deviceId: device.deviceId,
          },
          showSceneEditLightPopup: true,
          editIndex: e.currentTarget.dataset.index,
        })
      } else if (deviceAction.proType === PRO_TYPE.switch) {
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

    /**
     * 预览设备状态,需求
     */
    handleSceneEditConfirm(e: { detail: IAnyObject }) {
      console.log('previewDeviceStatus', e)
      const { _cacheDeviceMap } = this.data
      const deviceAction = sceneStore.addSceneActions[this.data.editIndex]
      const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
      const device = allRoomDeviceMap[deviceAction.uniId]
      const previewData = e.detail

      if (!_cacheDeviceMap[deviceAction.uniId]) {
        _cacheDeviceMap[deviceAction.uniId] = {
          gatewayId: device.gatewayId,
          deviceId: device.deviceId,
          proType: device.proType,
          deviceType: device.deviceType,
          ep: deviceAction.value.ep,
          property: {
            ...deviceAction.value,
          },
        }
      }

      sceneStore.addSceneActions[this.data.editIndex].value = {
        ep: sceneStore.addSceneActions[this.data.editIndex].value.ep,
        ...previewData,
      }
      if (sceneStore.addSceneActions[this.data.editIndex].proType === PRO_TYPE.light) {
        if (previewData.OnOff) {
          const desc = previewData.OnOff ? ['打开'] : ['关闭']
          const color = (previewData.ColorTemp / 100) * (maxColorTempK - minColorTempK) + minColorTempK
          desc.push(`亮度${previewData.Level}%`)
          desc.push(`色温${color}K`)
          sceneStore.addSceneActions[this.data.editIndex].desc = desc
        } else {
          sceneStore.addSceneActions[this.data.editIndex].desc = ['关闭']
        }
      } else if (sceneStore.addSceneActions[this.data.editIndex].proType === PRO_TYPE.switch) {
        sceneStore.addSceneActions[this.data.editIndex].desc = previewData.OnOff ? ['打开'] : ['关闭']
      }
      runInAction(() => {
        sceneStore.addSceneActions = [...sceneStore.addSceneActions]
      })
    },
  },
})
