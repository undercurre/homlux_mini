import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { batchDeleteDevice, batchUpdate } from '../../../../apis/index'
import { proType } from '../../../../config/index'
import { deviceBinding, deviceStore, homeStore, roomBinding, roomStore } from '../../../../store/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { storage, checkInputNameIllegal } from '../../../../utils/index'
ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },

  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding, roomBinding] })],

  properties: {
    editSelectList: {
      type: Array,
      value: [] as string[],
    },
    editSelectMode: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.animate(
            '#bottom',
            [
              {
                translateY: '100%',
              },
              {
                translateY: '0%',
              },
            ],
            100,
          )
          this.animate(
            '#top',
            [
              {
                translateY: '-100%',
              },
              {
                translateY: '0%',
              },
            ],
            100,
          )
        } else {
          this.animate(
            '#bottom',
            [
              {
                translateY: '0%',
              },
              {
                translateY: '100%',
              },
            ],
            100,
          )
          this.animate(
            '#top',
            [
              {
                translateY: '0%',
              },
              {
                translateY: '-100%',
              },
            ],
            100,
          )
        }
      },
    },
  },

  computed: {
    canEditName(data) {
      return data.editSelectList?.length === 1
    },
    editDeviceNameTitle(data) {
      return data.editProType === proType.switch ? '面板名称' : '设备名称'
    },
    isAllSelect(data) {
      return deviceStore.deviceFlattenList.length === data.editSelectList.length
    },
    editNameDisable(data) {
      if (data.editProType === proType.switch) {
        return !data.editDeviceName || !data.editSwitchName
      }
      return !data.editDeviceName
    },
    editRoomDisable(data) {
      return roomStore.currentRoom.roomId === data.roomId
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    navigationBarHeight: (storage.get<number>('navigationBarHeight') as number) + 'px',
    showEditName: false,
    isEditSwitchName: false,
    editDeviceName: '',
    editSwitchName: '',
    editProType: '',
    showEditRoom: false,
    roomId: '',
    showConfirmDelete: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleAllSelectToggle() {
      this.triggerEvent('selectAll', !this.data.isAllSelect)
    },
    handleDeleteDialog() {
      if (!this.data.editSelectList.length) {
        return
      }
      const hasSwitch = this.data.editSelectList.some((uniId: string) => uniId.includes(':'))
      Dialog.confirm({
        message: hasSwitch ? '该按键所在的面板将被一起删除' : '确定删除该设备',
        confirmButtonText: '是',
        cancelButtonText: '否',
        context: this,
      })
        .then(async () => {
          const set = new Set<string>([])
          this.data.editSelectList.forEach((uniId: string) => {
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
            Toast({
              message: '删除成功',
              zIndex: 9999,
            })
            await Promise.all([deviceStore.updateSubDeviceList(), homeStore.updateRoomCardList()])
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
      if (this.data.editSelectList?.length > 1) {
        return
      }
      const uniId = this.data.editSelectList[0]
      const device = deviceStore.allRoomDeviceFlattenMap[uniId]
      if (uniId.includes(':')) {
        this.setData({
          showEditName: true,
          editDeviceName: deviceStore.allRoomDeviceFlattenMap[uniId].deviceName,
          editSwitchName: deviceStore.allRoomDeviceFlattenMap[uniId].switchInfoDTOList[0].switchName,
          isEditSwitchName: true,
          editProType: device.proType,
        })
      } else {
        this.setData({
          showEditName: true,
          editDeviceName: deviceStore.allRoomDeviceFlattenMap[uniId].deviceName,
          isEditSwitchName: false,
          editProType: device.proType,
        })
      }
    },
    handleMoveRoomPopup() {
      if (!this.data.editSelectList.length) {
        return
      }
      const uniId = this.data.editSelectList[0]
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

      this.triggerEvent('close')
    },
    async handleConfirm() {
      if (this.data.showEditName) {
        if (this.data.editProType === proType.switch) {
          // 校验名字合法性
          if (checkInputNameIllegal(this.data.editSwitchName)) {
            Toast('按键名称不能用特殊符号或表情')
            return
          }
          if (checkInputNameIllegal(this.data.editDeviceName)) {
            Toast('设备名称不能用特殊符号或表情')
            return
          }
          if (this.data.editSwitchName.length > 5) {
            Toast('按键名称不能超过5个字符')
            return
          }
          if (this.data.editSwitchName.length > 6) {
            Toast('面板名称不能超过6个字符')
            return
          }
          const [deviceId, switchId] = this.data.editSelectList[0].split(':')
          const device = deviceStore.allRoomDeviceFlattenMap[this.data.editSelectList[0]]
          const deviceInfoUpdateVoList = [] as Device.DeviceInfoUpdateVo[]
          if (this.data.editSwitchName !== device.switchInfoDTOList[0].switchName) {
            deviceInfoUpdateVoList.push({
              deviceId,
              switchId,
              houseId: homeStore.currentHomeId,
              switchName: this.data.editSwitchName,
              type: '3',
            })
            device.switchInfoDTOList[0].switchName = this.data.editSwitchName // 用于传参，更新视图
          }
          if (this.data.editDeviceName !== device.deviceName) {
            deviceInfoUpdateVoList.push({
              deviceId,
              deviceName: this.data.editDeviceName,
              houseId: homeStore.currentHomeId,
              type: '0',
            })
            device.deviceName = this.data.editDeviceName // 用于传参，更新视图
          }
          if (!deviceInfoUpdateVoList.length) {
            Toast({
              message: '修改成功',
              zIndex: 9999,
            })
            this.handleClose()
            return
          }
          const res = await batchUpdate({
            deviceInfoUpdateVoList,
          })
          if (res.success) {
            Toast({
              message: '修改成功',
              zIndex: 9999,
            })
            this.handleClose()
            await Promise.all([homeStore.updateRoomCardList(), deviceStore.updateSubDeviceList()])
            this.triggerEvent('updateList', device)
          } else {
            Toast({
              message: '修改失败',
              zIndex: 9999,
            })
          }
        }
        // 修改灯属性
        else {
          const device = deviceStore.allRoomDeviceFlattenMap[this.data.editSelectList[0]]

          if (checkInputNameIllegal(this.data.editDeviceName)) {
            Toast('设备名称不能用特殊符号或表情')
            return
          }
          if (this.data.editSwitchName.length > 6) {
            Toast('设备名称不能超过6个字符')
            return
          }
          const res = await batchUpdate({
            deviceInfoUpdateVoList: [
              {
                deviceId: this.data.editSelectList[0],
                houseId: homeStore.currentHomeId,
                deviceName: this.data.editDeviceName,
                type: '0',
              },
            ],
          })
          if (res.success) {
            Toast({
              message: '修改成功',
              zIndex: 9999,
            })
            this.handleClose()
            await Promise.all([homeStore.updateRoomCardList(), deviceStore.updateSubDeviceList()])
            device.deviceName = this.data.editDeviceName // 用于传参，更新视图
            this.triggerEvent('updateList', device)
          } else {
            Toast({
              message: '修改失败',
              zIndex: 9999,
            })
          }
        }
      } else if (this.data.showEditRoom) {
        const actionFn = async () => {
          const map = {} as Record<string, Device.DeviceInfoUpdateVo>
          this.data.editSelectList.forEach((uniId: string) => {
            if (uniId.includes(':')) {
              const deviceId = uniId.split(':')[0]
              if (!map[deviceId]) {
                map[deviceId] = {
                  deviceId,
                  houseId: homeStore.currentHomeId,
                  roomId: this.data.roomId,
                  type: '1',
                }
              }
            } else {
              if (!map[uniId]) {
                map[uniId] = {
                  deviceId: uniId,
                  houseId: homeStore.currentHomeId,
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
            Toast({
              message: '移动成功',
              zIndex: 9999,
            })
            this.handleClose()
            await Promise.all([deviceStore.updateSubDeviceList(), homeStore.updateRoomCardList()])
            this.triggerEvent('updateList')
            this.triggerEvent('roomMove')
          } else {
            Toast({
              message: '移动失败',
              zIndex: 9999,
            })
          }
        }
        if (this.data.editSelectList.some((uniId: string) => uniId.includes(':'))) {
          Dialog.confirm({
            message: '按键所在的面板将被移动至新房间，是否继续？',
            confirmButtonText: '是',
            cancelButtonText: '否',
            context: this,
          })
            .then(actionFn)
            .catch((e) => console.log(e))
        } else {
          actionFn()
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
