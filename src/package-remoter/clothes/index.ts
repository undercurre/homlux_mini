import { ComponentWithComputed } from 'miniprogram-computed'
import { CMD, FACTORY_ADDR } from '../../config/remoter'
import { initBleCapacity } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import { createBleServer, bleAdvertising, BleService } from '../../utils/remoterUtils'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
import { hideLoading, showLoading } from '../../utils/system'
import dataBus from '../utils/dataBus'
import Toast from '@vant/weapp/toast/toast'
import { emitter } from '../../utils/index'

const minuteArr = []
for (let i = 0; i <= 180; i+=5) {
  minuteArr.push(i)
}

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] })],
  data: {
    isFactoryMode: false,
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
        key: 'ONEKEY',
        name: '一键晾衣',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/oneKeyOn.png',
        iconOff: '/package-remoter/assets/newUI/oneKeyOff.png',
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
        key: 'DELAY',
        name: '延时关',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/delayOn.png',
        iconOff: '/package-remoter/assets/newUI/delayOff.png',
      },
      {
        key: 'DIS',
        name: '消毒',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/disOn.png',
        iconOff: '/package-remoter/assets/newUI/disOff.png',
      },
      {
        key: 'WIND',
        name: '风干',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/windDryOn.png',
        iconOff: '/package-remoter/assets/newUI/windDryOff.png',
      },
      {
        key: 'HEAT',
        name: '烘干',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/heatDryOn.png',
        iconOff: '/package-remoter/assets/newUI/heatDryOff.png',
      }
    ],
    bottomList: [
      {
        key: 'LIGHT',
        name: '照明',
        isOn: false,
        isEnable: true,
        iconOn: '/package-remoter/assets/newUI/lightOn.png',
        iconOff: '/package-remoter/assets/newUI/lightOff.png',
      }
    ],
    curAction: '',
    curBrightnessPercent: 20,
    isShowPopup: false,
    conTimer: null as any,
    tryConnectCnt: 0,
    isShowTimePicker: false,
    minuteArr,
    curTimePickerIndex: [0],
    pickerIndexTemp: [0],
    curOneKeyHeight: 0
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
      dataBus.emit('DEVSTATUS', temp)
    },
  },
  computed: {
    connectedColor(data) {
      return data.isBLEConnected ? '#25CF42' : '#979EAD'
    },
    connectedText(data) {
      if (data.curAction) return data.curAction
      if (!data.isBLEConnected) return '未连接'
      return '已连接'
    }
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

      dataBus.on('DEVSEND', (cmd) => {
        this.sendBluetoothCMD(cmd as number[])
      })

      const bleInited = await initBleCapacity()
      if (!bleInited) {
        return
      }
      // 建立BLE外围设备服务端
      this.data._bleServer = await createBleServer()
      if (this.data.isNeedConnectBLE) this.start()

      this.getAccessCount()
    },
    configBtns() {
      const support = this.getFunSupport()
      console.log('lmn>>>support=', JSON.stringify(support))
      const btns = this.data.btnList
      const showBtns = []
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].key === 'ONEKEY') {
          if (support.oneKey) showBtns.push(btns[i])
        } else if (btns[i].key === 'BRI') {
          if (support.bright) showBtns.push(btns[i])
        } else if (btns[i].key === 'DELAY') {
          if (support.delay) showBtns.push(btns[i])
        } else if (btns[i].key === 'DIS') {
          if (support.disinfect) showBtns.push(btns[i])
        } else if (btns[i].key === 'WIND') {
          if (support.wind) showBtns.push(btns[i])
        } else if (btns[i].key === 'HEAT') {
          if (support.heat) showBtns.push(btns[i])
        } else {
          showBtns.push(btns[i])
        }
      }
      this.setData({
        btnList: showBtns,
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
            oneKey: true,
            bright: true,
            delay: true,
            disinfect: !!(funArr[0] & 0x01),
            wind: !!(funArr[0] & 0x02),
            heat: !!(funArr[0] & 0x02),
            voice: !!(funArr[0] & 0x04),
          }
        }
        return {...byte0}
      }
      return {
        oneKey: true,
        bright: true,
        delay: true,
        disinfect: false,
        wind: false,
        heat: false,
        voice: false
      }
    },
    onUnload() {
      dataBus.all.clear()
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
        isV2
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
        const isV2 = this.data.devFunDes.length > 0
        const payload = remoterProtocol.generalCmdString(paramsArr, isV2, true)
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
      let status = {}
      if (this.data.devFunDes.length > 0) {
        status = remoterProtocol.parsePayloadV2(data.slice(this.data.devFunDes.length), this.data.devType)
      } else {
        status = remoterProtocol.parsePayload(data.slice(2), this.data.devType, this.data.devModel)
      }
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
      dataBus.emit('DEVSTATUS', status)
    },
    bluetoothConnectChange(isConnected: boolean) {
      console.log('lmn>>>bluetoothConnectChange::isConnected=', isConnected)
      this.setData({
        isBLEConnected: isConnected,
      })
    },
    updateView() {
      if (!this.data.isNeedUpdate) return
      const status = this.data.devStatus
      const btns = this.data.btnList
      const bottom = this.data.bottomList
      const gear = this.data.gearBtnConfig
      let timeIndex = this.data.curTimePickerIndex
      let action = ''
      let percent = this.data.curBrightnessPercent
      if (status.CLOTHES_LIGHT != undefined) {
        bottom[0].isOn = status.CLOTHES_LIGHT
      }
      if (status.CLOTHES_ACTION !== undefined) {
        gear.isTopOn = false
        gear.isMiddleOn = false
        gear.isBottomOn = false
        if (status.CLOTHES_ACTION === 1) {
          gear.isTopOn = true
          action = '上升中'
        } else if (status.CLOTHES_ACTION === 2) {
          gear.isBottomOn = true
          action = '下降中'
        } else if (status.CLOTHES_ACTION === 0) {
          if (status.CLOTHES_MOTOR_LOCATION !== undefined) {
            if (status.CLOTHES_MOTOR_LOCATION === 1 || status.CLOTHES_MOTOR_LOCATION === 2) gear.isMiddleOn = false
            else gear.isMiddleOn = true
          } else gear.isMiddleOn = true
          action = '已暂停'
        }
      }
      if (status.CLOTHES_MOTOR_LOCATION !== undefined) {
        if (status.CLOTHES_MOTOR_LOCATION === 1) action = '已到顶'
        else if (status.CLOTHES_MOTOR_LOCATION === 2) action = '已到底'
      }
      if (status.CLOTHES_ONE_KEY != undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'ONEKEY') {
            btns[i].isOn = status.CLOTHES_ONE_KEY
            break
          }
        }
      }
      if (status.CLOTHES_DELAY_LIGHT_TIME != undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'DELAY') {
            btns[i].isOn = status.CLOTHES_DELAY_LIGHT_TIME > 0
            if (status.CLOTHES_DELAY_LIGHT_TIME > 0) {
              const hour = Math.floor(status.CLOTHES_DELAY_LIGHT_TIME / 60)
              const min = status.CLOTHES_DELAY_LIGHT_TIME % 60
              btns[i].name = `剩余${hour >= 10 ? '' : '0'}${hour}:${min >= 10 ? '' : '0'}${min}`
            } else {
              btns[i].name = '延迟关'
            }
            break
          }
        }
        if (!this.data.isShowTimePicker) {
          const minute = status.CLOTHES_DELAY_LIGHT_TIME > 180 ? 180 : status.CLOTHES_DELAY_LIGHT_TIME
          timeIndex = [Math.floor(minute / 5)]
        }
      }
      if (status.CLOTHES_WIND_DRY !== undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'WIND') {
            btns[i].isOn = status.CLOTHES_WIND_DRY
            if (status.CLOTHES_WIND_TIME > 0) {
              const hour = Math.floor(status.CLOTHES_WIND_TIME / 60)
              const min = status.CLOTHES_WIND_TIME % 60
              btns[i].name = `剩余${hour >= 10 ? '' : '0'}${hour}:${min >= 10 ? '' : '0'}${min}`
            } else {
              btns[i].name = '风干'
            }
            break
          }
        }
      }
      if (status.CLOTHES_HEAT_DRY !== undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'HEAT') {
            btns[i].isOn = status.CLOTHES_HEAT_DRY
            if (status.CLOTHES_HEAT_TIME > 0) {
              const hour = Math.floor(status.CLOTHES_HEAT_TIME / 60)
              const min = status.CLOTHES_HEAT_TIME % 60
              btns[i].name = `剩余${hour >= 10 ? '' : '0'}${hour}:${min >= 10 ? '' : '0'}${min}`
            } else {
              btns[i].name = '烘干'
            }
            break
          }
        }
      }
      if (status.CLOTHES_DIS !== undefined) {
        for (let i = 0; i < btns.length; i++) {
          if (btns[i].key === 'DIS') {
            btns[i].isOn = status.CLOTHES_DIS
            if (status.CLOTHES_DIS_TIME > 0) {
              const hour = Math.floor(status.CLOTHES_DIS_TIME / 60)
              const min = status.CLOTHES_DIS_TIME % 60
              btns[i].name = `剩余${hour >= 10 ? '' : '0'}${hour}:${min >= 10 ? '' : '0'}${min}`
            } else {
              btns[i].name = '消毒'
            }
            break
          }
        }
      }

      if (status.CLOTHES_BRIGHT !== undefined) {
        percent = status.CLOTHES_BRIGHT < 20 ? 20 : status.CLOTHES_BRIGHT > 100 ? 100 : status.CLOTHES_BRIGHT
      }

      if (status.CLOTHES_SET_HEIGHT !== undefined) {
        this.setData({
          curOneKeyHeight: status.CLOTHES_SET_HEIGHT
        })
      }
      
      this.setData({
        gearBtnConfig: gear,
        btnList: btns,
        bottomList: bottom,
        curAction: action,
        curTimePickerIndex: timeIndex,
        curBrightnessPercent: percent
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
      this.sendBluetoothCMD([CMD['CLOTHES_UP']], 'CLOTHES_UP')
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
      this.sendBluetoothCMD([CMD['CLOTHES_DOWN']], 'CLOTHES_DOWN')
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
      this.sendBluetoothCMD([CMD['CLOTHES_PAUSE']], 'CLOTHES_PAUSE')
    },
    onBtnListClick(e: any) {
      const index = e.currentTarget.dataset.index
      const list = this.data.btnList
      const key = list[index].key
      if (!list[index].isEnable) {
        return
      }
      const lastIsOn = list[index].isOn
      if (key === 'ONEKEY' || key === 'DIS' || key === 'WIND' || key === 'HEAT') {
        if (key === 'ONEKEY' && this.data.curOneKeyHeight === 0) {
          Toast('请先设置一键晾衣高度');
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
      }
      if (key === 'BRI') {
        this.setData({
          isShowPopup: true
        })
      } else if (key === 'ONEKEY') {
        this.sendBluetoothCMD([CMD['CLOTHES_ONE_KEY']], 'CLOTHES_ONE_KEY')
      } else if (key === 'DELAY') {
        this.setData({
          isShowTimePicker: true,
          pickerIndexTemp: this.data.curTimePickerIndex
        })
      } else if (key === 'DIS') {
        this.sendBluetoothCMD([CMD['CLOTHES_DIS']], 'CLOTHES_DIS')
      } else if (key === 'WIND') {
        const val = lastIsOn ? 0 : 1
        this.sendBluetoothCMD([CMD['CLOTHES_DRY_MODE'], val], 'CLOTHES_DRY_MODE')
      } else if (key === 'HEAT') {
        const val = lastIsOn ? 0 : 2
        this.sendBluetoothCMD([CMD['CLOTHES_DRY_MODE'], val], 'CLOTHES_DRY_MODE')
      }
    },
    goToDevManage() {
      setTimeout(() => {
        dataBus.emit('DEVSTATUS', this.data.devStatus)
      }, 500);
      wx.navigateTo({
        url: `/package-remoter/setting/index?addr=${this.data.devAddr}&deviceType=${this.data.devType}&deviceModel=${this.data.devModel}&&functionDes=${this.data.devFunDes}`,
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
      if (list[index].key == 'LIGHT') {
        this.sendBluetoothCMD([CMD['CLOTHES_LIGHT']], 'CLOTHES_LIGHT')
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
        curBrightnessPercent: value
      })
      this.sendBluetoothCMD([CMD['CLOTHES_BRIGHT'], this.data.curBrightnessPercent], 'CLOTHES_BRIGHT')
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
        const minute = this.data.minuteArr[this.data.curTimePickerIndex[0]]
        this.sendBluetoothCMD([CMD['CLOTHES_DELAY_LIGHT_TIME'], minute], 'CLOTHES_DELAY_LIGHT_TIME')
      }, 1200);
    },
    getAccessCount() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this
      wx.batchGetStorage({
        keyList: ['REMOTERTOTALACCESS', 'REMOTERDAYACCESS', 'REMOTERMONTHACCESS'],
        success (res: any) {
          const list = res.dataList
          if (list.length < 3) return
          wx.reportEvent("remoter_live", {
            "rm_month_access": parseInt(list[2]),
            "rm_day_access": parseInt(list[1]),
            "rm_total_access": parseInt(list[0]),
            "rm_live_type": "access",
            "rm_device_type": that.data.devType,
          })
        }
      })
    },
  },
})
