import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { deviceTransmit, queryDeviceInfoByDeviceId } from '../../../apis/index'
import { ossDomain, ShareImgUrl } from '../../../config/index'
import Toast from '../../../skyline-components/mz-toast/toast'

type StatusType = 'init' | 'generated'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    expired: 10,
    pwd: '',
    remainSecond: 0,
    timerSetVal: 10, // picker设置值
    isShowPicker: false,
    pickerTitle: '密码有效期',
    pickerColumns: [
      {
        values: Array.from({ length: 30 }, (_, i) => i + 1),
        defaultIndex: 9,
      },
    ],
    status: 'init' as StatusType,
    deviceId: '',
    doorOnline: '0',
    generatedImage: `${ossDomain}/homlux/guide/temp-psw.png`,
    _countdownId: 0,
    deviceInfo: {} as Device.DeviceItem,
  },

  computed: {
    actionTips(data) {
      const { pwd } = data
      return `在门锁输入“ ${pwd.length}位数密码 + ✔键 ”结束`
    },
    pwdSize(data) {
      const { pwd } = data
      return pwd.length >= 8 ? '112rpx' : '144rpx'
    },
    // 按格式显示倒计时
    remainTime(data) {
      const { remainSecond } = data
      const min = Math.floor(remainSecond / 60)
      const sec = remainSecond % 60
      return [min, sec].map((item) => String(item).padStart(2, '0')).join(':')
    },
    pwdValidTime(data) {
      const { expired } = data
      return `有效时间：${expired}分钟`
    },

    // 复合判断门锁在离线状态
    isDoorOnline(data) {
      const { doorOnline, deviceInfo } = data
      if (!deviceInfo.onLineStatus) return false
      return doorOnline === '1' || doorOnline === '2'
    },
    pwdTips(data) {
      const { isDoorOnline } = data
      return isDoorOnline ? '1.生成新密码后，原临时密码失效。' : '1.密码在有效期内可重复使用，请谨慎分享。'
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad({ deviceId }: { deviceId: string }) {
      console.log('onLoad', deviceId)
      this.setData({
        deviceId,
      })

      wx.updateShareMenu({
        withShareTicket: true,
        isPrivateMessage: true,
      })
    },

    onShow() {
      this.updateReport()
      this.resetStatus()
      this.updateDeviceInfo()
    },
    async updateDeviceInfo() {
      const res = await queryDeviceInfoByDeviceId({ deviceId: this.data.deviceId })
      if (res.success) {
        this.setData({
          deviceInfo: res.result,
        })
      }
    },

    resetStatus() {
      this.data._countdownId && clearInterval(this.data._countdownId)

      this.setData({
        status: 'init',
        pwd: '',
        remainSecond: 0,
      })
    },

    showPicker() {
      this.setData({ isShowPicker: true })
    },
    handleClose() {
      this.setData({ isShowPicker: false })
    },
    handlePickerConfirm() {
      this.setData({
        isShowPicker: false,
        expired: this.data.timerSetVal,
      })
    },
    handleCopyPwd() {
      wx.setClipboardData({
        data: `【门锁临时密码】${this.data.pwd}，${this.data.pwdValidTime}`,
      })
    },
    onShareAppMessage() {
      return {
        title: `【门锁临时密码】${this.data.pwd}，${this.data.pwdValidTime}`,
        imageUrl: ShareImgUrl,
        path: '/pages/index/index',
      }
    },
    timeChange(e: { detail: { value: string[] } }) {
      const timerSetVal = Number(e.detail.value[0])
      this.setData({ timerSetVal })
    },
    /**
     * 生成一次临时密码
     * ! 直接使用单向模式的接口，云端会作判断，若设备实际处于双向模式，返回双向模式的密码
     */
    async generatePsw() {
      const handleType = this.data.isDoorOnline ? 'DOWN_DOUBLE_PWD' : 'GET_TMP_PWD'
      const res = (await deviceTransmit(handleType, {
        deviceId: this.data.deviceId,
        expireTime: this.data.expired * 60,
      })) as IAnyObject

      if (!res.success) {
        Toast('门锁临时密码生成失败')
        return
      }

      const { remainTime, pwd } = res.result
      const [min, sec] = remainTime.split(':').map((item: string) => Number(item))

      this.setData({
        status: 'generated',
        remainSecond: min * 60 + sec,
        pwd,
      })

      this.toCountDown()
    },
    /**
     * 倒计时显示
     * 若计时结束，则返回未生成密码的页面状态
     */
    toCountDown() {
      this.data._countdownId && clearInterval(this.data._countdownId)

      this.data._countdownId = setInterval(() => {
        this.setData({
          remainSecond: this.data.remainSecond - 1,
        })
        if (this.data.remainSecond <= 0) {
          this.resetStatus()
        }
      }, 1000)
    },
    /**
     * 主动更新门锁信息
     */
    async updateReport() {
      const res = (await deviceTransmit('GET_REPORT_JSON', {
        deviceId: this.data.deviceId,
      })) as IAnyObject

      if (!res.success) {
        Toast('门锁状态查询失败')
        return
      }

      this.setData({
        doorOnline: res.result.doorOnline,
      })
    },
  },
})
