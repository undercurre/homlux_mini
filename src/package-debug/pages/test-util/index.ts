import pageBehavior from '../../../behaviors/pageBehaviors'
import { Logger, strUtil, isValidHomluxLink } from '../../../utils/index'
import { BleClient, bleUtil, IAdData } from '../../../utils/bleProtocol'

Component({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    mac: '',
    _hasFound: false,
    _timeId: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async startScan() {
      // 只允许从相机扫码
      const scanRes = await wx
        .scanCode({
          onlyFromCamera: true,
          scanType: ['qrCode'],
        })
        .catch((err) => err)

      console.log('scanCode', scanRes)

      if (!scanRes.result) {
        return
      }

      const url = scanRes.result

      if (!isValidHomluxLink(url)) {
        wx.showToast({
          title: '无效二维码',
          icon: 'error',
          duration: 2000,
        })

        return
      }

      const pageParams = strUtil.getUrlParams(url)

      Logger.log('scanParams', pageParams)

      // mode 配网方式 （00代表AP配网，01代表蓝牙配网， 02代表AP+有线）
      // 带蓝牙子设备
      if (pageParams.mode === '01' && pageParams.mac) {
        this.startZigbee(pageParams.mac)
      } else {
        wx.showToast({
          title: '无效二维码',
          icon: 'error',
          duration: 2000,
        })
      }
    },

    async initBle() {
      bleUtil.initBle()

      // 初始化蓝牙模块
      const openBleRes = await wx
        .openBluetoothAdapter({
          mode: 'central',
        })
        .catch((error) => error)

      Logger.log('openBleRes', openBleRes)

      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
        const deviceList = res.devices.filter((item) => {
          let flag = false
          // localName为homlux_ble、homlux
          if (item.localName && ['homlux_ble', 'homlux'].includes(item.localName)) {
            flag = true
          }

          return flag
        })

        for (const item of deviceList) {
          const msgObj = bleUtil.transferBroadcastData(item.advertisData)
          const targetMac = this.data.mac // 云端的是zigbee模块的mac

          if (this.data._hasFound) {
            console.error('已执行过发现目标蓝牙设备，中断流程')
            break
          }

          if (targetMac !== msgObj.zigbeeMac) {
            continue
          }

          wx.showLoading({
            title: '正在连接设备',
            mask: true,
          })

          this.data._hasFound = true
          Logger.log('Device Found', item, msgObj)

          wx.stopBluetoothDevicesDiscovery()
          wx.offBluetoothDeviceFound()
          clearTimeout(this.data._timeId)

          this.handleBleDeviceInfo({
            ...item,
            ...msgObj,
          })

          break
        }
      })

      // 开始搜寻附近的蓝牙外围设备
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        powerLevel: 'high',
        interval: 3000,
        success: (res) => {
          console.log('startBluetoothDevicesDiscovery-添加单个子设备', res)
        },
      })
    },

    /**
     * 检查是否目标设备
     */
    handleBleDeviceInfo(device: WechatMiniprogram.BlueToothDevice & IAdData) {
      this.sendZigbeeCmd({ mac: device.mac, deviceId: device.deviceId, protocolVersion: device.protocolVersion })
      return true
    },

    async sendZigbeeCmd(device: { mac: string; deviceId: string; protocolVersion: string }) {
      const client = new BleClient({
        mac: device.mac,
        deviceUuid: device.deviceId,
        modelId: '',
        proType: '',
        protocolVersion: device.protocolVersion,
      })

      const res = await client.startZigbeeNet({})

      if (res.success) {
        wx.showToast({
          title: '进入配网状态成功',
          icon: 'success',
          duration: 2000,
        })
      } else {
        wx.showToast({
          title: '进入配网状态失败',
          icon: 'error',
          duration: 2000,
        })
      }
    },

    /**
     * 开始让子设备进入配网
     */
    async startZigbee(mac: string) {
      this.data.mac = mac
      this.data._hasFound = false
      this.initBle()

      wx.showLoading({
        title: '正在寻找设备',
        mask: true,
      })
      // 扫码子设备，20s超时处理，无论是否发现目标子设备
      this.data._timeId = setTimeout(async () => {
        wx.showToast({
          title: '没有发现子设备',
          icon: 'error',
          duration: 2000,
        })
        console.error(`没有发现子设备${mac}`)
      }, 20000)
    },
  },
})
