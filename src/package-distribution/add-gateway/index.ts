import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { IPageData } from './typings'
import { queryDeviceOnlineStatus, bindDevice } from '../../apis/index'
import { WifiSocket, strUtil, getCurrentPageParams } from '../../utils/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding, roomBinding } from '../../store/index'

let socket: WifiSocket

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
      console.log('add-gateway-hide')
      socket.close()
      clearTimeout(this.data._interId)
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async initWifi() {
      const startRes = await wx.startWifi()

      console.log('startWifi', startRes)

      await socket.connect()

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

      const res = await socket.sendCmd({
        topic: '/gateway/net/set', //指令名称
        data,
      })

      console.log('startWifiBind', res)

      wx.connectWifi({
        SSID: params.wifiSSID,
        password: params.wifiPassword,
        partialInfo: false,
      })

      this.queryDeviceOnlineStatus()
    },

    async requestBindDevice() {
      const params = getCurrentPageParams()

      const res = await bindDevice({
        deviceId: params.deviceId,
        houseId: homeBinding.store.currentHomeId,
        roomId: roomBinding.store.roomList[0].roomId,
        sn: params.dsn,
        deviceName: params.deviceName,
      })

      if (res.success && res.result.isBind) {
        this.setData({
          activeIndex: 2,
        })
        wx.redirectTo({
          url: strUtil.getUrlWithParams('/package-distribution/bind-home/index', {
            deviceId: res.result.deviceId,
          }),
        })
      }
    },

    async queryDeviceOnlineStatus() {
      const params = getCurrentPageParams()

      console.log('getCurrentPageParams', params)

      const res = await queryDeviceOnlineStatus({ sn: params.dsn, deviceType: '1' })

      console.log('queryDeviceOnlineStatus', res)

      if (res.success && res.result.onlineStatus === 1) {
        this.setData({
          activeIndex: 1,
        })

        this.requestBindDevice()
      } else {
        this.data._interId = setTimeout(() => {
          this.queryDeviceOnlineStatus()
        }, 3000)
      }
    },
  },
})
