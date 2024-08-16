import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { homluxOssUrl } from '../../../config/index'

ComponentWithComputed({
  behaviors: [pageBehaviors],
  properties: {},

  data: {
    homluxOssUrl,
    isAgree: false,
    seconds: 3,
    tips: '请登录美居APP账号，美的系列产品可同步至Homlux美的照明小程序。\n美的系列产品可直接通过Homlux美的照明小程序完成设备配网。完成后，设备数据信息将同步到美的美居APP和Homlux美的照明小程序中。',
  },

  computed: {
    tipsText(data) {
      const { seconds } = data
      return '我知道了' + (seconds ? `（${seconds}s）` : '')
    },
  },
  lifetimes: {
    async ready() {
      const timeId = setInterval(() => {
        this.data.seconds--

        this.setData({
          seconds: this.data.seconds,
        })

        if (this.data.seconds <= 0) {
          clearInterval(timeId)
        }
      }, 1000)

      // const entry = storage.get('meiju_auth_entry')
      // if (entry !== 'package-auth-index') {
      //   this.setData({
      //     tips: '请登录美居APP账号，美的系列产品可直接通过Homlux美的照明小程序完成设备配网。完成后，设备数据信息将同步到美的美居APP和Homlux美的照明小程序中。',
      //   })
      // }
    },
  },
  methods: {
    toAgree(e: { detail: boolean }) {
      if (this.data.seconds > 0) {
        return
      }

      this.setData({
        isAgree: e.detail,
      })
    },
    /**
     * 确认绑定美居账号
     */
    toBindMeijuHome() {
      wx.redirectTo({
        url: '/package-auth/pages/meiju/index',
      })
    },
  },
})
