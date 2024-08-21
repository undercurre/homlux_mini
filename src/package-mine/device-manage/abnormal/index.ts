import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { wxRequestSubscribeMessage, queryUserSubscribeInfo, updateUserSubscribeInfo } from '../../../apis/index'
import { ABNORMAL_TEMPLATE_ID } from '../../../config/index'
import { userStore } from '../../../store/index'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    deviceId: '',
    isAcceptedSubscriptions: false,
    abnormalSetting: {
      '132': false, // 门铃响
      '134': false, // 门锁被撬
      '133': false, // 5次后锁定
      '135': false, // 低电量
    } as Record<string, boolean>,
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

    async onShow() {
      await this.initWechatSetting()
      if (this.data.isAcceptedSubscriptions) {
        this.initCloudSetting()
      }
    },
    async initWechatSetting() {
      // 查询小程序订阅设置
      wx.getSetting({
        withSubscriptions: true,
        success: (res) => {
          const { mainSwitch, itemSettings = {} } = res.subscriptionsSetting
          const isAcceptedSubscriptions = mainSwitch && itemSettings[ABNORMAL_TEMPLATE_ID] === 'accept'
          // console.log('wx getSetting', { mainSwitch, itemSettings })
          this.setData({
            isAcceptedSubscriptions,
          })

          // 如果微信设置不接收，则重置云端设置
          if (!isAcceptedSubscriptions) {
            for (const cmdType of Object.keys(this.data.abnormalSetting)) {
              const oldStatus = this.data.abnormalSetting[cmdType]
              if (!oldStatus) continue
              updateUserSubscribeInfo({
                deviceId: this.data.deviceId,
                cmdType,
                onStatus: 0,
                userId: userStore.userInfo.userId,
              })
            }
          }
        },
      })
    },
    // 查询Homlux提醒设置

    async initCloudSetting() {
      const res = await queryUserSubscribeInfo({
        deviceId: this.data.deviceId,
      })

      if (!res.success) {
        Toast('提醒设置查询失败')
        return
      }
      const diffData = {} as IAnyObject
      const { subscribeStatus } = res.result
      Object.keys(subscribeStatus).forEach((key) => {
        diffData[`abnormalSetting[${key}]`] = !!subscribeStatus[key]
      })

      this.setData(diffData)
    },

    async handleSwitch(e: WechatMiniprogram.CustomEvent<never, never, { key: string }>) {
      const cmdType = e.currentTarget.dataset.key
      const oldStatus = this.data.abnormalSetting[cmdType]

      if (!oldStatus && !this.data.isAcceptedSubscriptions) {
        // 如果要开启，但订阅设置关闭
        const res = await wxRequestSubscribeMessage([ABNORMAL_TEMPLATE_ID]) // 弹出授权框
        // console.log('wxRequestSubscribeMessage', res)
        if (res[ABNORMAL_TEMPLATE_ID] !== 'accept') return // 如果用户未选择接受

        this.setData({ isAcceptedSubscriptions: true })
        Toast.success('订阅成功')
      }

      await updateUserSubscribeInfo({
        deviceId: this.data.deviceId,
        cmdType,
        onStatus: oldStatus ? 0 : 1,
        userId: userStore.userInfo.userId,
      })

      this.setData({
        [`abnormalSetting[${cmdType}]`]: !oldStatus,
      })
    },
  },
})
