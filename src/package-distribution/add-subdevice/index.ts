import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, roomBinding, deviceBinding } from '../../store/index'
import { bleUtil, strUtil, BleClient, getCurrentPageParams, emitter, WSEventType } from '../../utils/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { sendCmdAddSubdevice, bindDevice, queryDeviceOnlineStatus } from '../../apis/index'
import { IBleDevice } from './typings'

type StatusName = 'linking' | 'error'
let deviceNum = 0

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
    _timeId: 0,
    status: 'linking' as StatusName,
    activeIndex: 0,
    pageParams: {} as IAnyObject,
    _hasFound: false, // 是否已经找到指定mac设备
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    ready: function () {
      const pageParams = getCurrentPageParams()
      console.log('pageParams', pageParams)

      pageParams.deviceName = pageParams.deviceName || '子设备'
      pageParams.deviceIcon = pageParams.deviceIcon || ''

      deviceNum = deviceBinding.store.allRoomDeviceList.filter((item) => item.proType === pageParams.proType).length // 数量

      this.setData({
        pageParams,
      })
      this.initBle()

      // 60s超时处理
      setTimeout(() => {
        this.setData({
          status: 'error',
        })

        emitter.off('bind_device')
      }, 60000)

      emitter.on('bind_device', (data) => {
        console.log('bind_device', data)

        if (data.deviceId === this.data.pageParams.mac) {
          this.queryDeviceOnlineStatus()
        }
      })
    },
    detached: function () {
      wx.closeBluetoothAdapter()
    },
  },

  pageLifetimes: {
    hide() {},
  },

  methods: {
    async initBle() {
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
          if (item.localName && item.localName.includes('homlux_ble')) {
            flag = true
          }

          return flag
        })
        deviceList.forEach((item) => {
          this.handleBleDeviceInfo(item)
        })
      })

      // 开始搜寻附近的蓝牙外围设备
      wx.startBluetoothDevicesDiscovery({
        // services: ['BAE55B96-7D19-458D-970C-50613D801BC9'],
        allowDuplicatesKey: false,
        powerLevel: 'high',
        interval: 3000,
        success: (res) => {
          console.log('startBluetoothDevicesDiscovery', res)
        },
      })
    },

    /**
     * 检查是否目标设备
     */
    async handleBleDeviceInfo(device: WechatMiniprogram.BlueToothDevice) {
      const msgObj = bleUtil.transferBroadcastData(device.advertisData)
      const targetMac = this.data.pageParams.mac // 云端的是zigbee模块的mac

      if (targetMac !== msgObj.zigbeeMac) {
        return false
      }

      if (this.data._hasFound) {
        console.error('重复发现目标蓝牙设备')
        return false
      }

      this.data._hasFound = true
      clearTimeout(this.data._timeId)
      console.log('Device Found', device, msgObj)

      wx.stopBluetoothDevicesDiscovery()

      const bleDevice: IBleDevice = {
        deviceUuid: device.deviceId,
        mac: msgObj.mac,
        zigbeeMac: '',
        icon: this.data.pageParams.deviceIcon,
        name: this.data.pageParams.deviceName,
        client: new BleClient({ mac: msgObj.mac, deviceUuid: device.deviceId }),
        roomId: '',
        roomName: '',
        status: 'waiting',
        requestTimes: 20,
        zigbeeRepeatTimes: 3,
      }

      this.confirmAdd(bleDevice)

      return true
    },

    // 确认添加设备
    async confirmAdd(bleDevice: IBleDevice) {
      this.setData({
        activeIndex: 1,
      })
      this.startZigbeeNet(bleDevice)

      const res = await sendCmdAddSubdevice({
        deviceId: this.data.pageParams.gatewayId,
        expire: 60,
        buzz: 1,
      })

      if (!res.success) {
        this.setData({
          status: 'error',
        })

        return
      }
    },

    async startZigbeeNet(bleDevice: IBleDevice) {
      bleDevice.zigbeeRepeatTimes--

      const res = await bleDevice.client.startZigbeeNet()

      // 配网指令允许重发3次
      if (!res.success && bleDevice.zigbeeRepeatTimes > 0) {
        this.startZigbeeNet(bleDevice)
        return
      }

      if (res.success) {
        bleDevice.zigbeeMac = res.result.zigbeeMac

        // this.queryDeviceOnlineStatus(bleDevice)
      } else {
        this.setData({
          status: 'error',
        })
      }

      bleDevice.client.close()
    },

    async queryDeviceOnlineStatus() {
      // const queryRes = await queryDeviceOnlineStatus({
      //   deviceId: device.zigbeeMac,
      //   deviceType: '2',
      //   sn: this.data.pageParams.gatewaySn,
      // })

      // console.log('queryDeviceOnlineStatus', queryRes)

      // if (queryRes.result.onlineStatus === 0) {
      //   // 限制最多查询云端设备在线状态次数：device.requestTimes，超过则置为失败
      //   device.requestTimes--

      //   if (device.requestTimes <= 0) {
      //     this.setData({
      //       status: 'error',
      //     })

      //     return
      //   }

      //   setTimeout(() => {
      //     this.queryDeviceOnlineStatus(device)
      //   }, 3000)

      //   return
      // }

      this.setData({
        activeIndex: 2,
      })

      const res = await bindDevice({
        deviceId: this.data.pageParams.mac,
        houseId: homeBinding.store.currentHomeId,
        roomId: roomBinding.store.currentRoom.roomId,
        sn: '',
        deviceName: this.data.pageParams.deviceName + (deviceNum > 0 ? ++deviceNum : ''),
      })

      if (res.success && res.result.isBind) {
        this.setData({
          activeIndex: 3,
        })
        wx.redirectTo({
          url: strUtil.getUrlWithParams('/package-distribution/bind-home/index', {
            deviceId: res.result.deviceId,
          }),
        })
      } else {
        this.setData({
          status: 'error',
        })
      }
    },

    finish() {
      wx.switchTab({
        url: '/pages/index/index',
      })
    },
  },
})
