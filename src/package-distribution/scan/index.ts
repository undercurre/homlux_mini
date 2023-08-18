import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import dayjs from 'dayjs'
import { deviceBinding, homeBinding } from '../../store/index'
import { bleDevicesBinding, bleDevicesStore } from '../store/bleDeviceStore'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { checkWifiSwitch, strUtil, showLoading, hideLoading, delay, Logger, isAndroid } from '../../utils/index'
import { getGwNetworkInfo, checkDevice, getUploadFileForOssInfo, queryWxImgQrCode } from '../../apis/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/,
  },

  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding, bleDevicesBinding] }), pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    _listenLocationTimeId: 0, // 监听系统位置信息是否打开的计时器， 0为不存在监听
    needCheckCamera: true, // 是否需要重新检查摄像头权限
    isBlePermit: false,
    isShowPage: false,
    isShowGatewayList: false, // 是否展示选择网关列表弹窗
    isShowNoGatewayTips: false, // 是否展示添加网关提示弹窗
    isScan: false, // 是否正在扫码
    scanType: '', // 扫码页的种类
    isFlash: false,
    selectGateway: {
      deviceId: '',
      sn: '',
    },
    deviceInfo: {
      icon: '/package-distribution/assets/scan/light.png',
    } as IAnyObject,
  },

  computed: {
    gatewayList(data) {
      const allRoomDeviceList: Device.DeviceItem[] = (data as IAnyObject).allRoomDeviceList || []

      return allRoomDeviceList.filter((item) => item.deviceType === 1)
    },
    tipsText(data: IAnyObject) {
      if (!data.available) {
        return '打开手机蓝牙发现附近子设备'
      }

      return data.bleDeviceList?.length ? `搜索到${data.bleDeviceList.length}个附近的子设备` : '正在搜索附近子设备'
    },
  },

  lifetimes: {
    async ready() {
      bleDevicesBinding.store.reset()

      await homeBinding.store.updateHomeInfo()
    },
    detached() {
      wx.closeBluetoothAdapter()
      wx.stopWifi()
      clearInterval(this.data._listenLocationTimeId)
    },
  },

  pageLifetimes: {
    show() {
      this.setData({
        isShowPage: true,
      })

      // 子设备配网页，蓝牙权限及开关已开情况下
      this.data.scanType === 'subdevice' &&
        this.data.isBlePermit &&
        bleDevicesStore.available &&
        bleDevicesStore.startBleDiscovery()
    },
    hide() {
      // 由于非授权情况下进入页面，摄像头组件已经渲染，即使重新授权页无法正常使用，需要通过wx：if重新触发渲染组件
      this.setData({
        isShowPage: false,
      })

      bleDevicesStore.discovering && bleDevicesStore.stopBLeDiscovery()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async onLoad(query: { type?: string }) {
      this.setData({
        scanType: query.type,
      })
    },
    // 检查是否通过微信扫码直接进入该界面时判断场景值
    checkWxScanEnter() {
      const params = wx.getLaunchOptionsSync()
      Logger.log(
        'scanPage',
        params,
        'wx.getEnterOptionsSync()',
        wx.getEnterOptionsSync(),
        'getCurrentPages()',
        getCurrentPages(),
      )

      // 防止重复判断,仅通过微信扫码直接进入该界面时判断场景值
      if (getCurrentPages().length === 1 && params.scene === 1011) {
        const scanUrl = decodeURIComponent(params.query.q)

        Logger.log('scanUrl', scanUrl)

        this.handleScanUrl(scanUrl)

        return
      }
    },
    showGateListPopup() {
      this.setData({
        isShowGatewayList: true,
      })
    },

    async selectGateway(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      const item = this.data.gatewayList[index]

      if (item.onLineStatus === 0) {
        return
      }

      this.setData({
        selectGateway: {
          deviceId: item.deviceId,
          sn: item.sn,
        },
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
      // 没有打开系统蓝牙开关异常处理
      if (!bleDevicesStore.available) {
        Dialog.alert({
          message: '请打开手机蓝牙，用于发现附近的子设备',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })
      }

      return bleDevicesStore.available
    },

    /**
     * 检查微信蓝牙权限
     */
    async checkBlePermission() {
      showLoading()
      // 没有打开微信蓝牙授权异常处理

      this.setData({
        needCheckCamera: true,
      })

      Dialog.alert({
        message: '请授权使用蓝牙，否则无法正常扫码配网',
        showCancelButton: true,
        cancelButtonText: '返回',
        confirmButtonText: '去设置',
        confirmButtonOpenType: 'openSetting',
      }).catch(() => {
        // on cancel
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        this.goBack() // 拒绝授权摄像头，则退出当前页面
      })

      hideLoading()
    },

    async initBle() {
      if (bleDevicesStore.discovering) {
        return
      }

      // 初始化蓝牙模块
      const openBleRes = (await wx
        .openBluetoothAdapter({
          mode: 'central',
        })
        .catch((err: WechatMiniprogram.BluetoothError) => err)) as IAnyObject

      Logger.log('scan-openBleRes', openBleRes)

      // 判断是否授权蓝牙 安卓、IOS返回错误格式不一致
      if (openBleRes.errno === 103 || openBleRes.errMsg.includes('auth deny')) {
        this.checkBlePermission()

        // 优先判断微信授权设置
        return
      }

      this.setData({
        isBlePermit: true,
      })

      // 系统是否已打开蓝牙
      const res = await this.checkSystemBleSwitch()

      if (!res) {
        const listen = (res: WechatMiniprogram.OnBluetoothAdapterStateChangeCallbackResult) => {
          if (res.available) {
            bleDevicesStore.startBleDiscovery()
            this.checkWxScanEnter()
            wx.offBluetoothAdapterStateChange(listen)
          }
        }
        wx.onBluetoothAdapterStateChange(listen)
      } else {
        bleDevicesStore.startBleDiscovery()
        this.checkWxScanEnter()
      }
    },

    onCloseGwList() {
      this.setData({
        isShowGatewayList: false,
        selectGateway: {
          deviceId: '',
          sn: '',
        },
      })
    },

    // 检查摄像头权限
    async checkCameraPerssion() {
      showLoading()
      const settingRes = await wx.getSetting().catch((err) => err)

      Logger.log('检查摄像头权限', settingRes)

      if (!settingRes.authSetting['scope.camera']) {
        // 跳转过权限设置页均需要重置needCheckCamera状态，回来后需要重新检查摄像头权限
        this.setData({
          needCheckCamera: true,
        })

        Dialog.alert({
          message: '请授权使用摄像头，用于扫码配网',
          showCancelButton: true,
          cancelButtonText: '返回',
          confirmButtonText: '去设置',
          confirmButtonOpenType: 'openSetting',
        }).catch(() => {
          // on cancel
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          this.goBack() // 拒绝授权摄像头，则退出当前页面
        })
      } else {
        this.setData({
          needCheckCamera: false,
        })
      }

      hideLoading()

      return settingRes.authSetting['scope.camera']
    },
    /**
     * 扫码解析
     */
    async getQrCodeInfo(e: WechatMiniprogram.CustomEvent) {
      if (this.data.isScan || !bleDevicesStore.discovering) {
        return
      }

      const scanUrl = e.detail.result

      this.handleScanUrl(scanUrl)
    },

    getCameraError(event: WechatMiniprogram.CustomEvent) {
      Logger.error('getCameraError', event)

      this.checkCameraPerssion()
    },

    async initCameraDone() {
      Logger.log('initCameraDone')
      if (this.data.needCheckCamera) {
        const flag = await this.checkCameraPerssion()

        if (!flag) {
          return
        }
      }

      // 安卓 6.0 及以上版本，定位开关未打开时，无法进行设备搜索。
      if (isAndroid() && !this.data._listenLocationTimeId) {
        const systemSetting = wx.getSystemSetting()

        if (!systemSetting.locationEnabled) {
          wx.showModal({
            content: '请打开手机系统的位置信息开关',
            showCancel: false,
            confirmText: '我知道了',
            confirmColor: '#488FFF',
          })

          this.data._listenLocationTimeId = setInterval(() => {
            const systemSetting = wx.getSystemSetting()

            if (systemSetting.locationEnabled) {
              clearInterval(this.data._listenLocationTimeId)
              this.data._listenLocationTimeId = 0
              this.initBle()
            }
          }, 3000)

          return
        }
      }

      this.initBle()
    },

    toggleFlash() {
      this.setData({
        isFlash: !this.data.isFlash,
      })
    },

    chooseAlbum() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: async (res) => {
          this.setData({
            isScan: true,
          })
          showLoading()

          const file = res.tempFiles[0]

          const fs = wx.getFileSystemManager()

          // 微信解析二维码图片大小限制 2M，前端暂时限制1.5M
          if (file.size > 1500 * 1024) {
            const compressRes = await wx.compressImage({
              src: file.tempFilePath,
              quality: 70,
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

      // 获取集团oss上传服务相关信息
      const { result } = await getUploadFileForOssInfo(nameArr[nameArr.length - 1])

      // 上传图片到集团OSS服务
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
          await delay(3000) // 由于有可能图片还没上传完毕，需要延迟调用解析图片接口

          const query = await queryWxImgQrCode(result.downloadUrl)

          if (query.success) {
            this.handleScanUrl(query.result.qrCodeUrl)
          } else {
            hideLoading()
            Toast('无效二维码')
            this.setData({
              isScan: false,
            })
          }
        },
      })
    },

    async handleScanUrl(url: string) {
      try {
        this.setData({
          isScan: true,
        })

        if (!url.includes('meizgd.com/homlux/qrCode.html')) {
          throw '无效二维码'
        }

        const pageParams = strUtil.getUrlParams(url)

        Logger.log('scanParams', pageParams)

        showLoading()
        // mode 配网方式 （00代表AP配网，01代表蓝牙配网， 02代表AP+有线）
        // 带蓝牙子设备
        if (pageParams.mode === '01') {
          await this.bindSubDevice(pageParams)
        }
        // 网关绑定逻辑
        else if (pageParams.mode === '02') {
          await this.bindGateway(pageParams)
        }
        // 智慧屏扫码绑定
        else if (pageParams.mode === '10') {
          wx.redirectTo({
            url: strUtil.getUrlWithParams('/package-auth/auth-screen/index', {
              code: pageParams.code,
            }),
          })
        } else {
          throw '无效二维码'
        }
        hideLoading()
      } catch (err) {
        Toast(err as string)
      }

      // 延迟复位扫码状态，防止安卓端短时间重复执行扫码逻辑
      setTimeout(() => {
        this.setData({
          isScan: false,
        })
      }, 2000)
    },

    async bindGateway(params: IAnyObject) {
      const res = await checkDevice(
        {
          productId: params.pid,
        },
        { loading: false },
      )

      if (!res.success) {
        Toast('验证产品信息失败')

        return
      }

      // 预校验wifi开关是否打开
      if (!checkWifiSwitch()) {
        return
      }

      wx.reportEvent('add_device', {
        pro_type: res.result.proType,
        model_id: params.pid,
        add_type: 'qrcode',
      })

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/link-gateway/index', {
          apSSID: params.ssid,
          deviceName: res.result.productName,
          type: 'query',
        }),
      })
    },

    async bindSubDevice(params: IAnyObject) {
      const checkData = {} as IAnyObject
      const { sn, mac } = params

      if (sn) {
        checkData.dsn = sn
      } else if (mac) {
        checkData.mac = mac
      }

      const res = await checkDevice(checkData, { loading: false })

      if (!res.success) {
        Toast('验证产品信息失败')

        return
      }

      // 子设备根据扫码得到的sn在云端查mac地址
      this.setData({
        deviceInfo: {
          type: 'single',
          mac: res.result.mac, // zigbee 的mac
        },
      })

      const flag = await this.checkGateWayInfo()

      if (flag) {
        this.addSingleSubdevice()
      }
    },

    /**
     * 添加子设备时，检测是否已选择网关信息
     */
    async checkGateWayInfo() {
      const gatewayId = this.data.selectGateway.deviceId

      if (gatewayId) {
        return true
      }

      if (this.data.gatewayList.length === 0) {
        this.setData({
          isShowNoGatewayTips: true,
        })

        Dialog.alert({
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })

        return false
      }

      if (this.data.gatewayList.length === 1 && this.data.gatewayList[0].onLineStatus === 1) {
        const gateway = this.data.gatewayList[0]

        this.data.selectGateway = {
          deviceId: gateway.deviceId,
          sn: gateway.sn,
        }
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
    async addNearSubdevice() {
      this.data.deviceInfo.type = 'near'
      this.data.deviceInfo.deviceName = '子设备'

      const isValid = await this.checkGateWayInfo()

      if (!isValid) {
        return
      }

      const { deviceId, sn } = this.data.selectGateway

      const queryInfo = await getGwNetworkInfo({ deviceId }, { loading: true })

      let networkInfo = {
        channel: 0,
        panId: 0,
        extPanId: '',
      }

      if (queryInfo.success) {
        networkInfo = {
          channel: queryInfo.result.channel,
          panId: queryInfo.result.panId,
          extPanId: queryInfo.result.extPanId,
        }
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/search-subdevice/index', {
          gatewayId: deviceId,
          gatewaySn: sn,
          channel: networkInfo.channel || 0,
          panId: networkInfo.panId || 0,
          extPanId: networkInfo.extPanId || '',
        }),
      })
    },

    // 添加单个子设备
    async addSingleSubdevice() {
      const { deviceId, sn } = this.data.selectGateway

      const queryInfo = await getGwNetworkInfo({ deviceId }, { loading: true })

      let networkInfo = {
        channel: 0,
        panId: 0,
        extPanId: '',
      }

      if (queryInfo.success) {
        networkInfo = {
          channel: queryInfo.result.channel,
          panId: queryInfo.result.panId,
          extPanId: queryInfo.result.extPanId,
        }
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/add-subdevice/index', {
          mac: this.data.deviceInfo.mac,
          gatewayId: deviceId,
          gatewaySn: sn,
          channel: networkInfo.channel || 0,
          panId: networkInfo.panId || 0,
          extPanId: networkInfo.extPanId || '',
        }),
      })
    },
  },
})
