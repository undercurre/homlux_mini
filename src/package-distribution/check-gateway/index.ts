import dayjs from 'dayjs'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { WifiSocket, getCurrentPageParams, strUtil, showLoading, hideLoading } from '../../utils/index'

let socket: WifiSocket
let start = 0

const gatewayStatus = { method: '' }

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
    isShowForceBindTips: false,
    isAndroid10Plus: false,
    isConnectDevice: false,
    status: 'linking',
    ssid: '',
  } as IAnyObject,

  lifetimes: {
    ready() {
      this.initWifi()
    },
    detached() {
      console.log('check-gateway:detached')
      socket?.close()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    copy() {
      wx.setClipboardData({
        data: '12345678',
      })
    },
    /**
     * 检查微信位置权限
     * isDeny: 是否已拒绝授权，
     */
    async checkLocationPermission(isDeny?: boolean) {
      let settingRes: IAnyObject = {}
      // 若已知未授权，省略查询权限流程，节省时间
      if (isDeny !== true) {
        settingRes = await wx.getSetting()
      }

      return new Promise<boolean>((resolve) => {
        // 没有打开微信蓝牙授权异常处理
        console.log('getSetting', settingRes)

        if (isDeny || !settingRes.authSetting['scope.userLocation']) {
          wx.showModal({
            content: '请授权地理位置权限，否则无法正常配网',
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
                this.goBack() // 拒绝授权，则退出当前页面
                resolve(false)

                return
              }

              wx.openSetting({
                success: (settingRes) => {
                  console.log('openSetting', settingRes)
                  resolve(this.checkLocationPermission())
                },
              })
            },
          })
        } else {
          resolve(true)
        }
      })
    },

    async initWifi() {
      showLoading()

      const params = getCurrentPageParams()

      console.log('initWifi', params)

      const deviceInfo = wx.getDeviceInfo()

      console.log('deviceInfo', deviceInfo)

      const systemVersion = parseInt(deviceInfo.system.toLowerCase().replace(deviceInfo.platform, ''))
      const isAndroid10Plus = deviceInfo.platform === 'android' && systemVersion >= 10 // 判断是否Android10+或者是鸿蒙

      this.setData({
        isAndroid10Plus,
        ssid: params.ssid,
      })

      start = Date.now()
      const startRes = await wx.startWifi()

      console.debug('startWifi', startRes, '开启wifi模块用时：', Date.now() - start)

      // Android 调用前需要 用户授权 scope.userLocation。该权限流程需前置，否则会出现在配网过程连接设备热点导致无法联网，请求失败
      if (deviceInfo.platform === 'android') {
        const authorizeRes = await wx
          .authorize({
            scope: 'scope.userLocation',
          })
          .catch((err) => err)

        console.log('authorizeRes', authorizeRes)

        // 用户拒绝授权处理，安卓端没有返回errno字段，只能通过errMsg判断
        if (authorizeRes.errno === 103 || authorizeRes.errMsg.includes('auth deny')) {
          const authRes = await this.checkLocationPermission()
          console.log('authRes', authRes)

          if (!authRes) {
            console.error('授权失败')
            hideLoading()
            return
          }
        }

        // 无法访问互联网的情况下，wx.getWifiList()调用不成功,猜测微信存在查询外网接口信息的流程，堵塞流程，
        // 需在可访问外网时先调用一次，后面即使断网，再次调用getWifiList也能正常调用
        const wifiListRes = await wx.getWifiList().catch((err) => {
          console.log('getWifiList-catch', err)
        })

        console.debug('wifiListRes', wifiListRes)
      }

      socket = new WifiSocket({ ssid: params.ssid })

      if (!isAndroid10Plus) {
        this.connectWifi()
      }

      hideLoading()
    },

    async connectWifi() {
      try {
        const params = getCurrentPageParams()

        const connectRes = await socket.connect()

        console.debug(params.ssid + '---connectRes', connectRes)

        if (connectRes.errCode === 12007) {
          wx.navigateBack()
          return
        }

        if (!connectRes.success) {
          throw connectRes
        }

        this.setData({
          isConnectDevice: true,
        })

        const inistRes = await socket.init()

        if (!inistRes.success) {
          throw inistRes
        }

        this.getGatewayStatus()
      } catch {
        this.setData({
          status: 'error',
        })
      }
    },

    /**
         "bind":0,  //绑定状态 0：未绑定  1：WIFI已绑定  2:有线已绑定
         "method":"wifi" //无线配网："wifi"，有线配网:"eth"
     */
    async getGatewayStatus() {
      const res = await socket.sendCmd({
        topic: '/gateway/net/status',
        data: {},
      })

      console.debug('getGatewayStatus耗时：', dayjs().format('HH:mm:ss'))

      if (!res.success) {
        console.error('查询网关状态失败')
        this.setData({
          status: 'error',
        })
        return
      }

      // 强制绑定判断标志  "bind":0,  //绑定状态 0：未绑定  1：WIFI已绑定  2:有线已绑定
      if (res.bind !== 0) {
        this.setData({
          isShowForceBindTips: true,
        })

        gatewayStatus.method = res.method

        socket.onMessage((data: IAnyObject) => {
          console.log('WifiSocket.onMessage', data)

          if (data.topic === '/gateway/net/confirm' && this.data.isShowForceBindTips) {
            this.setData({
              isShowForceBindTips: false,
            })

            this.startBind(gatewayStatus.method)
          }
        })
      } else {
        this.startBind(res.method)
      }
    },

    reScan() {
      wx.navigateBack()
    },

    startBind(method: string) {
      const pageParams = getCurrentPageParams()

      const params = {
        apSSID: pageParams.ssid,
        method: method,
        deviceName: pageParams.deviceName,
      }

      console.debug('网关检查流程耗时：', Date.now() - start)
      wx.reportEvent('test', {
        check_device: Date.now() - start,
      })
      if (method === 'wifi') {
        // "method":"wifi" //无线配网："wifi"，有线配网:"eth"
        wx.redirectTo({
          url: strUtil.getUrlWithParams('/package-distribution/wifi-connect/index', params),
        })
      } else if (method === 'eth') {
        // "method":"wifi" //无线配网："wifi"，有线配网:"eth"
        wx.redirectTo({
          url: strUtil.getUrlWithParams('/package-distribution/add-gateway/index', params),
        })
      }
    },
  },
})
