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
} from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import {
  createBleServer,
  bleAdvertising,
  // bleAdvertisingEnd,
  // stopAdvertising,
  BleService,
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
    devStatus: {} as IAnyObject,
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _bleService: null as BleService | null,
    isNeedConnectBLE: false,
    isBLEConnected: false,
    devType: '',
    devModel: '',
    devAddr: '',
    gearSlicerConfig: {
      min: 1,
      max: 6,
      step: 1,
      value: 1,
      disable: false,
    },
    btnList: [
      {
        key: 'NATURN',
        name: '自然风',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/natureOn.png',
        iconOff: '/package-remoter/assets/newUI/natureOff.png',
      },
      {
        key: 'BRI',
        name: '亮度',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/briOn.png',
        iconOff: '/package-remoter/assets/newUI/briOff.png',
      },
      {
        key: 'COL',
        name: '色温',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/colorOn.png',
        iconOff: '/package-remoter/assets/newUI/colorOff.png',
      },
      {
        key: 'TIMER',
        name: '风扇定时',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/timerOn.png',
        iconOff: '/package-remoter/assets/newUI/timerOff.png',
      },
      {
        key: 'DIR',
        name: '反转',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/dirOn.png',
        iconOff: '/package-remoter/assets/newUI/dirOff.png',
      },
      {
        key: 'DISPLAY',
        name: '屏显',
        isOn: true,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/displayOn.png',
        iconOff: '/package-remoter/assets/newUI/displayOff.png',
      },
    ],
    bottomList: [
      {
        key: 'POWER',
        name: '风扇',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/powerOn.png',
        iconOff: '/package-remoter/assets/newUI/powerOff.png',
      },
      {
        key: 'LIGHT',
        name: '照明',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/lightOn.png',
        iconOff: '/package-remoter/assets/newUI/lightOff.png',
      },
    ],
    isShowPopup: false,
    popupIndex: 0,
    curBrightnessPercent: 0,
    curColorTempPercent: 0,
    isShowTimePicker: false,
    hourArr,
    curTimePickerIndex: [0],
    pickerIndexTemp: [0],
    conTimer: null as any,
    tryConnectCnt: 0,
  },
  watch: {
    curRemoter(value) {
      if (this.data.isBLEConnected || !value.deviceAttr) return
      const temp = this.data.devStatus
      Object.assign(temp, value.deviceAttr)
      this.setData({
        devStatus: temp,
      })
      console.log('lmn>>>rece AD status=', JSON.stringify(temp))
      this.updateView()
    },
  },
  computed: {
    connectedColor(data) {
      return data.isBLEConnected ? '#25CF42' : '#979EAD'
    },
    connectedText(data) {
      return `风速 ｜ ${data.gearSlicerConfig.value}档`
    },
    indArr(data) {
      const arr: number[] = []
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
        const result = Math.round((data.curColorTempPercent / 100) * rang) + arr[0]
        return `色温 | ${result}K`
      }
      return ''
    },
  },
  methods: {
    goBack() {
      wx.navigateBack()
    },
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string }) {
      console.log('lmn>>>query=', JSON.stringify(query))
      const { addr, deviceType, deviceModel } = query
      remoterStore.setAddr(addr)
      console.log('lmn>>>curRemoter=', JSON.stringify(remoterStore.curRemoter))
      this.setData({
        devType: deviceType,
        devModel: deviceModel,
        devAddr: addr,
        isNeedConnectBLE: remoterStore.curRemoter.version >= 2,
        devStatus: remoterStore.curRemoter.deviceAttr || {},
      })
      this.configBtns()
      this.updateView()

      const bleInited = await initBleCapacity()
      if (!bleInited) {
        return
      }
      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()
      if (this.data.isNeedConnectBLE) this.start()
    },
    configBtns() {
      if (this.data.devModel == '03') {
        const btns = this.data.btnList
        const temp = []
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key == 'BRI' || btns[i].key == 'COL' || btns[i].key == 'DISPLAY') {
            continue
          } else {
            temp.push(btns[i])
          }
        }
        this.setData({
          btnList: temp,
        })
      }
    },
    onUnload() {
      clearTimeout(this.data.conTimer)
      if (this.data.isBLEConnected) {
        this.data._bleService?.close()
      }
    },
    start() {
      const timer = setTimeout(() => {
        this.startConnectBLE()
      }, 2000)
      const cnt = this.data.tryConnectCnt
      this.setData({
        conTimer: timer,
        tryConnectCnt: cnt + 1,
      })
      this.sendBluetoothAd([CMD['DISCONNECT']])
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
        debug: false,
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
          this.setData({
            isBLEConnected: true,
          })
          this.updateViewEn()
        } else {
          this.setData({
            isBLEConnected: false,
          })
          if (this.data.tryConnectCnt < 2) {
            this.start()
          }
        }
      }
    },
    sendBluetoothCMD(paramsArr?: number[]) {
      // [3, 4, 5]
      if (!paramsArr || paramsArr.length == 0) return
      if (this.data.isBLEConnected) {
        const payload = remoterProtocol.generalCmdString(paramsArr)
        this.data._bleService?.sendCmd(payload)
      } else {
        this.sendBluetoothAd(paramsArr)
      }
    },
    receiveBluetoothData(data: string) {
      const status = remoterProtocol.parsePayload(data.slice(2), this.data.devType, this.data.devModel)
      console.log('lmn>>>receiveBluetoothData::status=', JSON.stringify(status))
      this.setData({
        devStatus: status,
      })
      this.updateView()
    },
    bluetoothConnectChange(isConnected: boolean) {
      console.log('lmn>>>bluetoothConnectChange::isConnected=', isConnected)
      this.setData({
        isBLEConnected: isConnected,
      })
      this.updateViewEn()
    },
    updateView() {
      const status = this.data.devStatus
      const bottom = this.data.bottomList
      const btns = this.data.btnList
      let bri = this.data.curBrightnessPercent
      let col = this.data.curColorTempPercent
      const gearConfig = this.data.gearSlicerConfig
      let timeIndex = this.data.curTimePickerIndex
      if (status.FAN_SWITCH != undefined) {
        bottom[0].isOn = status.FAN_SWITCH
      }
      if (status.LIGHT_LAMP != undefined) {
        bottom[1].isOn = status.LIGHT_LAMP
      }
      if (status.LIGHT_BRIGHT != undefined) {
        bri = this.rang2Percent(status.LIGHT_BRIGHT)
      }
      if (status.LIGHT_COLOR_TEMP != undefined) {
        col = this.rang2Percent(status.LIGHT_COLOR_TEMP)
      }
      if (status.SPEED != undefined) {
        const val = status.SPEED + 1
        gearConfig.value = val > 6 ? 6 : val < 1 ? 1 : val
      }
      if (status.FAN_NATURE != undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'NATURN') {
            btns[i].isOn = status.FAN_NATURE
            break
          }
        }
      }
      if (status.FAN_NEGATIVE != undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'DIR') {
            btns[i].isOn = status.FAN_NEGATIVE
            break
          }
        }
      }
      if (status.CLOSE_DISPLAY != undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'DISPLAY') {
            btns[i].isOn = status.CLOSE_DISPLAY
            btns[i].isEnable = status.CLOSE_DISPLAY
            break
          }
        }
      }
      if (status.DELAY_OFF != undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'TIMER') {
            btns[i].isOn = status.DELAY_OFF > 0
            if (status.DELAY_OFF > 0) {
              const hour = Math.floor(status.DELAY_OFF / 60)
              const min = status.DELAY_OFF % 60
              btns[i].name = `剩余${hour > 10 ? '' : '0'}${hour}:${min > 10 ? '' : '0'}${min}`
            } else {
              btns[i].name = '风扇定时'
            }
            break
          }
        }
        let hour = Math.ceil(status.DELAY_OFF / 60)
        hour = hour > 6 ? 6 : hour
        timeIndex = [hour]
      }

      this.setData({
        btnList: btns,
        bottomList: bottom,
        curBrightnessPercent: bri,
        curColorTempPercent: col,
        gearSlicerConfig: gearConfig,
        curTimePickerIndex: timeIndex,
      })
      this.updateViewEn()
    },
    updateViewEn() {
      const bottom = this.data.bottomList
      const gearConfig = this.data.gearSlicerConfig
      const btns = this.data.btnList
      const isFanDisable = !bottom[0].isOn && this.data.isBLEConnected
      const isLightDisable = !bottom[1].isOn && this.data.isBLEConnected
      gearConfig.disable = isFanDisable
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].key === 'NATURN' || btns[i].key === 'TIMER' || btns[i].key === 'DIR') {
          btns[i].isEnable = !isFanDisable
        } else if (btns[i].key === 'BRI' || btns[i].key === 'COL') {
          btns[i].isEnable = !isLightDisable
        } else if (btns[i].key === 'DISPLAY') {
          if (!this.data.isBLEConnected) btns[i].isEnable = true
        }
      }
      this.setData({
        gearSlicerConfig: gearConfig,
        btnList: btns,
      })
    },
    onSliderChange(e: any) {
      const value = e.detail
      const config = this.data.gearSlicerConfig
      config.value = value
      this.setData({
        gearSlicerConfig: config,
      })
      const key = `FAN_SPEED_${value}`
      const para = [CMD[key]]
      if (para != undefined && para != null) {
        this.sendBluetoothCMD(para)
      }
    },
    onBtnListClick(e: any) {
      const index = e.currentTarget.dataset.index
      const list = this.data.btnList
      const key = list[index].key
      if (!list[index].isEnable) {
        if (key === 'NATURN' || key === 'DIR' || key === 'TIMER') {
          Toast('风扇未开启')
        } else if (key === 'BRI' || key === 'COL') {
          Toast('灯未开启')
        } else if (key === 'DISPLAY') {
          Toast('灯开启后，屏显将自动开启')
        }
        return
      }
      if (key === 'NATURN' || key === 'DIR' || key === 'DISPLAY') {
        list[index].isOn = !list[index].isOn
        this.setData({
          btnList: list,
        })
        if (!this.data.isBLEConnected) {
          setTimeout(() => {
            list[index].isOn = false
            this.setData({
              btnList: list,
            })
          }, 300)
        }
      }
      if (key === 'NATURN') {
        this.sendBluetoothCMD([CMD['FAN_NATURE']])
      } else if (key === 'DIR') {
        this.sendBluetoothCMD([CMD['FAN_NEGATIVE']])
      } else if (key === 'DISPLAY') {
        this.sendBluetoothCMD([CMD['CLOSE_DISPLAY']])
      } else if (key === 'BRI' || key === 'COL') {
        this.setData({
          isShowPopup: true,
          popupIndex: index,
        })
      } else if (key === 'TIMER') {
        this.setData({
          isShowTimePicker: true,
          popupIndex: index,
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
      if (!list[index].isEnable) return
      list[index].isOn = !list[index].isOn
      this.setData({
        bottomList: list,
      })
      if (!this.data.isBLEConnected) {
        setTimeout(() => {
          list[index].isOn = false
          this.setData({
            bottomList: list,
          })
        }, 300)
      }
      if (list[index].key == 'POWER') {
        this.sendBluetoothCMD([CMD['FAN_SWITCH']])
      } else if (list[index].key == 'LIGHT') {
        this.sendBluetoothCMD([CMD['LIGHT_LAMP']])
      }
    },
    closePopup() {
      this.setData({
        isShowPopup: false,
        isShowTimePicker: false,
      })
    },
    onBrightnessSliderEnd(e: any) {
      const value = e.detail
      this.setData({
        curBrightnessPercent: value,
      })
      this.sendBluetoothCMD([CMD['LIGHT_BRIGHT'], this.percent2Rang(this.data.curBrightnessPercent)])
    },
    onColorSliderEnd(e: any) {
      const value = e.detail
      this.setData({
        curColorTempPercent: value,
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
        pickerIndexTemp: indexs,
      })
    },
    onTimePickEnd() {
      setTimeout(() => {
        this.setData({
          curTimePickerIndex: this.data.pickerIndexTemp,
        })
      }, 100)
    },
    percent2Rang(percent: number) {
      const value = percent > 100 ? 100 : percent < 0 ? 0 : percent
      return Math.round((value / 100) * 255)
    },
    rang2Percent(rang: number) {
      const value = rang > 255 ? 255 : rang < 0 ? 0 : rang
      return Math.round((value / 255) * 100)
    },
  },
})
