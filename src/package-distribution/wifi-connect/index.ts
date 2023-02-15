import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil, storage, getCurrentPageParams } from '../../utils/index'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },

  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    wifiInfo: {
      SSID: '',
      pw: '',
    },
    wifiList: [] as WechatMiniprogram.WifiInfo[],
  },

  computed: {},

  lifetimes: {
    attached() {
      const cacheWifiInfo = storage.get('selected_home_wifi') as { SSID: string; pw: string }

      if (cacheWifiInfo) {
        this.setData({
          wifiInfo: cacheWifiInfo,
        })
      }

      this.initWifi()

      const deviceInfo = wx.getDeviceInfo()

      console.log('deviceInfo', deviceInfo)
    },
  },

  pageLifetimes: {
    show: function () {},
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

      console.log('startWifi', startRes)

      wx.onGetWifiList((res) => {
        console.log('onGetWifiList', res)

        this.setData({
          wifiList: res.wifiList,
        })
        console.log('onGetWifiList', res.wifiList.map((item) => item.SSID).join('；；'))
      })
    },

    toggleWifi() {
      this.getWifiList()
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

      storage.set('selected_home_wifi', this.data.wifiInfo) // 记住输入过的wifi信息，下次自动回填

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/add-gateway/index', {
          ...pageParams,
          wifiSSID: SSID,
          wifiPassword: pw,
        }),
      })
    },
  },
})
