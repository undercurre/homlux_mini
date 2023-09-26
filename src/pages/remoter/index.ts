import pageBehaviors from '../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { initBleCapacity, storage, unique, isNullOrUnDef, emitter, delay } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import { createBleServer, bleAdvertising } from '../../utils/remoterUtils'
import { deviceConfig, MIN_RSSI, SEEK_TIMEOUT, SEEK_TIMEOUT_CONTROLED, CMD, FREQUENCY_TIME } from '../../config/remoter'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] }), pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
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
    isSeeking: false, // 正在搜索设备
    foundListHolder: false, // 临时显示发现列表的点位符
    isNotFound: false, // 已搜索过至少一次但未找到
    foundList: [] as Remoter.DeviceItem[], // 搜索到的设备
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _timeId: -1,
    _lastPowerKey: '', // 记录上一次点击‘照明’时的指令键，用于反转处理
    _firstLoad: true, // 页面首次打开
    _timer: 0, // 记录上次指令时间
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

      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
        // console.log('onBluetoothDeviceFound', res)
        const recoveredList =
          unique(res.devices, 'deviceId') // 过滤重复设备
            .map((item) => remoterProtocol.searchDeviceCallBack(item)) // 过滤不支持的设备
            .filter((item) => !!item) || []

        console.log('搜寻到的设备列表：', recoveredList)

        // 找到设备，即终止搜寻
        this.endSeek()

        const foundList = [] as Remoter.DeviceDetail[]
        recoveredList.forEach((item) => {
          const isSavedDevice = remoterStore.deviceAddrs.includes(item!.addr)
          // 刷新发现设备列表
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

            // 同品类同型号设备的数量，包括已保存、新发现
            const savedDeviceCount = remoterStore.remoterList.filter(
              (device) => device.deviceType === deviceType && device.deviceModel === deviceModel,
            ).length
            const newDeviceCount = foundList.filter(
              (device) => device.deviceType === deviceType && device.deviceModel === deviceModel,
            ).length
            const deviceNameSuffix = savedDeviceCount + newDeviceCount + 1

            // 如果设备名已存在，则加上编号后缀，以避免同名混淆
            const hasSavedName = remoterStore.deviceNames.includes(config.deviceName)
            const hasFoundName = foundList.findIndex((d) => d.deviceName === config.deviceName) > -1
            const deviceName = hasSavedName || hasFoundName ? config.deviceName + deviceNameSuffix : config.deviceName

            console.log({ savedDeviceCount, newDeviceCount, hasSavedName, hasFoundName })

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
            })
          }
        })

        // 更新我的设备列表
        remoterStore.renewRmState(recoveredList as Remoter.DeviceRx[])

        // 显示设备调试信息
        const rListRSSI = recoveredList.map((r) => `${r?.deviceType},${r?.deviceModel}:${r?.RSSI}`)
        const debugStr = `[rx]${rListRSSI.join('|')}`

        this.setData({
          foundList,
          debugStr,
        })

        this.initDrag()
      })

      // 监听蓝牙连接值变化
      // wx.onBLECharacteristicValueChange(function (res) {
      //   console.log('onBLECharacteristicValueChange', res.value)
      //   console.log('onBLECharacteristicValueChange', remoterCrypto.ab2hex(res.value))
      // })

      // 搜索一轮设备
      // this.toSeek()

      // 版本获取
      const info = wx.getAccountInfoSync()
      this.data._envVersion = info.miniProgram.envVersion
    },

    async onShow() {
      // 根据通知,更新设备列表
      emitter.on('remoterChanged', () => {
        console.log('remoterChanged on IndexList')

        this.initDrag()
      })

      await delay(0)

      // 首次进入，由用户手动操作；非首次进入（返回），自动搜索一轮设备
      if (this.data._firstLoad) {
        this.data._firstLoad = false
      } else {
        this.toSeek(true)
      }
      // 获取已连接的设备
      // this.getConnectedDevices()
    },

    onUnload() {
      console.log('detached on Index')

      this.endSeek()
      wx.offBluetoothAdapterStateChange() // 移除蓝牙适配器状态变化事件的全部监听函数
      wx.offBluetoothDeviceFound() // 移除搜索到新设备的事件的全部监听函数
      // wx.offBLECharacteristicValueChange() // 移除蓝牙低功耗设备的特征值变化事件的全部监听函数

      // 关闭外围设备服务端
      if (this.data._bleServer) {
        this.data._bleServer.close()
      }
      // 移除系统位置信息开关状态的监听
      if (this.data._listenLocationTimeId) {
        clearInterval(this.data._listenLocationTimeId)
      }

      // 取消计时器
      if (this.data._timeId) {
        clearTimeout(this.data._timeId)
      }

      emitter.off('remoterChanged')
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
      })

      await this.initDrag()

      this.setData({
        foundListHolder: !this.data.foundList.length,
        foundList: this.data.foundList,
      })
      if (!this.data.foundList.length) {
        setTimeout(() => {
          this.setData({
            foundListHolder: false,
          })
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
        wx.navigateTo({
          url: `/package-remoter/pannel/index?deviceType=${deviceType}&deviceModel=${deviceModel}&deviceModel=${deviceModel}&addr=${addr}`,
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
        Toast('操作太频繁啦~')
      }
      this.data._timer = now

      const { addr, actions, defaultAction } = e.detail
      // const addr = '18392c0c5566' // 模拟遥控器mac

      // HACK 特殊的照明按钮反转处理
      let { key } = actions[defaultAction]
      if (key === 'LIGHT_LAMP') {
        key = this.data._lastPowerKey === `${key}_OFF` ? `${key}_ON` : `${key}_OFF`
      }
      const payload = remoterProtocol.generalCmdString(CMD[key])

      // 建立BLE外围设备服务端
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }

      // 广播控制指令
      await bleAdvertising(this.data._bleServer, {
        addr,
        payload,
      })

      await this.toSeek(true)
    },
    // 搜索设备
    async toSeek(isControlled = false) {
      const _isControlled = typeof isControlled === 'boolean' && isControlled
      const interval = _isControlled ? SEEK_TIMEOUT_CONTROLED : SEEK_TIMEOUT // 在template中调用时，会误传入非number参数
      await initBleCapacity()

      // 如果是受控后搜索，不显示搜索中状态
      if (!_isControlled) {
        this.setData({
          isSeeking: true,
        })
      }

      // 开始搜寻附近的蓝牙外围设备
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        powerLevel: 'high',
        interval,
        fail(err) {
          console.log('startBluetoothDevicesDiscoveryErr', err)
        },
      })

      // 如果一直找不到，也自动停止搜索
      // !! 停止时间要稍长于 SEEK_TIMEOUT，否则会导致监听方法不执行
      this.data._timeId = setTimeout(() => this.endSeek(), interval + 500)
    },
    // 停止搜索设备
    endSeek() {
      if (this.data._timeId) {
        clearTimeout(this.data._timeId)
      }
      wx.stopBluetoothDevicesDiscovery({
        success: () => console.log('停止搜寻蓝牙外围设备'),
      })
      this.setData({
        isSeeking: false,
        isNotFound: true,
      })
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

    onPageScroll(e: { detail: { scrollTop: number } }) {
      this.setData({
        scrollTop: e.detail.scrollTop,
      })
      this.initDrag()
    },
    /**
     * 拖拽结束相关
     * @param e
     */
    async handleSortEnd(e: { detail: { listData: Remoter.DeviceItem[] } }) {
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
