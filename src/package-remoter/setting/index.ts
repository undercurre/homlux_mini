import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../behaviors/pageBehaviors'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    deviceName: '吸顶灯',
    showEditNamePopup: false,
    isShowSetting: false,
    fastSwitchName: '照明开关',
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
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {},

    onShow() {},

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
      this.setData({
        showEditNamePopup: false,
        deviceName: e.detail,
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
      }).then(async () => {
        // if (true) {
        Toast('删除成功')
        wx.navigateBack()
        // } else {
        //   Toast('删除失败')
        // }
      })
    },
    handleDeviceUnbind() {
      Dialog.confirm({
        title: '确认解除实体遥控器与当前设备的配对关系？',
      }).then(async () => {
        // if (true) {
        Toast('解绑成功')
        wx.navigateBack()
        // } else {
        //   Toast('解绑失败')
        // }
      })
    },
  },
})
