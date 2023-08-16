import pageBehavior from '../../behaviors/pageBehaviors'
import Dialog from '@vant/weapp/dialog/dialog'
import { isAndroid, Logger, checkWxBlePermission, storage } from '../../utils/index'
// import { deviceConfig, sn8ToType } from '../../config/remoter'

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
    scrollViewHeight:
      (storage.get<number>('windowHeight') as number) -
      (storage.get<number>('statusBarHeight') as number) -
      (storage.get<number>('bottomBarHeight') as number) - // IPX
      (storage.get<number>('navigationBarHeight') as number),
    showTips: false, // 首次进入显示操作提示
    tipsStep: 0,
    isSeeking: false, // 正在搜索设备
    isNotFound: false, // 已搜索过至少一次但未找到
    foundList: [
      {
        devicePic: '/assets/img/remoter/ceilLight.png',
        deviceName: '吸顶灯',
        sn8: '7909AC81',
        switchStatus: 'off',
        switchType: '小夜灯',
      },
    ], // 搜索到的设备
    deviceList: [
      {
        devicePic: '/assets/img/remoter/fanLight.png',
        deviceName: '风扇灯',
        sn8: '7909AC82',
        switchStatus: 'on',
        switchType: '照明',
      },
      {
        devicePic: '/assets/img/remoter/bathHeater.png',
        deviceName: '浴霸',
        sn8: '7909AC83',
        switchStatus: 'on',
        switchType: '小夜灯',
      },
      {
        devicePic: '/assets/img/remoter/fanLight.png',
        deviceName: '风扇灯',
        sn8: '7909AC82',
        switchStatus: 'on',
        switchType: '照明',
      },
      {
        devicePic: '/assets/img/remoter/fanLight.png',
        deviceName: '风扇灯',
        sn8: '7909AC82',
        switchStatus: 'on',
        switchType: '照明',
      },
      {
        devicePic: '/assets/img/remoter/fanLight.png',
        deviceName: '风扇灯',
        sn8: '7909AC82',
        switchStatus: 'on',
        switchType: '照明',
      },
      {
        devicePic: '/assets/img/remoter/fanLight.png',
        deviceName: '风扇灯',
        sn8: '7909AC82',
        switchStatus: 'on',
        switchType: '照明',
      },
      {
        devicePic: '/assets/img/remoter/fanLight.png',
        deviceName: '风扇灯',
        sn8: '7909AC82',
        switchStatus: 'on',
        switchType: '照明',
      },
    ], // 我的设备
  },

  lifetimes: {
    detached() {
      clearInterval(this.data._listenLocationTimeId)
      wx.offBluetoothAdapterStateChange()
    },
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1,
        })
      }

      this.initCapacity()
    },
  },

  methods: {
    onLoad() {
      // 是否点击过场景使用提示的我知道了，如果没点击过就显示
      const hasConfirmRemoterTips = storage.get<boolean>('hasConfirmRemoterTips')
      console.log({ hasConfirmRemoterTips })
      if (!hasConfirmRemoterTips) {
        this.setData({
          showTips: true,
        })
      }
    },
    /**
     * @description 初始化蓝牙模块
     * TODO 目前只检查权限，未实质打开服务
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
      }).catch(() => Logger.error('Refused WxBlePermission'))

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
      const sn8 = e.detail
      if (!sn8) {
        return
      }
      wx.navigateTo({
        url: `/package-remoter/pannel/index?sn8=${sn8}`,
      })
    },
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
    toSeek() {
      this.setData({
        isSeeking: true,
      })

      setTimeout(() => {
        this.setData({
          isSeeking: false,
          isNotFound: !this.data.isNotFound,
        })
      }, 3000)
    },
  },
})
