import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import { emitter } from '../../utils/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
import dataBus from '../utils/dataBus'
import { CMD } from '../../config/remoter'
import { ShareImgUrl } from '../../config/index'

const heightArr = []
for (let i = 10; i <= 120; i += 10) {
  heightArr.push(i)
}

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] }), pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    showEditNamePopup: false,
    isShowSetting: false,
    fastSwitchName: '照明开关',
    deviceType: '',
    deviceModel: '',
    deviceAddr: '',
    devFunDes: '',
    heightArr,
    isShowPicker: false,
    curPickerIndex: [0],
    pickerIndexTemp: [0],
    curShowHeight: '--',
    customOption: [
      { key: 'SLOWUP', name: '轻抬上升', isOn: false },
      { key: 'VOICE', name: '离线语音', isOn: false }
    ],
    curOneKeySettingStep: 0, // 0-开始设置，1-上升复位中，2-下降待完成中
    totalAccess: 0,
    curSwitchFun: '',
    statusTemp: null as any
  },
  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string, functionDes: string }) {
      const { deviceType, deviceModel, addr, functionDes } = query
      this.setData({ deviceType, deviceModel, deviceAddr: addr, devFunDes: functionDes || '' })
      this.configOption()

      dataBus.on('DEVSTATUS', (e) => {
        this.updateView(e)
        this.setData({
          statusTemp: e
        })
      })
      this.getAccessCount()
    },
    configOption() {
      if (this.data.deviceType === '17') {
        const funArr = []
        const funStr = this.data.devFunDes
        for (let i = 0; i < funStr.length; i += 2) {
          funArr.push(parseInt(funStr.slice(i, i + 2), 16))
        }
        let isSpportVoice = false
        if (funArr.length > 0) {
          isSpportVoice = !!(funArr[0] & 0x04)
        }
        const option = this.data.customOption
        const showOption = []
        for (let i = 0; i < option.length; i++) {
          if (option[i].key === 'VOICE') {
            if (isSpportVoice) showOption.push(option[i])
          } else {
            showOption.push(option[i])
          }
        }
        this.setData({
          customOption: showOption
        })
      }
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

      remoterStore.renameCurRemoter(deviceName)

      this.setData({
        showEditNamePopup: false,
      })

      emitter.emit('remoterChanged')
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
      const actions = remoterStore.curRemoter.actions
      const index = actions.findIndex((action) => action.name === e.detail.name)
      console.log('onSelectSetting', e.detail.name, index)

      remoterStore.changeAction(index)
      emitter.emit('remoterChanged')
    },
    handleDeviceDelete() {
      Dialog.confirm({
        title: '确定删除该设备？',
      })
        .then(() => {
          Toast('删除成功')
          wx.reportEvent("remoter_operate", {
            "rm_total_control": 0,
            "rm_device_model": remoterStore.curRemoter.deviceModel,
            "rm_device_type": remoterStore.curRemoter.deviceType,
            "rm_device_mac": remoterStore.curRemoter.addr,
            "rm_operate_type": "delete",
            "rm_total_access": this.data.totalAccess
          })

          remoterStore.removeCurRemoter()
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
    updateView(status: any) {
      console.log('lmn>>>dev status=', JSON.stringify(status))
      if (this.data.deviceType === '17') this.update17(status)
      else if (this.data.deviceType === '13') this.update13(status)
    },
    update17(status: any) {
      if (status.CLOTHES_SET_HEIGHT !== undefined) {
        const height = status.CLOTHES_SET_HEIGHT
        this.setData({
          curShowHeight: height === 0 ? '未设置' : '已设置',
        })
      }
      const option = this.data.customOption
      if (status.CLOTHES_SLOW_UP !== undefined) {
        for (let i = 0; i < option.length; i++) {
          if (option[i].key === 'SLOWUP') {
            option[i].isOn = status.CLOTHES_SLOW_UP
            break
          }
        }
      }
      if (status.CLOTHES_OFFLINE_VOICE !== undefined) {
        for (let i = 0; i < option.length; i++) {
          if (option[i].key === 'VOICE') {
            option[i].isOn = status.CLOTHES_OFFLINE_VOICE
            break
          }
        }
      }
      let step = this.data.curOneKeySettingStep
      if (status.CLOTHES_IS_SETTING_HEIGHT !== undefined && status.CLOTHES_ACTION !== undefined) {
        if (!status.CLOTHES_IS_SETTING_HEIGHT) {
          step = 0
        } else {
          if (status.CLOTHES_ACTION === 1) step = 1
          else if (status.CLOTHES_ACTION === 2) step = 2
        }
      }
      this.setData({
        customOption: option,
        curOneKeySettingStep: step,
      })
    },
    update13(status: any) {
      let text = this.data.curSwitchFun
      if (status.WALL_SWITCH !== undefined) {
        if (status.WALL_SWITCH === 0) text = '色温'
        else text = '功能'
      }
      this.setData({
        curSwitchFun: text
      })
    },
    sendBluetoothCMD(paramsArr?: number[]) {
      if (!paramsArr || paramsArr.length == 0) return
      dataBus.emit('DEVSEND', paramsArr)
    },
    closePopup() {
      this.setData({
        isShowPicker: false,
      })
    },
    onClothesHeightClick() {
      this.setData({
        isShowPicker: true,
      })
    },
    onPickChange(e: any) {
      const indexs = e.detail.value
      this.setData({
        pickerIndexTemp: indexs,
      })
    },
    onPickEnd() {
      setTimeout(() => {
        this.setData({
          curPickerIndex: this.data.pickerIndexTemp,
        })
      }, 100)
    },
    onOneKeyStepClick() {
      if (this.data.curOneKeySettingStep === 0) {
        this.sendBluetoothCMD([CMD['CLOTHES_ONE_KEY_START']])
      } else if (this.data.curOneKeySettingStep === 2) {
        this.sendBluetoothCMD([CMD['CLOTHES_ONE_KEY_END']])
        this.closePopup()
      }
    },
    // onPickTimeConfirm() {
    //   showLoading('加载中')
    //   setTimeout(() => {
    //     hideLoading()
    //     this.closePopup()
    //     const height = this.data.heightArr[this.data.curPickerIndex[0]]
    //     this.setData({
    //       curShowHeight: `${height}cm`
    //     })
    //     this.sendBluetoothCMD([CMD['CLOTHES_SET_HEIGHT'], height]);
    //   }, 1000);
    // },
    onCustomSwitchClick(e: any) {
      const index = e.currentTarget.dataset.index
      const option = this.data.customOption
      option[index].isOn = !option[index].isOn
      this.setData({
        customOption: option,
      })
      const key = e.currentTarget.dataset.key
      if (key === 'SLOWUP') {
        this.sendBluetoothCMD([CMD['CLOTHES_SLOW_UP']])
      }
    },
    onSwitchFunClick() {
      setTimeout(() => {
        dataBus.emit('DEVSTATUS', this.data.statusTemp)
      }, 500);
      wx.navigateTo({
        url: `/package-remoter/fan-light-setting/index?addr=${this.data.deviceAddr}&deviceType=${this.data.deviceType}&deviceModel=${this.data.deviceModel}`,
      })
    },
    updateShareSetting() {
      wx.updateShareMenu({
        withShareTicket: true,
        isPrivateMessage: false,
        success() {
          wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage'],
          })
        },
      })
    },
    onShareAppMessage() {
      const curDev = remoterStore.curRemoter
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            title: '分享遥控器设备',
            path: `/pages/remoter/index?addr=${curDev.addr}&deviceType=${curDev.deviceType}&deviceModel=${curDev.deviceModel}&functionDes=${curDev.functionDes}&deviceName=${curDev.deviceName}&version=${curDev.version}`,
            imageUrl: ShareImgUrl,
          })
        }, 500)
      })
      return {
        title: '分享遥控器设备',
        path: `/pages/remoter/index?addr=${curDev.addr}&deviceType=${curDev.deviceType}&deviceModel=${curDev.deviceModel}&functionDes=${curDev.functionDes}&deviceName=${curDev.deviceName}&version=${curDev.version}`,
        imageUrl: ShareImgUrl,
        promise,
      }
    },
    getAccessCount() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this
      wx.batchGetStorage({
        keyList: ['REMOTERTOTALACCESS'],
        success (res: any) {
          const list = res.dataList
          that.setData({
            totalAccess: list[0] ? parseInt(list[0]) : 0
          })
        }
      })
    },
  },
  lifetimes: {
    attached: function () {
      this.updateShareSetting()
    },
  },
})
