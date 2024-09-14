import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { ossDomain, ShareImgUrl } from '../../../config/index'
import { getNewTempPwd } from '../../../apis/index'
import Toast from '../../../skyline-components/mz-toast/toast'

type StatusType = 'init' | 'generated'

ComponentWithComputed({
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    status: 'init' as StatusType,
    randomCode: '',
    adminPwd: '',
    tmpPwd: '',
    actionTips: '临时密码10分钟有效，从随机码生成后开始计算',
    generatedImage: `${ossDomain}/homlux/guide/temp-psw.png`,
    isShowPassword: false,
  },

  computed: {
    infoReady(data) {
      return data.adminPwd && data.randomCode?.length === 4
    },
  },

  pageLifetimes: {
    async show() {},
  },

  methods: {
    async handleConfirm() {
      const { adminPwd, randomCode } = this.data
      const res = await getNewTempPwd({ random: randomCode, adminPwd })
      if (!res.success) {
        Toast('门锁临时密码生成失败')
        return
      }
      const { tmpPwd } = res.result
      this.setData({
        status: 'generated',
        tmpPwd,
        adminPwd: '',
        randomCode: '',
      })
    },
    handleCopyPwd() {
      wx.setClipboardData({
        data: `【门锁临时密码】${this.data.tmpPwd}`,
      })
    },
    onShareAppMessage() {
      return {
        title: `【门锁临时密码】${this.data.tmpPwd}`,
        imageUrl: ShareImgUrl,
        path: '/pages/index/index',
      }
    },
    toggleShowPassword() {
      this.setData({
        isShowPassword: !this.data.isShowPassword,
      })
    },
    // DESERTED 取消重置按钮
    // resetStatus() {
    //   this.setData({
    //     status: 'init',
    //   })
    // },
  },
})
