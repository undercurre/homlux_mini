import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil, storage, getCurrentPageParams } from '../../utils/index'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    isShowWifiList: false,
    selectWifi: {
      SSID: '',
      pw: '',
    },
    wifiInfo: {
      SSID: '',
      pw: '',
    },
    _platform: '',
    cacheWifiList: [] as Array<{ SSID: string; pw: string }>,
    systemWifiList: [] as WechatMiniprogram.WifiInfo[],
  },

  computed: {
    wifiList(data) {
      const list = data.cacheWifiList.map((item) => ({
        ...item,
        signalStrength: 100,
        frequency: 2.4,
      }))

      data.systemWifiList.forEach((item) => {
        const wifiInfo = list.find((lisItem) => item.SSID === lisItem.SSID)

        if (wifiInfo) {
          wifiInfo.frequency = item.frequency
          wifiInfo.signalStrength = data._platform === 'android' ? item.signalStrength : item.signalStrength * 100
        } else {
          list.push({
            ...item,
            pw: '',
          })
        }
      })

      return list
    },
  },

  lifetimes: {
    attached() {
      const deviceInfo = wx.getDeviceInfo()

      console.log('deviceInfo', deviceInfo)

      const cacheWifiInfo = storage.get('selected_home_wifi') as { SSID: string; pw: string }

      const cacheWifiList = storage.get('cacheWifiList', []) as Array<{ SSID: string; pw: string }>

      this.setData({
        wifiInfo: cacheWifiInfo || {
          SSID: '',
          pw: '',
        },
        cacheWifiList: cacheWifiList,
        _platform: deviceInfo.platform,
      })

      this.initWifi()
    },
    detached() {},
  },

  pageLifetimes: {
    show() {},
    hide() {},
  },

  methods: {
    onChange(event: WechatMiniprogram.CustomEvent) {
      const { value } = event.detail

      console.log('onChange', event)

      this.setData({
        'wifiInfo.SSID': value.SSID,
      })
    },

    async initWifi() {
      const startRes = await wx.startWifi()
      const pageParams = getCurrentPageParams()

      console.log('startWifi', startRes)

      wx.onGetWifiList((res) => {
        console.log('onGetWifiList', res)
        const wifiList = res.wifiList.filter((item) => item.SSID) // 过滤空的ssid的wifi

        this.setData({
          systemWifiList: wifiList,
        })
        console.log('onGetWifiList', wifiList.map((item) => item.SSID).join('；；'))
      })

      wx.onWifiConnected(async (res) => {
        console.log('onWifiConnected', res)

        if (!res.wifi.SSID || res.wifi.SSID === pageParams.apSSID) {
          return
        }

        this.setData({
          wifiInfo: {
            SSID: res.wifi.SSID,
            pw: '',
          },
        })
      })
    },

    toggleWifi() {
      if (this.data.cacheWifiList.length === 0) {
        this.getWifiList()
      }

      this.setData({
        isShowWifiList: true,
      })
    },

    onCloseWifiList() {
      this.setData({
        isShowWifiList: false,
      })
    },

    selectWifi(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset
      const item = this.data.wifiList[index]

      this.setData({
        selectWifi: {
          SSID: item.SSID,
          pw: item.pw,
        },
      })
    },

    confirmWifi() {
      this.setData({
        isShowWifiList: false,
        wifiInfo: {
          SSID: this.data.selectWifi.SSID,
          pw: this.data.selectWifi.pw,
        },
      })
    },

    changeWifiName(e: WechatMiniprogram.CustomEvent) {
      console.log('changeWifiName', e)
      this.setData({
        'wifiInfo.SSID': e.detail,
      })
    },

    changePw(e: WechatMiniprogram.CustomEvent) {
      console.log('changeWifiName', e)
      this.setData({
        'wifiInfo.pw': e.detail,
      })
    },

    async getWifiList() {
      const wifiListRes = await wx.getWifiList()

      console.log('getWifiList', wifiListRes)
    },

    next() {
      const pageParams = getCurrentPageParams()

      const { SSID, pw } = this.data.wifiInfo

      const cacheWifiList = this.data.cacheWifiList

      const index = cacheWifiList.findIndex((item) => item.SSID === SSID)

      if (index >= 0) {
        cacheWifiList[index].pw = pw
      } else {
        cacheWifiList.push({
          SSID,
          pw,
        })
      }

      storage.set('cacheWifiList', cacheWifiList)

      storage.set('selected_home_wifi', this.data.wifiInfo) // 记住输入过的wifi信息，下次自动回填

      wx.redirectTo({
        url: strUtil.getUrlWithParams('/package-distribution/add-gateway/index', {
          ...pageParams,
          wifiSSID: SSID,
          wifiPassword: pw,
        }),
      })
    },
  },
})
