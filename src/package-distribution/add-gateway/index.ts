import { IPageData } from './typings'
import { queryDeviceOnlineStatus } from '../../apis/index'
import { WifiSocket, strUtil, getCurrentPageParams } from '../../utils/index'
import pageBehaviors from '../../behaviors/pageBehaviors'

let socket: WifiSocket
let hasBind = false

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
    status: 'linking',
    currentStep: '连接设备',
    percentage: 0,
    activeIndex: -1,
    stepList: [
      {
        text: '连接设备',
      },
      {
        text: '设备联网',
      },
      {
        text: '账号绑定',
      },
    ],
  } as WechatMiniprogram.IAnyObject & IPageData,

  lifetimes: {
    ready() {
      const params = getCurrentPageParams()

      console.log('ready', params)

      socket = new WifiSocket({ ssid: params.apSSID })

      this.initWifi()
    },
    detached() {
      socket.close()
    },
  },

  pageLifetimes: {
    hide() {
      socket.close()
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async initWifi() {
      const startRes = await wx.startWifi()

      console.log('startWifi', startRes)

      wx.onWifiConnected(async (res) => {
        console.log('onWifiConnected', res)

        await socket.updateGatewayInfo()

        this.sendBindCmd()
      })

      this.connectWifi()
    },

    async connectWifi() {
      const params = getCurrentPageParams()

      const res = await wx
        .connectWifi({
          SSID: params.apSSID,
          password: '12345678',
          partialInfo: false,
        })
        .catch((err) => console.log('connectWifi-err', err))

      console.log('connectWifi', res)

      if ((res as IAnyObject).wifiMsg?.includes('already connected')) {
        await socket.updateGatewayInfo()

        this.sendBindCmd()
      }
    },

    async sendBindCmd() {
      if (hasBind) return
      hasBind = true
      const params = getCurrentPageParams()

      const data: IAnyObject = { method: params.method }

      if (params.method === 'wifi') {
        data.ssid = params.wifiSSID
        data.passwd = params.wifiPassword
      }

      const res = await socket.sendCmd({
        topic: '/gateway/net/set', //指令名称
        data,
      })

      console.log('startWifiBind', res)

      this.setData({
        activeIndex: 0,
      })
    },

    async queryDeviceOnlineStatus() {
      const params = getCurrentPageParams()

      console.log('getCurrentPageParams', params)

      const res = await queryDeviceOnlineStatus({ sn: params.dsn, deviceType: '1' })

      console.log('queryDeviceOnlineStatus', res)

      if (res.result.onlineStatus === 1) {
        this.setData({
          activeIndex: 1,
        })

        wx.navigateTo({
          url: strUtil.getUrlWithParams('/package-distribution/bind-home/index', {
            dsn: params.dsn,
          }),
        })
      }
    },
  },
})
