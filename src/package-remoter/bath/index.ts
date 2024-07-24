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
    devFunDes: '',
    tempType: 1,
    curTemp: '--' as string | number,
    tempBtnConfig: {
      isSubOn: false,
      isSubEnable: true,
      isAddOn: false,
      isAddEnable: true,
    },
    gearBtnConfig: {
      isEnable: true,
      isTopOn: false,
      isBottomOn: false,
    },
    btnList: [
      {
        key: 'HEAT',
        name: '取暖',
        isOn: false,
        isEnable: true,
        isMode: true,
        gear: -1,
        iconOn: '/package-remoter/assets/newUI/lowHeatOn.png',
        iconOff: '/package-remoter/assets/newUI/lowHeatOff.png',
        level: -1,
      },
      {
        key: 'BATH',
        name: '安心沐浴',
        isOn: false,
        isEnable: true,
        isMode: true,
        gear: -1,
        iconOn: '/package-remoter/assets/newUI/bathOn.png',
        iconOff: '/package-remoter/assets/newUI/bathOff.png',
        level: -1,
      },
      {
        key: 'VENT',
        name: '换气',
        isOn: false,
        isEnable: true,
        isMode: true,
        gear: -1,
        iconOn: '/package-remoter/assets/newUI/ventOn.png',
        iconOff: '/package-remoter/assets/newUI/ventOff.png',
        level: -1,
      },
      {
        key: 'BLOW',
        name: '吹风',
        isOn: false,
        isEnable: true,
        isMode: true,
        gear: -1,
        iconOn: '/package-remoter/assets/newUI/blowOn.png',
        iconOff: '/package-remoter/assets/newUI/blowOff.png',
        level: -1,
      },
      {
        key: 'DRY',
        name: '干燥',
        isOn: false,
        isEnable: true,
        isMode: true,
        gear: -1,
        iconOn: '/package-remoter/assets/newUI/dryOn.png',
        iconOff: '/package-remoter/assets/newUI/dryOff.png',
        level: -1,
      },
      {
        key: 'SMELL',
        name: '异味感应',
        isOn: false,
        isEnable: true,
        isMode: false,
        gear: -1,
        iconOn: '/package-remoter/assets/newUI/smellOn.png',
        iconOff: '/package-remoter/assets/newUI/smellOff.png',
        level: -1,
      },
      {
        key: 'SWING',
        name: '摆风',
        isOn: false,
        isEnable: true,
        isMode: false,
        gear: -1,
        iconOn: '/package-remoter/assets/newUI/swingOn.png',
        iconOff: '/package-remoter/assets/newUI/swingOff.png',
        level: -1,
      },
      {
        key: 'ANION',
        name: '负离子',
        isOn: false,
        isEnable: true,
        isMode: false,
        gear: -1,
        iconOn: '/package-remoter/assets/newUI/anionOn.png',
        iconOff: '/package-remoter/assets/newUI/anionOff.png',
        level: -1,
      },
      // {
      //   key: 'DELAY',
      //   name: '延时关',
      //   isOn: false,
      //   isEnable: true,
      //   isMode: false,
      //   gear: -1,
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
    popSelectMode: [] as any[],
    conTimer: null as any,
    tryConnectCnt: 0,
    isShowLevelPopup: false,
    levelPopupOption: [
      { name: '高档', value: 3, isSelect: true },
      { name: '中档', value: 2, isSelect: false },
      { name: '低档', value: 1, isSelect: false },
    ],
    iconLevelB: [
      '/package-remoter/assets/newUI/level1.png',
      '/package-remoter/assets/newUI/level2.png',
      '/package-remoter/assets/newUI/level3.png'
    ],
    iconLevelW: [
      '/package-remoter/assets/newUI/level1_w.png',
      '/package-remoter/assets/newUI/level2_w.png',
      '/package-remoter/assets/newUI/level3_w.png'
    ]
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
      if (data.gearBtnConfig.isTopOn) arr.push('强暖')
      else if (data.gearBtnConfig.isBottomOn) arr.push('弱暖')
      for (let i = 0; i < list.length; i++) {
        if (list[i].isMode && list[i].isOn) {
          if (list[i].gear > 0) arr.push(`${list[i].name}${list[i].gear}档`)
          else arr.push(list[i].name)
        }
      }
      if (arr.length === 0) return '已连接'
      else return arr.join(' | ')
    },
  },
  methods: {
    goBack() {
      wx.navigateBack()
    },
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string, functionDes: string }) {
      console.log('lmn>>>query=', JSON.stringify(query))
      const { addr, deviceType, deviceModel, functionDes } = query
      remoterStore.setAddr(addr)
      console.log('lmn>>>curRemoter=', JSON.stringify(remoterStore.curRemoter))
      const isV2 = functionDes !== undefined && functionDes.length > 0
      this.setData({
        devType: deviceType,
        devModel: deviceModel,
        devAddr: addr,
        isNeedConnectBLE: remoterStore.curRemoter.version >= 2 || isV2,
        isNeedUpdate: remoterStore.curRemoter.version >= 2 || isV2,
        devStatus: remoterStore.curRemoter.deviceAttr || {},
        devFunDes: functionDes || ''
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
      const support = this.getFunSupport()
      console.log('lmn>>>support=', JSON.stringify(support))
      const btns = this.data.btnList
      const showBtns = []
      const popBtns = []
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].key === 'HEAT') {
          if (support.temperature) showBtns.push(btns[i])
        } else if (btns[i].key === 'SWING') {
          if (support.swing) showBtns.push(btns[i])
        } else if (btns[i].key === 'ANION') {
          if (support.anion) showBtns.push(btns[i])
        } else if (btns[i].key === 'SMELL') {
          if (support.smell) showBtns.push(btns[i])
        } else {
          showBtns.push(btns[i])
        }
        if (btns[i].isMode) popBtns.push(btns[i])
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
        tempType: support.temperature ? 1 : 2,
        btnList: showBtns,
        popSelectMode: popBtns,
        bottomList: showBottom,
      })
    },
    getFunSupport() {
      if (this.data.devFunDes.length > 0) {
        const funArr = []
        const funStr = this.data.devFunDes
        for (let i = 0; i < funStr.length; i += 2) {
          funArr.push(parseInt(funStr.slice(i, i + 2), 16))
        }
        let byte0 = {}
        if (funArr.length > 0) {
          byte0 = {
            temperature: !!(funArr[0] & 0x01),
            swing: !!(funArr[0] & 0x02),
            radar: !!(funArr[0] & 0x04),
            colorful: !!(funArr[0] & 0x08),
            DC: !!(funArr[0] & 0x10),
            night: !!(funArr[0] & 0x20),
            anion: !!(funArr[0] & 0x40),
          }
        }
        let byte1 = {}
        if (funArr.length > 1) {
          byte1 = {
            smell: !!(funArr[1] & 0x01)
          }
        }
        return {...byte0, ...byte1}
      }
      if (this.data.devModel === '') return {}
      const model = parseInt(this.data.devModel, 16)
      return {
        temperature: !!(model & 0x01),
        swing: !!(model & 0x02),
        radar: !!(model & 0x04),
        colorful: !!(model & 0x08),
        DC: !!(model & 0x10),
        night: !!(model & 0x20),
        anion: !!(model & 0x40),
        smell: !!(model & 0x80)
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
      const isV2 = this.data.devFunDes.length > 0
      const payload = remoterProtocol.generalCmdString(paramsArr, isV2)
      bleAdvertising(this.data._bleServer, {
        addr,
        payload,
        isFactory: this.data.isFactoryMode,
        debug: false,
        isV2,
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
      let status = {}
      if (this.data.devFunDes.length > 0) {
        status = remoterProtocol.parsePayloadV2(data.slice(this.data.devFunDes.length), this.data.devType)
      } else {
        status = remoterProtocol.parsePayload(data.slice(2), this.data.devType, this.data.devModel)
      }
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
      if (!this.data.isNeedUpdate) return
      const status = this.data.devStatus
      let temp = this.data.curTemp
      const btns = this.data.btnList
      const bottom = this.data.bottomList
      const gear = this.data.gearBtnConfig
      if (status.BATH_TEMPERATURE != undefined) {
        temp = this.tempLimit(status.BATH_TEMPERATURE)
      }
      let isAllClose = true
      if (this.data.tempType == 2) {
        if (status.BATH_WARM_STRONG != undefined) {
          gear.isTopOn = status.BATH_WARM_STRONG
          if (status.BATH_WARM_STRONG) isAllClose = false
        }
        if (status.BATH_WARM_SOFT != undefined) {
          gear.isBottomOn = status.BATH_WARM_SOFT
          if (status.BATH_WARM_SOFT) isAllClose = false
        }
      }
      let isShowTemp = false
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].key === 'HEAT') {
          if (status.BATH_WARM_UP != undefined) {
            btns[i].isOn = status.BATH_WARM_UP
            if (status.BATH_WARM_UP) {
              isAllClose = false
              isShowTemp = true
            }
          }
        } else if (btns[i].key === 'BATH') {
          if (status.BATH_AUTO != undefined) {
            btns[i].isOn = status.BATH_AUTO
            if (status.BATH_AUTO) {
              isAllClose = false
              isShowTemp = true
            }
          }
        } else if (btns[i].key === 'VENT') {
          if (status.BATH_VENTILATE != undefined) {
            btns[i].isOn = status.BATH_VENTILATE
            if (status.BATH_VENTILATE) isAllClose = false
          }
          if (status.VENT_GEAR != undefined) {
            btns[i].gear = status.VENT_GEAR
          }
        } else if (btns[i].key === 'BLOW') {
          if (status.BATH_WIND != undefined) {
            btns[i].isOn = status.BATH_WIND
            if (status.BATH_WIND) isAllClose = false
          }
          if (status.BLOW_GEAR != undefined) {
            btns[i].gear = status.BLOW_GEAR
          }
        } else if (btns[i].key === 'DRY') {
          if (status.BATH_DRY != undefined) {
            btns[i].isOn = status.BATH_DRY
            if (status.BATH_DRY) isAllClose = false
          }
        } else if (btns[i].key === 'SWING') {
          if (status.BATH_SWING != undefined) {
            btns[i].isOn = status.BATH_SWING
          }
        } else if (btns[i].key === 'ANION') {
          if (status.BATH_ANION != undefined) {
            btns[i].isOn = status.BATH_ANION
          }
        } else if (btns[i].key === 'SMELL') {
          if (status.BATH_SMELL != undefined) {
            btns[i].isOn = status.BATH_SMELL
            btns[i].level = status.SMELL_LEVEL || 0
          }
          const levelPopup = this.data.levelPopupOption
          levelPopup.forEach(item => {
            item.isSelect = item.value === btns[i].level
          });
          this.setData({
            levelPopupOption: levelPopup
          })
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
        curTemp: isShowTemp ? temp : '--',
        btnList: btns,
        bottomList: bottom,
        gearBtnConfig: gear,
      })
      this.updateViewEn()
    },
    tempLimit(val: number) {
      return val < 30 ? 30 : val > 42 ? 42 : val
    },
    updateViewEn() {
      if (!this.data.isNeedUpdate) return
      const bottom = this.data.bottomList
      const btns = this.data.btnList
      const tempConfig = this.data.tempBtnConfig
      if (this.data.isBLEConnected) {
        const isPowerOn = bottom[0].isOn
        let isCanTemp = false
        for (let i = 0; i < btns.length; i++) {
          btns[i].isEnable = isPowerOn
          if ((btns[i].key === 'HEAT' || btns[i].key === 'BATH') && btns[i].isOn && isPowerOn) isCanTemp = true
        }
        const curT = this.data.curTemp === '--' ? -1 : parseInt(`${this.data.curTemp}`)
        tempConfig.isAddEnable = isPowerOn && isCanTemp && curT < 42
        tempConfig.isSubEnable = isPowerOn && isCanTemp && curT > 30
      } else {
        for (let i = 0; i < btns.length; i++) {
          btns[i].isEnable = true
        }
        tempConfig.isAddEnable = true
        tempConfig.isSubEnable = true
      }
      this.setData({
        tempBtnConfig: tempConfig,
        btnList: btns,
      })
    },
    onTempAddClick() {
      const config = this.data.tempBtnConfig
      if (!config.isAddEnable) return
      config.isAddOn = true
      config.isSubOn = false
      this.setData({
        tempBtnConfig: config,
      })
      setTimeout(() => {
        config.isAddOn = false
        config.isSubOn = false
        this.setData({
          tempBtnConfig: config,
        })
      }, 300)
      this.sendBluetoothCMD([CMD['BATH_TEMPERATURE_ADD']])
    },
    onTempSubClick() {
      const config = this.data.tempBtnConfig
      if (!config.isSubEnable) return
      config.isAddOn = false
      config.isSubOn = true
      this.setData({
        tempBtnConfig: config,
      })
      setTimeout(() => {
        config.isAddOn = false
        config.isSubOn = false
        this.setData({
          tempBtnConfig: config,
        })
      }, 300)
      this.sendBluetoothCMD([CMD['BATH_TEMPERATURE_SUB']])
    },
    onGearTopClick() {
      const config = this.data.gearBtnConfig
      if (!config.isEnable) return
      config.isTopOn = true
      config.isBottomOn = false
      this.setData({
        gearBtnConfig: config,
      })
      if (!this.data.isBLEConnected) {
        setTimeout(() => {
          config.isTopOn = false
          config.isBottomOn = false
          this.setData({
            gearBtnConfig: config,
          })
        }, 300)
      }
      this.sendBluetoothCMD([CMD['BATH_WARM_STRONG']])
    },
    onGearBottomClick() {
      const config = this.data.gearBtnConfig
      if (!config.isEnable) return
      config.isTopOn = false
      config.isBottomOn = true
      this.setData({
        gearBtnConfig: config,
      })
      if (!this.data.isBLEConnected) {
        setTimeout(() => {
          config.isTopOn = false
          config.isBottomOn = false
          this.setData({
            gearBtnConfig: config,
          })
        }, 300)
      }
      this.sendBluetoothCMD([CMD['BATH_WARM_SOFT']])
    },
    onBtnListClick(e: any) {
      const index = e.currentTarget.dataset.index
      const list = this.data.btnList
      const key = list[index].key
      if (!list[index].isEnable) {
        return
      }
      if (key === 'SMELL') {
        this.setData({
          isShowLevelPopup: true
        })
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
      if (key === 'HEAT') {
        this.sendBluetoothCMD([CMD['BATH_WARM_UP']])
      } else if (key === 'BATH') {
        this.sendBluetoothCMD([CMD['BATH_AUTO']])
      } else if (key === 'VENT') {
        this.sendBluetoothCMD([CMD['BATH_VENTILATE']])
      } else if (key === 'BLOW') {
        this.sendBluetoothCMD([CMD['BATH_WIND']])
      } else if (key === 'DRY') {
        this.sendBluetoothCMD([CMD['BATH_DRY']])
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
      if (key === 'HEAT') {
        if (this.data.tempType === 1) this.sendBluetoothCMD([CMD['BATH_WARM_UP']])
        else this.sendBluetoothCMD([CMD['BATH_WARM_STRONG']])
      } else if (key === 'BATH') {
        this.sendBluetoothCMD([CMD['BATH_AUTO']])
      } else if (key === 'VENT') {
        this.sendBluetoothCMD([CMD['BATH_VENTILATE']])
      } else if (key === 'BLOW') {
        this.sendBluetoothCMD([CMD['BATH_WIND']])
      } else if (key === 'DRY') {
        this.sendBluetoothCMD([CMD['BATH_DRY']])
      }
    },
    onPopupLevelSelect(e: any) {
      this.closePopup()
      const val = e.currentTarget.dataset.value
      const option = this.data.levelPopupOption
      option.forEach(item => {
        item.isSelect = item.value === val
      });
      this.setData({
        levelPopupOption: option
      })
      this.sendBluetoothCMD([CMD['BATH_SMELL'], val])
    },
    closePopup() {
      this.setData({
        isShowPopup: false,
        isShowLevelPopup: false
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
