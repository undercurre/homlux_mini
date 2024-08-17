import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { deviceTransmit, sendDevice } from '../../../../../apis/index'
import { getRandomNum } from '../../../../../utils/index'

ComponentWithComputed({
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
      observer(device) {
        const modelName = 'doorLock'
        this.setData({
          electronicLockSetVal: !!device?.mzgdPropertyDTOList[modelName]?.electronicLock,
          intelligentSceneSetVal: !device?.mzgdPropertyDTOList[modelName]?.intelligentScene, // HACK 省电模式与intelligentScene相反
        })
      },
    },
    isManager: {
      type: Boolean,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    electronicLockSetVal: false, // 电子返锁设置值
    intelligentSceneSetVal: false, // 省电模式设置值
    isShowResume: false, // 是否打开
    doorOnline: '0',
  },

  computed: {
    // 复合判断门锁在离线状态
    isDoorOnline(data) {
      const { doorOnline, deviceInfo } = data
      if (!deviceInfo.onLineStatus) return false
      return doorOnline === '1' || doorOnline === '2'
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    toPage(e: WechatMiniprogram.TouchEvent<never, never, { url: string }>) {
      const { deviceId } = this.data.deviceInfo
      console.log('toPage', e.currentTarget.dataset.url)
      wx.navigateTo({
        url: `${e.currentTarget.dataset.url}?deviceId=${deviceId}`,
      })
    },
    async doorLockControl(params: { data: IAnyObject; cmdType: number }) {
      const { proType, deviceType, deviceId } = this.data.deviceInfo
      const res = await sendDevice({
        proType,
        deviceType,
        deviceId,
        customJson: {
          msgId: getRandomNum(0, 255),
          ...params,
        },
      })

      return res.success
    },

    async changeElectronicLock() {
      this.updateReport()
      if (!this.data.isDoorOnline) return

      const result = await this.doorLockControl({
        data: {
          electronicLock: this.data.electronicLockSetVal ? 0 : 1, // 1-打开电子反锁 0-取消电子反锁
        },
        cmdType: 10,
      })
      if (!result) {
        Toast('控制失败')
      } else {
        this.setData({ electronicLockSetVal: !this.data.electronicLockSetVal })
      }
    },

    async changeIntelligentScene() {
      this.updateReport()
      if (!this.data.isDoorOnline) return

      const result = await this.doorLockControl({
        data: {
          intelligentScene: this.data.intelligentSceneSetVal ? 1 : 0, // 1-打开智能模式关闭省电模式 0-取消智能模式开启省电模式
        },
        cmdType: 13,
      })

      if (!result) {
        Toast('控制失败')
      } else {
        this.setData({ intelligentSceneSetVal: !this.data.intelligentSceneSetVal })
      }
    },

    /**
     * 主动更新门锁信息，若离线则主动提示唤醒
     */
    async updateReport() {
      const res = (await deviceTransmit('GET_REPORT_JSON', {
        deviceId: this.data.deviceInfo.deviceId,
      })) as IAnyObject

      if (!res.success) {
        Toast('门锁状态查询失败')
        return
      }

      this.setData({
        doorOnline: res.result.doorOnline,
        isShowResume: !this.data.isDoorOnline,
      })
    },
  },
})
