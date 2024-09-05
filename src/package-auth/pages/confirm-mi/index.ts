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
    tips: '1、在美的照明小程序完成设备联网；\n2、登录“米家”APP帐号，可手动勾选美的照明的设备信息授权同步到“米家”APP中，与米家生态所有智能设备实现互联互通；\n3、可通过小爱同学语音控制和通过“米家”设置自动化功能。',
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
    toNextStep() {
      wx.redirectTo({
        url: '/package-auth/pages/mi/index',
      })
    },
  },
})
