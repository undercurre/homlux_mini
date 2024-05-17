import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { getModelName, PRO_TYPE, SCREEN_PID, MAX_MOVE_CARDS } from '../../../../config/index'
import { waitingBatchDeleteDevice, batchUpdate, renameGroup } from '../../../../apis/index'
import { deviceBinding, deviceStore, homeStore, roomStore } from '../../../../store/index'
import Toast from '../../../../skyline-components/mz-toast/toast'
import Dialog from '../../../../skyline-components/mz-dialog/dialog'
import { storage, checkInputNameIllegal, emitter, showLoading, hideLoading } from '../../../../utils/index'

let timeId: number

ComponentWithComputed({
  options: {},

  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] })],

  properties: {
    editSelectList: {
      type: Array,
      value: [] as string[],
    },
    editSelectMode: {
      type: Boolean,
      value: false,
      observer(value) {
        console.log('editSelectMode', value)
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
     * 设备均为子设备或WIFI设备或86网关
     * 设备均在线
     */
    canMoveRoom(data) {
      const noScreen = data.editSelectList.every((uId: string) => {
        const deviceId = uId.split(':')[0]
        const device = deviceStore.deviceMap[deviceId]
        return !SCREEN_PID.includes(device.productId)
      })
      return (
        noScreen &&
        data.editSelectList?.length &&
        data.editSelectList?.length <= MAX_MOVE_CARDS &&
        data.editSelectList.every((uId: string) => {
          const deviceId = uId.split(':')[0] // 不管有没有:
          const device = deviceStore.deviceMap[deviceId]
          return [1, 2, 3].includes(device.deviceType) && device.onLineStatus === 1
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
    /**
     * @description 可被删除
     * 设备数量大于1
     * 非智慧屏开关，非网关
     */
    canDelete(data) {
      const { hasGateway, selectedAmountInRange } = data
      return hasGateway && selectedAmountInRange
    },
    selectedAmountInRange(data) {
      return data.editSelectList?.length && data.editSelectList?.length <= MAX_MOVE_CARDS
    },
    hasGateway(data) {
      const noScreenOrGateway = data.editSelectList.every((uId: string) => {
        const deviceId = uId.split(':')[0]
        const device = deviceStore.deviceMap[deviceId]
        return !SCREEN_PID.includes(device.productId) && device.proType !== PRO_TYPE.gateway
      })
      return noScreenOrGateway
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
      return roomStore.currentRoomId === data.roomId
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    navigationBarAndStatusBarHeight:
      (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 'px',
    // navigationBarHeight: (storage.get('navigationBarHeight') as number) + 'px',
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
    roomList: [] as roomInfo[],
  },

  lifetimes: {
    async ready() {
      this.setData({
        roomList: [...roomStore.roomList],
      })
    },
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
      if (!this.data.hasGateway) {
        Toast('网关类设备需在设备管理中删除')
        return
      }
      if (!this.data.selectedAmountInRange) {
        Toast(`最多同时删除${MAX_MOVE_CARDS}个设备`)
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
            this.triggerEvent('updateList')
            this.handleClose()
          } else {
            Toast({
              message: '删除失败',
              zIndex: 9999,
            })
            this.triggerEvent('updateList')
          }
        })
        .catch((e) => console.log('catch', e))
    },
    handleEditNamePopup() {
      if (!this.data.canEditName) {
        Toast('请选择一个设备')
        return
      }
      const uniId = this.data.editSelectList[0]
      const device = deviceStore.deviceFlattenList.find((d) => d.uniId === uniId)
      if (!device) {
        return
      }
      if (uniId.includes(':')) {
        this.setData({
          showEditName: true,
          editDeviceName: device.deviceName,
          editSwitchName: device.switchInfoDTOList[0].switchName,
          isEditSwitchName: true,
          editProType: device.proType,
        })
      } else {
        this.setData({
          showEditName: true,
          editDeviceName: device.deviceName,
          isEditSwitchName: false,
          editProType: device.proType,
        })
      }
    },
    handleMoveRoomPopup() {
      if (!this.data.canMoveRoom) {
        Toast(`最多同时移动${MAX_MOVE_CARDS}个设备`)
        return
      }
      const uniId = this.data.editSelectList[0]
      const device = deviceStore.deviceFlattenList.find((d) => d.uniId === uniId)
      if (!device) {
        return
      }
      this.setData({
        showEditRoom: true,
        roomId: device.roomId,
      })
    },
    handleCreateGroup() {
      if (!this.data.canGroup) {
        Toast('请选择多个在线灯具')
        return
      }
      const lightList = this.data.editSelectList
      const lightGroup = deviceStore.deviceList.filter((d) => d.deviceType === 4)
      wx.navigateTo({
        url: '/package-room-control/group/index',
        success: (res) => {
          res.eventChannel.emit('createGroup', {
            lightList,
            groupName: lightGroup?.length ? `灯组${lightGroup.length + 1}` : '',
          })
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
        // 可能存在未重新开始移动，目标已被移动成功的情况
        if (!this.data.moveWaitlist.length) {
          this.triggerEvent('updateList')
          Dialog.close() // 关闭【前端超时】提示窗口
          emitter.off('group_device_result_status') // 取消监听

          Toast({
            message: '已成功移动',
            zIndex: 9999,
          })
          return
        }
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
          // 超时后检查云端上报，是否已成功移动完毕 15~120s
          const TIME_OUT = Math.min(Math.max(15000, this.data.moveWaitlist.length * 1000), 120000)

          showLoading('正在移动设备房间，请稍候')
          timeId = setTimeout(async () => {
            hideLoading()

            // 部分未成功也要通知刷新页面
            this.triggerEvent('updateList')

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
          this.triggerEvent('updateList')

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
      this.triggerEvent('updateList')
      Toast({
        message: '移动成功',
        zIndex: 9999,
      })

      emitter.off('group_device_result_status')
    },
    async handleConfirm() {
      if (this.data.showEditName) {
        const uniId = this.data.editSelectList[0]
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
          if (this.data.editDeviceName.length > 6) {
            Toast('面板名称不能超过6个字符')
            return
          }
          const [deviceId, switchId] = uniId.split(':')
          const device = deviceStore.deviceFlattenList.find((d) => d.uniId === uniId)
          if (!device) {
            return
          }
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
            // await homeStore.updateRoomCardList()
            this.triggerEvent('updateDevice', device)

            // 如果修改的是面板名称，则需要同时更新面板其余的按键对应的卡片
            if (type === '0') {
              deviceStore.deviceFlattenList.forEach((_device) => {
                if (_device.deviceId === deviceId && _device.switchInfoDTOList[0].switchId !== switchId) {
                  this.triggerEvent('updateDevice', _device)
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
          const device = deviceStore.deviceFlattenList.find((d) => d.uniId === uniId)
          if (!device) {
            return
          }

          if (checkInputNameIllegal(this.data.editDeviceName)) {
            Toast('设备名称不能用特殊符号或表情')
            return
          }
          if (this.data.editDeviceName.length > 6) {
            Toast('设备名称不能超过6个字符')
            return
          }
          const res =
            device.deviceType === 4
              ? // 灯组
                await renameGroup({
                  groupId: uniId,
                  groupName: this.data.editDeviceName,
                })
              : // 单灯
                await batchUpdate({
                  deviceInfoUpdateVoList: [
                    {
                      deviceId: uniId,
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
            // await homeStore.updateRoomCardList()
            device.deviceName = this.data.editDeviceName // 用于传参，更新视图
            this.triggerEvent('updateDevice', device)
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
        if (device.proType === PRO_TYPE.switch) {
          for (const panel of device.switchInfoDTOList) {
            const modelName = panel.switchId
            const uId = `${device.deviceId}:${modelName}`
            if (!this.data.moveWaitlist.includes(uId)) {
              this.data.moveWaitlist.push(uId)
            }
          }
        } else {
          const modelName = getModelName(device.proType, device.productId)
          this.data.moveWaitlist.push(`${device.deviceId}:${modelName}`)
        }
      })
    },
  },
})
