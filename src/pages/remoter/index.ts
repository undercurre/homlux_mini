import pageBehaviors from '../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { initBleCapacity, storage, unique, isNullOrUnDef, emitter, delay, Logger } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import { createBleServer, bleAdvertising } from '../../utils/remoterUtils'
import { deviceConfig, MIN_RSSI, CMD, FREQUENCY_TIME, SEEK_INTERVAL, SEEK_TIMEOUT } from '../../config/remoter'
import { defaultImgDir } from '../../config/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] }), pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    MIN_RSSI,
    _envVersion: 'release', // 当前小程序环境，默认为发布版，用于屏蔽部分实验功能
    _listenLocationTimeId: 0, // 监听系统位置信息是否打开的计时器， 0为不存在监听
    statusBarHeight: storage.get('statusBarHeight') as number,
    scrollTop: 0,
    scrollViewHeight:
      (storage.get('windowHeight') as number) -
      (storage.get('statusBarHeight') as number) -
      (storage.get('bottomBarHeight') as number) - // IPX
      (storage.get('navigationBarHeight') as number),
    showTips: false, // 首次进入显示操作提示
    tipsStep: 0,
    isSeeking: false, // 正在主动搜索设备
    _isDiscoverying: false, // 正在搜索设备（包括静默更新状态的情况）
    foundListHolder: false, // 临时显示发现列表的点位符
    canShowNotFound: false, // 已搜索过至少一次但未找到
    foundList: [] as Remoter.DeviceItem[], // 搜索到的设备
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _time_id_end: null as any, // 定时终止搜索设备
    _lastPowerKey: '', // 记录上一次点击‘照明’时的指令键，用于反转处理
    _timer: 0, // 记录上次指令时间
    _holdBleScan: false, // onHide时保持蓝牙扫描的标志
    debugStr: '[rx]',
    isDebugMode: false,
  },

  computed: {},

  methods: {
    async onLoad() {
      // TabBar选中项处理
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1,
        })
      }

      // 是否点击过场景使用提示的我知道了，如果没点击过就显示
      const hasConfirmRemoterTips = storage.get<boolean>('hasConfirmRemoterTips')
      if (!hasConfirmRemoterTips) {
        this.setData({
          showTips: true,
        })
      }

      // 初始化[我的设备]列表
      this.initDeviceList()

      // 根据通知,更新设备列表
      emitter.on('remoterChanged', async () => {
        await delay(0)
        console.log('remoterChanged on IndexList')

        const drag = this.selectComponent('#drag')
        drag?.init()
      })

      // 监听蓝牙连接值变化
      // wx.onBLECharacteristicValueChange(function (res) {
      //   console.log('onBLECharacteristicValueChange', res.value)
      //   console.log('onBLECharacteristicValueChange', remoterCrypto.ab2hex(res.value))
      // })

      // 版本获取
      const info = wx.getAccountInfoSync()
      this.data._envVersion = info.miniProgram.envVersion
    },

    async onShow() {
      this.data._holdBleScan = false

      await initBleCapacity()

      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
        // console.log('onBluetoothDeviceFound', res)
        this.resolveFoundDevices(res)
      })

      await delay(0)

      // 如果未在发现模式，则搜索设备
      if (!this.data._isDiscoverying) {
        this.toSeek()
      }
      // 获取已连接的设备
      // this.getConnectedDevices()
    },

    onHide() {
      console.log('onHide on Index')

      wx.offBluetoothAdapterStateChange() // 移除蓝牙适配器状态变化事件的全部监听函数
      // wx.offBLECharacteristicValueChange() // 移除蓝牙低功耗设备的特征值变化事件的全部监听函数

      // 移除系统位置信息开关状态的监听
      if (this.data._listenLocationTimeId) {
        clearInterval(this.data._listenLocationTimeId)
      }

      if (!this.data._holdBleScan) {
        emitter.off('remoterChanged')
        wx.offBluetoothDeviceFound() // 移除搜索到新设备的事件的全部监听函数

        this.endSeek()
        // 关闭外围设备服务端
        if (this.data._bleServer) {
          this.data._bleServer.close()
          this.data._bleServer = null
        }

        // 取消计时器
        if (this.data._time_id_end) {
          clearTimeout(this.data._time_id_end)
          this.data._time_id_end = null
        }
      }
    },

    onUnload() {
      console.log('onUnload on Index')
      this.endSeek()
    },

    toggleDebug() {
      if (this.data._envVersion === 'release') {
        return
      }

      this.setData({ isDebugMode: !this.data.isDebugMode })
    },

    // 拖拽列表初始化
    async initDrag() {
      // 有可能视图未更新，需要先等待nextTick
      await delay(0)

      const drag = this.selectComponent('#drag')
      drag?.init()
    },

    // 从storage初始化我的设备列表
    initDeviceList() {
      remoterStore.retrieveRmStore()

      this.initDrag()
    },

    // 将新发现设备, 添加到[我的设备]
    async saveDevice(device: Remoter.DeviceItem) {
      const { addr } = device
      const index = this.data.foundList.findIndex((device) => device.addr === addr)
      const newDevice = this.data.foundList.splice(index, 1)[0]
      const orderNum = remoterStore.remoterList.length

      remoterStore.addRemoter({
        ...newDevice,
        orderNum,
        defaultAction: 0,
      } as Remoter.DeviceRx)

      this.setData({
        foundListHolder: !this.data.foundList.length,
        foundList: this.data.foundList,
      })
      await this.initDrag() // 设备列表增加了要刷新

      // 发现列表已空，占位符显示2秒
      if (!this.data.foundList.length) {
        setTimeout(() => {
          this.setData({
            foundListHolder: false,
          })
          this.initDrag() // 动画结束了位置变化过又要刷新
        }, 2000)
      }
    },

    // 点击设备卡片
    async handleCardTap(e: WechatMiniprogram.TouchEvent) {
      const { deviceType, deviceModel, saved, addr } = e.detail
      if (isNullOrUnDef(deviceType) || isNullOrUnDef(deviceModel)) {
        return
      }

      if (!saved) {
        this.saveDevice(e.detail as Remoter.DeviceItem)
      }
      // 跳转到控制页
      else {
        this.data._holdBleScan = true
        let page = 'pannel'
        if (deviceType === '13') {
          page = deviceModel === '01' ? 'light' : 'fan-light'
        }
        // else if (deviceType === '26') {
        //   page = 'bath'
        // } else if (deviceType === '40') {
        //   page = 'cool-bath'
        // }
        wx.navigateTo({
          url: `/package-remoter/${page}/index?deviceType=${deviceType}&deviceModel=${deviceModel}&deviceModel=${deviceModel}&addr=${addr}`,
        })
      }
    },
    // 点击设备按钮
    async handleControlTap(e: WechatMiniprogram.TouchEvent) {
      console.log('handleControlTap', e.detail)

      // 先触发本地保存，提高响应体验
      if (!e.detail.saved) {
        this.saveDevice(e.detail as Remoter.DeviceItem)
      }

      const now = new Date().getTime()
      console.log('now - this.data._timer', now - this.data._timer)
      if (now - this.data._timer < FREQUENCY_TIME) {
        console.log('丢弃频繁操作')
        return
      }
      this.data._timer = now

      const { addr, actions, defaultAction } = e.detail
      // const addr = '18392c0c5566' // 模拟遥控器mac

      // HACK 特殊的照明按钮反转处理
      const { key } = actions[defaultAction]
      if (key === 'LIGHT_LAMP') {
        this.data._lastPowerKey = this.data._lastPowerKey === `${key}_OFF` ? `${key}_ON` : `${key}_OFF`
        // this.data._lastPowerKey = key
      }
      const payload = remoterProtocol.generalCmdString([CMD[key]])

      // 建立BLE外围设备服务端
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }

      // 广播控制指令
      await bleAdvertising(this.data._bleServer, {
        addr,
        payload,
      })
    },

    /**
     * @description 搜索设备
     * @param isUserControlled 是否用户主动操作
     */
    async toSeek(e?: WechatMiniprogram.TouchEvent) {
      const isUserControlled = !!e // 若从wxml调用，即为用户主动操作

      // 若用户主动搜索，则设置搜索中标志
      if (isUserControlled) {
        this.setData({
          isSeeking: true,
        })
        this.data._time_id_end = setTimeout(
          () =>
            this.setData({
              isSeeking: false,
            }),
          SEEK_TIMEOUT,
        )
      }

      if (this.data._isDiscoverying) {
        console.log('[已在发现中且未停止]')
      } else {
        this.data._isDiscoverying = true

        // 开始搜寻附近的蓝牙外围设备
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: true,
          powerLevel: 'high',
          interval: SEEK_INTERVAL,
          fail: (err) => Logger.log('[startBluetoothDevicesDiscoveryErr]', err),
          success: () => Logger.log('[startBluetoothDevicesDiscoverySuccess]'),
        })
      }
    },
    // 停止搜索设备
    endSeek() {
      if (this.data._time_id_end) {
        clearTimeout(this.data._time_id_end)
        this.data._time_id_end = null
      }
      wx.stopBluetoothDevicesDiscovery({
        success: () => {
          Logger.log('[stopBluetoothDevicesDiscovery]')
          this.data._isDiscoverying = false
          this.setData({
            isSeeking: false,
            canShowNotFound: true,
          })
        },
      })

      this.data._isDiscoverying = false
    },

    // 处理搜索到的设备
    resolveFoundDevices(res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) {
      const recoveredList =
        unique(res.devices, 'deviceId') // 过滤重复设备
          .map((item) => remoterProtocol.searchDeviceCallBack(item)) // 过滤不支持的设备
          .filter((item) => !!item) || []

      // console.log('搜寻到的设备列表：', recoveredList)

      if (!recoveredList?.length) {
        return
      }

      // 在终止搜寻前先记录本次搜索的操作方式
      const isUserControlled = this.data.isSeeking

      // 更新我的设备列表
      remoterStore.renewRmState(recoveredList as Remoter.DeviceRx[])
      this.initDrag()

      // 显示设备调试信息
      const rListRSSI = recoveredList.map((r) => `${r?.deviceType},${r?.deviceModel}:${r?.RSSI}`)
      const debugStr = `[rx]${rListRSSI.join('|')}`
      this.setData({ debugStr })

      // 静默搜索，只处理已保存列表的设备
      if (!isUserControlled) {
        return
      }

      // 用户主动搜索，刷新发现列表
      const foundList = [] as Remoter.DeviceDetail[]
      const newDeviceCountMap = {} as IAnyObject
      recoveredList.forEach((item) => {
        const isSavedDevice = remoterStore.deviceAddrs.includes(item!.addr)
        if (
          item!.RSSI >= this.data.MIN_RSSI && // 过滤弱信号设备
          !isSavedDevice // 排除已在我的设备列表的设备
        ) {
          const deviceType = item!.deviceType
          const deviceModel = item!.deviceModel
          const config = deviceConfig[deviceType][deviceModel]

          if (!config) {
            console.log('config NOT EXISTED in onBluetoothDeviceFound')
            return
          }

          // 同默认名字设备的数量，包括已保存、新发现
          const savedDeviceCount = remoterStore.remoterList.filter((device) => {
            if (device.deviceType === '13') {
              return device.deviceType === deviceType && device.deviceModel === deviceModel
            }
            return device.deviceType === deviceType
          }).length
          let uniqueType = deviceType
          if (deviceType === '13') {
            if (deviceModel === '02' || deviceModel === '03') uniqueType = '1302'
            else uniqueType = `${deviceType}${deviceModel}`
          }
          const newDeviceCount = newDeviceCountMap[uniqueType] ?? 0
          newDeviceCountMap[uniqueType] = newDeviceCount + 1

          const deviceNameSuffix = savedDeviceCount + newDeviceCountMap[uniqueType]

          // 如果设备名已存在，则加上编号后缀，以避免同名混淆 // TODO 更名后仍和已保存的名字后缀存在一样的情况，未处理
          // const hasSavedName = remoterStore.deviceNames.includes(config.deviceName)
          // const hasFoundName = foundList.findIndex((d) => d.deviceName === config.deviceName) > -1
          const deviceName = deviceNameSuffix ? config.deviceName + deviceNameSuffix : config.deviceName

          console.log({ savedDeviceCount, newDeviceCount }, newDeviceCountMap)

          // 更新发现设备列表
          foundList.push({
            deviceId: item!.deviceId,
            addr: item!.addr,
            devicePic: config.devicePic,
            actions: config.actions,
            deviceName,
            deviceType,
            deviceModel,
            actionStatus: false,
            saved: false,
            defaultAction: 0,
            DISCOVERED: 1,
          })
        }
      })

      this.setData({ foundList })
    },

    // 获取已建立连接的设备 暂时用不着
    // async getConnectedDevices() {
    //   const services = Object.keys(this.data._localList)
    //     .map((addr) => this.data._localList[addr].serviceId)
    //     .filter((service) => !!service) as string[]

    //   const res = await wx.getConnectedBluetoothDevices({
    //     services,
    //   })
    //   console.log('getConnectedBluetoothDevices', res)

    //   // 更新已连接状态
    //   if (res.devices?.length) {
    //     const servicesList = res.devices.map((item) => item.deviceId)

    //     const diffData = {} as IAnyObject
    //     this.data.deviceList.forEach((device, index) => {
    //       if (servicesList.includes(device.deviceId)) {
    //         diffData[`deviceList[${index}].connected`] = true
    //       }
    //     })
    //     this.setData(diffData)
    //     this.initDrag()
    //   }
    // },

    onPageScroll() {
      // console.log(e.detail)
      // this.setData({
      //   scrollTop: e.detail.scrollTop,
      // })
      this.initDrag()
    },
    /**
     * 拖拽结束相关
     * @param e
     */
    async handleSortEnd(e: { detail: { listData: Remoter.DeviceRx[] } }) {
      // 更新列表数据
      remoterStore.saveRmStore(
        e.detail.listData.map((item, index) => ({
          ...item,
          orderNum: index,
        })),
      )
    },
    // 取消新手提示
    cancelTips() {
      this.setData({
        showTips: false,
      })
      storage.set('hasConfirmRemoterTips', true)
    },
    nextTips() {
      if (this.data.tipsStep === 1) {
        this.cancelTips()
      }
      this.setData({
        tipsStep: this.data.tipsStep + 1,
      })
    },
    rssiToggle() {
      let rssi = this.data.MIN_RSSI - 5
      if (rssi < -80) {
        rssi = -50
      }
      this.setData({ MIN_RSSI: rssi })
    },
  },
})
