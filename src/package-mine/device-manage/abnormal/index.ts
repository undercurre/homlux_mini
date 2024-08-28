import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { queryUserSubscribeInfo, updateUserSubscribeInfo, getSnTicket } from '../../../apis/index'
import {
  DOORLOCK_TEMPLATE_ID_LIST,
  TYPE_TO_WX_MODEL_ID,
  DOORLOCK_HAVE_EYE_LIST,
  CMDTYPE_TO_TEMPLATE_ID,
} from '../../../config/index'
import { deviceStore, userStore } from '../../../store/index'
import { hideLoading, showLoading } from '../../../utils/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'

type SubscriptionStatus = null | 'accept' | 'reject' | 'ban' | 'filter' | 'acceptWithAudio'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    deviceId: '',
    pid: '',
    mainSwitch: false,
    itemSettings: Object.fromEntries(DOORLOCK_TEMPLATE_ID_LIST.map((item) => [item, 'accept'])),
    isAcceptedSubscriptions: null as SubscriptionStatus,
    subscriptionSetting: {
      // '132': false, // 门铃响
      '133': false, // 5次后锁定
      '134': false, // 门锁被撬
      '135': false, // 低电量
      '136': false, // 开门失败
      '137': false, // 关门失败
      '159': false, // 门外逗留
    } as Record<string, boolean>,
  },

  computed: {
    hasEyesAlarm(data) {
      return DOORLOCK_HAVE_EYE_LIST.includes(data.pid)
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad({ deviceId }: { deviceId: string }) {
      const pid = deviceStore.allRoomDeviceMap[deviceId].productId
      this.setData({
        deviceId,
        pid,
      })
      console.log('onLoad', deviceId, pid)
    },

    onShow() {
      // 查询小程序订阅设置
      wx.getSetting({
        withSubscriptions: true,
        success: (res) => {
          const { mainSwitch, itemSettings = {} } = res.subscriptionsSetting
          this.setData({
            mainSwitch,
            itemSettings,
          })
          console.log('wx getSetting', {
            mainSwitch,
            itemSettings,
          })

          // 如果微信设置接收，则按云端数据初始化各种提醒的状态
          if (mainSwitch) {
            this.initCloudSetting()
          }
          // 如果微信设置不接收，则重置云端设置（否则手动打开微信设置后，云端可能有历史设置）
          else {
            for (const cmdType of Object.keys(this.data.subscriptionSetting)) {
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
      const { itemSettings } = this.data

      const diffData = {} as IAnyObject
      const { subscribeStatus } = res.result
      // 遍历确定各订阅状态，需要云端开关以及微信对应的订阅授权同时开启
      Object.keys(subscribeStatus).forEach((cmdType) => {
        diffData[`subscriptionSetting[${cmdType}]`] =
          !!subscribeStatus[cmdType] && itemSettings[CMDTYPE_TO_TEMPLATE_ID[cmdType]] === 'accept'
      })

      this.setData(diffData)
    },

    /**
     * 开启消息订阅开关
     * @param e.currentTarget.dataset.key 区分不同的提醒
     */
    async handleSwitch(e: WechatMiniprogram.CustomEvent<never, never, { key: string }>) {
      const cmdType = e.currentTarget.dataset.key
      const tmplIds = [CMDTYPE_TO_TEMPLATE_ID[cmdType]]

      // 如果微信总开关关闭，或某个订阅被手动关关闭过，提示用户需要手动打开
      if (!this.data.mainSwitch || this.data.itemSettings[tmplIds[0]] === 'reject') {
        Dialog.confirm({
          showCancelButton: false,
        }).catch(() => {})
        return
      }

      showLoading()

      // !! 如果是开启操作，都必须再调用一次wx订阅接口
      const oldStatus = this.data.subscriptionSetting[cmdType]
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
            tmplIds,
            sn: this.data.deviceId,
            snTicket,
            modelId,
          })
          .catch((err) => {
            console.log('[wxRequestSubscribeMessage]err', err)
          }) // 弹出授权框
        console.log('[wxRequestSubscribeMessage]', cmdType, tmplIds, res)

        if (!res || res[tmplIds[0]] !== 'accept') {
          Toast('订阅失败')
          hideLoading()
          return
        } // 如果用户未选择接受

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
        [`subscriptionSetting[${cmdType}]`]: !oldStatus,
      })
      hideLoading()
    },
  },
})
