import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { batchDeleteDevice, batchUpdate } from '../../../../apis/index'
import { proType } from '../../../../config/index'
import { deviceBinding, deviceStore, roomBinding } from '../../../../store/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { runInAction } from 'mobx-miniprogram'
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },

  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding, roomBinding] })],

  computed: {
    canEditName(data) {
      if (data.editSelect) {
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
    showEditRoom: false,
    roomId: '',
    showConfirmDelete: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleDeleteDialog() {
      Dialog.confirm({
        title: '确定删除该设备',
        context: this,
      })
        .then(async () => {
          const set = new Set<string>([])
          deviceStore.editSelect.forEach((uniId) => {
            if (uniId.includes(':')) {
              set.add(uniId.split(':')[0])
            } else {
              set.add(uniId)
            }
          })
          const res = await batchDeleteDevice({
            deviceBaseDeviceVoList: Array.from(set).map((deviceId) => ({
              deviceId,
              deviceType: '2',
            })),
          })
          if (res.success) {
            await Promise.all([deviceStore.updateSubDeviceList(), deviceStore.updateAllRoomDeviceList()])
            runInAction(() => {
              deviceStore.isEditSelectMode = false
            })
            this.triggerEvent('updateList')
            this.handleClose()
          } else {
            Toast({
              message: '删除失败',
              zIndex: 9999,
            })
          }
        })
        .catch((e) => console.log(e))
    },
    handleEditNamePopup() {
      if (this.data.isMultiSelect || !deviceStore.editSelect.length || deviceStore.editSelect.length > 1) {
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
      const uniId = deviceStore.editSelect[0]
      const device = deviceStore.allRoomDeviceFlattenMap[uniId]
      this.setData({
        showEditRoom: true,
        roomId: device.roomId,
      })
    },
    handleClose() {
      this.setData({
        showEditName: false,
        showEditRoom: false,
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
            await deviceStore.updateSubDeviceList()
            this.triggerEvent('updateList')
            this.handleClose()
          } else {
            Toast({
              message: '编辑失败',
              zIndex: 9999,
            })
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
            Toast({
              message: '编辑失败',
              zIndex: 9999,
            })
          }
        }
      } else if (this.data.showEditRoom) {
        const map = {} as Record<string, Device.DeviceInfoUpdateVo>
        deviceStore.editSelect.forEach((uniId) => {
          if (uniId.includes(':')) {
            const deviceId = uniId.split(':')[0]
            if (!map[deviceId]) {
              map[deviceId] = {
                deviceId,
                roomId: this.data.roomId,
                type: '1',
              }
            }
          } else {
            if (!map[uniId]) {
              map[uniId] = {
                deviceId: uniId,
                roomId: this.data.roomId,
                type: '1',
              }
            }
          }
        })
        const res = await batchUpdate({
          deviceInfoUpdateVoList: Object.entries(map).map(([_, data]) => data),
        })
        if (res.success) {
          await Promise.all([deviceStore.updateSubDeviceList(), deviceStore.updateAllRoomDeviceList()])
          runInAction(() => {
            deviceStore.isEditSelectMode = false
          })
          this.triggerEvent('updateList')
          this.handleClose()
        } else {
          Toast({
            message: '移动失败',
            zIndex: 9999,
          })
        }
      }
    },
    handleRoomSelect(e: { currentTarget: { dataset: { id: string } } }) {
      this.setData({
        roomId: e.currentTarget.dataset.id,
      })
    },
  },
})
