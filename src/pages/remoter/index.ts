import pageBehavior from '../../behaviors/pageBehaviors'
import Dialog from '@vant/weapp/dialog/dialog'
import { isAndroid, Logger, checkWxBlePermission, storage, unique, isNullOrUnDef } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import { createBleServer, bleAdvertising } from '../../utils/remoterUtils'
import { deviceConfig, MIN_RSSI } from '../../config/remoter'
// import { deviceConfig } from '../../config/remoter'

type RmDeviceItem = {
  dragId: number
  deviceId: string
  orderNum: number
  devicePic: string
  deviceName: string
  deviceType: string
  deviceModel: string
  switchStatus: string
  switchType: string
  saved: boolean // 是否已保存在本地（我的设备）
}

Component({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    isWxBlePermit: false, // 微信蓝牙权限是否开启
    isSystemBlePermit: false, // 系统蓝牙权限是否开启
    _listenLocationTimeId: 0, // 监听系统位置信息是否打开的计时器， 0为不存在监听
    statusBarHeight: storage.get<number>('statusBarHeight') as number,
    _orderMap: (storage.get<Record<number, number>>('orderMap') ?? {}) as Record<number, number>,
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
    foundList: [] as RmDeviceItem[], // 搜索到的设备
    deviceList: [
      {
        dragId: 0,
        deviceId: '',
        orderNum: 1,
        devicePic: '/assets/img/remoter/fanLight.png',
        deviceName: '风扇灯Mock',
        deviceType: '13',
        deviceModel: '02',
        switchStatus: 'on',
        switchType: '照明',
        saved: true,
      },
      {
        dragId: 1,
        deviceId: '',
        orderNum: 0,
        devicePic: '/assets/img/remoter/bathHeater.png',
        deviceName: '浴霸Mock',
        deviceType: '26',
        deviceModel: '01',
        switchStatus: 'on',
        switchType: '小夜灯',
        saved: true,
      },
      {
        dragId: 2,
        deviceId: '',
        orderNum: 2,
        devicePic: '/assets/img/remoter/fanLight.png',
        deviceName: '吸顶灯Mock',
        deviceType: '13',
        deviceModel: '01',
        switchStatus: 'on',
        switchType: '照明',
        saved: true,
      },
    ], // 我的设备
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    debugStr: '0000',
  },

  lifetimes: {
    detached() {
      wx.offBluetoothAdapterStateChange() // 移除蓝牙适配器状态变化事件的全部监听函数
      wx.offBluetoothDeviceFound() // 移除搜索到新设备的事件的全部监听函数

      // 关闭外围设备服务端
      if (this.data._bleServer) {
        this.data._bleServer.close()
      }
      // 移除系统位置信息开关状态的监听
      if (this.data._listenLocationTimeId) {
        clearInterval(this.data._listenLocationTimeId)
      }
    },
  },
  pageLifetimes: {
    show() {
      this.initCapacity()
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

      // 我的设备排序
      this.data.deviceList.forEach((d) => {
        d.orderNum = this.data._orderMap[d.dragId] ?? d.orderNum
      })
      this.setData({
        deviceList: this.data.deviceList.sort((a, b) => a.orderNum - b.orderNum),
      })

      this.initDrag()

      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()
    },
    // 拖拽列表初始化
    initDrag() {
      if (!this.data.deviceList.length) {
        return
      }
      const drag = this.selectComponent('#drag')
      drag.init()
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

    handleCardTap(e: WechatMiniprogram.TouchEvent) {
      const { deviceType, deviceModel, saved } = e.detail
      if (isNullOrUnDef(deviceType) || isNullOrUnDef(deviceModel)) {
        return
      }
      // TODO 添加到我的设备
      if (!saved) {
        return
      }
      wx.navigateTo({
        url: `/package-remoter/pannel/index?deviceType=${deviceType}&deviceModel=${deviceModel}`,
      })
    },
    // 搜索设备
    toSeek() {
      this.setData({
        isSeeking: true,
      })

      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
        const rList = unique(res.devices, 'deviceId') // 过滤重复设备信息
          .map((item) => remoterProtocol.searchDeviceCallBack(item))
          .filter((item) => !!item)

        console.log('搜寻蓝牙外围设备：', rList[0])

        if (rList.length) {
          // 终止搜寻
          this.endSeek()

          // 刷新发现设备列表
          // TODO 排除已在我的设备列表的设备
          const foundList = rList
            .filter((item) => item!.RSSI >= MIN_RSSI) // 过滤弱信号设备
            .map((_d) => {
              const deviceType = _d!.deviceType
              const deviceModel = _d!.deviceModel
              const detail = deviceConfig[deviceType][deviceModel] // deviceModel
              return {
                devicePic: detail.devicePic,
                deviceName: detail.deviceName,
                deviceId: detail.deviceId,
                deviceType,
                deviceModel,
                switchStatus: 'off',
                switchType: '小夜灯',
                saved: false,
              }
            }) as RmDeviceItem[]

          // TODO 目前只显示单一设备调试信息
          const debugStr = `[recv]${rList[0]?.payload.toLocaleUpperCase()},${rList[0]?.RSSI}dBm`

          this.setData({
            foundList,
            debugStr,
          })
        }
      })

      // 开始搜寻附近的蓝牙外围设备
      const SEEK_TIMEOUT = 3000
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        powerLevel: 'high',
        interval: SEEK_TIMEOUT,
      })

      // 如果一直找不到，也自动停止搜索
      // !! 停止时间要稍长于 SEEK_TIMEOUT，否则会导致监听方法不执行
      setTimeout(() => this.endSeek(), SEEK_TIMEOUT + 1000)
    },
    // 停止搜索设备
    endSeek() {
      wx.stopBluetoothDevicesDiscovery({
        success: () => console.log('停止搜寻蓝牙外围设备'),
      })
      this.setData({
        isSeeking: false,
        isNotFound: !this.data.isNotFound,
      })
    },
    // 广播控制指令
    startAdvertising() {
      if (!this.data._bleServer) {
        return
      }
      bleAdvertising(this.data._bleServer, {
        addr: 'AA9078563412',
        payload: '0001B80B4416F6670001000000000000',
      })
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
    async handleSortEnd(e: { detail: { listData: RmDeviceItem[] } }) {
      // 更新列表数据
      this.setData({
        deviceList: e.detail.listData.map((item, index) => ({
          ...item,
          orderNum: index,
        })),
      })

      // 排序缓存在前端
      this.data.deviceList.forEach((d) => {
        this.data._orderMap[d.dragId] = d.orderNum
      })
      storage.set('orderMap', this.data._orderMap)
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
