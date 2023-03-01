import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { IPageData } from './typings'
import { queryDeviceOnlineStatus, bindDevice } from '../../apis/index'
import { WifiSocket, strUtil, getCurrentPageParams } from '../../utils/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding, roomBinding } from '../../store/index'

let socket: WifiSocket
let start = Date.now()

Component({
  options: {
    styleIsolation: 'apply-shared',
    pureDataPattern: /^_/,
  },

  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] }), pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    _interId: 0,
    _queryTimes: 50,
    status: 'linking',
    currentStep: '连接设备',
    activeIndex: -1,
  } as WechatMiniprogram.IAnyObject & IPageData,

  lifetimes: {
    ready() {
      start = Date.now()
      this.initWifi()
    },
    detached() {
      console.log('addGateway-detached')
      socket.close()
    },
  },

  pageLifetimes: {
    hide() {
      console.log('add-gateway-hide')
      socket.close()
      clearTimeout(this.data._interId)
      wx.stopWifi()
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async initWifi() {
      const params = getCurrentPageParams()

      console.log('ready', params)

      socket = new WifiSocket({ ssid: params.apSSID })

      const connectRes = await socket.connect()

      console.log('connectRes', connectRes, socket)

      if (!connectRes.success) {
        this.setData({
          status: 'error',
        })
        return
      }

      this.setData({
        activeIndex: 0,
      })

      this.sendBindCmd()
    },

    async sendBindCmd() {
      const params = getCurrentPageParams()

      const data: IAnyObject = { method: params.method }

      if (params.method === 'wifi') {
        data.ssid = params.wifiSSID
        data.passwd = params.wifiPassword
      }

      await socket.sendCmd({
        topic: '/gateway/net/set', //指令名称
        data,
      })

      // wx.connectWifi({
      //   SSID: params.wifiSSID,
      //   password: params.wifiPassword,
      //   partialInfo: false,
      // })

      console.log('app-网关耗时：', Date.now() - start)

      wx.reportEvent('test', {
        app_device: Date.now() - start,
      })

      this.queryDeviceOnlineStatus()

      socket.close()
    },

    async requestBindDevice() {
      const params = getCurrentPageParams()

      const res = await bindDevice({
        deviceId: params.deviceId,
        houseId: homeBinding.store.currentHomeId,
        roomId: roomBinding.store.roomList[0].roomId,
        sn: params.dsn,
        deviceName: params.deviceName + params.apSSID.substr(-4),
      })

      if (res.success && res.result.isBind) {
        this.setData({
          activeIndex: 2,
        })

        console.log('app到云端，添加网关耗时：', Date.now() - start)
        wx.reportEvent('test', {
          app_cloud: Date.now() - start,
        })

        wx.redirectTo({
          url: strUtil.getUrlWithParams('/package-distribution/bind-home/index', {
            deviceId: res.result.deviceId,
          }),
        })
      } else {
        this.setData({
          status: 'error',
        })
      }
    },

    async queryDeviceOnlineStatus() {
      const params = getCurrentPageParams()

      const res = await queryDeviceOnlineStatus({ sn: params.dsn, deviceType: '1' })

      console.log('queryDeviceOnlineStatus', res.result)

      if (res.success && res.result.onlineStatus === 1 && res.result.deviceId) {
        this.setData({
          activeIndex: 1,
        })

        this.requestBindDevice()
      } else {
        this.data._queryTimes--

        if (this.data._queryTimes <= 0) {
          this.setData({
            status: 'error',
          })
          return
        }

        this.data._interId = setTimeout(() => {
          this.queryDeviceOnlineStatus()
        }, 5000)
      }
    },
  },
})
