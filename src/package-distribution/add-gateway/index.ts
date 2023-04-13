import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import { IPageData, stepListForBind, stepListForChangeWiFi } from './conifg'
import { queryDeviceOnlineStatus, bindDevice } from '../../apis/index'
import { WifiSocket, strUtil, getCurrentPageParams } from '../../utils/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding, roomBinding, deviceBinding } from '../../store/index'

let socket: WifiSocket
let start = Date.now()
let gatewayNum = 0

ComponentWithComputed({
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
    type: '',
    apSSID: '',
    isConnectDevice: false,
    _interId: 0,
    _queryTimes: 50,
    status: 'linking',
    activeIndex: 0,
  } as WechatMiniprogram.IAnyObject & IPageData,

  computed: {
    pageTitle(data) {
      let title = ''

      if (data.type === 'changeWifi') {
        title = '重新联网'
      } else {
        title = '添加智能网关'
      }

      return title
    },
  },

  lifetimes: {
    ready() {
      gatewayNum = deviceBinding.store.allRoomDeviceList.filter((item) => item.proType === '0x16').length // 网关数量
      start = Date.now()
      this.initWifi()
    },
    detached() {
      console.log('addGateway-detached')
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
      const { type, apSSID } = getCurrentPageParams()

      console.log('ready', getCurrentPageParams())
      // 绑定流程和更改wifi的步骤流程不同
      this.setData({
        type,
        apSSID: apSSID,
        stepList: type === 'changeWifi' ? stepListForChangeWiFi : stepListForBind,
      })

      socket = new WifiSocket({ ssid: apSSID })

      const connectRes = await socket.connect()

      console.log('connectRes', connectRes, socket)
      console.debug('connectRes用时：', Date.now() - start)

      if (!connectRes.success) {
        this.setData({
          status: 'error',
        })
        return
      }

      await socket.init()

      this.setData({
        activeIndex: 1,
        isConnectDevice: true,
      })

      if (type === 'changeWifi') {
        this.changeWifi()
      } else {
        this.sendBindCmd()
      }
    },

    async sendBindCmd() {
      const params = getCurrentPageParams()

      const begin = Date.now()
      const data: IAnyObject = { method: params.method }

      if (params.method === 'wifi') {
        data.ssid = params.wifiSSID
        data.passwd = params.wifiPassword
      }

      const setRes = await socket.sendCmd({
        topic: '/gateway/net/set', //指令名称
        data,
      })

      console.log('setRes', setRes)

      console.debug('app-网关耗时：', Date.now() - start, '发送绑定指令耗时：', Date.now() - begin)

      if (!setRes.success) {
        this.setData({
          status: 'error',
        })
        return
      }

      wx.reportEvent('test', {
        app_device: Date.now() - start,
      })

      // 防止强绑情况选网关还没断开原有连接，需要延迟查询
      setTimeout(() => {
        this.queryDeviceOnlineStatus(setRes.sn)
      }, 10000)

      socket.close()
    },

    async changeWifi() {
      const params = getCurrentPageParams()

      const data: IAnyObject = { ssid: params.wifiSSID, passwd: params.wifiPassword }

      const res = await socket.sendCmd({
        topic: '/gateway/net/change', //指令名称
        data,
      })

      console.log('change', res)

      // 防止强绑情况选网关还没断开原有连接，需要延迟查询
      setTimeout(() => {
        this.queryDeviceOnlineStatus(params.sn, params.type)
      }, 10000)

      socket.close()
    },

    async requestBindDevice(sn: string, deviceId: string) {
      const params = getCurrentPageParams()

      const existDevice = deviceBinding.store.allRoomDeviceList.find(item => item.sn === sn)

      // 强绑情况下，取旧命名
      let deviceName = existDevice ? existDevice.deviceName : (params.deviceName + (gatewayNum > 0 ? ++gatewayNum : ''))

      const res = await bindDevice({
        deviceId: deviceId,
        houseId: homeBinding.store.currentHomeId,
        roomId: roomBinding.store.currentRoom.roomId,
        sn,
        deviceName: deviceName,
      })

      if (res.success && res.result.isBind) {
        this.setData({
          activeIndex: 3,
        })

        console.debug('app到云端，添加网关耗时：', Date.now() - start)
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

    async queryDeviceOnlineStatus(sn: string, type?: string) {
      const res = await queryDeviceOnlineStatus({ sn, deviceType: '1' })

      console.log('queryDeviceOnlineStatus', res.result)

      if (res.success && res.result.onlineStatus === 1 && res.result.deviceId) {
        this.setData({
          activeIndex: 2,
        })

        if (type === 'changeWifi') {
          wx.redirectTo({
            url: '/package-distribution/change-wifi-success/index',
          })
          return
        }
        this.requestBindDevice(sn, res.result.deviceId)
      } else {
        this.data._queryTimes--

        if (this.data._queryTimes <= 0) {
          console.error('配网失败：网关云端状态不在线')
          this.setData({
            status: 'error',
          })
          return
        }

        this.data._interId = setTimeout(() => {
          this.queryDeviceOnlineStatus(sn, type)
        }, 3000)
      }
    },
  },
})
