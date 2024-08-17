import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { wxRequestSubscribeMessage, queryUserSubscribeInfo } from '../../../apis/index'
import { ABNORMAL_TEMPLATE_ID } from '../../../config/index'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    deviceId: '',
    isAcceptedSubscriptions: false,
    abnormalSetting: {
      132: false, // 门铃响
      134: false, // 门锁被撬
      133: false, // 5次后锁定
      135: false, // 低电量
    },
  },

  computed: {},

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad({ deviceId }: { deviceId: string }) {
      console.log('onLoad', deviceId)
      this.setData({
        deviceId,
      })
    },

    onShow() {
      this.init()
    },
    async init() {
      const diffData = {} as IAnyObject

      // 查询小程序订阅设置
      wx.getSetting({
        withSubscriptions: true,
        success: (res) => {
          const { mainSwitch, itemSettings = {} } = res.subscriptionsSetting
          diffData.isAcceptedSubscriptions = mainSwitch && itemSettings[ABNORMAL_TEMPLATE_ID] === 'accept'
        },
      })

      // 查询Homlux提醒设置
      const res = await queryUserSubscribeInfo({
        deviceId: this.data.deviceId,
      })

      if (!res.success) {
        Toast('提醒设置查询失败')
        return
      }

      const { subscribeStatus } = res.result
      Object.keys(subscribeStatus).forEach((key) => {
        diffData[`abnormalSetting[${key}]`] = !!subscribeStatus[key]
      })

      this.setData(diffData)
    },
    async handleSwitch(e: WechatMiniprogram.CustomEvent<never, never, { key: number }>) {
      if (!this.data.isAcceptedSubscriptions) {
        // 如果订阅关闭
        const res = await wxRequestSubscribeMessage([ABNORMAL_TEMPLATE_ID]) // 弹出授权框
        if (res[ABNORMAL_TEMPLATE_ID] !== 'accept') return // 如果用户未选择接受

        this.setData({ isAcceptedSubscriptions: true })
        Toast.success('订阅成功')
      }

      this.setData({
        [`abnormalSetting[${e.currentTarget.dataset.key}]`]: true,
      })
    },
  },
})
