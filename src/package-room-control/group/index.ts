import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceStore, homeBinding, roomBinding } from '../../store/index'
import { emitter } from '../../utils/index'
import { StatusType } from './typings'
import { addGroup, renameGroup } from '../../apis/device'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] }), pageBehaviors],
  data: {
    deviceList: [] as Device.DeviceItem[],
    status: 'processing' as StatusType,
    groupName: '',
    groupId: '',
    presetNames: ['筒灯', '射灯', '吊灯', '灯组'],
  },
  computed: {
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
      eventChannel.on('createGroup', (data) => {
        const deviceList = data.lightList.map((deviceId: string) => ({
          ...deviceStore.deviceMap[deviceId],
          status: 'processing',
        }))
        console.log(data.lightList, deviceList)

        this.setData({
          deviceList,
        })

        // 开始创建分组
        this.addGroup()

        // 监听创建结果
        emitter.on('group_device_result_status', (result) => {
          const diffData = {} as IAnyObject
          const index = this.data.deviceList.findIndex((device) => device.deviceId === result.devId)
          const isSuccess = result.errCode === 0

          diffData[`deviceList[${index}].status`] = isSuccess ? 'success' : 'failed'

          // 若这是最后一个上报，则变更页面状态
          if (this.data.failedList.length + this.data.successList.length === this.data.deviceList.length - 1) {
            diffData.status = this.data.failedList.length || !isSuccess ? 'hasFailure' : 'allSuccess'
          }

          this.setData(diffData)
        })
      })
    },
    async addGroup() {
      const res = await addGroup({
        applianceGroupDtoList: this.data.deviceList.map((device) => ({
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          proType: device.proType,
        })),
        groupName: '灯组',
        houseId: this.data.currentHomeId,
        roomId: this.data.currentRoom.roomId,
      })
      if (res.success) {
        this.data.groupId = res.result.groupId
      }
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

    finishBtn() {
      renameGroup({
        groupId: this.data.groupId,
        groupName: this.data.groupName,
      })
      wx.switchTab({
        url: '/pages/index/index',
      })
    },
  },
})
