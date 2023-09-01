import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { CMD, deviceConfig } from '../../config/remoter'
import remoterProtocol from '../../utils/remoterProtocol'
import { createBleServer, bleAdvertising } from '../../utils/remoterUtils'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    device: {} as IAnyObject,
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
  },

  computed: {},

  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; deviceId: string }) {
      const { deviceType, deviceModel, deviceId } = query
      this.setData({
        device: { ...deviceConfig[deviceType][deviceModel], deviceType, deviceModel, deviceId },
      })

      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()
    },

    async btnTap(e: WechatMiniprogram.TouchEvent) {
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }
      // 广播控制指令
      const { addr } = this.data.device
      const payload = remoterProtocol.generalCmdString(CMD[e.target.dataset.key])
      bleAdvertising(this.data._bleServer, {
        addr,
        payload,
      })

      console.log('btnTap', e.target.dataset.key, payload)
    },
    handleLongPress(e: WechatMiniprogram.TouchEvent) {
      console.log('handleLongPress', e)
    },

    toSetting() {
      const { deviceType, deviceModel, deviceId } = this.data.device
      wx.navigateTo({
        url: `/package-remoter/setting/index?deviceType=${deviceType}&deviceModel=${deviceModel}&deviceId=${deviceId}`,
      })
    },
  },
})
