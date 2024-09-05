import { ComponentWithComputed } from 'miniprogram-computed'
import {
  CMD,
  FACTORY_ADDR,
} from '../../config/remoter'
import {
  initBleCapacity,
} from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import {
  createBleServer,
  bleAdvertising,
  BleService,
} from '../../utils/remoterUtils'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'
import { emitter } from '../../utils/index'

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
    btnList: [
      {
        key: 'BRIGHT',
        name: '明亮',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/brightOn.png',
        iconOff: '/package-remoter/assets/newUI/birghtOff.png',
      },
      {
        key: 'SOFT',
        name: '柔和',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/briOn.png',
        iconOff: '/package-remoter/assets/newUI/briOff.png',
      },
      {
        key: 'SLEEP',
        name: '助眠',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/sleepOn.png',
        iconOff: '/package-remoter/assets/newUI/sleepOff.png',
      },
      {
        key: 'DELAY',
        name: '延时关灯',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/delay2mOn.png',
        iconOff: '/package-remoter/assets/newUI/delay2mOff.png',
      },
    ],
    bottomList: [
      {
        key: 'POWER',
        name: '开灯',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/powerOn.png',
        iconOff: '/package-remoter/assets/newUI/powerOff.png',
      },
      {
        key: 'NIGHT',
        name: '夜灯',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/nightOn.png',
        iconOff: '/package-remoter/assets/newUI/nightOff.png',
      },
    ],
    curTabIndex: 0,
    isBriDraging: false,
    briDragTemp: 1,
    curBrightnessPercent: 1,
    curColorTempPercent: 1,
    isBriSliderDisable: false,
    isColSliderDisable: false,
    conTimer: null as any,
    tryConnectCnt: 0
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
      return data.isBLEConnected ? '已连接' : '未连接'
    },
    sliderBriTextColor(data) {
      if (data.isBriDraging) {
        if (data.briDragTemp > 12) return '#ffffff'
        else return '#7C9DF8'
      } else {
        if (data.curBrightnessPercent > 12) return '#ffffff'
        else return '#7C9DF8'
      }
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
      this.updateView()

      const bleInited = await initBleCapacity()
      if (!bleInited) {
        return
      }
      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()
      if (this.data.isNeedConnectBLE) this.start()
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
        tryConnectCnt: cnt+1
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
    sendBluetoothCMD(paramsArr?: number[], key?: string) {
      // [3, 4, 5]
      if (!paramsArr || paramsArr.length == 0) return
      if (this.data.isBLEConnected) {
        const payload = remoterProtocol.generalCmdString(paramsArr)
        this.data._bleService?.sendCmd(payload)
      } else {
        this.sendBluetoothAd(paramsArr)
      }
      emitter.emit('remoterControl', {mac: this.data.devAddr})
      if (!key) return
      wx.reportEvent("remoter_control", {
        "rm_control_function": key,
        "rm_control_type": this.data.isBLEConnected ? "connect" : "ad",
        "rm_device_model": this.data.devModel,
        "rm_device_type": this.data.devType,
        "rm_device_mac": this.data.devAddr
      })
    },
    receiveBluetoothData(data: string) {
      const srcModel = data.slice(0, 2)
      const status = remoterProtocol.parsePayload(data.slice(2), this.data.devType, this.data.devModel, srcModel)
      const str = JSON.stringify(status)
      if (str === '{}') {
        console.warn('lmn>>>收到错误命令')
        return
      }
      console.log('lmn>>>receiveBluetoothData::status=', str)
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
      if (status.LIGHT_LAMP != undefined) {
        bottom[0].isOn = status.LIGHT_LAMP
      }
      if (status.LIGHT_NIGHT_LAMP != undefined) {
        bottom[1].isOn = status.LIGHT_NIGHT_LAMP
      }
      if (status.LIGHT_BRIGHT != undefined) {
        bri = this.rang2Percent(status.LIGHT_BRIGHT)
        if (status.LIGHT_BRIGHT <= 0) {
          bri = 0
        } else if (status.LIGHT_BRIGHT > 255) {
          bri = 100
        } else {
          bri = Math.floor(((status.LIGHT_BRIGHT - 1) * 99) / 254) + 1
        }
      }
      if (status.LIGHT_COLOR_TEMP != undefined) {
        col = this.rang2Percent(status.LIGHT_COLOR_TEMP)
      }
      if (status.LIGHT_SCENE_SLEEP !== undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'SLEEP') {
            btns[i].isOn = status.LIGHT_SCENE_SLEEP
            break
          }
        }
      }
      if (status.DELAY_OFF != undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'DELAY') {
            btns[i].isOn = status.DELAY_OFF > 0
            break
          }
        }
      }
      this.setData({
        btnList: btns,
        bottomList: bottom,
        curBrightnessPercent: bri,
        briDragTemp: bri,
        curColorTempPercent: col,
      })
      this.updateViewEn()
    },
    updateViewEn() {
      const bottom = this.data.bottomList
      const btns = this.data.btnList
      const isLightDisable = !bottom[0].isOn && this.data.isBLEConnected
      for (let i = 0; i < btns.length; i++) {
        btns[i].isEnable = !isLightDisable
      }
      this.setData({
        btnList: btns,
        isBriSliderDisable: isLightDisable,
        isColSliderDisable: isLightDisable,
      })
    },
    onBtnListClick(e: any) {
      const index = e.currentTarget.dataset.index
      const list = this.data.btnList
      if (!list[index].isEnable) {
        Toast('灯未开启')
        return
      }
      const key = list[index].key
      list[index].isOn = !list[index].isOn
      this.setData({
        btnList: list,
      })
      if (!this.data.isBLEConnected || key === 'BRIGHT' || key === 'SOFT') {
        setTimeout(() => {
          list[index].isOn = false
          this.setData({
            btnList: list,
          })
        }, 300)
      }
      if (key === 'BRIGHT') {
        this.sendBluetoothCMD([CMD['LIGHT_SCENE_MIX'], 255, 255], 'LIGHT_SCENE_MIX')
      } else if (key === 'SOFT') {
        this.sendBluetoothCMD([CMD['LIGHT_SCENE_MIX'], 127], 'LIGHT_SCENE_MIX')
      } else if (key === 'SLEEP') {
        this.sendBluetoothCMD([CMD['LIGHT_SCENE_SLEEP']], 'LIGHT_SCENE_SLEEP')
      } else if (key === 'DELAY') {
        this.sendBluetoothCMD([CMD['LIGHT_SCENE_DELAY_OFF']], 'LIGHT_SCENE_DELAY_OFF')
      }
    },
    goToDevManage() {
      wx.navigateTo({
        url: `/package-remoter/setting/index?addr=${this.data.devAddr}&deviceType=${this.data.devType}&deviceModel=${this.data.devModel}`,
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
        this.sendBluetoothCMD([CMD['LIGHT_LAMP']], 'LIGHT_LAMP')
      } else if (list[index].key == 'NIGHT') {
        this.sendBluetoothCMD([CMD['LIGHT_NIGHT_LAMP']], 'LIGHT_NIGHT_LAMP')
      }
    },
    onTabClick(e: any) {
      const index = e.detail.index
      this.setData({
        curTabIndex: index,
      })
    },
    onBriSliderDrag(e: any) {
      const value = e.detail.value
      this.setData({
        isBriDraging: true,
        briDragTemp: 101 - value,
      })
    },
    onBriSliderChange(e: any) {
      const value = e.detail
      this.setData({
        curBrightnessPercent: 101 - value,
        isBriDraging: false,
      })
      this.sendBluetoothCMD([CMD['LIGHT_BRIGHT'], this.percent2Rang(this.data.curBrightnessPercent)], 'LIGHT_BRIGHT')
    },
    onColSliderChange(e: any) {
      const value = e.detail
      this.setData({
        curColorTempPercent: 101 - value,
      })
      this.sendBluetoothCMD([CMD['LIGHT_COLOR_TEMP'], this.percent2Rang(this.data.curColorTempPercent)], 'LIGHT_COLOR_TEMP')
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
