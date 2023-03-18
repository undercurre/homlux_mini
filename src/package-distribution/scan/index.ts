import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding, homeBinding } from '../../store/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil } from '../../utils/index'
import { checkDevice, queryProtypeInfo } from '../../apis/index'

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
    isShowGatewayList: false, // 是否展示选择网关列表弹窗
    isShowNoGatewayTips: false, // 是否展示添加网关提示弹窗
    _isScaning: false, // 是否正在扫码
    _isInitBle: false, // 是否已经初始化蓝牙
    bleStatus: '',
    isFlash: false,
    selectGatewayId: '',
    selectGatewaySn: '',
    subdeviceList: Array<string>(),
    deviceInfo: {} as IAnyObject,
  },

  computed: {
    gatewayList(data) {
      const allRoomDeviceList: Device.DeviceItem[] = (data as IAnyObject).allRoomDeviceList || []

      return allRoomDeviceList.filter((item) => item.deviceType === 1)
    },
    tipsText(data) {
      return data.subdeviceList.length ? `搜索到${data.subdeviceList.length}个附近的子设备` : '正在搜索附近子设备'
    },
  },

  lifetimes: {
    async ready() {
      await homeBinding.store.updateHomeInfo()

      const params = wx.getLaunchOptionsSync()
      console.log(
        'scanPage',
        params,
        'wx.getEnterOptionsSync()',
        wx.getEnterOptionsSync(),
        'getCurrentPages()',
        getCurrentPages(),
      )

      wx.onBluetoothAdapterStateChange((res) => {
        console.log('onBluetoothAdapterStateChange-scan', res)
        this.setData({
          bleStatus: res.available ? 'open' : 'close',
        })
        if (res.available) {
          this.initBle()
        }
      })

      this.initWifi()

      // 是否已打开蓝牙
      const res = await this.checkBle()

      if (!res) {
        return
      } else {
        this.initBle()
      }

      // 防止重复判断,仅通过微信扫码直接进入该界面时判断场景值
      if (getCurrentPages().length === 1 && params.scene === 1011) {
        const scanUrl = decodeURIComponent(params.query.q)

        console.log('scanUrl', scanUrl)

        this.handleScanUrl(scanUrl)

        return
      }
    },
  },

  pageLifetimes: {
    async show() {
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
    test() {
      wx.scanCode({
        success(res) {
          console.log(res)
        },
      })
    },
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
          await wx.showModal({ content: '请打开位置权限，否则无法正常使用配网' })

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
      if (this.data.deviceInfo.type === 'single') {
        this.addSingleSubdevice()
      } else {
        this.addNearSubdevice()
      }

      this.setData({
        isShowGatewayList: false,
      })
    },

    async checkBle() {
      const res = wx.getSystemSetting()

      console.log('getSystemSetting', res)

      this.setData({
        bleStatus: res.bluetoothEnabled ? 'open' : 'close',
      })
      // 没有打开蓝牙异常处理
      if (!res.bluetoothEnabled) {
        // const deviceInfo = wx.getDeviceInfo()

        wx.showModal({
          content: '“Homlux”想开启您的蓝牙功能用于设备配网',
          showCancel: false,
          confirmText: '确定',
          confirmColor: '#27282A',
          success: (bleDialogRes) => {
            console.log('bleDialogRes', bleDialogRes)
          },
        })
      }

      return res.bluetoothEnabled
    },

    async initBle() {
      if (this.data._isInitBle) {
        return
      }

      this.data._isInitBle = true

      // 初始化蓝牙模块
      const openBleRes = await wx
        .openBluetoothAdapter({
          mode: 'central',
        })
        .catch((err) => err)

      console.log('scan-openBleRes', openBleRes)

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

      const scanUrl = e.detail.result

      if (!scanUrl.includes('meizgd.com/homlux/qrCode.html')) {
        return
      }

      this.handleScanUrl(scanUrl)
    },

    toggleFlash() {
      this.setData({
        isFlash: !this.data.isFlash,
      })
    },

    async handleScanUrl(url: string) {
      this.setData({
        _isScaning: true,
      })

      wx.showLoading({
        title: 'loading',
      })

      const pageParams = strUtil.getUrlParams(url)

      console.log('pageParams', pageParams)

      // mode 配网方式 （00代表AP配网，01代表蓝牙配网， 02代表AP+有线）
      if (pageParams.mode === '01') {
        // 子设备
        await this.bindSubDevice(pageParams)
      } else if (pageParams.mode === '02') {
        // 网关绑定逻辑
        await this.bindGateway(pageParams)
      }

      // 延迟复位扫码状态，防止安卓端短时间重复执行扫码逻辑
      setTimeout(() => {
        this.setData({
          _isScaning: false,
        })

        console.log('_isScaning', this.data._isScaning)
      }, 2000)

      wx.hideLoading()
    },

    async bindGateway(params: IAnyObject) {
      const res = await queryProtypeInfo({
        pid: params.pid,
      })

      if (!res.success) {
        wx.showToast({ title: '验证产品信息失败', icon: 'error' })

        return
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/check-gateway/index', {
          ssid: params.ssid,
          deviceName: res.result.productName,
        }),
      })
    },

    async bindSubDevice(params: IAnyObject) {
      const res = await checkDevice({ dsn: params.sn })

      if (!res.success) {
        wx.showToast({ title: '验证产品信息失败', icon: 'error' })

        return
      }

      // 子设备根据扫码得到的sn在云端查mac地址
      this.setData({
        deviceInfo: {
          type: 'single',
          proType: res.result.proType,
          deviceName: res.result.productName,
          icon: res.result.productIcon,
          mac: res.result.mac,
        },
      })

      const flag = this.checkGateWayInfo()

      if (flag) {
        this.addSingleSubdevice()
      }
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
      this.data.deviceInfo.type = 'near'

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
          mac: this.data.deviceInfo.mac,
          gatewayId,
          gatewaySn,
          deviceName: this.data.deviceInfo.deviceName,
          deviceIcon: this.data.deviceInfo.icon,
        }),
      })
    },
  },
})
