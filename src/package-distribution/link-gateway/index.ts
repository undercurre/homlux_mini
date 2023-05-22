import dayjs from 'dayjs'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { queryDeviceOnlineStatus, bindDevice } from '../../apis/index'
import { homeBinding, roomBinding, deviceBinding } from '../../store/index'
import { WifiSocket, getCurrentPageParams, strUtil, isAndroid, isAndroid10Plus } from '../../utils/index'
import { stepListForBind, stepListForChangeWiFi } from './conifg'

let start = 0

const gatewayStatus = { method: '' }

// 埋点数据存储
let reportInfo: IAnyObject = {}

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
    pureDataPattern: /^_/,
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
    type: '', // query: 校验网关状态，bind: 绑定网关，changeWifi： 更改wifi
    isShowForceBindTips: false,
    isAndroid10Plus: false,
    isConnectDevice: false,
    status: 'linking',
    apSSID: '',
    _queryCloudTimeId: 0,
    _queryTimes: 50, // 网关发送绑定指令后查询云端最大次数
    activeIndex: 0,
    stepList: [],
    _socket: null as WifiSocket | null,
  } as IAnyObject,

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
    async ready() {
      const pageParams = getCurrentPageParams()

      console.log('ready', pageParams)

      this.setData({
        type: pageParams.type,
        apSSID: pageParams.apSSID,
        stepList: pageParams.type === 'changeWifi' ? stepListForChangeWiFi : stepListForBind, // 绑定流程和更改wifi的步骤流程不同
      })

      // 仅检验网关信息时校验位置权限
      if (pageParams.type === 'query') {
        const auth = await this.authLocationPermission()

        if (!auth) {
          console.error('用户位置授权失败')
          return
        }
      }

      this.initWifi()
    },
    detached() {
      console.debug('link-gateway:detached')
      this.data._socket?.close()

      if (this.data._queryCloudTimeId) {
        clearTimeout(this.data._queryCloudTimeId)
      }
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toErrorStatus() {
      this.setData({
        status: 'error',
      })

      this.data._socket?.close()
    },
    copy() {
      wx.setClipboardData({
        data: this.data._socket.pw,
      })
    },

    async authLocationPermission() {
      // Android 调用前需要 用户授权 scope.userLocation。该权限流程需前置，否则会出现在配网过程连接设备热点导致无法联网，请求失败
      if (isAndroid()) {
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
          }

          return authRes
        }
      }

      return true
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
      reportInfo = {}

      const startRes = await wx.startWifi()

      console.log('startWifi', startRes)

      if (isAndroid()) {
        // 无法访问互联网的情况下，wx.getWifiList()调用不成功,猜测微信存在查询外网接口信息的流程，堵塞流程，
        // 需在可访问外网时先调用一次，后面即使断网，再次调用getWifiList也能正常调用
        const wifiListRes = await wx.getWifiList().catch((err) => err)

        console.log('wifiListRes', wifiListRes)
      }

      start = Date.now()

      this.data._socket = new WifiSocket({ ssid: this.data.apSSID })

      const isConnect = await this.data._socket.isConnectDeviceWifi()

      if (!isAndroid10Plus() || isConnect) {
        this.connectWifi()
      } else {
        this.setData({
          isAndroid10Plus: isAndroid10Plus(),
        })
      }
    },

    async connectWifi() {
      try {
        const now = Date.now()

        const connectRes = await this.data._socket.connect()

        console.log(`连接${this.data.apSSID}时长：`, Date.now() - now, connectRes, dayjs().format('HH:mm:ss'))

        // 针对IOS用户 加入网关热点wifi的系统弹窗的取消操作
        if (connectRes.errCode === 12007) {
          wx.navigateBack()
          return
        }

        // 重复请求_socket.connect()接口
        if (connectRes.errCode === -2) {
          return
        }

        if (!connectRes.success) {
          throw connectRes
        }

        this.setData({
          activeIndex: 1,
          isConnectDevice: true,
        })

        reportInfo.connect_wifi_time = Date.now() - now

        const initRes = await this.data._socket.init()

        if (!initRes.success) {
          throw initRes
        }

        const { type } = this.data

        if (type === 'changeWifi') {
          this.changeWifi()
        } else if (type === 'bind') {
          this.sendBindCmd()
        } else if (type === 'query') {
          this.getGatewayStatus()
        }
      } catch (err) {
        console.error('connectWifi-err', err)
        this.toErrorStatus()
      }
    },

    /**
         "bind":0,  //绑定状态 0：未绑定  1：WIFI已绑定  2:有线已绑定
         "method":"wifi" //无线配网："wifi"，有线配网:"eth"
     */
    async getGatewayStatus() {
      const res = await this.data._socket.getGatewayStatus()

      if (!res.success) {
        this.toErrorStatus()
        return
      }

      gatewayStatus.method = res.method

      // 强制绑定判断标志  "bind":0,  //绑定状态 0：未绑定  1：WIFI已绑定  2:有线已绑定
      if (res.bind !== 0) {
        this.setData({
          isShowForceBindTips: true,
        })

        this.data._socket.onMessage((data: IAnyObject) => {
          console.log('WifiSocket.onMessage', data)

          if (data.topic === '/gateway/net/confirm' && this.data.isShowForceBindTips) {
            this.setData({
              isShowForceBindTips: false,
            })

            this.startBind()
          }
        })
      } else {
        this.startBind()
      }
    },

    async sendBindCmd() {
      const params = getCurrentPageParams()

      const begin = Date.now()
      const data: IAnyObject = { method: gatewayStatus.method }

      if (data.method === 'wifi') {
        data.ssid = params.wifiSSID
        data.passwd = params.wifiPassword
      }

      const setRes = await this.data._socket.sendCmd({
        topic: '/gateway/net/set', //指令名称
        data,
      })

      console.debug('app-网关耗时：', Date.now() - start, '发送绑定指令耗时：', Date.now() - begin)

      if (!setRes.success) {
        this.toErrorStatus()
        return
      }

      wx.reportEvent('test', {
        app_device: Date.now() - start,
      })

      // 防止强绑情况选网关还没断开原有连接，需要延迟查询
      this.data._queryCloudTimeId = setTimeout(() => {
        this.queryDeviceOnlineStatus(setRes.sn)
      }, 10000)

      this.data._socket.close()
    },

    async changeWifi() {
      const params = getCurrentPageParams()

      const data: IAnyObject = { ssid: params.wifiSSID, passwd: params.wifiPassword }

      const res = await this.data._socket.sendCmd({
        topic: '/gateway/net/change', //指令名称
        data,
      })

      console.log('change', res)
      if (!res.success) {
        this.toErrorStatus()
        return
      }

      // 防止强绑情况网关还没断开原有连接，需要延迟查询
      setTimeout(() => {
        this.queryDeviceOnlineStatus(params.sn, params.type)
      }, 10000)

      this.data._socket.close()
    },

    async requestBindDevice(sn: string, deviceId: string) {
      const params = getCurrentPageParams()

      const existDevice = deviceBinding.store.allRoomDeviceList.find((item) => item.sn === sn)

      let gatewayNum = deviceBinding.store.allRoomDeviceList.filter((item) => item.proType === '0x16').length // 网关数量

      // 强绑情况下，取旧命名
      const deviceName = existDevice ? existDevice.deviceName : params.deviceName + (gatewayNum > 0 ? ++gatewayNum : '')

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
        this.toErrorStatus()
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
          this.toErrorStatus()
          return
        }

        this.data._queryCloudTimeId = setTimeout(() => {
          this.queryDeviceOnlineStatus(sn, type)
        }, 3000)
      }
    },

    reScan() {
      wx.navigateBack()
    },

    startBind() {
      const pageParams = getCurrentPageParams()

      const params = {
        apSSID: pageParams.apSSID,
        method: gatewayStatus.method,
        deviceName: pageParams.deviceName,
      }

      console.debug('网关检查流程耗时：', Date.now() - start)
      wx.reportEvent('test', {
        check_device: Date.now() - start,
      })
      if (gatewayStatus.method === 'wifi') {
        // "method":"wifi" //无线配网："wifi"，有线配网:"eth"
        wx.redirectTo({
          url: strUtil.getUrlWithParams('/package-distribution/wifi-connect/index', params),
        })
      } else if (gatewayStatus.method === 'eth') {
        // "method":"wifi" //无线配网："wifi"，有线配网:"eth"
        this.setData({
          type: 'bind',
        })
        this.sendBindCmd()
      }
    },
  },
})
