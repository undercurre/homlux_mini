import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
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
    _isScaning: false,
    selectGatewayId: '',
    selectGatewaySn: '',
    subdeviceList: Array<string>(),
    _deviceInfo: {} as IAnyObject,
  },

  computed: {
    gatewayList(data) {
      const deviceList: Device.DeviceItem[] = (data as IAnyObject).deviceList || []

      return deviceList.filter((item) => item.deviceType === 1)
    },
    tipsText(data) {
      return data.subdeviceList.length ? `搜索到${data.subdeviceList.length}个附近的子设备` : '正在搜索附近子设备'
    },
  },

  lifetimes: {
    async ready() {
      await homeBinding.store.updateHomeInfo()

      await deviceBinding.store.updateAllRoomDeviceList()

      const params = wx.getLaunchOptionsSync()
      console.log('scanPage', params)

      // 防止重复判断
      if (getCurrentPages.length === 1 && params.scene === 1011) {
        const scanUrl = decodeURIComponent(params.query.q)

        console.log('scanUrl', scanUrl)

        this.handleScanUrl(scanUrl)

        return
      }

      this.initBle()
    },
  },

  pageLifetimes: {
    show() {
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
    async initWifi() {
      const deviceInfo = wx.getDeviceInfo()

      console.log('deviceInfo', deviceInfo)
      // Android 调用前需要 用户授权 scope.userLocation。该权限流程需前置，否则会出现在配网过程连接设备热点导致无法联网，请求失败
      if (deviceInfo.platform === 'android') {
        const authorizeRes = await wx
          .authorize({
            scope: 'scope.userLocation',
          })
          .catch((err) => err)

        console.log('authorizeRes', authorizeRes)

        if (authorizeRes.errno === 103) {
          wx.showToast({ title: '请打开权限', icon: 'none' })

          wx.openSetting({
            success(res) {
              console.log('authSetting', res.authSetting)
            },
          })

          wx.navigateBack()
          return
        }
      }
    },
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
      if (this.data._deviceInfo.type === 'single') {
        this.addSingleSubdevice()
      } else {
        this.addNearSubdevice()
      }

      this.setData({
        isShowGatewayList: false,
      })
    },

    async initBle() {
      wx.onBluetoothAdapterStateChange((changeRes) => {
        console.log('onBluetoothAdapterStateChange', changeRes)
      })

      // 初始化蓝牙模块
      const openBleRes = await wx.openBluetoothAdapter({
        mode: 'central',
      })

      console.log('scan-openBleRes', openBleRes)

      // 没有打开蓝牙异常处理
      if (openBleRes.errCode === 10001) {
        wx.openAppAuthorizeSetting({
          success(res) {
            console.log(res)
          },
        })

        return
      }

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
        interval: 3000,
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
      if (this.data._isScaning) {
        return
      }

      console.log('getQrCodeInfo', e, this.data._isScaning)

      this.setData({
        _isScaning: true,
      })

      const scanUrl = e.detail.result

      this.handleScanUrl(scanUrl)
    },

    async handleScanUrl(url: string) {
      wx.showLoading({
        title: 'loading',
      })

      const params = strUtil.getUrlParams(url)

      console.log('params', params)
      // const modelId = aesUtil.decrypt(params.pid, `midea@homlux${params.mac.substr(-4)}`, 'Hex')
      // console.log('modelId', modelId)

      // 获取云端的产品基本信息
      const res = await checkDevice({
        productId: params.pid,
        productIdType: params.mode === '01' ? 2 : 1,
      })

      console.log('checkDevice', res)

      if (!res.success) {
        wx.showToast({ title: '验证产品信息失败' })
      } else if (res.result && res.result.proType === '0x18') {
        this.bindGateway({
          ssid: params.ssid,
          dsn: params.dsn,
          deviceName: res.result.productName,
        })
      } else {
        this.data._deviceInfo = {
          type: 'single',
          proType: res.result.proType,
          deviceName: res.result.productName,
          mac: params.mac,
        }

        const flag = this.checkGateWayInfo()

        if (flag) {
          this.addSingleSubdevice()
        }
      }

      wx.hideLoading()

      setTimeout(() => {
        this.setData({
          _isScaning: false,
        })

        console.log('_isScaning', this.data._isScaning)
      }, 2000)
    },

    bindGateway(params: IAnyObject) {
      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/check-gateway/index', params),
      })
    },

    /**
     * 添加子设备时，检测是否已选择网关信息
     */
    checkGateWayInfo() {
      const gatewayId = this.data.selectGatewayId

      if (gatewayId) {
        return true
      }

      console.log('this.data.gatewayList', this.data.gatewayList)
      if (this.data.gatewayList.length === 0) {
        this.setData({
          isShowNoGatewayTips: true,
        })

        return false
      }

      if (this.data.gatewayList.length === 1 && this.data.gatewayList[0].onLineStatus === 1) {
        this.data.selectGatewayId = this.data.gatewayList[0].deviceId
        this.data.selectGatewaySn = this.data.gatewayList[0].sn
      } else {
        this.setData({
          isShowGatewayList: true,
        })

        return false
      }

      return true
    },
    /**
     * 添加附近搜索的子设备
     */
    addNearSubdevice() {
      this.data._deviceInfo.type = 'near'

      if (!this.checkGateWayInfo()) {
        return
      }

      const gatewayId = this.data.selectGatewayId,
        gatewaySn = this.data.selectGatewaySn

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/search-subdevice/index', {
          gatewayId,
          gatewaySn,
        }),
      })
    },

    // 添加单个子设备
    addSingleSubdevice() {
      const gatewayId = this.data.selectGatewayId,
        gatewaySn = this.data.selectGatewaySn

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/add-subdevice/index', {
          mac: this.data._deviceInfo.mac,
          gatewayId,
          gatewaySn,
          // modelId: modelId,
          deviceName: this.data._deviceInfo.productName,
        }),
      })
    },
  },
})
