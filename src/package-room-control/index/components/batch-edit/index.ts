import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { PRO_TYPE } from '../../../../config/index'
import { waitingBatchDeleteDevice, batchUpdate, renameGroup } from '../../../../apis/index'
import { deviceBinding, deviceStore, homeStore, roomBinding, roomStore } from '../../../../store/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { storage, checkInputNameIllegal, emitter, showLoading, hideLoading } from '../../../../utils/index'

let timeId: number

ComponentWithComputed({
  options: {},

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
    /**
     * @description 当前选项是否可以移动房间
     * 设备数量不能为0
     * 设备均为子设备或WIFI设备
     * 设备均在线
     */
    canMoveRoom(data) {
      return (
        data.editSelectList?.length &&
        data.editSelectList.every((uId: string) => {
          const deviceId = uId.split(':')[0] // 不管有没有:
          const device = deviceStore.deviceMap[deviceId]
          return [2, 3].includes(device.deviceType) && device.onLineStatus === 1
        })
      )
    },
    /**
     * @description 当前选项是否可以分组
     * 设备数量大于1
     * 设备均为灯具
     * 设备均为子设备或WIFI设备
     * 设备均在线
     */
    canGroup(data) {
      return (
        data.editSelectList?.length &&
        data.editSelectList.length > 1 &&
        data.editSelectList.every((uId: string) => {
          const deviceId = uId.split(':')[0]
          const device = deviceStore.deviceMap[deviceId]
          return device.proType === PRO_TYPE.light && [2, 3].includes(device.deviceType) && device.onLineStatus === 1
        })
      )
    },
    editDeviceNameTitle(data) {
      return data.editProType === PRO_TYPE.switch ? '面板名称' : '设备名称'
    },
    isAllSelect(data) {
      return deviceStore.deviceFlattenList.length === data.editSelectList.length
    },
    editNameDisable(data) {
      if (data.editProType === PRO_TYPE.switch) {
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
    moveWaitlist: [] as string[],
    moveFailCount: 0,
  },

  lifetimes: {
    ready() {},
    detached() {
      if (timeId) {
        clearTimeout(timeId)
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleAllSelectToggle() {
      this.triggerEvent('selectAll', !this.data.isAllSelect)
    },
    // TODO 处理分组解散的交互提示
    handleDeleteDialog() {
      if (!this.data.editSelectList.length) {
        return
      }
      const hasSwitch = this.data.editSelectList.some((uniId: string) => uniId.includes(':'))
      Dialog.confirm({
        title: hasSwitch ? '该按键所在的面板将被一起删除' : '确定删除该设备',
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
          const res = await waitingBatchDeleteDevice({
            deviceBaseDeviceVoList: Array.from(set).map((deviceId) => ({
              deviceId,
              deviceType: String(deviceStore.deviceMap[deviceId].deviceType),
            })),
          })
          if (res.success) {
            Toast({
              message: '删除成功',
              zIndex: 9999,
            })
            this.triggerEvent('updateListOnCloud')
            this.handleClose()
          } else {
            Toast({
              message: '删除失败',
              zIndex: 9999,
            })
            this.triggerEvent('updateListOnCloud')
          }
        })
        .catch((e) => console.log(e))
    },
    handleEditNamePopup() {
      if (!this.data.canEditName) {
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
      if (!this.data.canMoveRoom) {
        return
      }
      const uniId = this.data.editSelectList[0]
      const device = deviceStore.allRoomDeviceFlattenMap[uniId]
      this.setData({
        showEditRoom: true,
        roomId: device.roomId,
      })
    },
    handleCreateGroup() {
      if (!this.data.canGroup) {
        return
      }
      const lightList = this.data.editSelectList
      wx.navigateTo({
        url: '/package-room-control/group/index',
        success: (res) => {
          res.eventChannel.emit('createGroup', { lightList })
        },
      })
      this.triggerEvent('close')
    },
    handleClose() {
      this.setData({
        showEditName: false,
        showEditRoom: false,
      })

      this.triggerEvent('close')
    },
    handleBatchMove() {
      const actionFn = async () => {
        this.data.moveFailCount = 0 // 清空失败计数
        const map = {} as Record<string, Device.DeviceInfoUpdateVo>
        this.data.moveWaitlist.forEach((uniId: string) => {
          const deviceId = uniId.split(':')[0]
          const { deviceType } = deviceStore.deviceMap[deviceId]
          if (!map[deviceId]) {
            map[deviceId] = {
              deviceId,
              houseId: homeStore.currentHomeId,
              roomId: this.data.roomId,
              type: '1',
              deviceType,
            }
          }
        })
        const res = await batchUpdate({
          deviceInfoUpdateVoList: Object.entries(map).map(([_, data]) => data),
        })
        if (res.success) {
          // 可能存在快速收到ws通知，不用等待
          if (!this.data.moveWaitlist.length) {
            return
          }

          // TODO 只有WIFI设备时，不需要超时检测逻辑
          // 超时后检查云端上报，是否已成功移动完毕 5~120s
          const TIME_OUT = Math.min(Math.max(5000, this.data.moveWaitlist.length * 1000), 120000)

          showLoading('正在移动设备房间，请稍候')
          timeId = setTimeout(async () => {
            hideLoading()

            Dialog.confirm({
              title: '部分设备未成功移动，是否重试',
              confirmButtonText: '是',
              cancelButtonText: '否',
              context: this,
            })
              .then(actionFn) // ! 有条件递归执行
              .catch((e) => console.log(e))
          }, TIME_OUT)
        } else {
          this.triggerEvent('updateListOnCloud')

          Toast({
            message: '移动失败',
            zIndex: 9999,
          })
        }
      }
      const hasSwitch = this.data.moveWaitlist.some((uniId: string) => {
        const deviceId = uniId.split(':')[0]
        const { proType } = deviceStore.deviceMap[deviceId]
        return proType === PRO_TYPE.switch
      })
      if (hasSwitch && !this.data.moveFailCount) {
        Dialog.confirm({
          title: '按键所在的面板将被移动至新房间，是否继续？',
          confirmButtonText: '是',
          cancelButtonText: '否',
          context: this,
        })
          .then(actionFn)
          .catch((e) => console.log(e))
      }
      // 如果不包含面板设备，或者是失败重试列表为空，刚不必询问直接执行
      else {
        actionFn()
      }
    },
    async handleMoveFinish() {
      hideLoading()

      if (timeId) {
        clearTimeout(timeId)
      }
      this.triggerEvent('updateListOnCloud')
      Toast({
        message: '移动成功',
        zIndex: 9999,
      })

      emitter.off('group_device_result_status')
    },
    async handleConfirm() {
      if (this.data.showEditName) {
        if (this.data.editProType === PRO_TYPE.switch) {
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
          let type = ''
          if (this.data.editSwitchName !== device.switchInfoDTOList[0].switchName) {
            device.switchInfoDTOList[0].switchName = this.data.editSwitchName // 用于传参，更新视图
            type = '3'
            deviceInfoUpdateVoList.push({
              deviceId,
              switchId,
              houseId: homeStore.currentHomeId,
              switchName: this.data.editSwitchName,
              type,
            })
          }
          if (this.data.editDeviceName !== device.deviceName) {
            device.deviceName = this.data.editDeviceName // 用于传参，更新视图
            type = '0'
            deviceInfoUpdateVoList.push({
              deviceId,
              deviceName: this.data.editDeviceName,
              houseId: homeStore.currentHomeId,
              type,
              deviceType: device.deviceType,
            })
          }
          // 名称一样未被修改，假提示？
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

            // 如果修改的是面板名称，则需要同时更新面板其余的按键对应的卡片
            if (type === '0') {
              deviceStore.deviceFlattenList.forEach((_device) => {
                if (_device.deviceId === deviceId && _device.switchInfoDTOList[0].switchId !== switchId) {
                  this.triggerEvent('updateList', _device)
                }
              })
            }
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
          const res =
            device.deviceType === 4
              ? // 灯组
                await renameGroup({
                  groupId: this.data.editSelectList[0],
                  groupName: this.data.editDeviceName,
                })
              : // 单灯
                await batchUpdate({
                  deviceInfoUpdateVoList: [
                    {
                      deviceId: this.data.editSelectList[0],
                      houseId: homeStore.currentHomeId,
                      deviceName: this.data.editDeviceName,
                      type: '0',
                      deviceType: device.deviceType,
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
        this.initMoveWaitlist()
        this.handleBatchMove()
        this.handleClose()

        emitter.on('group_device_result_status', (result) => {
          if (result.errCode !== 0) {
            this.data.moveFailCount++
          }
          const uniId = `${result.devId}:${result.modelName}`
          const finishedIndex = this.data.moveWaitlist.findIndex((item) => item === uniId)
          this.data.moveWaitlist.splice(finishedIndex, 1)

          if (!this.data.moveWaitlist.length) {
            if (this.data.moveFailCount) {
              this.handleBatchMove()
            } else {
              this.handleMoveFinish()
            }
          }
        })
      }
    },
    handleRoomSelect(e: { currentTarget: { dataset: { id: string } } }) {
      this.setData({
        roomId: e.currentTarget.dataset.id,
      })
    },
    // 初始化等待移动的列表
    initMoveWaitlist() {
      this.data.editSelectList.forEach((uId: string) => {
        const deviceId = uId.split(':')[0]
        const device = deviceStore.deviceMap[deviceId]
        if (device.deviceType === 2) {
          for (const modelName in device.mzgdPropertyDTOList) {
            const uId = `${device.deviceId}:${modelName}`
            if (!this.data.moveWaitlist.includes(uId)) {
              this.data.moveWaitlist.push(uId)
            }
          }
        } else {
          this.data.moveWaitlist.push(`${device.deviceId}:1`)
        }
      })
    },
  },
})
