import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { batchUpdate } from '../../../../apis/index'
import { proType } from '../../../../config/index'
import { deviceBinding, deviceStore } from '../../../../store/index'
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },

  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] })],

  computed: {
    canEditName(data) {
      if (data.editSelect) {
        console.log('length', data.editSelect.length)
        return data.editSelect.length === 1
      }
      return false
    },
    editNameTitle(data) {
      return data.editProType === proType.switch ? '按键名称' : '设备名称'
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    showEditName: false,
    editName: '',
    editProType: '',
    showRoomPopup: false,
    roomId: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleEditNamePopup() {
      if (this.data.isMultiSelect || !deviceStore.editSelect.length) {
        return
      }
      const uniId = deviceStore.editSelect[0]
      const device = deviceStore.allRoomDeviceFlattenMap[uniId]
      let name = ''
      if (uniId.includes(':')) {
        name = deviceStore.allRoomDeviceFlattenMap[uniId].switchInfoDTOList[0].switchName
      } else {
        name = device.deviceName
      }
      this.setData({
        showEditName: true,
        editName: name,
        editProType: device.proType,
      })
    },
    handleMoveRoomPopup() {
      if (!deviceStore.editSelect.length) {
        return
      }
      this.setData({
        showEditName: true,
        deviceName: deviceStore.allRoomDeviceMap[deviceStore.editSelect[0]].deviceName,
      })
    },
    handleClose() {
      this.setData({
        showEditName: false,
        showRoomPopup: false,
      })
    },
    async handleConfirm() {
      if (this.data.showEditName) {
        if (this.data.editProType === proType.switch) {
          const [deviceId, switchId] = deviceStore.editSelect[0].split(':')
          const res = await batchUpdate({
            deviceInfoUpdateVoList: [
              {
                deviceId,
                switchId,
                switchName: this.data.editName,
                type: '3',
              },
            ],
          })
          if (res.success) {
            this.triggerEvent('updateList')
          } else {
            //todo: toast
          }
        } else {
          const res = await batchUpdate({
            deviceInfoUpdateVoList: [
              {
                deviceId: deviceStore.editSelect[0],
                deviceName: this.data.editName,
                type: '0',
              },
            ],
          })
          if (res.success) {
            this.triggerEvent('updateList')
          } else {
            //todo: toast
          }
        }
      } else if (this.data.showRoomPopup) {
        // todo:
      }
    },
  },
})
