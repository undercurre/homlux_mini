import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { CMD, deviceConfig } from '../../config/remoter'
import { emitter, storage, isAndroid } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import { createBleServer, bleAdvertising, bleAdvertisingEnd, stopAdvertising } from '../../utils/remoterUtils'

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
    _lastPowerKey: '', // 记录上一次点击‘照明’时的指令键，用于反转处理
  },

  computed: {},

  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; deviceId: string }) {
      // HACK 从设置页后退时被跳过，再次进入时可能不会重新初始化
      this.data._localList = (storage.get<Remoter.LocalList>('_localList') ?? {}) as Remoter.LocalList

      console.log('pannel', this.data._localList)
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
        console.log('remoterChanged on Pannel')

        this.reloadDeviceData()
      })
    },
    onUnload() {
      emitter.off('remoterChanged')
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

      let { key } = e.target.dataset
      // HACK 特殊的POWER按钮反转处理
      if (key === 'POWER') {
        key = this.data._lastPowerKey === 'POWER_OFF' ? 'POWER_ON' : 'POWER_OFF'
        this.data._lastPowerKey = key
      }

      // 广播控制指令
      const { addr } = this.data.device
      const payload = remoterProtocol.generalCmdString(CMD[key])
      bleAdvertising(this.data._bleServer, {
        addr,
        payload,
      })

      console.log('btnTap', key, payload, addr)
    },
    async handleLongPress(e: WechatMiniprogram.TouchEvent) {
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }

      const key = `${e.target.dataset.key}_ACC` // 加上长按指令后缀

      // 广播控制指令
      const { addr } = this.data.device
      const payload = remoterProtocol.generalCmdString(CMD[key])
      bleAdvertising(this.data._bleServer, {
        addr,
        payload,
        autoEnd: false, // 松手才发终止指令
      })

      console.log('handleLongPress', key, payload)
    },
    async handleTouchEnd() {
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }
      await stopAdvertising(this.data._bleServer)

      const { addr } = this.data.device
      bleAdvertisingEnd(this.data._bleServer, { addr })
      console.log('handleTouchEnd')
    },

    toSetting() {
      const { deviceType, deviceModel, deviceId } = this.data.device
      wx.navigateTo({
        url: `/package-remoter/setting/index?deviceType=${deviceType}&deviceModel=${deviceModel}&deviceId=${deviceId}`,
      })
    },
  },
})
