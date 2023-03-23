import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { WifiSocket, getCurrentPageParams, strUtil } from '../../utils/index'

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
      socket.close()
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
          const authRes = await this.checkLocationPermission()
          console.log('authRes', authRes)
          if (!authRes) return
        }
      }

      start = Date.now()
      const startRes = await wx.startWifi()

      // 无法访问互联网的情况下，wx.getWifiList()调用不成功,猜测微信存在查询外网接口信息的流程，堵塞流程，
      // 需在可访问外网时先调用一次，后面即使断网，再次调用getWifiList也能正常调用
      if (deviceInfo.system.toLowerCase().includes('android')) {
        const wifiListRes = await wx.getWifiList().catch((err) => {
          console.log('getWifiList-catch', err)
        })

        console.debug('wifiListRes', wifiListRes)
      }

      console.debug('startWifi', startRes, '开启wifi模块用时：', Date.now() - start)

      const params = getCurrentPageParams()

      console.log('ready', params)
      this.setData({
        ssid: params.ssid,
      })

      socket = new WifiSocket({ ssid: params.ssid })

      socket.onMessage((data: IAnyObject) => {
        console.log('WifiSocket.onMessage', data)

        if (data.topic === '/gateway/net/confirm' && this.data.isShowForceBindTips) {
          this.setData({
            isShowForceBindTips: false,
          })

          this.startBind(gatewayStatus.method)
        }
      })

      const connectRes = await socket.connect()

      console.debug(params.ssid + '---connectRes', connectRes, '初始化socket连接用时：', Date.now() - start)

      if (connectRes.errCode === 12007) {
        wx.navigateBack()
        return
      }

      if (!connectRes.success) {
        this.setData({
          status: 'error',
        })
        return
      }

      this.setData({
        isConnectDevice: true,
      })

      this.getGatewayStatus()
    },

    sendCmdForDeviceIp() {
      socket.sendCmdForDeviceIp()
    },

    cancel() {
      this.setData({
        status: 'linking',
      })
    },

    /**
         "bind":0,  //绑定状态 0：未绑定  1：WIFI已绑定  2:有线已绑定
         "method":"wifi" //无线配网："wifi"，有线配网:"eth"
     */
    async getGatewayStatus() {
      const res = await socket.sendCmd({
        topic: '/gateway/net/status', //指令名称:获取网关IP
        data: {},
      })

      console.debug('getGatewayStatus耗时：', Date.now() - start, res)

      if (!res.success) {
        Toast('查询网关状态失败')
        return
      }

      // 强制绑定判断标志  "bind":0,  //绑定状态 0：未绑定  1：WIFI已绑定  2:有线已绑定
      if (res.bind !== 0) {
        this.setData({
          isShowForceBindTips: true,
        })

        gatewayStatus.method = res.method
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
