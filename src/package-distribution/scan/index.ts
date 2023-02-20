import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { reaction } from 'mobx-miniprogram'
import { deviceBinding, homeBinding } from '../../store/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil } from '../../utils/index'
import { checkDevice } from '../../apis/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
    pureDataPattern: /^_/,
  },

  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] }), pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    isShowGatewayList: false,
    isShowNoGatewayTips: false,
    selectGatewayId: '',
    selectGatewaySn: '',
    subdeviceList: Array<string>(),
  },

  computed: {
    gatewayList(data) {
      const deviceList: Device.DeviceItem[] = (data as IAnyObject).deviceList

      return deviceList?.filter((item) => item.deviceType === 1)
    },
  },

  lifetimes: {
    async attached() {
      reaction(
        () => homeBinding.store.currentHomeDetail.houseId,
        () => {
          deviceBinding.store.updateAllRoomDeviceList()
        },
      )

      const systemSetting = wx.getSystemSetting()

      console.log('systemSetting', systemSetting)

      // let authorizeRes = await wx.authorize({
      //   scope: 'scope.bluetooth'
      // })

      // console.log('authorizeRes', authorizeRes)

      this.initBle()
    },
  },

  pageLifetimes: {
    show() {
      // this.getQrCodeInfo({
      //   detail: {
      //     result:
      //       'https://homlux.meizgd.com/homelux/qrCode.html?v=1&mode=02&pid=8d531b6a944a454e9fb15d3cc1f4d55b&ssid=midea_16_E5FB&dsn=000016111MSGWZ00288B1539E5FB0000',
      //   },
      // }) // todo: 测试代码
      console.log('show')
    },
    hide() {
      console.log('hide')
      wx.closeBluetoothAdapter()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    showGateListPopup() {
      this.setData({
        isShowGatewayList: true,
      })
    },

    async selectGateway(event: WechatMiniprogram.CustomEvent) {
      console.log('selectGateway', event)
      const { index } = event.currentTarget.dataset

      const item = this.data.gatewayList[index]

      if (item.onLineStatus === 0) {
        return
      }

      this.setData({
        selectGatewayId: item.deviceId,
        selectGatewaySn: item.sn,
      })
    },

    confirmGateway() {
      this.addNearSubdevice()
    },

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
        const subdeviceList = res.devices.filter((item) => {
          let flag = false

          // localName为homlux_ble且没有被发现过的
          if (
            item.localName &&
            item.localName.includes('homlux_ble') &&
            this.data.subdeviceList.findIndex((listItem) => item.deviceId === listItem) < 0
          ) {
            flag = true
          }

          return flag
        })

        if (subdeviceList.length <= 0) return

        console.log('onBluetoothDeviceFound', subdeviceList)
        this.setData({
          subdeviceList: this.data.subdeviceList.concat(subdeviceList.map((item) => item.deviceId)),
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
        selectGatewayId: '',
        selectGatewaySn: '',
      })
    },
    /**
     * 扫码解析
     * 网关id：1676277426246918    子设备id：5C0272FFFE0E0826    蓝牙id：26
     */
    async getQrCodeInfo(e: WechatMiniprogram.CustomEvent) {
      wx.vibrateShort({ type: 'heavy' }) // 轻微震动

      console.log('getQrCodeInfo', e)

      const scanUrl = e.detail.result

      const params = strUtil.getUrlParams(scanUrl)

      console.log('params', params)

      // 获取云端的产品基本信息
      const res = await checkDevice({
        productId: params.pid,
        productIdType: params.mode === '01' ? 2 : 1,
      })

      console.log('checkDevice', res)

      if (params.ssid && params.ssid.includes('midea_16')) {
        this.bindGateway(params)
      }
    },

    bindGateway(params: IAnyObject) {
      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/check-gateway/index', {
          ssid: params.ssid,
          dsn: params.dsn,
          deviceName: '智能网关',
        }),
      })
    },

    /**
     * 添加附近搜索的子设备
     */
    addNearSubdevice() {
      let gatewayId = this.data.selectGatewayId,
        gatewaySn = this.data.selectGatewaySn

      if (this.data.gatewayList.length === 0) {
        this.setData({
          isShowNoGatewayTips: true,
        })

        return
      }

      if (!gatewayId && this.data.gatewayList.length === 1) {
        gatewayId = this.data.gatewayList[0].deviceId
        gatewaySn = this.data.gatewayList[0].sn
      } else if (!gatewayId) {
        this.setData({
          isShowGatewayList: true,
        })

        return
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/search-subdevice/index', {
          gatewayId,
          gatewaySn,
        }),
      })
    },
  },
})
