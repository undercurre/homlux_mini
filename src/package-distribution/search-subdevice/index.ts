import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding, roomBinding } from '../../store/index'
import { bleUtil, strUtil, BleClient, getCurrentPageParams } from '../../utils/index'
import { IBleDevice } from './types'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { sendCmdAddSubdevice, bindDevice, queryDeviceOnlineStatus, queryProtypeInfo } from '../../apis/index'
import lottie from 'lottie-miniprogram'
import { addDevice } from '../../assets/lottie/index'

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

      this.setData({
        deviceList: JSON.parse(
          '[{"deviceUuid":"086DDD30-219D-6655-AC69-4A0C9036442B","mac":"04CD15AEA756","zigbeeMac":"","icon":"https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/midea.light.003.002-3.png","name":"灯具A756","isChecked":false,"client":{"key":"midea@homluxA756","serviceId":"BAE55B96-7D19-458D-970C-50613D801BC9","characteristicId":"","msgId":0,"mac":"04CD15AEA756","deviceUuid":"086DDD30-219D-6655-AC69-4A0C9036442B"},"roomId":"","roomName":"","status":"waiting","requestTimes":20,"requesting":false,"zigbeeRepeatTimes":3},{"deviceUuid":"086DDD30-219D-6655-AC69-4A0C9036442B","mac":"04CD15AEA756","zigbeeMac":"","icon":"https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/midea.light.003.002-3.png","name":"灯具A756","isChecked":false,"client":{"key":"midea@homluxA756","serviceId":"BAE55B96-7D19-458D-970C-50613D801BC9","characteristicId":"","msgId":0,"mac":"04CD15AEA756","deviceUuid":"086DDD30-219D-6655-AC69-4A0C9036442B"},"roomId":"","roomName":"","status":"waiting","requestTimes":20,"requesting":false,"zigbeeRepeatTimes":3}]',
        ),
      })
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

      wx.onBLEConnectionStateChange((res) => {
        const item = this.data.deviceList.find((item) => item.deviceUuid === res.deviceId) as IBleDevice

        // 该方法回调中可以用于处理连接意外断开等异常情况
        console.log(
          `mac: ${item.mac}`,
          'onBLEConnectionStateChange-search-subdevice',
          res,
          `device ${res.deviceId} state has changed, connected: ${res.connected}`,
        )
      })

      // 开始搜寻附近的蓝牙外围设备
      wx.startBluetoothDevicesDiscovery({
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

      const infoRes = await queryProtypeInfo({
        proType: `0x${msgObj.deviceCategory}`,
        mid: `0x${msgObj.deviceModel}`,
      })

      if (!infoRes.success) {
        return
      }

      const bleDevice: IBleDevice = {
        deviceUuid: device.deviceId,
        mac: msgObj.mac,
        zigbeeMac: '',
        icon: infoRes.result.icon || '/assets/img/device/gateway.png',
        name: infoRes.result.productName + msgObj.mac.substr(-4, 4),
        isChecked: false,
        client: new BleClient({ mac: msgObj.mac, deviceUuid: device.deviceId }),
        roomId: '',
        roomName: '',
        status: 'waiting',
        requestTimes: 20,
        requesting: false,
        zigbeeRepeatTimes: 3,
      }

      console.log('bleDevice', JSON.stringify(bleDevice))

      this.data.deviceList.push(bleDevice)

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    // 切换选择发现的设备
    toggleDevice(e: WechatMiniprogram.CustomEvent) {
      const index = e.currentTarget.dataset.index as number
      const item = this.data.deviceList[index]

      console.log('toggleDevice', item)

      item.isChecked = !item.isChecked

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    // 确认添加设备
    async confirmAdd() {
      try {
        const pageParams = getCurrentPageParams()

        wx.stopBluetoothDevicesDiscovery().catch((err) => err)

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

        setTimeout(() => {
          this.startAnimation()
        }, 300)

        const list = this.data.selectedList

        for (const item of list) {
          await this.startZigbeeNet(item)
        }
      } catch (err) {
        console.log('confirmAdd-err', err)
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

        this.queryDeviceOnlineStatus(bleDevice)
      } else {
        console.error(`子设备配网失败：${bleDevice.mac}`, res)
        bleDevice.status = 'fail'

        this.setData({
          deviceList: this.data.deviceList,
        })
      }

      bleDevice.client.close()
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

      console.log('tryControl', id)

      const bleDeviceItem = this.data.deviceList.find((item) => item.deviceUuid === id) as IBleDevice

      if (bleDeviceItem.requesting) {
        return
      }

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

      sendCmdAddSubdevice({
        deviceId: pageParams.gatewayId,
        expire: 60,
        buzz: 1,
      })
    },

    finish() {
      homeBinding.store.updateCurrentHomeDetail()

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
