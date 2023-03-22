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
    isShowPw: false, // 是否展示密码明文
    isShowWifiTips: false,
    hasShowWifiTips: false,
    isShowWifiList: false,
    isRequestSystemWifiList: false,
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
    ready() {
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
    toggleWifiTips() {
      this.setData({
        hasShowWifiTips: true,
        isShowWifiTips: !this.data.isShowWifiTips,
      })
    },
    onChange(event: WechatMiniprogram.CustomEvent) {
      const { value } = event.detail

      console.log('onChange', event)

      this.setData({
        'wifiInfo.SSID': value.SSID,
      })
    },

    async initWifi() {
      const pageParams = getCurrentPageParams()

      wx.onGetWifiList((res) => {
        console.log('onGetWifiList-wifi-connect', res)
        const wifiList = res.wifiList.filter((item) => {
          return item.SSID && this.data.systemWifiList.findIndex((foundItem) => item.SSID === foundItem.SSID) < 0 // 过滤空的ssid的wifi
        })

        if (!wifiList.length) {
          return
        }

        this.setData({
          isRequestSystemWifiList: false,
          systemWifiList: this.data.systemWifiList.concat(wifiList),
        })
        console.log('onGetWifiList', wifiList.map((item) => item.SSID).join('；'))
      })

      wx.onWifiConnected(async (res) => {
        console.log('onWifiConnected-connect-wifi', res, pageParams)

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
      const hasList = this.data.cacheWifiList.length > 0 || this.data.systemWifiList.length > 0

      if (hasList) {
        this.toggleWifiListPopup()
        return
      }

      this.getWifiList()
    },

    toggleWifiListPopup() {
      this.setData({
        isShowWifiList: !this.data.isShowWifiList,
      })
    },

    async getWifiList() {
      const deviceInfo = wx.getDeviceInfo()

      if (deviceInfo.system.toLowerCase().includes('android') || this.data.hasShowWifiTips) {
        this.setData({
          isRequestSystemWifiList: true,
        })
        const wifiListRes = await wx.getWifiList().catch((err) => {
          this.setData({
            isRequestSystemWifiList: false,
          })
          console.log('getWifiList-catch', err)
        })

        console.log('getWifiList', wifiListRes)

        this.setData({
          isShowWifiList: true,
        })
      } else if (deviceInfo.system.toLowerCase().includes('ios')) {
        this.toggleWifiTips()
      }
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
        'wifiInfo.SSID': e.detail.value,
      })
    },

    changePw(e: WechatMiniprogram.CustomEvent) {
      console.log('changeWifiName', e)
      this.setData({
        'wifiInfo.pw': e.detail.value,
      })
    },

    togglePw() {
      this.setData({
        isShowPw: !this.data.isShowPw,
      })
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
