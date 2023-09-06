import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../behaviors/pageBehaviors'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import { deviceConfig } from '../../config/remoter'
import { storage, emitter } from '../../utils/index'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    showEditNamePopup: false,
    isShowSetting: false,
    fastSwitchName: '照明开关',
    _localList: (storage.get<Remoter.LocalList>('_localList') ?? {}) as Remoter.LocalList,
    device: {} as IAnyObject,
  },

  computed: {
    settingActions() {
      const actions = [
        {
          name: '小夜灯',
        },
        {
          name: '照明',
        },
      ]

      return actions
    },
  },

  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string }) {
      const { deviceType, deviceModel, addr } = query
      const deviceName = this.data._localList[addr].deviceName ?? deviceConfig[deviceType][deviceModel]
      this.setData({
        device: { ...deviceConfig[deviceType][deviceModel], deviceName, addr },
      })
    },

    handleDeviceNameEditPopup() {
      this.setData({
        showEditNamePopup: true,
      })
    },
    handleDeviceNameEditCancel() {
      this.setData({
        showEditNamePopup: false,
      })
    },
    handleDeviceNameEditConfirm(e: { detail: string }) {
      const deviceName = e.detail
      this.data._localList[this.data.device.addr].deviceName = deviceName
      storage.set('_localList', this.data._localList)
      emitter.emit('remoterChanged')

      this.setData({
        showEditNamePopup: false,
        device: {
          ...this.data.device,
          deviceName,
        },
      })
    },
    toSetting() {
      this.setData({
        isShowSetting: true,
      })
    },
    onCloseSetting() {
      this.setData({
        isShowSetting: false,
      })
    },
    onSelectSetting(e: WechatMiniprogram.CustomEvent) {
      const name = e.detail.name

      this.setData({
        isShowSetting: false,
        fastSwitchName: name,
      })
    },
    handleDeviceDelete() {
      Dialog.confirm({
        title: '确定删除该设备？',
      })
        .then(async () => {
          Toast('删除成功')
          delete this.data._localList[this.data.device.addr]
          storage.set('_localList', this.data._localList)
          emitter.emit('remoterChanged')

          wx.navigateBack({
            delta: 2,
          })
        })
        .catch(() => {})
    },
    handleDeviceUnbind() {
      Dialog.confirm({
        title: '确认解除实体遥控器与当前设备的配对关系？',
      })
        .then(async () => {
          Toast('解绑成功')
        })
        .catch(() => {})
    },
  },
})
