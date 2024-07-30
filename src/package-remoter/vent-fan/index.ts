import { ComponentWithComputed } from 'miniprogram-computed'
import { CMD, FACTORY_ADDR } from '../../config/remoter'
import { initBleCapacity } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import { createBleServer, bleAdvertising, BleService } from '../../utils/remoterUtils'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
import { hideLoading, showLoading } from '../../utils/system'
// import Toast from '@vant/weapp/toast/toast'

const minuteArr = []
for (let i = 0; i <= 24; i += 0.5) {
  minuteArr.push(i)
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
    isNeedUpdate: false,
    devType: '',
    devModel: '',
    devAddr: '',
    devFunDes: '',
    gearBtnConfig: {
      isEnable: true,
      isTopOn: false,
      isMiddleOn: false,
      isBottomOn: false,
    },
    btnList: [
      {
        key: 'DELAY',
        name: '定时关',
        isOn: false,
        isEnable: true,
        isMode: false,
        iconOn: '/package-remoter/assets/newUI/delayOn.png',
        iconOff: '/package-remoter/assets/newUI/delayOff.png',
      }
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
    ],
    isShowTimePicker: false,
    minuteArr,
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
      if (!data.isBLEConnected) return '未连接'
      const list = data.btnList
      const arr = []
      if (data.gearBtnConfig.isTopOn) arr.push('1档')
      else if (data.gearBtnConfig.isMiddleOn) arr.push('2档')
      else if (data.gearBtnConfig.isBottomOn) arr.push('3档')
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
      // this.configBtns()
      this.updateView()

      const bleInited = await initBleCapacity()
      if (!bleInited) {
        return
      }
      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()
      if (this.data.isNeedConnectBLE) this.start()
    },
    configBtns() {},
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
        const isV2 = this.data.devFunDes.length > 0
        const payload = remoterProtocol.generalCmdString(paramsArr, isV2, true)
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
        devStatus: status
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
      const btns = this.data.btnList
      const bottom = this.data.bottomList
      const gear = this.data.gearBtnConfig
      if (status.FAN_GEAR != undefined) {
        gear.isTopOn = false
        gear.isMiddleOn = false
        gear.isBottomOn = false
        if (status.FAN_GEAR === 1) gear.isTopOn = true
        else if (status.FAN_GEAR === 2) gear.isMiddleOn = true
        else if (status.FAN_GEAR === 3) gear.isBottomOn = true
      }
      if (status.FAN_SWITCH != undefined) {
        bottom[0].isOn = status.FAN_SWITCH
      }
      let timeIndex = this.data.curTimePickerIndex
      if (status.FAN_DELAY_OFF_MIN != undefined) {
        const hour = Math.floor(status.FAN_DELAY_OFF_MIN / 60)
        const min = status.FAN_DELAY_OFF_MIN % 60
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'DELAY') {
            btns[i].isOn = status.FAN_DELAY_OFF_MIN > 0
            if (status.FAN_DELAY_OFF_MIN > 0) {
              btns[i].name = `剩余${hour >= 10 ? '' : '0'}${hour}:${min >= 10 ? '' : '0'}${min}`
            } else {
              btns[i].name = '定时关'
            }
            break
          }
        }
        if (!this.data.isShowTimePicker) {
          timeIndex = [hour * 2 + (min >= 30 ? 1 : 0)]
        }
      }
      this.setData({
        gearBtnConfig: gear,
        btnList: btns,
        bottomList: bottom,
        curTimePickerIndex: timeIndex,
      })
      this.updateViewEn()
    },
    updateViewEn() {
      if (!this.data.isNeedUpdate) return
      const bottom = this.data.bottomList
      const btns = this.data.btnList
      const gear = this.data.gearBtnConfig
      if (this.data.isBLEConnected) {
        const isPowerOn = bottom[0].isOn
        for (let i = 0; i < btns.length; i++) {
          btns[i].isEnable = isPowerOn
        }
        gear.isEnable = isPowerOn
      } else {
        for (let i = 0; i < btns.length; i++) {
          btns[i].isEnable = true
        }
        gear.isEnable = true
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
      config.isMiddleOn = false
      config.isBottomOn = false
      this.setData({
        gearBtnConfig: config,
      })
      if (!this.data.isBLEConnected) {
        setTimeout(() => {
          config.isTopOn = false
          config.isMiddleOn = false
          config.isBottomOn = false
          this.setData({
            gearBtnConfig: config,
          })
        }, 300)
      }
      this.sendBluetoothCMD([CMD['FAN_GEAR'], 1])
    },
    onGearMiddleClick() {
      const config = this.data.gearBtnConfig
      if (!config.isEnable) return
      config.isTopOn = false
      config.isMiddleOn = true
      config.isBottomOn = false
      this.setData({
        gearBtnConfig: config,
      })
      if (!this.data.isBLEConnected) {
        setTimeout(() => {
          config.isTopOn = false
          config.isMiddleOn = false
          config.isBottomOn = false
          this.setData({
            gearBtnConfig: config,
          })
        }, 300)
      }
      this.sendBluetoothCMD([CMD['FAN_GEAR'], 2])
    },
    onGearBottomClick() {
      const config = this.data.gearBtnConfig
      if (!config.isEnable) return
      config.isTopOn = false
      config.isMiddleOn = false
      config.isBottomOn = true
      this.setData({
        gearBtnConfig: config,
      })
      if (!this.data.isBLEConnected) {
        setTimeout(() => {
          config.isTopOn = false
          config.isMiddleOn = false
          config.isBottomOn = false
          this.setData({
            gearBtnConfig: config,
          })
        }, 300)
      }
      this.sendBluetoothCMD([CMD['FAN_GEAR'], 3])
    },
    onBtnListClick(e: any) {
      const index = e.currentTarget.dataset.index
      const list = this.data.btnList
      const key = list[index].key
      if (!list[index].isEnable) {
        return
      }
      if (key === 'DELAY') {
        this.setData({
          isShowTimePicker: true
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
        this.sendBluetoothCMD([CMD['FAN_SWITCH']])
      }
    },
    closePopup() {
      this.setData({
        isShowTimePicker: false,
      })
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
    onPickTimeConfirm() {
      showLoading('加载中')
      setTimeout(() => {
        hideLoading()
        this.closePopup()
        const minute = this.data.minuteArr[this.data.curTimePickerIndex[0]] * 60
        const HByte = Math.floor(minute / 256)
        const LByte = minute % 256
        this.sendBluetoothCMD([CMD['FAN_DELAY_OFF_MIN'], HByte, LByte])
      }, 500);
    },
  },
})
