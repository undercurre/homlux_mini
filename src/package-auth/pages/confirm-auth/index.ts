import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { homeStore } from '../../../store/index'
import Dialog from '@vant/weapp/dialog/dialog'

ComponentWithComputed({
  behaviors: [pageBehaviors],
  properties: {
    proType: String,
    sn8: String,
    deviceImg: String,
    productId: String,
    mode: Number,
  },

  data: {
    isAgree: false,
    seconds: 3,
  },

  computed: {
    tipsText(data) {
      const { seconds } = data
      return '我知道了' + (seconds ? `（${seconds}s）` : '')
    },
  },
  lifetimes: {
    async ready() {
      // 请联系家庭创建者完成美的美居授权。
      if (!homeStore.isCreator) {
        Dialog.alert({
          title: '请联系HOMLUX家庭创建者完成美的美居授权，路径：我的-连接其他平台-美的美居。',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        }).then(() => {
          this.goBack()
        })
        return
      }

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
    toBindMeijuHome() {
      wx.redirectTo({
        url: '/package-auth/pages/meiju/index',
      })
    },
  },
})
