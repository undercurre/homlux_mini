import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { CMD, deviceConfig } from '../../config/remoter'
import { emitter, storage, isAndroid } from '../../utils/index'
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
    _localList: (storage.get<Remoter.LocalList>('_localList') ?? {}) as Remoter.LocalList,
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
  },

  computed: {},

  lifetimes: {
    detached() {
      emitter.off('remoterChanged')
    },
  },

  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; deviceId: string }) {
      const { deviceType, deviceModel, deviceId } = query
      const addr = isAndroid() ? deviceId.split(':').reverse().join('') : deviceId
      const deviceName = this.data._localList[deviceId].deviceName ?? deviceConfig[deviceType][deviceModel]
      this.setData({
        device: { ...deviceConfig[deviceType][deviceModel], deviceType, deviceModel, deviceId, deviceName, addr },
      })

      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()

      // 根据通知,更新设备列表
      emitter.on('remoterChanged', () => {
        this.reloadDeviceData()
      })
    },

    reloadDeviceData() {
      this.data._localList = (storage.get<Remoter.LocalList>('_localList') ?? {}) as Remoter.LocalList
      const deviceName = this.data._localList[this.data.device.deviceId].deviceName
      this.setData({
        device: {
          ...this.data.device,
          deviceName,
        },
      })
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

      console.log('btnTap', e.target.dataset.key, payload, addr)
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
