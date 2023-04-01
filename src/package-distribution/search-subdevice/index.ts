import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { runInAction } from 'mobx-miniprogram'
import Toast from '@vant/weapp/toast/toast'
import asyncPool from 'tiny-async-pool'
import { homeBinding, roomBinding, homeStore } from '../../store/index'
import { bleDevicesBinding, ISwitch, IBleDevice, bleDevicesStore } from '../store/bleDeviceStore'
import { getCurrentPageParams } from '../../utils/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { sendCmdAddSubdevice, bindDevice, queryDeviceOnlineStatus, batchUpdate } from '../../apis/index'
import lottie from 'lottie-miniprogram'
import { addDevice } from '../../assets/lottie/index'

type StatusName = 'discover' | 'requesting' | 'success' | 'error'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding, bleDevicesBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    _timeId: 0,
    isEditDevice: false,
    editDeviceInfo: {
      index: -1,
      deviceId: '',
      deviceName: '',
      roomId: '',
      roomName: '',
      switchList: [] as ISwitch[],
    },
    status: 'discover' as StatusName,
  },

  computed: {
    pageTitle(data) {
      const titleMap = {
        discover: '附近的子设备',
        requesting: '添加设备',
        success: '添加设备',
        error: '附近的子设备',
      }

      return titleMap[data.status]
    },
    selectedList(data) {
      const list = data.bleDeivceList || []

      return list.filter((item: IBleDevice) => item.isChecked)
    },
    failList(data) {
      return data.selectedList.filter((item: IBleDevice) => item.status === 'fail') as IBleDevice[]
    },
    successList(data) {
      return data.selectedList.filter((item: IBleDevice) => item.status === 'success')
    },

    isAllSelected(data) {
      const list = data.bleDeivceList || []

      return data.selectedList.length === list.length
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    ready: function () {},
    moved: function () {},
  },

  pageLifetimes: {
    hide() {
      this.stopGwAddMode()
    },
  },

  methods: {
    startAnimation() {
      // 加载动画
      this.createSelectorQuery()
        .selectAll('#canvas')
        .node((res) => {
          const canvas = (res as any)[0].node
          const context = canvas.getContext('2d')

          canvas.width = 400
          canvas.height = 400

          lottie.setup(canvas)
          lottie.loadAnimation({
            loop: true,
            autoplay: true,
            animationData: JSON.parse(addDevice),
            rendererSettings: {
              context,
            },
          })
        })
        .exec()
    },

    // 切换选择发现的设备
    toggleDevice(e: WechatMiniprogram.CustomEvent) {
      const index = e.currentTarget.dataset.index as number
      const item = bleDevicesBinding.store.bleDeivceList[index]

      item.isChecked = !item.isChecked

      this.updateBleDeviceListView()
    },

    // 确认添加设备
    async confirmAdd() {
      try {
        bleDevicesBinding.store.stopBLeDiscovery()

        const selectedList = bleDevicesBinding.store.bleDeivceList.filter((item: IBleDevice) => item.isChecked)

        this.beginAddDevice(selectedList)
      } catch (err) {
        console.log('confirmAdd-err', err)
      }
    },

    updateBleDeviceListView() {
      runInAction(() => {
        bleDevicesBinding.store.bleDeivceList = bleDevicesBinding.store.bleDeivceList.concat([])
      })
    },

    async startGwAddMode() {
      const pageParams = getCurrentPageParams()
      const expireTime = 60

      const res = await sendCmdAddSubdevice({
        deviceId: pageParams.gatewayId,
        expire: expireTime,
        buzz: 1,
      })

      // 子设备配网阶段，保持网关在配网状态
      if (res.success) {
        this.data._timeId = setTimeout(() => {
          const hasWaitItem = bleDevicesStore.bleDeivceList.findIndex((item) => item.status === 'waiting') >= 0 // 检测是否还存在需要配网的设备

          hasWaitItem && this.sendGwAddCmd()
        }, (expireTime - 10) * 1000)
      }

      return res
    },

    async stopGwAddMode() {
      if (this.data._timeId === 0) {
        return
      }

      const pageParams = getCurrentPageParams()

      clearTimeout(this.data._timeId)
      this.data._timeId = 0

      const res = await sendCmdAddSubdevice({
        deviceId: pageParams.gatewayId,
        expire: 0,
        buzz: 1,
      })

      // 子设备配网阶段，保持网关在配网状态
      if (res.success) {
        console.log('结束网关配网状态')
      }

      return res
    },

    async beginAddDevice(list: IBleDevice[]) {
      try {
        const res = await this.startGwAddMode()

        if (!res.success) {
          Toast(res.msg)
          return
        }

        this.setData({
          status: 'requesting',
        })

        setTimeout(() => {
          this.startAnimation()
        }, 300)

        const iteratorFn = async (item: IBleDevice) => {
          console.info('开始任务：', item.mac, item)

          await this.startZigbeeNet(item)

          return item
        }

        for await (const value of asyncPool(3, list, iteratorFn)) {
          console.info('任务结束：', value.mac)
        }

        this.stopGwAddMode()
      } catch (err) {
        console.log('beginAddDevice-err', err)
      }
    },

    async startZigbeeNet(bleDevice: IBleDevice) {
      console.group(`startZigbeeNet:${bleDevice.mac}`)
      console.log(`开始子设备配网：${bleDevice.mac}，第${3 - bleDevice.zigbeeRepeatTimes}次`)

      // 过滤刚出厂设备刚起电时会默认进入配网状态期间，被网关绑定的情况，这种当做成功配网，无需再下发配网指令，否则可能会导致zigbee入网失败
      if (bleDevice.isConfig !== '02') {
        const configRes = await bleDevice.client.getBleStatus()

        console.log('configRes', configRes)

        if (configRes.success && configRes.result.isConfig === '02') {
          this.queryDeviceOnlineStatus(bleDevice)
          bleDevice.client.close()

          return
        }
      }

      bleDevice.zigbeeRepeatTimes--

      const res = await bleDevice.client.startZigbeeNet()

      // 配网指令允许重发3次
      if (!res.success && bleDevice.zigbeeRepeatTimes > 0) {
        await this.startZigbeeNet(bleDevice)

        return
      }

      if (res.success) {
        this.queryDeviceOnlineStatus(bleDevice)
      } else {
        console.error(`子设备配网失败：${bleDevice.mac}`, res)
        bleDevice.status = 'fail'

        this.updateBleDeviceListView()
      }

      bleDevice.client.close()

      console.groupEnd()
    },

    async queryDeviceOnlineStatus(device: IBleDevice) {
      const pageParams = getCurrentPageParams()

      const queryRes = await queryDeviceOnlineStatus({
        deviceId: device.zigbeeMac,
        deviceType: '2',
        sn: pageParams.gatewaySn,
      })

      console.log('queryDeviceOnlineStatus', queryRes)

      if (queryRes.result.onlineStatus === 0 || !queryRes.result.deviceId) {
        // 限制最多查询云端设备在线状态次数：device.requestTimes，超过则置为失败
        device.requestTimes--

        if (device.requestTimes <= 0) {
          device.status = 'fail'
          this.updateBleDeviceListView()

          return
        }

        setTimeout(() => {
          this.queryDeviceOnlineStatus(device)
        }, 3000)

        return
      }

      const res = await bindDevice({
        deviceId: device.zigbeeMac,
        houseId: homeBinding.store.currentHomeId,
        roomId: device.roomId,
        sn: '',
        deviceName: device.name,
      })

      if (res.success && res.result.isBind) {
        await this.editDeviceInfo({ deviceId: res.result.deviceId, switchList: device.switchList })
        console.log('123133')
        device.status = 'success'
      } else {
        device.status = 'fail'
      }

      this.updateBleDeviceListView()
    },

    async editDeviceInfo(data: { deviceId: string; switchList: ISwitch[] }) {
      const { deviceId, switchList } = data

      const deviceInfoUpdateVoList = switchList.map((item) => {
        return {
          deviceId: deviceId,
          houseId: homeStore.currentHomeId,
          switchId: item.switchId,
          switchName: item.switchName,
          type: '3',
        }
      })

      await batchUpdate({ deviceInfoUpdateVoList })
    },

    /**
     * 编辑设备信息
     * @param event
     */
    editDevice(event: WechatMiniprogram.BaseEvent) {
      const { index } = event.currentTarget.dataset

      const item = bleDevicesBinding.store.bleDeivceList[index]

      this.setData({
        isEditDevice: true,
        editDeviceInfo: {
          index: index,
          deviceId: item.deviceUuid,
          deviceName: item.name,
          roomId: item.roomId,
          roomName: item.roomName,
          switchList: item.switchList,
        },
      })
    },

    confirmEditDevice(event: WechatMiniprogram.CustomEvent) {
      console.log('confirmEditDevice', event)
      const { detail } = event
      const item = bleDevicesBinding.store.bleDeivceList[this.data.editDeviceInfo.index]

      item.roomId = detail.roomId
      item.roomName = detail.roomName
      item.name = detail.deviceName
      item.switchList = detail.switchList

      this.setData({
        isEditDevice: false,
      })

      this.updateBleDeviceListView()
    },

    cancelEditDevice() {
      this.setData({
        isEditDevice: false,
      })
    },

    /**
     * 试一试
     */
    async tryControl(event: WechatMiniprogram.CustomEvent) {
      const { id } = event.currentTarget.dataset

      const bleDeviceItem = bleDevicesBinding.store.bleDeivceList.find((item) => item.deviceUuid === id) as IBleDevice

      if (bleDeviceItem.requesting) {
        return
      }

      bleDeviceItem.requesting = true

      this.updateBleDeviceListView()

      const res = await bleDeviceItem.client.sendCmd({
        cmdType: 'DEVICE_CONTROL',
        subType: 'haveTry',
      })

      console.log('tryControl-res', res)
      bleDeviceItem.client.close() // 发送指令完毕后需要断开已连接的设备，否则连接数满了之后无法连接新的设备

      bleDeviceItem.requesting = false

      this.updateBleDeviceListView()
    },

    // 重新添加
    async reAdd() {
      const failList = bleDevicesBinding.store.bleDeivceList.filter(
        (item: IBleDevice) => item.isChecked && item.status === 'fail',
      )

      for (const item of failList) {
        item.status = 'waiting'
        item.requestTimes = 20
        item.zigbeeRepeatTimes = 2
      }

      this.updateBleDeviceListView()

      this.beginAddDevice(failList)
    },

    finish() {
      homeBinding.store.updateCurrentHomeDetail()
      wx.closeBluetoothAdapter()

      wx.switchTab({
        url: '/pages/index/index',
      })
    },

    toggleSelectAll() {
      runInAction(() => {
        bleDevicesBinding.store.bleDeivceList = bleDevicesBinding.store.bleDeivceList.map((item) => ({
          ...item,
          isChecked: !this.data.isAllSelected,
        }))
      })
    },
  },
})
