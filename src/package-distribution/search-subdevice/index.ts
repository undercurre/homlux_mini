import { ComponentWithComputed } from 'miniprogram-computed'
import { ble, strUtil } from '../../utils/index'
import { IBleDevice } from './types'
import pageBehaviors from '../../behaviors/pageBehaviors'

type StatusName = 'discover' | 'requesting' | 'success' | 'error' | 'openBle'

interface PageData {
  isEditDevice: boolean // 是否编辑设备信息
  deviceList: Array<IBleDevice>
  failList: Array<IBleDevice>
  pageTitle: string
  status: StatusName
}

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },

  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEditDevice: false,
    deviceList: Array<IBleDevice>(),
    failList: Array<IBleDevice>(),
    status: 'discover',
  } as PageData,

  computed: {
    pageTitle(data: PageData) {
      const titleMap = {
        discover: '附近的子设备',
        requesting: '添加设备',
        success: '添加设备',
        error: '附近的子设备',
        openBle: '附近的子设备',
      }

      return titleMap[data.status]
    },
    checkedDeviceNum(data: PageData) {
      return data.deviceList.filter((item) => item.isChecked).length
    },
  },

  methods: {
    async initBle() {
      wx.onBluetoothAdapterStateChange((changeRes) => {
        console.log('onBluetoothAdapterStateChange', changeRes)
      })

      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
        if (res.devices.length <= 0) return

        const list: IBleDevice[] = res.devices
          .filter((item) => {
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
          .map((device) => {
            // 这里可以做一些过滤
            const dataMsg = strUtil.ab2hex(device.advertisData)
            const msgObj = ble.transferBroadcastData(dataMsg)

            console.log('Device Found', device, dataMsg, msgObj)
            return {
              deviceUuid: device.deviceId,
              mac: msgObj.mac,
              icon: '/assets/img/device/light.png',
              name: '设备',
              isCheck: false,
            }
          })

        this.setData({
          deviceList: this.data.deviceList.concat(list),
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

      wx.onBLECharacteristicValueChange(function (res) {
        console.log(`onBLECharacteristicValueChange ${res.characteristicId} has changed, now is ${res.value}`)
        console.log(strUtil.ab2hex(res.value))
      })

      // 初始化蓝牙模块
      const openBleRes = await wx.openBluetoothAdapter({
        mode: 'central',
      })

      console.log('openBleRes', openBleRes)

      // 开始搜寻附近的蓝牙外围设备
      wx.startBluetoothDevicesDiscovery({
        // services: ['BAE55B96-7D19-458D-970C-50613D801BC9'],
        allowDuplicatesKey: false,
        powerLevel: 'high',
        success(res) {
          console.log('startBluetoothDevicesDiscovery', res)
        },
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
    confirmAdd() {
      this.setData({
        status: 'requesting',
      })
    },

    editDevice() {
      this.setData({
        isEditDevice: true,
      })
    },

    // 重新添加
    reAdd() {},

    finish() {
      wx.switchTab({
        url: '/pages/index/index',
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
      const date1 = Date.now()
      console.log('tryControl', event)

      const deviceId = event.currentTarget.dataset.id

      const connectRes = await wx.createBLEConnection({
        deviceId, // 搜索到设备的 deviceId
      })

      console.log('connectRes', connectRes, Date.now() - date1)

      // 连接成功，获取服务
      const bleServiceRes = await wx.getBLEDeviceServices({
        deviceId,
      })

      console.log('bleServiceRes', bleServiceRes)

      // const characRes = await wx.getBLEDeviceCharacteristics({})

      // console.log('getBLEDeviceCharacteristics', characRes)
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {
      this.initBle()
    },
    moved: function () {},
    detached: function () {
      // wx.stopBluetoothDevicesDiscovery()
    },
  },

  pageLifetimes: {
    hide() {
      // wx.stopBluetoothDevicesDiscovery()
    },
  },
})
