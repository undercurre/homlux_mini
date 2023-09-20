import pageBehaviors from '../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { CMD, FACTORY_ADDR } from '../../config/remoter'
import { emitter, Logger, initBleCapacity } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import {
  createBleServer,
  bleAdvertising,
  bleAdvertisingEnd,
  stopAdvertising,
  BleService,
} from '../../utils/remoterUtils'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isDebugMode: false,
    isFactoryMode: false, // 工厂调试模式，按特定的地址发送指令
    _envVersion: 'release', // 当前小程序环境，默认为发布版，用于屏蔽部分实验功能
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _bleService: null as BleService | null,
    _lastPowerKey: '', // 记录上一次点击‘照明’时的指令键，用于反转处理
    _keyQueue: ['', '', '', '', '', '', '', ''], // 记录按键序列
    _longpress_key: '',
  },

  computed: {
    pageTitle(data) {
      const deviceName = remoterStore.curRemoter.deviceName ?? ''
      return data.isFactoryMode ? `${deviceName}|${FACTORY_ADDR}` : deviceName
    },
    connectIcon() {
      return remoterStore.curRemoter?.connected
        ? '/assets/img/base/scene-switch-btn.png'
        : '/assets/img/base/offline.png'
    },
  },

  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string }) {
      const { addr } = query
      // this.setData({ deviceType, deviceModel, addr })
      remoterStore.setAddr(addr)

      const bleInited = await initBleCapacity()

      if (!bleInited) {
        return
      }

      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()

      // 根据通知,更新设备列表
      // FIXME 删除设备时，IOS下仍会触发本更新，导致报错
      emitter.on('remoterChanged', () => {
        console.log('remoterChanged on Pannel')

        // this.reloadDeviceData()
      })

      // TODO 监听蓝牙连接状态变化

      // 版本获取
      const info = wx.getAccountInfoSync()
      this.data._envVersion = info.miniProgram.envVersion
    },
    onUnload() {
      emitter.off('remoterChanged')

      // 关闭蓝牙连接
      if (remoterStore.curRemoter.connected) {
        this.data._bleService?.close()
      }
    },

    // TODO 产测模式需要自定义标题
    reloadDeviceData() {
      // this.data._localList = (storage.get<Remoter.LocalList>('_localList') ?? {}) as Remoter.LocalList
      // const deviceName = this.data._localList[this.data.device.addr].deviceName
      // this.setData({
      //   device: {
      //     ...this.data.device,
      //     deviceName,
      //   },
      // })
    },

    async btnTap(e: WechatMiniprogram.TouchEvent) {
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }

      let { key } = e.target.dataset
      // DEBUG 产测指令，仅调试模式可用
      if (key === 'FACTORY' && !this.data.isFactoryMode) {
        return
      }
      // HACK 特殊的照明按钮反转处理
      if (key === 'LIGHT_LAMP') {
        key = this.data._lastPowerKey === `${key}_OFF` ? `${key}_ON` : `${key}_OFF`
        this.data._lastPowerKey = key
      }

      const addr = this.data.isFactoryMode ? FACTORY_ADDR : remoterStore.curAddr
      const payload = remoterProtocol.generalCmdString(CMD[key])

      const { dir } = e.target.dataset
      Logger.log('btnTap', key, dir, { payload, addr })

      // DEBUG 蓝牙连接模式
      if (remoterStore.curRemoter.connected) {
        await this.data._bleService?.sendCmd(payload)
      }
      // 广播控制指令
      else {
        bleAdvertising(this.data._bleServer, {
          addr,
          payload,
        })
      }

      // 记录点击按键序列，作为进入调试模式的前置操作
      this.data._keyQueue.shift()
      this.data._keyQueue.push(dir)
    },
    async handleLongPress(e: WechatMiniprogram.TouchEvent) {
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }

      const key = `${e.target.dataset.key}_ACC` // 加上长按指令后缀
      const addr = this.data.isFactoryMode ? FACTORY_ADDR : remoterStore.curAddr
      const payload = remoterProtocol.generalCmdString(CMD[key])

      // DEBUG 蓝牙连接模式 TODO 定时连续发指令
      if (remoterStore.curRemoter.connected) {
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

      this.data._longpress_key = e.target.dataset.dir

      console.log('handleLongPress', key, payload)
    },
    async handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
      // 若已建立连接，则不再广播结束指令
      if (remoterStore.curRemoter.connected) {
        return
      }

      // 如果上个动作不是执行长按，不需要主动广播结束指令
      const { dir } = e.target.dataset
      if (!dir || dir !== this.data._longpress_key) {
        return
      }
      this.data._longpress_key = ''

      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }
      await stopAdvertising(this.data._bleServer)

      const addr = this.data.isFactoryMode ? FACTORY_ADDR : remoterStore.curAddr
      bleAdvertisingEnd(this.data._bleServer, { addr })
      console.log('handleTouchEnd')
    },

    toSetting() {
      wx.navigateTo({
        url: `/package-remoter/setting/index?addr=${remoterStore.curAddr}`,
      })
    },

    // 建立蓝牙连接（调试用）
    async toggleBleMode() {
      // if (wx.vibrateShort) wx.vibrateShort({ type: 'light' })
      // const { addr, connected } = remoterStore.curRemoter
      // const { deviceId } = this.data._localList[addr]
      // if (!this.data._bleService) {
      //   this.data._bleService = new BleService({ addr, deviceId })
      // }
      // if (!connected) {
      //   await this.data._bleService.connect()
      //   await this.data._bleService.init()
      // } else {
      //   await this.data._bleService.close()
      // }
      // TODO 更新连接状态
      // const diffData = {} as IAnyObject
      // diffData['device.connected'] = !connected
      // this.setData(diffData)
    },

    toggleDebug() {
      // 只用于开发环境、体验环境
      if (this.data._envVersion === 'release') {
        return
      }

      // 进入调试模式，按键序列满足上上下下左左右右
      const q = this.data._keyQueue.join('')
      this.data._keyQueue = ['', '', '', '', '', '', '', ''] // 清空
      console.log('toggleDebug', q)
      if (!this.data.isDebugMode && q !== 'UUDDLLRR') {
        return
      }

      // 切换调试模式，同时默认禁用工厂模式
      this.setData({ isDebugMode: !this.data.isDebugMode, isFactoryMode: false })
    },

    toggleAddr() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })

      this.setData({ isFactoryMode: !this.data.isFactoryMode })
    },
  },
})
