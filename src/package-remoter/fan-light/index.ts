import { ComponentWithComputed } from 'miniprogram-computed'
// import { ACTIONSHEET_MAP, CMD, COLORTEMP_RANGE, FACTORY_ADDR, FREQUENCY_TIME } from '../../config/remoter'
// import { Logger, initBleCapacity, storage, isDevMode, rangeValue } from '../../utils/index'
// import remoterProtocol from '../../utils/remoterProtocol'
// import { createBleServer, bleAdvertising, bleAdvertisingEnd, stopAdvertising, BleService } from '../../utils/remoterUtils'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'

const hourArr = []
for (let i = 0; i <= 23; i++) {
  hourArr.push(i)
}
const minuteArr = []
for (let i = 0; i <= 59; i++) {
  minuteArr.push(i)
}

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] })],
  data: {
    deviceInfo: {} as IAnyObject,
    gearSlicerConfig: {
      min: 1,
      max: 6,
      step: 1,
      value: 2
    },
    btnList: [
      { key: 'NATURN', name: '自然风', isOn: true, iconOn: '/package-remoter/assets/newUI/natureOn.png', iconOff: '/package-remoter/assets/newUI/natureOff.png'},
      { key: 'BRI', name: '亮度', isOn: false, iconOn: '/package-remoter/assets/newUI/briOn.png', iconOff: '/package-remoter/assets/newUI/briOff.png'},
      { key: 'COL', name: '色温', isOn: false, iconOn: '/package-remoter/assets/newUI/colorOn.png', iconOff: '/package-remoter/assets/newUI/colorOff.png'},
      { key: 'ANION', name: '负离子', isOn: false, iconOn: '/package-remoter/assets/newUI/anionOn.png', iconOff: '/package-remoter/assets/newUI/anionOff.png'},
      { key: 'TIMER', name: '定时', isOn: false, iconOn: '/package-remoter/assets/newUI/timerOn.png', iconOff: '/package-remoter/assets/newUI/timerOff.png'},
      { key: 'DIR', name: '正反转', isOn: false, iconOn: '/package-remoter/assets/newUI/dirOn.png', iconOff: '/package-remoter/assets/newUI/dirOff.png'},
      { key: 'DISPLAY', name: '屏显', isOn: false, iconOn: '/package-remoter/assets/newUI/displayOn.png', iconOff: '/package-remoter/assets/newUI/displayOff.png'}
    ],
    bottomList: [
      {name: '风扇', isOn: true, iconOn: '/package-remoter/assets/newUI/powerOn.png', iconOff: '/package-remoter/assets/newUI/powerOff.png'},
      {name: '照明', isOn: false, iconOn: '/package-remoter/assets/newUI/lightOn.png', iconOff: '/package-remoter/assets/newUI/lightOff.png'}
    ],
    isShowPopup: false,
    popupIndex: 0,
    curBirghtness: 0,
    curColorPercent: 0,
    isShowTimePicker: false,
    hourArr,
    minuteArr,
    curTimePickerIndex: [0, 0],
    pickerIndexTemp: [0, 0]
  },
  watch: {
    curRemoter(value) {
      // console.log('watch curRemoter')
      this.setData({
        deviceInfo: {
          ...this.data.deviceInfo,
          ...value.deviceAttr,
        },
      })
    },
  },
  computed: {
    connectedColor(data) {
      return data.deviceInfo.connected ? '#25CF42' : '#979EAD'
    },
    connectedText(data) {
      return data.deviceInfo.connected ? '已连接' : '未连接'
    },
    indArr(data) {
      const arr:number[] = []
      for (let i = data.gearSlicerConfig.min; i <= data.gearSlicerConfig.max; i++) {
        arr.push(i)
      }
      return arr
    },
    popupTitle(data) {
      if (data.btnList[data.popupIndex].key === 'BRI') {
        return `亮度 | ${data.curBirghtness}%`
      } else if (data.btnList[data.popupIndex].key === 'COL') {
        return `色温 | ${data.curColorPercent}K`
      }
      return ''
    }
  },
  methods: {
    goBack() {
      wx.navigateBack()
    },
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string }) {
      console.log('lmn>>>', JSON.stringify(query))
      // const { addr } = query
      // // this.setData({ deviceType, deviceModel, addr })
      // remoterStore.setAddr(addr)

      // const bleInited = await initBleCapacity()
      // if (!bleInited) {
      //   return
      // }
      // // 建立BLE外围设备服务端
      // this.data._bleServer = await createBleServer()

      // this.setData({
      //   deviceInfo: {
      //     ...this.data.deviceInfo,
      //     ...remoterStore.curRemoter.deviceAttr,
      //   },
      // })
    },
    onUnload() {
      if (remoterStore.curRemoter.connected) {
        this.data._bleService?.close()
      }
    },
    onSliderChange(e: any) {
      const value = e.detail
      console.log('lmn>>>onSliderChange::value=', value)
    },
    onSliderEnd(e: any) {
      console.log('lmn>>>', JSON.stringify(e))
    },
    onBtnListClick(e: any) {
      const index = e.currentTarget.dataset.index
      console.log('lmn>>>onBtnListClick::index=', index)
      const list = this.data.btnList
      list[index].isOn = !list[index].isOn
      this.setData({
        btnList: list
      })
      if (list[index].key === 'BRI') {
        this.setData({
          isShowPopup: true,
          popupIndex: index
        })
      } else if (list[index].key === 'COL') {
        this.setData({
          isShowPopup: true,
          popupIndex: index
        })
      } else if (list[index].key === 'TIMER') {
        this.setData({
          isShowTimePicker: true,
          popupIndex: index
        })
      }
    },
    goToDevManage() {
      wx.navigateTo({
        url: `/package-remoter/setting/index?addr=${remoterStore.curAddr}`,
      })
    },
    onBottomClick(e: any) {
      const index = e.currentTarget.dataset.index
      console.log('lmn>>>onBottomClick::index=', index)
      const list = this.data.bottomList
      list[index].isOn = !list[index].isOn
      this.setData({
        bottomList: list
      })
    },
    closePopup() {
      this.setData({
        isShowPopup: false,
        isShowTimePicker: false
      })
    },
    onBrightnessSliderEnd(e: any) {
      const value = e.detail
      console.log('lmn>>>onBrightnessSliderEnd::value=', value)
      this.setData({
        curBirghtness: value
      })
    },
    onColorSliderEnd(e: any) {
      const value = e.detail
      console.log('lmn>>>onColorSliderEnd::value=', value)
      this.setData({
        curColorPercent: value
      })
    },
    onPickTimeConfirm() {
      this.closePopup()
      Toast('onPickTimeConfirm')
    },
    onTimePickChange(e: any) {
      const indexs = e.detail.value
      this.setData({
        pickerIndexTemp: indexs
      })
    },
    onTimePickEnd() {
      setTimeout(() => {
        this.setData({
          curTimePickerIndex: this.data.pickerIndexTemp
        })
      }, 100)
    }
  }
})