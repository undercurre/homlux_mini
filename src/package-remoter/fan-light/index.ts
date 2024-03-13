import { ComponentWithComputed } from 'miniprogram-computed'
import { 
  // ACTIONSHEET_MAP,
  CMD,
  // COLORTEMP_RANGE,
  FACTORY_ADDR,
  // FREQUENCY_TIME
} from '../../config/remoter'
import { 
  initBleCapacity, 
  // storage, 
  // isDevMode, 
  // rangeValue 
} from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import { 
  createBleServer,
  bleAdvertising,
  // bleAdvertisingEnd,
  // stopAdvertising,
  BleService 
} from '../../utils/remoterUtils'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'

const hourArr = []
for (let i = 0; i <= 6; i++) {
  hourArr.push(i)
}

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] })],
  data: {
    isFactoryMode: false, // 工厂调试模式，按特定的地址发送指令
    deviceInfo: {} as IAnyObject,
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _bleService: null as BleService | null,
    isBLEConnected: false,
    gearSlicerConfig: {
      min: 1,
      max: 6,
      step: 1,
      value: 1,
      disable: false
    },
    btnList: [
      { key: 'NATURN', name: '自然风', isOn: true, isEnable: true,
        iconOn: '/package-remoter/assets/newUI/natureOn.png', iconOff: '/package-remoter/assets/newUI/natureOff.png'},
      { key: 'BRI', name: '亮度', isOn: false, isEnable: true,
        iconOn: '/package-remoter/assets/newUI/briOn.png', iconOff: '/package-remoter/assets/newUI/briOff.png'},
      { key: 'COL', name: '色温', isOn: false, isEnable: true,
        iconOn: '/package-remoter/assets/newUI/colorOn.png', iconOff: '/package-remoter/assets/newUI/colorOff.png'},
      // { key: 'ANION', name: '负离子', isOn: false, isEnable: true,
      //   iconOn: '/package-remoter/assets/newUI/anionOn.png', iconOff: '/package-remoter/assets/newUI/anionOff.png'},
      { key: 'TIMER', name: '定时', isOn: false, isEnable: true,
        iconOn: '/package-remoter/assets/newUI/timerOn.png', iconOff: '/package-remoter/assets/newUI/timerOff.png'},
      { key: 'DIR', name: '正反转', isOn: false, isEnable: true,
        iconOn: '/package-remoter/assets/newUI/dirOn.png', iconOff: '/package-remoter/assets/newUI/dirOff.png'},
      { key: 'DISPLAY', name: '屏显', isOn: false, isEnable: true,
        iconOn: '/package-remoter/assets/newUI/displayOn.png', iconOff: '/package-remoter/assets/newUI/displayOff.png'}
    ],
    bottomList: [
      { key: 'POWER', name: '风扇', isOn: true, iconOn: '/package-remoter/assets/newUI/powerOn.png', iconOff: '/package-remoter/assets/newUI/powerOff.png'},
      { key: 'LIGHT', name: '照明', isOn: false, iconOn: '/package-remoter/assets/newUI/lightOn.png', iconOff: '/package-remoter/assets/newUI/lightOff.png'}
    ],
    isShowPopup: false,
    popupIndex: 0,
    curBrightnessPercent: 0,
    curColorTempPercent: 0,
    isShowTimePicker: false,
    hourArr,
    curTimePickerIndex: [0],
    pickerIndexTemp: [0]
  },
  watch: {
    curRemoter(value) {
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
      return data.isBLEConnected ? '#25CF42' : '#979EAD'
    },
    connectedText(data) {
      return data.isBLEConnected ? '已连接' : '未连接'
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
        return `亮度 | ${data.curBrightnessPercent}%`
      } else if (data.btnList[data.popupIndex].key === 'COL') {
        const arr = [2700, 6500]
        const rang = arr[1] - arr[0]
        const result = Math.round(data.curColorTempPercent / 100 * rang) + arr[0]
        return `色温 | ${result}K`
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
      const { addr } = query
      // this.setData({ deviceType, deviceModel, addr })
      remoterStore.setAddr(addr)
      console.log('lmn>>>curRemoter=', JSON.stringify(remoterStore.curRemoter))

      const bleInited = await initBleCapacity()
      if (!bleInited) {
        return
      }
      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()

      this.setData({
        deviceInfo: {
          ...this.data.deviceInfo,
          ...remoterStore.curRemoter.deviceAttr,
        },
      })
      console.log('lmn>>>deviceInfo=', JSON.stringify(this.data.deviceInfo))
      this.start()
    },
    onUnload() {
      if (this.data.isBLEConnected) {
        this.data._bleService?.close()
      }
    },
    start(){
      this.sendBluetoothAd([CMD['DISCONNECT']])
      setTimeout(() => {
        this.startConnectBLE()
      }, 1500);
    },
    async sendBluetoothAd(paramsArr?: number[]) {
      if (!paramsArr || paramsArr.length == 0) return
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }
      const addr = this.data.isFactoryMode ? FACTORY_ADDR : remoterStore.curAddr
      const payload = remoterProtocol.generalCmdString(paramsArr)
      bleAdvertising(this.data._bleServer, {
        addr,
        payload,
        isFactory: this.data.isFactoryMode,
        debug: false
      })
    },
    async startConnectBLE() {
      const { addr, deviceId } = remoterStore.curRemoter
      if (!this.data.isBLEConnected) {
        if (!this.data._bleService) {
          this.data._bleService = new BleService({ addr, deviceId })
          this.data._bleService.registerConnectState((isCon) => {
            this.bluetoothConnectChange(isCon)
          })
          this.data._bleService.registerReceCallback((data) => {
            this.receiveBluetoothData(data)
          })
        }
        const res = await this.data._bleService.connect()
        if (res.code == 0) {
          await this.data._bleService.init()
          Toast('蓝牙连接成功')
          this.setData({
            isBLEConnected: true
          })
        } else {
          Toast('蓝牙连接失败')
          this.setData({
            isBLEConnected: false
          })
        }
      }
    },
    sendBluetoothCMD(paramsArr?: number[]) { // [3, 4, 5]
      if (!paramsArr || paramsArr.length == 0) return
      if (this.data.isBLEConnected) {
        const payload = remoterProtocol.generalCmdString(paramsArr)
        this.data._bleService?.sendCmd(payload)
      } else {
        this.sendBluetoothAd(paramsArr)
      }
    },
    receiveBluetoothData(data: string) {
      console.log('lmn>>>receiveBluetoothData::data=', data)
    },
    bluetoothConnectChange(isConnected: boolean) {
      console.log('lmn>>>bluetoothConnectChange::isConnected=', isConnected)
      if (!isConnected) {
        Toast('蓝牙连接已断开')
      }
      this.setData({
        isBLEConnected: isConnected
      })
    },
    onSliderChange(e: any) {
      const value = e.detail
      console.log('lmn>>>onSliderChange::value=', value)
      const key = `FAN_SPEED_${value}`
      const para = [CMD[key]]
      if (para != undefined && para != null) {
        this.sendBluetoothCMD(para)
      }
    },
    onBtnListClick(e: any) {
      const index = e.currentTarget.dataset.index
      const list = this.data.btnList
      if (!list[index].isEnable) return
      const key = list[index].key
      if (key === 'NATURN' || key === 'DIR' || key === 'DISPLAY') {
        list[index].isOn = !list[index].isOn
        this.setData({
          btnList: list
        })
      }
      if (key === 'NATURN') {
        this.sendBluetoothCMD([CMD['FAN_NATRUE']])
      } else if (key === 'DIR') {
        this.sendBluetoothCMD([CMD['FAN_NEGATIVE']])
      } else if (key === 'DISPLAY') {
        this.sendBluetoothCMD([CMD['CLOSE_DISPLAY']])
      } else if (key === 'BRI' || key === 'COL') {
        this.setData({
          isShowPopup: true,
          popupIndex: index
        })
      } else if (key === 'TIMER') {
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
      const list = this.data.bottomList
      list[index].isOn = !list[index].isOn
      this.setData({
        bottomList: list
      })
      if (list[index].key == 'POWER') {
        this.sendBluetoothCMD([CMD['FAN_SWITCH']])
      } else if (list[index].key == 'LIGHT') {
        this.sendBluetoothCMD([CMD['LIGHT_LAMP']])
      }
    },
    closePopup() {
      this.setData({
        isShowPopup: false,
        isShowTimePicker: false
      })
    },
    onBrightnessSliderEnd(e: any) {
      const value = e.detail
      this.setData({
        curBrightnessPercent: value
      })
      this.sendBluetoothCMD([CMD['LIGHT_BRIGHT'], this.percent2Rang(this.data.curBrightnessPercent)])
    },
    onColorSliderEnd(e: any) {
      const value = e.detail
      this.setData({
        curColorTempPercent: value
      })
      this.sendBluetoothCMD([CMD['LIGHT_COLOR_TEMP'], this.percent2Rang(this.data.curColorTempPercent)])
    },
    onPickTimeConfirm() {
      this.closePopup()
      const hour = this.data.hourArr[this.data.pickerIndexTemp[0]]
      if (hour == 0) {
        this.sendBluetoothCMD([CMD['FAN_DELAY_OFF_CANCEL']])
      } else {
        const key = `FAN_DELAY_OFF_${hour}`
        const para = CMD[key]
        if (para != undefined && para != null) this.sendBluetoothCMD([CMD[key]])
      }
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
    },
    percent2Rang(percent: number) {
      const value = percent > 100 ? 100 : percent < 0 ? 0 : percent
      return Math.round(value / 100 * 255)
    },
    rang2Percent(rang: number) {
      const value = rang > 255 ? 255 : rang < 0 ? 0 : rang
      return Math.round(value / 255 * 100)
    }
  }
})