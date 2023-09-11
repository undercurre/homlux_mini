import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { CMD, deviceConfig } from '../../config/remoter'
import { emitter, storage } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import {
  createBleServer,
  bleAdvertising,
  bleAdvertisingEnd,
  stopAdvertising,
  BleService,
} from '../../utils/remoterUtils'

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
    envVersion: 'release', // 当前小程序环境，默认为发布版，用于屏蔽部分实验功能
    _localList: (storage.get<Remoter.LocalList>('_localList') ?? {}) as Remoter.LocalList,
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _bleService: null as BleService | null,
    _lastPowerKey: '', // 记录上一次点击‘照明’时的指令键，用于反转处理
  },

  computed: {
    connectIcon(data) {
      return data.device.connected ? '/assets/img/base/scene-switch-btn.png' : '/assets/img/base/offline.png'
    },
  },

  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string }) {
      // HACK 从设置页后退时被跳过，再次进入时可能不会重新初始化
      this.data._localList = (storage.get<Remoter.LocalList>('_localList') ?? {}) as Remoter.LocalList

      console.log('pannel', this.data._localList)
      const { deviceType, deviceModel, addr } = query
      const deviceName = this.data._localList[addr].deviceName ?? deviceConfig[deviceType][deviceModel]
      this.setData({
        device: { ...deviceConfig[deviceType][deviceModel], deviceType, deviceModel, deviceName, addr },
      })

      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()

      // 根据通知,更新设备列表
      emitter.on('remoterChanged', () => {
        console.log('remoterChanged on Pannel')

        this.reloadDeviceData()
      })

      // TODO 监听蓝牙连接状态变化

      // 版本获取
      const info = wx.getAccountInfoSync()

      this.setData({
        envVersion: info.miniProgram.envVersion,
      })
    },
    onUnload() {
      emitter.off('remoterChanged')

      // 关闭蓝牙连接
      if (this.data.device.connected) {
        this.data._bleService?.close()
      }
    },

    reloadDeviceData() {
      this.data._localList = (storage.get<Remoter.LocalList>('_localList') ?? {}) as Remoter.LocalList
      const deviceName = this.data._localList[this.data.device.addr].deviceName
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
      // HACK 特殊的照明按钮反转处理
      if (key === 'LIGHT_LAMP') {
        key = this.data._lastPowerKey === `${key}_OFF` ? `${key}_ON` : `${key}_OFF`
        this.data._lastPowerKey = key
      }

      const { addr, connected } = this.data.device
      const payload = remoterProtocol.generalCmdString(CMD[key])
      if (connected) {
        await this.data._bleService?.sendCmd(payload)
      }
      // 广播控制指令
      else {
        bleAdvertising(this.data._bleServer, {
          addr,
          payload,
        })
      }

      console.log('btnTap', { key, payload, addr, connected })
    },
    async handleLongPress(e: WechatMiniprogram.TouchEvent) {
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }

      const key = `${e.target.dataset.key}_ACC` // 加上长按指令后缀

      const { addr, connected } = this.data.device
      const payload = remoterProtocol.generalCmdString(CMD[key])
      if (connected) {
        // TODO 定时连续发指令
        await this.data._bleService?.sendCmd(payload)
        await this.data._bleService?.sendCmd(payload)
        await this.data._bleService?.sendCmd(payload)
        await this.data._bleService?.sendCmd(payload)
      }
      // 广播控制指令
      else {
        bleAdvertising(this.data._bleServer, {
          addr,
          payload,
          autoEnd: false, // 松手才发终止指令
        })
      }

      console.log('handleLongPress', key, payload)
    },
    async handleTouchEnd() {
      // 若已建立连接，则不再广播结束指令
      if (this.data.device.connected) {
        return
      }

      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }
      await stopAdvertising(this.data._bleServer)

      const { addr } = this.data.device
      bleAdvertisingEnd(this.data._bleServer, { addr })
      console.log('handleTouchEnd')
    },

    toSetting() {
      const { deviceType, deviceModel, addr } = this.data.device
      wx.navigateTo({
        url: `/package-remoter/setting/index?deviceType=${deviceType}&deviceModel=${deviceModel}&addr=${addr}`,
      })
    },

    // 建立蓝牙连接（调试用）
    async connectToggle() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' })

      const { addr, connected } = this.data.device
      const { deviceId } = this.data._localList[addr]
      if (!this.data._bleService) {
        this.data._bleService = new BleService({ addr, deviceId })
      }

      if (!connected) {
        await this.data._bleService.connect()
        await this.data._bleService.init()
      } else {
        await this.data._bleService.close()
      }

      const diffData = {} as IAnyObject
      diffData['device.connected'] = !connected
      this.setData(diffData)
    },
  },
})
