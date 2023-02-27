import pageBehaviors from '../../behaviors/pageBehaviors'
import { WifiSocket, getCurrentPageParams, strUtil } from '../../utils/index'

let socket: WifiSocket
let start = Date.now()

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
      start = Date.now()

      this.initWifi()

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
      const params = getCurrentPageParams()

      console.log('ready', params)
      
      socket = new WifiSocket({ ssid: params.ssid })

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

      console.log('网关检查流程耗时：', Date.now() - start)
      wx.reportEvent('test', {
        check_device: Date.now() - start
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

    finish() {
      wx.switchTab({
        url: '/pages/index/index',
      })
    },
  },
})
