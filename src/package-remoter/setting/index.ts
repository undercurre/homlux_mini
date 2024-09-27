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
import { hideLoading, showLoading } from '../../utils/system'

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
    isShowHeightSet: false,
    curShowHeight: '--',
    customOption: [
      { key: 'NOBODY_OFF', name: '无人灭灯', isOn: false, hasPop: true, isEnable: true, des: '仅在消毒功能开启时可使用', timeSec: 0, from: 0 },
      { key: 'NOBODY_UP', name: '无人升顶', isOn: false, hasPop: true, isEnable: true, des: '仅在消毒功能开启时可使用', timeSec: 0, from: 0 },
      { key: 'SLOW_UP', name: '轻抬上升', isOn: false, hasPop: false, isEnable: true, des: '', timeSec: 0, from: 0 },
      { key: 'VOICE', name: '离线语音', isOn: false, hasPop: false, isEnable: true, des: '', timeSec: 0, from: 0 }
    ],
    curOneKeySettingStep: 0, // 0-开始设置，1-上升复位中，2-下降待完成中
    totalAccess: 0,
    curSwitchFun: '',
    statusTemp: null as any,
    noBodyMinuteArr: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    noBodySecondArr: [0, 30],
    curPickerIndex: [0],
    pickerIndexTemp: [0],
    isShowTimePicker: false,
    curPickOptionIndex: 0,
    clickCnt: 0
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
    onUnload() {
      dataBus.off('DEVSTATUS')
    },
    configOption() {
      if (this.data.deviceType === '17') {
        const funArr = []
        const funStr = this.data.devFunDes
        for (let i = 0; i < funStr.length; i += 2) {
          funArr.push(parseInt(funStr.slice(i, i + 2), 16))
        }
        let isSpportVoice = false
        let isSupportDis = false
        if (funArr.length > 0) {
          isSpportVoice = !!(funArr[0] & 0x04)
          isSupportDis = !!(funArr[0] & 0x01)
        }
        const option = this.data.customOption
        const showOption = []
        for (let i = 0; i < option.length; i++) {
          if (option[i].key === 'VOICE') {
            if (isSpportVoice) showOption.push(option[i])
          } else if (option[i].key === 'NOBODY_OFF' || option[i].key === 'NOBODY_UP') {
            if (isSupportDis) showOption.push(option[i])
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
          if (option[i].key === 'SLOW_UP') {
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
      if (status.CLOTHES_NOBODY_LIGHT_OFF !== undefined) {
        for (let i = 0; i < option.length; i++) {
          if (option[i].key === 'NOBODY_OFF') {
            option[i].isOn = status.CLOTHES_NOBODY_LIGHT_OFF
            option[i].timeSec = status.CLOTHES_NOBODY_LIGHT_TIME || 0
            break
          }
        }
      }
      if (status.CLOTHES_NOBODY_UP !== undefined) {
        for (let i = 0; i < option.length; i++) {
          if (option[i].key === 'NOBODY_UP') {
            option[i].isOn = status.CLOTHES_NOBODY_UP
            option[i].timeSec = status.CLOTHES_NOBODY_UP_TIME || 0
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
        isShowHeightSet: false,
        isShowTimePicker: false
      })
    },
    onClothesHeightClick() {
      this.setData({
        isShowHeightSet: true,
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
    onTimePickChange(e: any) {
      const indexs = e.detail.value
      if (indexs[0] === 0) {
        this.setData({
          pickerIndexTemp: indexs,
          noBodySecondArr: [30]
        })
      } else if (indexs[0] === 10) {
        this.setData({
          pickerIndexTemp: indexs,
          noBodySecondArr: [0]
        })
      } else {
        this.setData({
          pickerIndexTemp: indexs,
          noBodySecondArr: [0, 30]
        })
      }
    },
    onTimePickEnd() {
      setTimeout(() => {
        this.setData({
          curPickerIndex: this.data.pickerIndexTemp,
        })
      }, 100)
    },
    onPickTimeConfirm() {
      showLoading('加载中')
      setTimeout(() => {
        hideLoading()
        this.closePopup()
        const minute = this.data.noBodyMinuteArr[this.data.curPickerIndex[0]]
        let second = this.data.noBodySecondArr[this.data.curPickerIndex[1]]
        if (minute === 0) second = 30
        else if (minute === 10) second = 0
        const secVal = minute * 60 + second
        const HVal = Math.floor(secVal / 256)
        const LVal = secVal % 256
        const option = this.data.customOption
        const index = this.data.curPickOptionIndex
        if (option[index].from === 1) {
          option[index].isOn = true
          this.setData({
            customOption: option
          })
        }
        const isOnVal = option[index].isOn ? 1 : 0
        this.sendBluetoothCMD([CMD['CLOTHES_NOBODY_LIGHT_OFF'], isOnVal, HVal, LVal])
      }, 1000);
    },
    onCustomSwitchClick(e: any) {
      const index = e.currentTarget.dataset.index
      const option = this.data.customOption
      if (!option[index].isEnable) return
      const key = e.currentTarget.dataset.key
      if (key === 'SLOW_UP') {
        option[index].isOn = !option[index].isOn
        this.setData({
          customOption: option,
        })
        this.sendBluetoothCMD([CMD['CLOTHES_SLOW_UP']])
      } else if (key === 'VOICE') {
        option[index].isOn = !option[index].isOn
        this.setData({
          customOption: option,
        })
        this.sendBluetoothCMD([CMD['CLOTHES_OFFLINE_VOICE']])
      } else if (key === 'NOBODY_OFF') {
        if (option[index].isOn) {
          option[index].isOn = false
          this.setData({
            customOption: option,
          })
          this.sendBluetoothCMD([CMD['CLOTHES_NOBODY_LIGHT_OFF'], 0, 0, 30])
        } else {
          const pickIndex = [0, 0]
          pickIndex[0] = Math.floor(option[index].timeSec / 60)
          pickIndex[1] = Math.floor(option[index].timeSec % 60 / 30)
          option[index].from = 1
          this.setData({
            curPickerIndex: pickIndex,
            isShowTimePicker: true,
            curPickOptionIndex: index,
            customOption: option
          })
        }
      } else if (key === 'NOBODY_UP') {
        if (option[index].isOn) {
          option[index].isOn = false
          this.setData({
            customOption: option,
          })
          this.sendBluetoothCMD([CMD['CLOTHES_NOBODY_UP'], 0, 0, 30])
        } else {
          const pickIndex = [0, 0]
          pickIndex[0] = Math.floor(option[index].timeSec / 60)
          pickIndex[1] = Math.floor(option[index].timeSec % 60 / 30)
          option[index].from = 1
          this.setData({
            curPickerIndex: pickIndex,
            isShowTimePicker: true,
            curPickOptionIndex: index,
            customOption: option
          })
        }
      }
    },
    onCustomCellClick(e: any) {
      const index = e.currentTarget.dataset.index
      const option = this.data.customOption
      if (!option[index].isEnable || !option[index].hasPop) return
      const key = e.currentTarget.dataset.key
      if (key === 'NOBODY_OFF' || key === 'NOBODY_UP') {
        const pickIndex = [0, 0]
        pickIndex[0] = Math.floor(option[index].timeSec / 60)
        pickIndex[1] = Math.floor(option[index].timeSec % 60 / 30)
        option[index].from = 0
        this.setData({
          curPickerIndex: pickIndex,
          isShowTimePicker: true,
          curPickOptionIndex: index,
          customOption: option
        })
      }
    },
    none() {},
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
    onNavClick() {
      const cnt = this.data.clickCnt
      if (cnt >= 3) {
        this.sendBluetoothCMD([CMD['FACTORY']])
        this.setData({
          clickCnt: 0
        })
      } else {
        this.setData({
          clickCnt: cnt + 1
        })
      }
    },
  },
  lifetimes: {
    attached: function () {
      this.updateShareSetting()
    },
  },
})
