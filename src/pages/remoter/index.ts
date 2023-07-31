import pageBehavior from '../../behaviors/pageBehaviors'
import Dialog from '@vant/weapp/dialog/dialog'
import { isAndroid, Logger } from '../../utils/index'

Component({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    isWxBlePermit: false, // 微信蓝牙权限是否开启
    isSystemBlePermit: false, // 系统蓝牙权限是否开启
    _listenLocationTimeId: 0, // 监听系统位置信息是否打开的计时器， 0为不存在监听
  },

  lifetimes: {
    detached() {
      clearInterval(this.data._listenLocationTimeId)
    },
  },
  pageLifetimes: {
    show() {
      if (typeof this.getTabBar === 'function' && this.getTabBar()) {
        this.getTabBar().setData({
          selected: 1,
        })
      }

      this.initBle()
    },
  },

  methods: {
    /**
     * @description 初始化蓝牙模块
     * TODO 目前只检查权限，未实质打开服务
     */
    async initBle() {
      const openBleRes = (await wx
        .openBluetoothAdapter({
          mode: 'central',
        })
        .catch((err: WechatMiniprogram.BluetoothError) => err)) as IAnyObject

      Logger.console('scan-openBleRes', openBleRes)

      // 判断是否授权蓝牙 安卓、IOS返回错误格式不一致
      if (openBleRes.errno === 103 || openBleRes.errMsg.includes('auth deny')) {
        this.checkWxBlePermission()

        // 优先判断微信授权设置
        return
      }

      this.setData({
        isWxBlePermit: true,
      })

      this.checkSystemBleSwitch()
    },

    /**
     * 检查微信蓝牙权限
     */
    async checkWxBlePermission() {
      Dialog.confirm({
        title: '请授权小程序使用蓝牙',
        cancelButtonText: '知道了',
        confirmButtonText: '去设置',
        confirmButtonOpenType: 'openSetting', // 确认按钮的微信开放能力
      }).catch(() => Logger.error('Refused WxBlePermission'))
    },

    /**
     * 检查系统蓝牙开关
     */
    checkSystemBleSwitch() {
      const systemSetting = wx.getSystemSetting()
      this.setData({
        isSystemBlePermit: systemSetting.bluetoothEnabled,
      })

      // 系统蓝牙关闭，弹出指引
      if (!this.data.isSystemBlePermit) {
        Dialog.confirm({
          title: '请打开手机蓝牙开关并授权微信使用',
          cancelButtonText: '知道了',
          confirmButtonText: '查看指引',
        }).catch(() => Logger.error('不查看指引'))

        const listen = (res: WechatMiniprogram.OnBluetoothAdapterStateChangeCallbackResult) => {
          if (res.available) {
            Logger.log('Ble Adapter Ready')
            wx.offBluetoothAdapterStateChange(listen)
          }
        }
        wx.onBluetoothAdapterStateChange(listen)
      }
    },
    checkSystemLocation() {
      if (!isAndroid() || this.data._listenLocationTimeId) {
        return
      }

      const systemSetting = wx.getSystemSetting()

      if (!systemSetting.locationEnabled) {
        wx.showModal({
          content: '请打开手机系统的位置信息开关',
          showCancel: false,
          confirmText: '我知道了',
          confirmColor: '#488FFF',
        })

        this.data._listenLocationTimeId = setInterval(() => {
          const systemSetting = wx.getSystemSetting()

          if (systemSetting.locationEnabled) {
            clearInterval(this.data._listenLocationTimeId)
            this.data._listenLocationTimeId = 0
            this.initBle()
          }
        }, 3000)
      }
    },
  },
})
