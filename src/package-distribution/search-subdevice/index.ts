import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, roomBinding } from '../../store/index'
import { bleUtil, strUtil, BleClient, getCurrentPageParams } from '../../utils/index'
import { IBleDevice } from './types'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { sendCmdAddSubdevice, bindDevice, queryDeviceOnlineStatus, checkDevice } from '../../apis/index'

type StatusName = 'discover' | 'requesting' | 'success' | 'error' | 'openBle'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEditDevice: false,
    editDeviceInfo: {
      index: -1,
      deviceId: '',
      deviceName: '',
      roomId: '',
    },
    deviceList: Array<IBleDevice>(),
    status: 'discover' as StatusName,
  },

  computed: {
    pageTitle(data) {
      const titleMap = {
        discover: '附近的子设备',
        requesting: '添加设备',
        success: '添加设备',
        error: '附近的子设备',
        openBle: '附近的子设备',
      }

      return titleMap[data.status]
    },
    defaultRoom(data) {
      const list = data.currentHomeDetail?.roomList || []
      return list[0] || {}
    },
    selectedList(data) {
      return data.deviceList.filter((item) => item.isChecked) as IBleDevice[]
    },
    failList(data) {
      return data.selectedList.filter((item: IBleDevice) => item.status === 'fail') as IBleDevice[]
    },
    successList(data) {
      return data.selectedList.filter((item: IBleDevice) => item.status === 'success')
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    ready: function () {
      this.initBle()
    },
    moved: function () {},
    detached: function () {
      wx.closeBluetoothAdapter()
    },
  },

  pageLifetimes: {
    hide() {},
  },

  methods: {
    openSystemBluetoothSetting() {
      wx.openSystemBluetoothSetting({
        success(res) {
          console.log('openSystemBluetoothSetting', res)
        },
      })
    },

    openAppAuthorizeSetting() {
      wx.openAppAuthorizeSetting({
        success(res) {
          console.log('openAppAuthorizeSetting', res)
        },
      })
    },
    async initBle() {
      wx.onBluetoothAdapterStateChange((changeRes) => {
        console.log('onBluetoothAdapterStateChange', changeRes)
      })

      // 初始化蓝牙模块
      const openBleRes = await wx
        .openBluetoothAdapter({
          mode: 'central',
        })
        .catch((error) => error)

      console.log('openBleRes', openBleRes)

      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
        const deviceList = res.devices.filter((item) => {
          let flag = false

          // localName为homlux_ble且没有被发现过的
          if (
            item.localName &&
            item.localName.includes('homlux_ble') &&
            this.data.deviceList.findIndex((listItem) => item.deviceId === listItem.deviceUuid) < 0
          ) {
            flag = true
          }

          return flag
        })

        if (deviceList.length <= 0) return

        deviceList.forEach((device) => {
          this.handleBleDeviceInfo(device)
        })
      })

      wx.onBLEConnectionStateChange(function (res) {
        // 该方法回调中可以用于处理连接意外断开等异常情况
        console.log(
          'onBLEConnectionStateChange',
          res,
          `device ${res.deviceId} state has changed, connected: ${res.connected}`,
        )
      })

      // 开始搜寻附近的蓝牙外围设备
      wx.startBluetoothDevicesDiscovery({
        // services: ['BAE55B96-7D19-458D-970C-50613D801BC9'],
        allowDuplicatesKey: false,
        powerLevel: 'high',
        interval: 3000,
        success(res) {
          console.log('startBluetoothDevicesDiscovery', res)
        },
      })
    },

    async handleBleDeviceInfo(device: WechatMiniprogram.BlueToothDevice) {
      const dataMsg = strUtil.ab2hex(device.advertisData)
      const msgObj = bleUtil.transferBroadcastData(dataMsg)

      console.log('Device Found', device, dataMsg, msgObj)

      await checkDevice({
        mac: msgObj.mac,
        productId: '26',
        productIdType: 2,
      })

      const bleDevice: IBleDevice = {
        deviceUuid: device.deviceId,
        mac: msgObj.mac,
        zigbeeMac: '',
        icon: '/assets/img/device/light.png',
        name: '子设备' + msgObj.mac.substr(-4, 4),
        isChecked: false,
        client: new BleClient({ mac: msgObj.mac, deviceUuid: device.deviceId }),
        roomId: '',
        roomName: '',
        status: 'waiting',
        requestTimes: 20,
        requesting: false,
      }

      this.data.deviceList.push(bleDevice)

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    // 切换选择发现的设备
    toggleDevice(e: WechatMiniprogram.CustomEvent) {
      console.log('toggleDevice', e)
      const index = e.currentTarget.dataset.index as number
      const item = this.data.deviceList[index]

      item.isChecked = !item.isChecked

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    // 确认添加设备
    async confirmAdd() {
      const pageParams = getCurrentPageParams()

      wx.stopBluetoothDevicesDiscovery()

      const res = await sendCmdAddSubdevice({
        deviceId: pageParams.gatewayId,
        expire: 60,
        buzz: 1,
      })

      if (!res.success) {
        wx.showToast({ title: res.msg })
        return
      }

      this.setData({
        status: 'requesting',
      })

      const list = this.data.selectedList

      for (const item of list) {
        this.startZigbeeNet(item)
      }
    },

    async startZigbeeNet(bleDevice: IBleDevice) {
      const res = await bleDevice.client.startZigbeeNet()

      if (res.success) {
        bleDevice.zigbeeMac = res.result.zigbeeMac

        this.queryDeviceOnlineStatus(bleDevice)
      } else {
        bleDevice.status = 'fail'

        this.setData({
          deviceList: this.data.deviceList,
        })
      }
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
          this.setData({
            deviceList: this.data.deviceList,
          })

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
        roomId: device.roomId || this.data.defaultRoom.roomId,
        sn: '',
        deviceName: device.name,
      })

      if (res.success && res.result.isBind) {
        device.status = 'success'
      } else {
        device.status = 'fail'
      }

      this.setData({
        deviceList: this.data.deviceList,
      })
    },
    /**
     * 编辑设备信息
     * @param event
     */
    editDevice(event: WechatMiniprogram.BaseEvent) {
      console.log('editDevice', event)

      const { index } = event.currentTarget.dataset

      const item = this.data.deviceList[index]

      console.log('item', item)

      this.setData({
        isEditDevice: true,
        editDeviceInfo: {
          index: index,
          deviceId: item.deviceUuid,
          deviceName: item.name,
          roomId: item.roomId || this.data.defaultRoom.roomId,
        },
      })
    },

    confirmEditDevice(event: WechatMiniprogram.CustomEvent) {
      console.log('confirmEditDevice', event)
      const { detail } = event
      const item = this.data.deviceList[this.data.editDeviceInfo.index]

      item.roomId = detail.roomId
      item.roomName = detail.roomName
      item.name = detail.deviceName

      this.setData({
        isEditDevice: false,
        deviceList: this.data.deviceList,
      })
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

      console.log('tryControl', event, id)

      const bleDeviceItem = this.data.deviceList.find((item) => item.deviceUuid === id) as IBleDevice

      bleDeviceItem.requesting = true

      this.setData({
        deviceList: this.data.deviceList,
      })
      const res = await bleDeviceItem.client.sendCmd({
        cmdType: 'control',
        subType: 'haveTry',
      })

      console.log('tryControl-res', res)

      bleDeviceItem.requesting = false

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    // 重新添加
    async reAdd() {
      const pageParams = getCurrentPageParams()

      const res = await sendCmdAddSubdevice({
        deviceId: pageParams.gatewayId,
        expire: 60,
        buzz: 1,
      })

      if (!res.success) {
        return
      }

      this.setData({
        status: 'requesting',
      })

      const list = this.data.failList

      for (const item of list) {
        item.status = 'waiting'
        item.requestTimes = 20

        this.startZigbeeNet(item)
      }

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    finish() {
      roomBinding.store.updateRoomList()

      wx.switchTab({
        url: '/pages/index/index',
      })
    },

    selectAll() {
      this.setData({
        deviceList: this.data.deviceList.map((item) => ({
          ...item,
          isChecked: true,
        })),
      })
    },
  },
})
