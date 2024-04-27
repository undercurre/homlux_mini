import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceStore, homeBinding, roomBinding } from '../../store/index'
import { emitter, Logger } from '../../utils/index'
import { StatusType } from './typings'
import { addGroup, renameGroup, delGroup, updateGroup, retryGroup } from '../../apis/device'

let timeoutId: number | null

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] }), pageBehaviors],
  data: {
    isEdit: false, // 是否编辑
    deviceList: [] as Device.DeviceItem[],
    status: 'processing' as StatusType,
    defaultGroupName: '灯组', // 默认分组名称
    groupName: '',
    groupId: '',
    presetNames: ['筒灯', '射灯', '吊灯', '灯组'],
    showGroupFailTips: false,
    listHeight: 0,
  },
  computed: {
    pageTitle(data) {
      return data.isEdit ? '编辑分组' : '创建分组'
    },
    successList(data) {
      return data.deviceList.filter((device) => device.status === 'success')
    },
    failedList(data) {
      return data.deviceList.filter((device) => device.status === 'failed')
    },
    tips(data) {
      return `正在将分组数据下发至灯具（${data.successList.length}/${data.deviceList.length}）…`
    },
  },

  methods: {
    onLoad() {
      const eventChannel = this.getOpenerEventChannel()
      eventChannel.on('createGroup', async (data) => {
        const deviceList = data.lightList.map((deviceId: string) => ({
          ...deviceStore.allRoomDeviceMap[deviceId],
          status: 'processing',
        }))

        console.log(data.lightList, deviceList, deviceStore.allRoomDeviceMap)

        this.setData({
          deviceList,
          groupId: data.groupId,
          isEdit: !!data.groupId,
          groupName: data.groupName || this.data.defaultGroupName,
        })

        // 开始创建\更新分组
        if (!this.data.groupId) {
          await this.addGroup()
        } else {
          await updateGroup({
            applianceGroupDtoList: this.data.deviceList.map((device) => ({
              deviceId: device.deviceId,
              deviceType: device.deviceType,
              proType: device.proType,
            })),
            groupId: this.data.groupId,
          })
        }

        wx.createSelectorQuery()
          .select('#content')
          .boundingClientRect()
          .exec((res) => {
            if (res[0] && res[0].height) {
              this.setData({
                listHeight: res[0].height,
              })
            }
          })

        // 超时控制
        const TIME_OUT = Math.min(Math.max(15000, this.data.deviceList.length * 1000), 120000)
        timeoutId = setTimeout(() => {
          timeoutId = null
          if (this.data.deviceList.length !== this.data.successList.length) {
            this.setData({
              showGroupFailTips: true,
              status: 'hasFailure',
            })
          }
          // 如果全部失败，则清空分组
          else if (this.data.failedList.length === this.data.deviceList.length) {
            delGroup({ groupId: this.data.groupId })
            this.setData({
              groupId: '',
            })
          }
        }, TIME_OUT)
      })

      // 监听分组结果
      emitter.on('group_device_result_status', (result) => {
        const diffData = {} as IAnyObject
        const index = this.data.deviceList.findIndex((device) => device.deviceId === result.devId)
        const isSuccess = result.errCode === 0
        const status = isSuccess ? 'success' : 'failed'

        Logger.log('[绑定结果上报]设备ID：', result.devId, `第${index}条上报`, status)

        diffData[`deviceList[${index}].status`] = status

        // 若这是最后一个上报，则变更页面状态
        if (this.data.failedList.length + this.data.successList.length === this.data.deviceList.length - 1) {
          diffData.status = this.data.failedList.length || !isSuccess ? 'hasFailure' : 'allSuccess'

          if (diffData.status === 'hasFailure') {
            this.setData({
              showGroupFailTips: true,
            })
            if (timeoutId) {
              clearTimeout(timeoutId)
            }
          } else if (this.data.showGroupFailTips) {
            this.setData({
              showGroupFailTips: false,
            })
          }
        }

        this.setData(diffData)

        // 如果全部失败，则清空分组
        if (this.data.failedList.length === this.data.deviceList.length) {
          delGroup({ groupId: this.data.groupId })
          this.setData({
            groupId: '',
          })
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
        }
      })
    },
    onUnload() {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    },
    handleCloseDialog() {
      this.setData({
        showGroupFailTips: false,
      })
    },
    async addGroup() {
      const res = await addGroup({
        applianceGroupDtoList: this.data.deviceList.map((device) => ({
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          proType: device.proType,
        })),
        groupName: this.data.groupName, // 不经用户选择，自动命名
        houseId: this.data.currentHomeId,
        roomId: this.data.currentRoom.roomId,
      })
      if (res.success) {
        this.data.groupId = res.result.groupId
      }
    },

    async retryGroup() {
      if (!this.data.groupId) {
        this.addGroup()
      } else {
        await retryGroup({
          applianceGroupDtoList: this.data.deviceList
            .filter((device) => device.status === 'failed')
            .map((device) => ({
              deviceId: device.deviceId,
              deviceType: device.deviceType,
              proType: device.proType,
            })),
          groupId: this.data.groupId,
        })
      }

      // 重新生成列表，未成功转为进行中，并设置状态为进行中
      const deviceList = this.data.deviceList.map((device) => ({
        ...device,
        status: device.status === 'failed' ? 'processing' : device.status,
      }))
      this.setData({
        deviceList,
        status: 'processing',
      })
    },

    toRename() {
      this.setData({
        status: 'naming',
      })
    },

    handlePreset(e: { currentTarget: { dataset: { value: string } } }) {
      this.setData({
        groupName: e.currentTarget.dataset.value,
      })
    },

    changeGroupName(e: { detail: string }) {
      this.setData({
        groupName: e.detail,
      })
    },

    /**
     * 跳过失败的设备
     */
    jumpFail() {
      // 编辑灯组的情况
      if (this.data.isEdit) {
        this.endGroup()
      } else {
        this.nextStep()
      }
    },

    /**
     * 分组指令下发成功后，进入下一步
     */
    nextStep() {
      // 编辑灯组的情况
      if (this.data.isEdit) {
        this.endGroup()
      } else {
        this.toRename()
      }
    },

    endGroup() {
      emitter.off('group_device_result_status')
      wx.navigateBack()
    },

    // 点击完成时，实际上灯组已存在，补充修改灯组名称
    finishBtn() {
      if (this.data.defaultGroupName !== this.data.groupName) {
        renameGroup({
          groupId: this.data.groupId,
          groupName: this.data.groupName,
        })
      }
      this.endGroup()
    },
  },
})
