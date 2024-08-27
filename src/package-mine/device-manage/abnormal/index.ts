import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { queryUserSubscribeInfo, updateUserSubscribeInfo, getSnTicket } from '../../../apis/index'
import { ABNORMAL_TEMPLATE_ID, TYPE_TO_WX_MODEL_ID } from '../../../config/index'
import { userStore } from '../../../store/index'
import { hideLoading, showLoading } from '../../../utils/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    deviceId: '',
    mainSwitch: false,
    isAcceptedSubscriptions: null as null | 'accept' | 'reject' | 'ban' | 'filter' | 'acceptWithAudio',
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

    onShow() {
      // 查询小程序订阅设置
      wx.getSetting({
        withSubscriptions: true,
        success: (res) => {
          const { mainSwitch, itemSettings = {} } = res.subscriptionsSetting
          const isAcceptedSubscriptions = itemSettings[ABNORMAL_TEMPLATE_ID]
          this.setData({
            mainSwitch,
            isAcceptedSubscriptions,
          })
          console.log('wx getSetting', {
            mainSwitch,
            itemSettings,
          })

          // 如果微信设置接收，则按云端数据初始化各种提醒的状态
          if (mainSwitch && isAcceptedSubscriptions === 'accept') {
            this.initCloudSetting()
          }
          // 如果微信设置不接收，则重置云端设置（否则手动打开微信设置后，云端可能有历史设置）
          else {
            for (const cmdType of Object.keys(this.data.abnormalSetting)) {
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

    // 查询云端Homlux提醒设置
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

    /**
     * 开启异常提醒开关
     * @param e.currentTarget.dataset.key 区分不同的提醒
     */
    async handleSwitch(e: WechatMiniprogram.CustomEvent<never, never, { key: string }>) {
      console.log('isAcceptedSubscriptions', this.data.isAcceptedSubscriptions)
      if (!this.data.mainSwitch || this.data.isAcceptedSubscriptions === 'reject') {
        Dialog.confirm({
          showCancelButton: false,
        }).catch(() => {})
        return
      }

      const cmdType = e.currentTarget.dataset.key
      const oldStatus = this.data.abnormalSetting[cmdType]

      showLoading()

      // 如果是开启，并且isAcceptedSubscriptions未设置过
      //  && typeof this.data.isAcceptedSubscriptions !== 'string'
      if (!oldStatus) {
        const modelId = TYPE_TO_WX_MODEL_ID['0x09']
        const ticketRes = await getSnTicket({ sn: this.data.deviceId, modelId })
        if (!ticketRes.success) {
          Toast('订阅失败')
          hideLoading()
          return
        }

        const { snTicket } = ticketRes.result

        const res = await wx
          .requestSubscribeDeviceMessage({
            tmplIds: [ABNORMAL_TEMPLATE_ID],
            sn: this.data.deviceId,
            snTicket,
            modelId,
          })
          .catch((err) => {
            console.log('[wxRequestSubscribeMessage]err', err)
          }) // 弹出授权框
        console.log('[wxRequestSubscribeMessage]', res)
        if (!res || res[ABNORMAL_TEMPLATE_ID] !== 'accept') {
          Toast('订阅失败')
          hideLoading()
          return
        } // 如果用户未选择接受

        this.setData({ isAcceptedSubscriptions: 'accept' })
        Toast('订阅成功')
      }

      // 更新页面显示及云端记录
      await updateUserSubscribeInfo({
        deviceId: this.data.deviceId,
        cmdType,
        onStatus: oldStatus ? 0 : 1,
        userId: userStore.userInfo.userId,
      })

      this.setData({
        [`abnormalSetting[${cmdType}]`]: !oldStatus,
      })
      hideLoading()
    },
  },
})
