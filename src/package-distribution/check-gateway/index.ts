import pageBehaviors from '../../behaviors/pageBehaviors'
import { WifiSocket, getCurrentPageParams, strUtil } from '../../utils/index'

let socket: WifiSocket

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
    status: 'linking',
  } as IAnyObject,

  lifetimes: {
    ready() {
      const params = getCurrentPageParams()

      console.log('ready', params)

      this.initWifi()

      socket = new WifiSocket({ ssid: params.ssid })

      socket.onMessage((data: IAnyObject) => {
        console.log('socket.onMessage', data)

        if (data.topic === '/gateway/net/confirm' && this.data.isShowForceBindTips) {
          this.setData({
            isShowForceBindTips: false,
          })

          this.startBind(gatewayStatus.method)
        }
      })
    },
    detached() {
      console.log('detached')

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
    onHide() {
      console.log('onHide')
    },
    async initWifi() {
      const authorizeRes = await wx
        .authorize({
          scope: 'scope.userLocation',
        })
        .catch((err) => err)

      console.log('authorizeRes', authorizeRes)

      const startRes = await wx.startWifi()

      console.log('startWifi', startRes)

      const connectRes = await socket.connect()

      if (!connectRes.success) {
        this.setData({
          status: 'error',
        })
        return
      }

      this.getGatewayStatus()
    },

    async getWifiList() {
      const wifiListRes = await wx.getWifiList()

      console.log('getWifiList', wifiListRes)
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

      console.log('getGatewayStatus', res)

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
        dsn: pageParams.dsn,
        method: method,
        deviceName: pageParams.deviceName,
      }

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

    finish() {
      wx.switchTab({
        url: '/pages/index/index',
      })
    },
  },
})
