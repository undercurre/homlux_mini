import pageBehavior from '../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import { isAndroid, Logger, checkWxBlePermission, storage, unique, isNullOrUnDef, emitter } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import { createBleServer, bleAdvertising } from '../../utils/remoterUtils'
import { deviceConfig, MIN_RSSI, SEEK_TIMEOUT, CMD } from '../../config/remoter'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    isWxBlePermit: false, // 微信蓝牙权限是否开启
    isSystemBlePermit: false, // 系统蓝牙权限是否开启
    _envVersion: 'release', // 当前小程序环境，默认为发布版，用于屏蔽部分实验功能
    _listenLocationTimeId: 0, // 监听系统位置信息是否打开的计时器， 0为不存在监听
    statusBarHeight: storage.get<number>('statusBarHeight') as number,
    _localList: (storage.get('_localList') ?? {}) as Remoter.LocalList,
    scrollTop: 0,
    scrollViewHeight:
      (storage.get<number>('windowHeight') as number) -
      (storage.get<number>('statusBarHeight') as number) -
      (storage.get<number>('bottomBarHeight') as number) - // IPX
      (storage.get<number>('navigationBarHeight') as number),
    showTips: false, // 首次进入显示操作提示
    tipsStep: 0,
    isSeeking: false, // 正在搜索设备
    isNotFound: false, // 已搜索过至少一次但未找到
    foundList: [] as Remoter.DeviceItem[], // 搜索到的设备
    deviceList: [] as Remoter.DeviceItem[], // 我的设备
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _timeId: -1,
    debugStr: '0000',
    isDebugMode: false,
  },

  computed: {
    deviceIds(data) {
      return data.deviceList.map((device) => device.deviceId)
    },
    deviceAddrs(data) {
      return data.deviceList.map((device) => device.addr)
    },
    deviceNames(data) {
      return data.deviceList.map((device) => device.deviceName)
    },
  },

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
        const rList = unique(res.devices, 'deviceId') // 过滤重复设备信息
          .map((item) => remoterProtocol.searchDeviceCallBack(item))
          .filter((item) => !!item)

        console.log('搜寻到的设备列表：', rList)

        if (rList.length) {
          // 终止搜寻
          this.endSeek()

          const diffData = {} as IAnyObject

          const foundList = [] as Remoter.DeviceItem[]
          rList.forEach((item) => {
            const isSavedDevice = this.data.deviceAddrs.includes(item!.addr)
            // 刷新发现设备列表
            if (
              item!.RSSI >= MIN_RSSI && // 过滤弱信号设备
              !isSavedDevice // 排除已在我的设备列表的设备
            ) {
              const deviceType = item!.deviceType
              const deviceModel = item!.deviceModel
              const detail = deviceConfig[deviceType][deviceModel]
              // 同品类同型号设备的数量
              const deviceCount = this.data.deviceList.filter(
                (device) => device.deviceType === deviceType && device.deviceModel === deviceModel,
              ).length
              // 加上编号后缀，以避免同名混淆
              const deviceName = this.data.deviceNames.includes(detail.deviceName)
                ? detail.deviceName + (deviceCount + 1)
                : detail.deviceName

              foundList.push({
                deviceId: item!.deviceId,
                addr: item!.addr,
                devicePic: detail.devicePic,
                deviceName,
                deviceType,
                deviceModel,
                switchStatus: 'off',
                switchType: '小夜灯',
                saved: false,
              })
            }
          })

          // 刷新我的设备列表
          const rListIds = rList.map((r) => r?.addr)
          this.data.deviceList.forEach((device, index) => {
            diffData[`deviceList[${index}].discovered`] = rListIds.includes(device.addr)
          })

          // 显示设备调试信息
          const rListRSSI = rList.map((r) => `${r?.manufacturerId}:${r?.RSSI}dBm`)
          const debugStr = `[recv]${rListRSSI.join('|')}`

          diffData.foundList = foundList
          diffData.debugStr = debugStr
          console.log('diffData', diffData)

          this.setData(diffData)

          this.initDrag()
        }
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

      // 根据通知,更新设备列表
      emitter.on('remoterChanged', () => {
        console.log('remoterChanged on IndexList')
        this.data._localList = (storage.get<Remoter.LocalList>('_localList') ?? {}) as Remoter.LocalList

        this.initDeviceList()
      })
    },

    async onShow() {
      await this.initCapacity()

      // 搜索一轮设备
      this.toSeek()

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
    initDrag() {
      if (!this.data.deviceList.length) {
        return
      }
      const drag = this.selectComponent('#drag')
      drag.init()
    },

    // 从storage初始化我的设备列表
    initDeviceList() {
      const deviceList = [] as Remoter.DeviceItem[]
      for (const addr in this.data._localList) {
        const { deviceModel, deviceType, orderNum, deviceName, deviceId } = this.data._localList[addr]
        if (!deviceModel || !deviceType) return

        const detail = deviceConfig[deviceType][deviceModel]
        deviceList.push({
          dragId: addr,
          deviceId,
          addr,
          orderNum: orderNum ?? 0,
          devicePic: detail.devicePic,
          deviceName: deviceName ?? detail.deviceName,
          deviceType,
          deviceModel,
          switchStatus: 'off',
          switchType: '小夜灯',
          saved: true,
          discovered: false,
          connected: false,
        })
      }

      this.setData({
        deviceList: deviceList.sort((a, b) => a.orderNum! - b.orderNum!),
      })

      this.initDrag()
    },

    /**
     * @description 初始化蓝牙模块，只检查权限，未实质打开服务
     */
    async initCapacity() {
      await this.consultWxBlePermission()
      if (!this.data.isWxBlePermit) {
        return
      }

      this.consultSystemBlePermission()
      if (!this.data.isSystemBlePermit) {
        return
      }

      // 安卓需要同时打开位置开关及权限
      if (isAndroid()) {
        this.consultSystemLocation()
      }
    },

    /**
     * 检查小程序蓝牙权限
     */
    async consultWxBlePermission() {
      const isWxBlePermit = await checkWxBlePermission()
      if (isWxBlePermit) {
        this.setData({
          isWxBlePermit,
        })
        return true
      }

      Dialog.confirm({
        title: '请授权小程序使用蓝牙',
        cancelButtonText: '知道了',
        confirmButtonText: '去设置',
        confirmButtonOpenType: 'openSetting', // 确认按钮的微信开放能力
      }).catch(() => Logger.error('WxBlePermission Refused'))

      return false
    },

    /**
     * 检查系统蓝牙开关、对微信的授权
     */
    consultSystemBlePermission() {
      const systemSetting = wx.getSystemSetting()
      console.log('[getSystemSetting]', systemSetting)
      this.setData({
        isSystemBlePermit: systemSetting.bluetoothEnabled,
      })

      if (!this.data.isSystemBlePermit) {
        Dialog.confirm({
          title: '请打开手机蓝牙开关并授权微信使用',
          cancelButtonText: '知道了',
          confirmButtonText: '查看指引',
        })
          .then(() => {
            wx.navigateTo({
              url: '/package-mine/guideline/index?type=bleEnable',
            })
          })
          .catch(() => Logger.error('未查看指引'))

        // 监听蓝牙状态的变化
        const listen = (res: WechatMiniprogram.OnBluetoothAdapterStateChangeCallbackResult) => {
          this.setData({
            isSystemBlePermit: res.available,
          })
          if (res.available) {
            Logger.log('System Ble Adapter Ready')
            wx.offBluetoothAdapterStateChange(listen)
          }
        }
        wx.onBluetoothAdapterStateChange(listen)
      }
    },
    /**
     * 检查系统位置信息开关、对微信的授权
     */
    consultSystemLocation() {
      if (this.data._listenLocationTimeId) {
        return
      }

      const systemSetting = wx.getSystemSetting()

      if (!systemSetting.locationEnabled) {
        Dialog.confirm({
          title: '请打开手机系统的位置信息开关',
          cancelButtonText: '知道了',
          confirmButtonText: '查看指引',
        })
          .then(() => {
            wx.navigateTo({
              url: '/package-mine/guideline/index?type=bleEnable',
            })
          })
          .catch(() => Logger.error('未查看指引'))

        // 轮询设备
        this.data._listenLocationTimeId = setInterval(() => {
          const systemSetting = wx.getSystemSetting()

          if (systemSetting.locationEnabled) {
            clearInterval(this.data._listenLocationTimeId)
            this.data._listenLocationTimeId = 0
            this.initCapacity()
          }
        }, 3000)
      }
    },

    // 将新发现设备, 点击添加到我的设备
    saveDevice(device: Remoter.DeviceItem) {
      const { deviceType, deviceModel, deviceName, deviceId, addr } = device
      const index = this.data.foundList.findIndex((device) => device.addr === addr)
      const newDevice = this.data.foundList.splice(index, 1)[0]
      const orderNum = this.data.deviceList.length
      this.data.deviceList.push({
        ...newDevice,
        dragId: addr,
        orderNum,
        saved: true,
        discovered: true,
      })
      console.log('saved deviceList', this.data.deviceList)

      this.setData({
        foundList: this.data.foundList,
        deviceList: this.data.deviceList,
      })

      this.initDrag()

      // 保存到前端缓存
      this.data._localList[addr] = {
        deviceId,
        orderNum,
        deviceType,
        deviceModel,
        deviceName,
      }
      storage.set('_localList', this.data._localList)
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

      const { addr } = e.detail
      // const addr = '18392c0c5566' // 模拟遥控器mac

      const payload = remoterProtocol.generalCmdString(CMD.LIGHT_NIGHT_LAMP)

      // 建立BLE外围设备服务端
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }

      // 广播控制指令
      bleAdvertising(this.data._bleServer, {
        addr,
        payload,
      })
    },
    // 搜索设备
    toSeek() {
      this.setData({
        isSeeking: true,
      })

      // 开始搜寻附近的蓝牙外围设备
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        powerLevel: 'high',
        interval: SEEK_TIMEOUT - 500,
        fail(err) {
          console.log('startBluetoothDevicesDiscoveryErr', err)
        },
      })

      // 如果一直找不到，也自动停止搜索
      // !! 停止时间要稍长于 SEEK_TIMEOUT，否则会导致监听方法不执行
      this.data._timeId = setTimeout(() => this.endSeek(), SEEK_TIMEOUT)
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
        isNotFound: !this.data.isNotFound,
      })
    },

    // 获取已连接的设备 暂时用不着
    async getConnectedDevices() {
      const services = Object.keys(this.data._localList)
        .map((addr) => this.data._localList[addr].serviceId)
        .filter((service) => !!service) as string[]

      const res = await wx.getConnectedBluetoothDevices({
        services,
      })
      console.log('getConnectedBluetoothDevices', res)

      // 更新已连接状态
      if (res.devices?.length) {
        const servicesList = res.devices.map((item) => item.deviceId)

        const diffData = {} as IAnyObject
        this.data.deviceList.forEach((device, index) => {
          if (servicesList.includes(device.deviceId)) {
            diffData[`deviceList[${index}].connected`] = true
          }
        })
        this.setData(diffData)
        this.initDrag()
      }
    },

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
      this.setData({
        deviceList: e.detail.listData.map((item, index) => ({
          ...item,
          orderNum: index,
        })),
      })

      // 排序缓存在前端
      this.data.deviceList.forEach((d) => {
        this.data._localList[d.addr].orderNum = d.orderNum
      })
      storage.set('_localList', this.data._localList)
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
  },
})
