import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import { emitter } from '../../utils/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
import { hideLoading, showLoading } from '../../utils/system'
import dataBus from '../utils/dataBus'
import { CMD } from '../../config/remoter'

const heightArr = []
for (let i = 0; i <= 120; i+=5) {
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
    heightArr,
    isShowPicker: false,
    curPickerIndex: [0],
    pickerIndexTemp: [0],
    customOption: [
      { key: 'SLOWUP', name: '轻抬上升', isOn: false }
    ]
  },
  methods: {
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string }) {
      const { deviceType, deviceModel, addr } = query
      this.setData({ deviceType, deviceModel, addr })

      dataBus.on('DEVSTATUS', (e) => {
        this.updateView(e)
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
          remoterStore.removeCurRemoter()

          wx.navigateBack({
            delta: 2,
            complete() {
              emitter.emit('remoterChanged')
            },
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
      if (status.CLOTHES_SET_HEIGHT !== undefined && !this.data.isShowPicker) {
        let pickIndex = this.data.curPickerIndex
        const height = status.CLOTHES_SET_HEIGHT
        if (height >=0 && height <= 120) {
          pickIndex = [Math.floor(height / 5)]
        }
        this.setData({
          curPickerIndex: pickIndex
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
      this.setData({
        customOption: option
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
        isShowPicker: true
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
    onPickTimeConfirm() {
      showLoading('加载中')
      setTimeout(() => {
        hideLoading()
        this.closePopup()
        const height = this.data.heightArr[this.data.curPickerIndex[0]]
        this.sendBluetoothCMD([CMD['CLOTHES_SET_HEIGHT'], height]);
      }, 1000);
    },
    onCustomSwitchClick(e: any) {
      const index = e.currentTarget.dataset.index
      const option = this.data.customOption
      option[index].isOn = !option[index].isOn
      this.setData({
        customOption: option
      })
      const key = e.currentTarget.dataset.key
      if (key === 'SLOWUP') {
        this.sendBluetoothCMD([CMD['CLOTHES_SLOW_UP']]);
      }
    }
  },
})
