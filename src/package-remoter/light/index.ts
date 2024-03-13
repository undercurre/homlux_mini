import { ComponentWithComputed } from 'miniprogram-computed'
import { 
  // ACTIONSHEET_MAP, 
  CMD, 
  // COLORTEMP_RANGE, 
  FACTORY_ADDR, 
  // FREQUENCY_TIME,
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
      value: 2
    },
    btnList: [
      { key: 'BRIGHT', name: '明亮', isOn: false, isEnable: true,
        iconOn: '/package-remoter/assets/newUI/brightOn.png', iconOff: '/package-remoter/assets/newUI/birghtOff.png'},
      { key: 'SOFT', name: '柔和', isOn: false, isEnable: true,
        iconOn: '/package-remoter/assets/newUI/briOn.png', iconOff: '/package-remoter/assets/newUI/briOff.png'},
      { key: 'SLEEP', name: '助眠', isOn: false, isEnable: true,
        iconOn: '/package-remoter/assets/newUI/sleepOn.png', iconOff: '/package-remoter/assets/newUI/sleepOff.png'},
      { key: 'DELAY', name: '延时关灯', isOn: false, isEnable: true,
        iconOn: '/package-remoter/assets/newUI/delay2mOn.png', iconOff: '/package-remoter/assets/newUI/delay2mOff.png'}
    ],
    bottomList: [
      { key: 'POWER', name: '风扇', isOn: true, iconOn: '/package-remoter/assets/newUI/powerOn.png', iconOff: '/package-remoter/assets/newUI/powerOff.png'},
      { key: 'NIGHT', name: '夜灯', isOn: false, iconOn: '/package-remoter/assets/newUI/nightOn.png', iconOff: '/package-remoter/assets/newUI/nightOff.png'}
    ],
    curTabIndex: 0,
    isBriDraging: false,
    briDragTemp: 1,
    curBrightnessPercent: 1,
    curColorTempPercent: 1
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
    sliderBriTextColor(data) {
      if (data.isBriDraging) {
        if (data.briDragTemp > 12) return '#ffffff'
        else return '#507FFF'
      } else {
        if (data.curBrightnessPercent > 12) return '#ffffff'
        else return '#507FFF'
      }
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
    onBtnListClick(e: any) {
      const index = e.currentTarget.dataset.index
      const list = this.data.btnList
      if (!list[index].isEnable) return
      list[index].isOn = !list[index].isOn
      this.setData({
        btnList: list
      })
      const key = list[index].key
      if (key === 'BRIGHT' || key === 'SOFT') {
        setTimeout(() => {
          list[index].isOn = false
          this.setData({
            btnList: list
          })
        }, 300);
      }
      if (key === 'BRIGHT') {
        this.sendBluetoothCMD([CMD['LIGHT_SCENE_MIX'], 255, 255])
      } else if (key === 'SOFT') {
        this.sendBluetoothCMD([CMD['LIGHT_SCENE_MIX'], 127])
      } else if (key === 'SLEEP') {
        this.sendBluetoothCMD([CMD['LIGHT_SCENE_SLEEP']])
      } else if (key === 'DELAY') {
        this.sendBluetoothCMD([CMD['LIGHT_SCENE_DELAY_OFF']])
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
        this.sendBluetoothCMD([CMD['LIGHT_LAMP']])
      } else if (list[index].key == 'NIGHT') {
        this.sendBluetoothCMD([CMD['LIGHT_NIGHT_LAMP']])
      }
    },
    onTabClick(e: any) {
      const index = e.detail.index
      this.setData({
        curTabIndex: index
      })
    },
    onBriSliderDrag(e: any) {
      const value = e.detail.value
      this.setData({
        isBriDraging: true,
        briDragTemp: 101 - value
      })
    },
    onBriSliderChange(e: any) {
      const value = e.detail
      this.setData({
        curBrightnessPercent: 101 - value,
        isBriDraging: false
      })
      this.sendBluetoothCMD([CMD['LIGHT_BRIGHT'], this.percent2Rang(this.data.curBrightnessPercent)])
    },
    onColSliderChange(e: any) {
      const value = e.detail
      this.setData({
        curColorTempPercent: 101 - value
      })
      this.sendBluetoothCMD([CMD['LIGHT_COLOR_TEMP'], this.percent2Rang(this.data.curColorTempPercent)])
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