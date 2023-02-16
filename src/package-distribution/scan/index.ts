import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil } from '../../utils/index'

let sacnUrl = '' // 正在解析的url

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    isShowGatewayList: false,
    deviceList: Array<string>(),
  },

  lifetimes: {
    attached() {
      const systemSetting = wx.getSystemSetting()

      console.log('systemSetting', systemSetting)

      this.initBle()
    },
  },

  pageLifetimes: {
    show() {
      console.log('show')
    },
    hide() {
      console.log('hide')
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async initBle() {
      wx.onBluetoothAdapterStateChange((changeRes) => {
        console.log('onBluetoothAdapterStateChange', changeRes)
      })

      // 初始化蓝牙模块
      const openBleRes = await wx.openBluetoothAdapter({
        mode: 'central',
      })

      console.log('openBleRes', openBleRes)

      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
        const deviceList = res.devices.filter((item) => {
          let flag = false

          // localName为homlux_ble且没有被发现过的
          if (
            item.localName &&
            item.localName.includes('homlux_ble') &&
            this.data.deviceList.findIndex((listItem) => item.deviceId === listItem) < 0
          ) {
            flag = true
          }

          return flag
        })

        if (deviceList.length <= 0) return

        this.setData({
          deviceList: this.data.deviceList.concat(deviceList.map((item) => item.deviceId)),
        })
      })

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

    onCloseGwList() {
      this.setData({
        isShowGatewayList: false,
      })
    },
    /**
     * 扫码解析
     */
    getQrCodeInfo(e: WechatMiniprogram.CustomEvent) {
      wx.vibrateShort({ type: 'heavy' }) // 轻微震动

      console.log('getQrCodeInfo', e)

      sacnUrl = e.detail.result

      const params = strUtil.getUrlParams(sacnUrl)

      console.log('params', params)

      if (params.ssid && params.ssid.includes('midea_16')) {
        this.bindGateway(params)
      }
    },

    toSearchSubDevice() {
      wx.redirectTo({
        url: '/package-distribution/search-subdevice/index',
      })
    },

    bindGateway(params: IAnyObject) {
      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/check-gateway/index', {
          ssid: params.ssid,
          dsn: params.dsn,
        }),
      })
    },

    /**
     * 添加附近搜索的子设备
     */
    addNearSubdevice() {
      wx.navigateTo({
        url: '/package-distribution/add-subdevice/index',
      })
    },
  },
})
