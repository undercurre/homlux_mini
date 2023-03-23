import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import dayjs from 'dayjs'
import { deviceBinding, homeBinding } from '../../store/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil, bleUtil } from '../../utils/index'
import { checkDevice, queryProtypeInfo, getUploadFileForOssInfo, queryWxImgQrCode } from '../../apis/index'

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
    isShowPage: false,
    isShowGatewayList: false, // 是否展示选择网关列表弹窗
    isShowNoGatewayTips: false, // 是否展示添加网关提示弹窗
    isScan: false, // 是否正在扫码
    _isDiscovering: false, // 是否正在发现蓝牙
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
      if (data.bleStatus === 'close') {
        return '打开手机蓝牙发现附近子设备'
      }

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

      this.initBle()

      this.initWifi()

      // 防止重复判断,仅通过微信扫码直接进入该界面时判断场景值
      if (getCurrentPages().length === 1 && params.scene === 1011) {
        const scanUrl = decodeURIComponent(params.query.q)

        console.log('scanUrl', scanUrl)

        this.handleScanUrl(scanUrl)

        return
      }
    },
    detached() {
      wx.closeBluetoothAdapter()
    },
  },

  pageLifetimes: {
    async show() {
      this.setData({
        isShowPage: true,
      })
    },
    hide() {
      console.log('hide')
      // 由于非授权情况下进入页面，摄像头组件已经渲染，即使重新授权页无法正常使用，需要通过wx：if重新触发渲染组件
      this.setData({
        isShowPage: false,
      })
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

        // 用户拒绝授权处理
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

    /**
     * 检查系统蓝牙开关
     */
    async checkSystemBleSwitch() {
      const res = wx.getSystemSetting()

      console.log('getSystemSetting', res)

      this.setData({
        bleStatus: res.bluetoothEnabled ? 'open' : 'close',
      })
      // 没有打开系统蓝牙开关异常处理
      if (!res.bluetoothEnabled) {
        wx.showModal({
          title: '请打开手机蓝牙',
          content: '用于发现附近的子设备',
          showCancel: false,
          confirmText: '我知道了',
          confirmColor: '#27282A',
        })
      }

      return res.bluetoothEnabled
    },

    /**
     * 检查微信蓝牙权限
     * isDeny: 是否已拒绝授权，
     */
    async checkBlePermission(isDeny?: boolean) {
      let settingRes: IAnyObject = {}
      // 若已知未授权，省略查询权限流程，节省时间
      if (isDeny !== true) {
        settingRes = await wx.getSetting()
      }

      return new Promise<boolean>((resolve) => {
        // 没有打开微信蓝牙授权异常处理
        console.log('getSetting', settingRes)
        // res.authSetting = {
        //   "scope.userInfo": true,
        //   "scope.userLocation": true
        // }

        if (isDeny || !settingRes.authSetting['scope.bluetooth']) {
          wx.showModal({
            content: '请授权使用蓝牙，否则无法正常扫码配网',
            showCancel: true,
            cancelText: '返回',
            cancelColor: '#27282A',
            confirmText: '去设置',
            confirmColor: '#27282A',
            success: (res) => {
              console.log('showModal', res)
              if (res.cancel) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                this.goBack() // 拒绝授权摄像头，则退出当前页面
                resolve(false)

                return
              }

              wx.openSetting({
                success: (settingRes) => {
                  console.log('openSetting', settingRes)
                  resolve(this.checkBlePermission())
                },
              })
            },
          })
        } else {
          resolve(true)
        }
      })
    },

    async initBle() {
      // 初始化蓝牙模块
      const openBleRes = await wx
        .openBluetoothAdapter({
          mode: 'central',
        })
        .catch((err: WechatMiniprogram.BluetoothError) => err)

      // 判断是否授权蓝牙
      if (openBleRes.errMsg.includes('auth deny')) {
        const permission = await this.checkBlePermission(true)

        // 优先判断微信授权设置
        if (!permission) {
          return
        }
      }

      console.log('scan-openBleRes', openBleRes)

      wx.onBluetoothAdapterStateChange((res) => {
        console.log('onBluetoothAdapterStateChange-scan', res)
        this.setData({
          bleStatus: res.available ? 'open' : 'close',
        })
        if (res.available) {
          this.startDiscoverBle()
        }
      })

      // 系统是否已打开蓝牙
      const res = await this.checkSystemBleSwitch()

      if (!res) {
        return
      } else {
        this.startDiscoverBle()
      }
    },

    async startDiscoverBle() {
      if (this.data._isDiscovering) {
        return
      }

      this.data._isDiscovering = true

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
          } else {
            return false
          }

          const dataMsg = strUtil.ab2hex(item.advertisData)
          const msgObj = bleUtil.transferBroadcastData(dataMsg)
          console.log('BroadcastData', msgObj)

          // 过滤已经配网的设备
          // 设备网络状态 0x00：未入网   0x01：正在入网   0x02:  已经入网   0x03:  已经连入网，但父节点没有响应
          if (msgObj.isConfig !== '00') {
            flag = false
          }

          return flag
        })

        if (subdeviceList.length <= 0) return

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

    // 检查摄像头权限
    async checkCamera() {
      const settingRes = await wx.getSetting()

      console.log('getSetting', settingRes)
      // res.authSetting = {
      //   "scope.userInfo": true,
      //   "scope.userLocation": true
      // }

      if (!settingRes.authSetting['scope.camera']) {
        wx.showModal({
          content: '请授权使用摄像头，否则无法正常扫码配网',
          showCancel: true,
          cancelText: '返回',
          cancelColor: '#27282A',
          confirmText: '去设置',
          confirmColor: '#27282A',
          success: (res) => {
            console.log('showModal', res)
            if (res.cancel) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              this.goBack() // 拒绝授权摄像头，则退出当前页面
              return
            }

            wx.openSetting({
              success: (settingRes) => {
                console.log('openSetting', settingRes)
              },
            })
          },
        })
      }
    },
    /**
     * 扫码解析
     */
    async getQrCodeInfo(e: WechatMiniprogram.CustomEvent) {
      if (this.data.isScan) {
        return
      }

      console.log('getQrCodeInfo', e, this.data.isScan)

      const scanUrl = e.detail.result

      this.handleScanUrl(scanUrl)
    },

    getCameraError(event: WechatMiniprogram.CustomEvent) {
      console.log('getCameraError', event)

      this.checkCamera()
    },

    toggleFlash() {
      this.setData({
        isFlash: !this.data.isFlash,
      })
    },

    chooseAlbun() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: async (res) => {
          console.log('选择相册：', res)

          let file = res.tempFiles[0]

          const fs = wx.getFileSystemManager()

          // 微信解析二维码图片大小限制 2M，前端暂时限制1.5M
          if (file.size > 1500 * 1024) {
            const compressRes = await wx.compressImage({
              src: file.tempFilePath,
              quality: 80,
            })

            console.log('compressRes', compressRes)

            const stat = fs.statSync(compressRes.tempFilePath, false) as WechatMiniprogram.Stats
            file.tempFilePath = compressRes.tempFilePath
            file.size = stat.size
          }

          const result = fs.readFileSync(file.tempFilePath)

          console.log('readFile', result)

          this.uploadFile({ fileUrl: file.tempFilePath, fileSize: file.size, binary: result })
        },
      })
    },

    async uploadFile(params: { fileUrl: string; fileSize: number; binary: string | ArrayBuffer }) {
      const { fileUrl, fileSize, binary } = params

      const nameArr = fileUrl.split('/')

      const { result } = await getUploadFileForOssInfo(nameArr[nameArr.length - 1])

      console.log('uploadInfo', result)

      wx.request({
        url: result.uploadUrl, //仅为示例，并非真实的接口地址
        method: 'PUT',
        data: binary,
        header: {
          'content-type': 'binary',
          Certification: result.certification,
          'X-amz-date': dayjs().subtract(8, 'hour').format('ddd,D MMM YYYY HH:mm:ss [GMT]'), // gmt时间慢8小时
          'Content-Length': fileSize,
          'X-amz-acl': 'public-read',
        },
        success: async (res) => {
          console.log('uploadFile-success', res)
          const query = await queryWxImgQrCode(result.downloadUrl)

          if (query.success) {
            this.handleScanUrl(query.result.qrCodeUrl)
          }
        },
        complete(res) {
          console.log('uploadFile-complete', res)
        },
      })
    },

    async handleScanUrl(url: string) {
      if (!url.includes('meizgd.com/homlux/qrCode.html')) {
        Toast('非法二维码')
        return
      }

      this.setData({
        isScan: true,
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
          isScan: false,
        })

        console.log('isScan', this.data.isScan)
      }, 2000)
    },

    async bindGateway(params: IAnyObject) {
      wx.showLoading({
        title: 'loading',
      })

      const res = await queryProtypeInfo({
        pid: params.pid,
      })

      if (!res.success) {
        Toast('验证产品信息失败')

        return
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/check-gateway/index', {
          ssid: params.ssid,
          deviceName: res.result.productName,
        }),
      })
      wx.hideLoading()
    },

    async bindSubDevice(params: IAnyObject) {
      wx.showLoading({
        title: 'loading',
      })

      if (this.data.bleStatus !== 'open') {
        this.checkSystemBleSwitch()
        return
      }

      const res = await checkDevice({ dsn: params.sn })

      if (!res.success) {
        Toast('验证产品信息失败')

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
      wx.hideLoading()
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

      wx.closeBluetoothAdapter()
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

      wx.closeBluetoothAdapter()
      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/add-subdevice/index', {
          mac: this.data.deviceInfo.mac,
          gatewayId,
          gatewaySn,
          deviceName: this.data.deviceInfo.deviceName,
          deviceIcon: this.data.deviceInfo.icon,
          proType: this.data.deviceInfo.proType,
        }),
      })
    },
  },
})
