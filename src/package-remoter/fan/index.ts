import pageBehaviors from '../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { ACTIONSHEET_MAP, CMD, COLORTEMP_RANGE, FACTORY_ADDR, FREQUENCY_TIME } from '../../config/remoter'
import { Logger, initBleCapacity, storage, isDevMode, rangeValue } from '../../utils/index'
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
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isDebugMode: false,
    isFactoryMode: false, // 工厂调试模式，按特定的地址发送指令
    toolbarMarginTop:
      (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 'px',
    setTemperture: 30,
    deviceInfo: {} as IAnyObject,
    showSpeedPopup: false,
    actionSheetType: '',
    actionSheetIndex: 0,
    selectKey: '',
    _envVersion: 'release', // 当前小程序环境，默认为发布版，用于屏蔽部分实验功能
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _bleService: null as BleService | null,
    // 记录上一次点击‘照明’时的指令键，用于反转处理；默认为关，即首次会广播开的指令
    _keyQueue: ['', '', '', '', '', '', '', ''], // 记录圆盘按键序列
    _timer: 0, // 记录上次指令时间
  },

  computed: {
    // 房间亮度toast格式化
    colorTempFormatter(data) {
      const { deviceModel, deviceType } = data.curRemoter ?? {}
      console.log('[colorTempFormatter]', deviceModel, deviceType)

      if (!data.hasColorBright) {
        return
      }

      // 未读取到型号时直接返回
      if (!deviceModel || !deviceType) {
        return (value: number) => {
          return `${value} K`
        }
      }

      const { COLORTEMP_MIN, COLORTEMP_MAX } = data.deviceInfo

      // 设备广播值未读取到时使用本地默认值
      if (!COLORTEMP_MIN || !COLORTEMP_MAX) {
        const [DEFAULT_COLORTEMP_MIN, DEFAULT_COLORTEMP_MAX] = COLORTEMP_RANGE[`${deviceType}${deviceModel}`]
        return (value: number) => {
          return `${(value / 100) * (DEFAULT_COLORTEMP_MAX - DEFAULT_COLORTEMP_MIN) + COLORTEMP_MIN}K`
        }
      }

      // 使用设备广播的色温范围
      return (value: number) => {
        return `${(value / 100) * (COLORTEMP_MAX - COLORTEMP_MIN) + COLORTEMP_MIN}K`
      }
    },
    // 亮度百分比显示
    brightView(data) {
      if (!data.hasColorBright) {
        return
      }
      const { LIGHT_BRIGHT = 0 } = data.deviceInfo
      return Math.round((LIGHT_BRIGHT / 255) * 100)
    },
    // 色温百分比显示
    colorTempView(data) {
      if (!data.hasColorBright) {
        return
      }
      const { LIGHT_COLOR_TEMP = 0 } = data.deviceInfo
      return Math.round((LIGHT_COLOR_TEMP / 255) * 100)
    },
    connectIcon() {
      return remoterStore.curRemoter?.connected
        ? '/assets/img/base/scene-switch-btn.png'
        : '/assets/img/base/offline.png'
    },
    curAddrText(data) {
      if (!data.isDebugMode) {
        // 没什么意义，但触发主动刷新
        return ''
      }
      const addr = (data.isFactoryMode ? FACTORY_ADDR : remoterStore.curRemoter.addr) ?? ''
      return String.prototype.match.call(addr, /.{1,2}/g)?.join(':')
    },
    actionSheetColumns(data) {
      const { actionSheetType } = data
      if (!actionSheetType) {
        return []
      }
      return ACTIONSHEET_MAP[actionSheetType].columns
    },
    // actionSheetTitle(data) {
    //   const { actionSheetType } = data
    //   if (!actionSheetType) {
    //     return `title: '设置'`
    //   }
    //   return `title: '${ACTIONSHEET_MAP[actionSheetType].title}设置'`
    // },
  },

  watch: {
    curRemoter(value) {
      console.log('watch curRemoter')
      this.setData({
        deviceInfo: {
          ...this.data.deviceInfo,
          ...value.deviceAttr,
        },
      })
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

      // 根据通知,更新设备列表，设备控制页暂时不需要本通知
      // emitter.on('remoterChanged', () => {
      // console.log('remoterChanged on Pannel')

      // })

      // TODO
      // console.log('curRemoter', remoterStore.curRemoter)
      this.setData({
        deviceInfo: {
          ...this.data.deviceInfo,
          ...remoterStore.curRemoter.deviceAttr,
        },
      })

      // 版本获取
      const info = wx.getAccountInfoSync()
      this.data._envVersion = info.miniProgram.envVersion
    },
    onUnload() {
      // emitter.off('remoterChanged')

      // 关闭蓝牙连接
      if (remoterStore.curRemoter.connected) {
        this.data._bleService?.close()
      }
    },
    /**
     * @name 广播控制指令
     */
    async toSendCmd(e: WechatMiniprogram.TouchEvent) {
      console.log('toSendCmd', e)
      if (!this.data._bleServer && !isDevMode) {
        this.data._bleServer = await createBleServer()
      }
      const { key } = e.target.dataset
      // DEBUG 产测指令，仅调试模式可用
      if (key === 'FACTORY' && !this.data.isFactoryMode) {
        return
      }

      const addr = this.data.isFactoryMode ? FACTORY_ADDR : remoterStore.curAddr
      const { type } = e.target.dataset
      console.log('[deviceInfo] before setting', this.data.deviceInfo)

      const params = [CMD[key]]
      // 色温和亮度同时设置的特殊指令
      if (key === 'LIGHT_SCENE_MIX') {
        const _arr = (e.detail ?? [0, 0]) as unknown as number[]
        const { COLORTEMP_MIN, COLORTEMP_MAX } = this.data.deviceInfo
        const bright = Math.round((_arr[0] / 100) * 255)
        const colortemp = Math.round(((_arr[1] - COLORTEMP_MIN) / (COLORTEMP_MAX - COLORTEMP_MIN)) * 255)
        const colortempPercent = Math.round(((_arr[1] - COLORTEMP_MIN) / (COLORTEMP_MAX - COLORTEMP_MIN)) * 100)
        params.push(bright, colortemp)
        this.setData({
          deviceInfo: {
            ...this.data.deviceInfo,
            LIGHT_BRIGHT: _arr[0],
            LIGHT_COLOR_TEMP: colortempPercent,
          },
        })
      }
      // 其余设值指令 TODO 区分亮度（1-255）和色温（0-255）的计算
      else if (type === 'SETUP') {
        const _val = (e.detail ?? 0) as unknown as number
        const setVal = Math.round(rangeValue((_val / 100) * 255, 0, 255))
        params.push(setVal)
        this.setData({
          deviceInfo: {
            ...this.data.deviceInfo,
            [key]: setVal,
          },
        })
      }
      // TODO 在前端实现乒乓逻辑的指令
      else if (type === 'TOGGLE') {
        const oldVal = this.data.deviceInfo[key]
        // 目前只有开关灯使用此类型的命令，电控端已有实现乒乓逻辑
        // params.push(oldVal ? 0x00 : 0x01)
        this.setData({
          deviceInfo: {
            ...this.data.deviceInfo,
            [key]: !oldVal,
          },
        })
      }

      const payload = remoterProtocol.generalCmdString(params)

      Logger.log('toSendCmd', key, { payload, addr, isFactory: this.data.isFactoryMode })

      // 记录点击按键序列，作为进入调试模式的前置操作
      const { dir } = e.target.dataset
      this.data._keyQueue.shift()
      this.data._keyQueue.push(dir)

      const now = new Date().getTime()
      console.log('now - this.data._timer', now - this.data._timer)
      if (now - this.data._timer < FREQUENCY_TIME) {
        console.log('丢弃频繁操作')
        return
      }
      this.data._timer = now

      // 广播控制指令
      bleAdvertising(this.data._bleServer, {
        addr,
        payload,
        isFactory: this.data.isFactoryMode,
      })
    },
    async handleTouchEnd() {
      // 主动广播结束指令
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }
      await stopAdvertising(this.data._bleServer)

      const addr = this.data.isFactoryMode ? FACTORY_ADDR : remoterStore.curAddr
      bleAdvertisingEnd(this.data._bleServer, { addr, isFactory: this.data.isFactoryMode })
    },

    toSetting() {
      wx.navigateTo({
        url: `/package-remoter/setting/index?addr=${remoterStore.curAddr}`,
      })
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

    toggleFactoryMode() {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })

      this.setData({ isFactoryMode: !this.data.isFactoryMode })
    },

    showActionSheet(e: WechatMiniprogram.TouchEvent) {
      const actionSheetType = e.target.dataset.key
      console.log('showActionSheet', this.data.deviceInfo)
      if (actionSheetType === 'FAN_DELAY_OFF' && !this.data.deviceInfo.FAN_SWITCH) {
        Toast('风扇已关闭')
        return
      }
      this.setData({
        actionSheetType,
        isShowPopup: true,
      })
    },

    actionSheetChange(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        actionSheetIndex: e.detail.index,
        selectKey: e.detail.value.key,
      })
    },

    handleConfirm() {
      const key = this.data.selectKey || this.data.actionSheetColumns[this.data.actionSheetIndex].key
      this.toSendCmd({
        target: {
          dataset: { key },
        },
      } as unknown as WechatMiniprogram.TouchEvent)
      this.setData({
        isShowPopup: false,
      })
    },

    handleClose() {
      this.setData({
        isShowPopup: false,
      })
    },
  },
})
