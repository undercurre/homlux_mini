import { ComponentWithComputed } from 'miniprogram-computed'
import { CMD, FACTORY_ADDR } from '../../config/remoter'
import { initBleCapacity } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import { createBleServer, bleAdvertising, BleService } from '../../utils/remoterUtils'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
// import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] })],
  data: {
    isFactoryMode: false, // 工厂调试模式，按特定的地址发送指令
    devStatus: {} as IAnyObject,
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _bleService: null as BleService | null,
    isNeedConnectBLE: false,
    isBLEConnected: false,
    isNeedUpdate: false,
    devType: '',
    devModel: '',
    devAddr: '',
    gearBtnConfig: {
      isEnable: true,
      isTopOn: false,
      isBottomOn: false,
    },
    btnList: [
      {
        key: 'VENT',
        name: '换气',
        isOn: false,
        isEnable: true,
        isMode: true,
        iconOn: '/package-remoter/assets/newUI/ventOn.png',
        iconOff: '/package-remoter/assets/newUI/ventOff.png',
      },
      {
        key: 'SWING',
        name: '摆风',
        isOn: false,
        isEnable: true,
        isMode: false,
        iconOn: '/package-remoter/assets/newUI/swingOn.png',
        iconOff: '/package-remoter/assets/newUI/swingOff.png',
      },
      {
        key: 'ANION',
        name: '负离子',
        isOn: false,
        isEnable: true,
        isMode: false,
        iconOn: '/package-remoter/assets/newUI/anionOn.png',
        iconOff: '/package-remoter/assets/newUI/anionOff.png',
      },
      // {
      //   key: 'DELAY',
      //   name: '延时关',
      //   isOn: false,
      //   isEnable: true,
      //   isMode: false,
      //   iconOn: '/package-remoter/assets/newUI/delayOn.png',
      //   iconOff: '/package-remoter/assets/newUI/delayOff.png',
      // }
    ],
    bottomList: [
      {
        key: 'POWER',
        name: '开机',
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
      {
        key: 'NIGHT',
        name: '夜灯',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/nightOn.png',
        iconOff: '/package-remoter/assets/newUI/nightOff.png',
      },
    ],
    isShowPopup: false,
    popSelectMode: [
      {
        key: 'HIGH',
        name: '强风',
        iconOff: '/package-remoter/assets/newUI/highWindOff.png',
      },
      {
        key: 'LOW',
        name: '弱风',
        iconOff: '/package-remoter/assets/newUI/lowWindOff.png',
      },
      {
        key: 'VENT',
        name: '换气',
        iconOff: '/package-remoter/assets/newUI/ventOff.png',
      },
    ],
    conTimer: null as any,
    updateTimer: null as any,
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
      if (!data.isBLEConnected) return '未连接'
      const list = data.btnList
      const arr = []
      if (data.gearBtnConfig.isTopOn) arr.push('强风')
      else if (data.gearBtnConfig.isBottomOn) arr.push('弱风')
      for (let i = 0; i < list.length; i++) {
        if (list[i].isMode && list[i].isOn) arr.push(list[i].name)
      }
      if (arr.length === 0) return '已连接'
      else return arr.join('|')
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
        isNeedUpdate: remoterStore.curRemoter.version >= 2,
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
      const support = this.getSupportByModel()
      console.log('lmn>>>support=', JSON.stringify(support))
      const btns = this.data.btnList
      const showBtns = []
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].key === 'SWING') {
          if (support.swing) showBtns.push(btns[i])
        } else if (btns[i].key === 'ANION') {
          if (support.anion) showBtns.push(btns[i])
        } else {
          showBtns.push(btns[i])
        }
      }
      const bottom = this.data.bottomList
      const showBottom = []
      for (let i = 0; i < bottom.length; i++) {
        if (bottom[i].key === 'NIGHT') {
          if (support.night) showBottom.push(bottom[i])
        } else {
          showBottom.push(bottom[i])
        }
      }
      this.setData({
        btnList: showBtns,
        bottomList: showBottom,
      })
    },
    getSupportByModel() {
      if (this.data.devModel === '') return {}
      const model = parseInt(this.data.devModel, 16)
      return {
        temperatrue: !!(model & 0x01),
        swing: !!(model & 0x02),
        radar: !!(model & 0x04),
        colorful: !!(model & 0x08),
        DC: !!(model & 0x10),
        night: !!(model & 0x20),
        anion: !!(model & 0x40),
        tvoc: !!(model & 0x80),
      }
    },
    onUnload() {
      clearTimeout(this.data.conTimer)
      clearTimeout(this.data.updateTimer)
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
      clearTimeout(this.data.updateTimer)
      const timer = setTimeout(() => {
        this.updateView()
      }, 300);
      this.setData({
        devStatus: status,
        updateTimer: timer
      })
    },
    bluetoothConnectChange(isConnected: boolean) {
      console.log('lmn>>>bluetoothConnectChange::isConnected=', isConnected)
      this.setData({
        isBLEConnected: isConnected,
      })
      this.updateViewEn()
    },
    updateView() {
      if (!this.data.isNeedUpdate) return
      const status = this.data.devStatus
      const btns = this.data.btnList
      const bottom = this.data.bottomList
      const gear = this.data.gearBtnConfig
      let isAllClose = true
      if (status.KITCHEN_WIND_STRONG != undefined) {
        gear.isTopOn = status.KITCHEN_WIND_STRONG
        if (status.KITCHEN_WIND_STRONG) isAllClose = false
      }
      if (status.KITCHEN_WIND_SOFT != undefined) {
        gear.isBottomOn = status.KITCHEN_WIND_SOFT
        if (status.KITCHEN_WIND_SOFT) isAllClose = false
      }
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].key === 'VENT') {
          if (status.BATH_VENTILATE != undefined) {
            btns[i].isOn = status.BATH_VENTILATE
            if (status.BATH_VENTILATE) isAllClose = false
          }
        } else if (btns[i].key === 'SWING') {
          if (status.BATH_SWING != undefined) {
            btns[i].isOn = status.BATH_SWING
          }
        } else if (btns[i].key === 'ANION') {
          if (status.BATH_ANION != undefined) {
            btns[i].isOn = status.BATH_ANION
          }
        }
      }
      bottom[0].isOn = !isAllClose
      if (status.BATH_LAMP != undefined) {
        bottom[1].isOn = status.BATH_LAMP
      }
      if (status.BATH_NIGHT_LAMP != undefined && bottom.length > 2) {
        bottom[2].isOn = status.BATH_NIGHT_LAMP
      }
      this.setData({
        gearBtnConfig: gear,
        btnList: btns,
        bottomList: bottom,
      })
      this.updateViewEn()
    },
    updateViewEn() {
      if (!this.data.isNeedUpdate) return
      const bottom = this.data.bottomList
      const btns = this.data.btnList
      const gear = this.data.gearBtnConfig
      const isDisable = !bottom[0].isOn && this.data.isBLEConnected
      gear.isEnable = !isDisable
      for (let i = 0; i < btns.length; i++) {
        btns[i].isEnable = !isDisable
      }
      this.setData({
        gearBtnConfig: gear,
        btnList: btns,
      })
    },
    onGearTopClick() {
      const config = this.data.gearBtnConfig
      if (!config.isEnable) return
      config.isTopOn = true
      config.isBottomOn = false
      this.setData({
        gearBtnConfig: config,
      })
      setTimeout(() => {
        config.isTopOn = false
        config.isBottomOn = false
        this.setData({
          gearBtnConfig: config,
        })
      }, 300)
      this.sendBluetoothCMD([CMD['KITCHEN_WIND_STRONG']])
    },
    onGearBottomClick() {
      const config = this.data.gearBtnConfig
      if (!config.isEnable) return
      config.isTopOn = false
      config.isBottomOn = true
      this.setData({
        gearBtnConfig: config,
      })
      setTimeout(() => {
        config.isTopOn = false
        config.isBottomOn = false
        this.setData({
          gearBtnConfig: config,
        })
      }, 300)
      this.sendBluetoothCMD([CMD['KITCHEN_WIND_SOFT']])
    },
    onBtnListClick(e: any) {
      const index = e.currentTarget.dataset.index
      const list = this.data.btnList
      const key = list[index].key
      if (!list[index].isEnable) {
        return
      }
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
      if (key === 'VENT') {
        this.sendBluetoothCMD([CMD['BATH_VENTILATE']])
      } else if (key === 'SWING') {
        this.sendBluetoothCMD([CMD['BATH_SWING']])
      } else if (key === 'ANION') {
        this.sendBluetoothCMD([CMD['BATH_ANION']])
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
      const lastPowerOn = list[0].isOn
      if (!this.data.isBLEConnected || lastPowerOn) {
        list[index].isOn = !list[index].isOn
        this.setData({
          bottomList: list,
        })
      }
      if (!this.data.isBLEConnected) {
        setTimeout(() => {
          list[index].isOn = false
          this.setData({
            bottomList: list,
          })
        }, 300)
      }
      if (list[index].key == 'POWER') {
        if (this.data.isBLEConnected && !lastPowerOn) {
          this.setData({
            isShowPopup: true,
          })
        } else {
          this.sendBluetoothCMD([CMD['BATH_ALL_OFF']])
        }
      } else if (list[index].key == 'LIGHT') {
        this.sendBluetoothCMD([CMD['BATH_LAMP']])
      } else if (list[index].key == 'NIGHT') {
        this.sendBluetoothCMD([CMD['BATH_NIGHT_LAMP']])
      }
    },
    onPopupSelect(e: any) {
      this.closePopup()
      const key = e.currentTarget.dataset.key
      if (key === 'HIGH') {
        this.sendBluetoothCMD([CMD['KITCHEN_WIND_STRONG']])
      } else if (key === 'LOW') {
        this.sendBluetoothCMD([CMD['KITCHEN_WIND_SOFT']])
      } else if (key === 'VENT') {
        this.sendBluetoothCMD([CMD['BATH_VENTILATE']])
      }
    },
    closePopup() {
      this.setData({
        isShowPopup: false,
      })
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
