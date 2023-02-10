import { ComponentWithComputed } from 'miniprogram-computed'
import { IPageData } from './typings'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { wifiProtocol, strUtil } from '../../utils/index'
import { queryDeviceOnlineStatus } from '../../apis/index'
import { deviceKey, env } from '../../config/index'

const udpClient = wx.createUDPSocket()
const key = (deviceKey[env] as string) + 'E5FB'
let gatewayIp = '',
  sn = '',
  wifiInfo: WechatMiniprogram.WifiInfo

ComponentWithComputed({
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
    SSID: 'midea_16_E5FB',
    password: '12345678',
    status: 'linking',
    currentStep: '连接设备',
  } as WechatMiniprogram.IAnyObject & IPageData,

  computed: {
    loadingText(data) {
      return data.status === 'linking' ? '正在连接设备，请将手机尽量靠近设备' : '请将设备尽量靠近智能网关' // data.c 为自定义 behavior 数据段
    },
  },

  lifetimes: {
    attached() {
      this.initWifi()

      // this.initUdpSocket()
    },
    detached() {
      console.log('detached')
      udpClient.close()
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async initWifi() {
      const startRes = await wx.startWifi()

      console.log('startWifi', startRes)

      wx.onGetWifiList((res) => {
        console.log('onGetWifiList', res)

        console.log(
          'onGetWifiList',
          res.wifiList
            .filter((item) => item.SSID.includes('midea_16'))
            .map((item) => item.SSID)
            .join('；；'),
        )
      })

      wx.onWifiConnected((res) => {
        console.log('onWifiConnected', res)

        wifiInfo = res.wifi

        this.getGatewayIp()
      })

      this.connectWifi()
    },

    async getWifiList() {
      const wifiListRes = await wx.getWifiList()

      console.log('getWifiList', wifiListRes)
    },

    async connectWifi() {
      const res = await wx.connectWifi({
        SSID: this.data.SSID,
        password: this.data.password,
        partialInfo: true,
      })

      console.log('connectWifi', res)
    },

    async initUdpSocket() {
      const port = udpClient.bind(6366)
      console.log('port', port)

      udpClient.onMessage((res) => {
        console.log('udpClient.onMessage', res)

        const reply = wifiProtocol.decodeCmd(res.message, key)
        console.log('reply', reply)

        // 获取网关IP地址
        if (reply.topic === '/gateway/net/serverip/ack') {
          gatewayIp = reply.data.ip

          this.getGatewayStatus()

          this.startWifiBind()
        } else if (reply.topic === '/gateway/net/set/ack') {
          sn = reply.data.sn

          this.queryDeviceOnlineStatus(sn)
        }
      })

      udpClient.onError((res) => {
        console.log('udpClient.onError', res)
      })

      udpClient.onClose((res) => {
        console.log('udpClient.onClose', res)
      })

      udpClient.onListening((res) => {
        console.log('udpClient.onListening', res)
      })
    },

    /**
     * 获取网关IP地址
     */
    getGatewayIp() {
      const msg = wifiProtocol.encodeCmd({
        topic: '/gateway/net/serverip', //指令名称:获取网关IP
        data: {},
        key,
      })

      // console.log('decrypt', aesUtil.decrypt(msg, key))

      udpClient.send({
        address: '255.255.255.255',
        port: 6266,
        message: msg,
      })
    },

    connectGateway() {
      udpClient.connect({ address: gatewayIp, port: 6266 })
    },

    /**
         "bind":0,  //绑定状态 0：未绑定  1：WIFI已绑定  2:有线已绑定
         "method":"wifi" //无线配网："wifi"，有线配网:"eth"
     */
    getGatewayStatus() {
      const msg = wifiProtocol.encodeCmd({
        topic: '/gateway/net/status', //指令名称:获取网关IP
        data: {},
        key,
      })

      udpClient.send({
        address: gatewayIp,
        port: 6266,
        message: msg,
      })
    },

    startWifiBind() {
      const msg = wifiProtocol.encodeCmd({
        topic: '/gateway/net/set', //指令名称
        data: {
          //指令参数
          method: 'wifi', //无线配网绑定
          ssid: 'xyh_wifi', //路由名称,长度不能超32个字符
          passwd: '12345678', //路由密码，长度不能超64个字符
          bssid: wifiInfo.BSSID, //路由BSSID
        },
        key,
      })

      udpClient.send({
        address: gatewayIp,
        port: 6266,
        message: msg,
      })
    },

    async queryDeviceOnlineStatus(sn: string) {
      const res = await queryDeviceOnlineStatus({ sn, deviceType: '1' })

      console.log('queryDeviceOnlineStatus', res)

      if (res && res.success && res.result.onlineStatus === 1) {
        wx.navigateTo({
          url: strUtil.getUrlWithParams('/package-distribution/bind-home/index', { deviceId: res.result.deviceId }),
        })
      }
    },

    toBind() {
      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/bind-home/index', { deviceId: '1111' }),
      })
    },
  },
})
