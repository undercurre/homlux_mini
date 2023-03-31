import { observable, runInAction } from 'mobx-miniprogram'
import { BleClient, unique, bleUtil } from '../../utils/index'
import { roomBinding, deviceBinding } from '../../store/index'
import { checkDevice } from '../../apis/index'

let _foundList = [] as IBleBaseInfo[]

console.info('bleDevicesStore')
export const bleDevicesStore = observable({
  bleDeivceList: [] as IBleDevice[],

  startBleDiscovery() {
    runInAction(() => {
      this.bleDeivceList = []

      _foundList = []
    })

    // 监听扫描到新设备事件
    wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
      res.devices = unique(res.devices, 'deviceId') as WechatMiniprogram.BlueToothDevice[] // 去重

      const deviceList = res.devices
        .filter((item) => {
          const foundItem = bleDevicesStore.bleDeivceList.find((foundItem) => foundItem.deviceUuid === item.deviceId)

          if (foundItem) {
            foundItem.RSSI = item.RSSI
            foundItem.signal = getSignalFlag(item.RSSI)

            runInAction(() => {
              bleDevicesStore.bleDeivceList = bleDevicesStore.bleDeivceList.concat([])
            })
          }
          // localName为homlux_ble且过滤【发现过的】&&【处于未配网】的设备
          return item.localName && item.localName.includes('homlux_ble') && !foundItem
        })
        .map((item) => getBleDeviceBaseInfo(item))
      // 过滤已经配网的设备
      // 设备网络状态 0x00：未入网   0x01：正在入网   0x02:  已经入网
      // 但由于丢包情况，设备本地状态不可靠，需要查询云端是否存在该设备的绑定状态（是否存在家庭绑定关系）结合判断是否真正配网

      deviceList.forEach(async (item) => {
        // 配网状态没变化的同一设备不再查询
        if (
          _foundList.find(
            (foundItem) => foundItem.deviceUuid === item.deviceUuid && foundItem.isConfig === item.isConfig,
          )
        ) {
          return
        }

        console.log('getBleDeviceBaseInfo', item.mac, item)
        _foundList.push(item)
        handleBleDeviceInfo(item)
      })
    })

    lightNum = deviceBinding.store.allRoomDeviceList.filter((item) => item.proType === '0x13').length // 灯数量
    panelNum = deviceBinding.store.allRoomDeviceList.filter((item) => item.proType === '0x21').length // 面板数

    // 开始搜寻附近的蓝牙外围设备
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      powerLevel: 'high',
      interval: 3000,
      success(res) {
        console.log('startBluetoothDevicesDiscovery', res)
      },
    })
  },

  stopBLeDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
    wx.offBluetoothDeviceFound()
  },
})

export const bleDevicesBinding = {
  store: bleDevicesStore,
  fields: ['bleDeivceList'],
  actions: [],
}

let lightNum = 0 // 灯数量
let panelNum = 0 // 面板数

function getBleDeviceBaseInfo(bleDevice: WechatMiniprogram.BlueToothDevice): IBleBaseInfo {
  const msgObj = bleUtil.transferBroadcastData(bleDevice.advertisData)

  const { RSSI } = bleDevice
  const signal = getSignalFlag(RSSI)

  return {
    ...msgObj,
    deviceUuid: bleDevice.deviceId,
    RSSI: bleDevice.RSSI,
    signal,
  }
}

function getSignalFlag(RSSI: number) {
  return RSSI > -80 ? (RSSI > -70 ? 'strong' : 'normal') : 'weak'
}

async function handleBleDeviceInfo(baseInfo: IBleBaseInfo) {
  const infoRes = await checkDevice({
    mac: baseInfo.zigbeeMac,
  })

  if (!infoRes.success) {
    console.error(`${baseInfo.mac}校验接口调用失败`)
    return
  }

  // 1、存在接口查询过程，过滤期间重复添加的设备
  // 2、过滤云端存在绑定关系且设备本地状态为02的设备
  if (
    bleDevicesStore.bleDeivceList.find((foundItem) => foundItem.deviceUuid === baseInfo.deviceUuid) ||
    (infoRes.result.roomId && baseInfo.isConfig === '02')
  ) {
    return
  }

  let { productName: deviceName } = infoRes.result
  const { proType } = infoRes.result
  const { switchNum } = infoRes.result

  if (proType === '0x21') {
    ++panelNum
    deviceName += panelNum > 1 ? panelNum : ''
    // deviceName += (panelNum > 1 ? strUtil.encodeS(panelNum) : '')
  } else if (proType === '0x13') {
    ++lightNum
    deviceName += lightNum > 1 ? lightNum : ''
  }

  const bleDevice: IBleDevice = {
    proType: proType,
    deviceUuid: baseInfo.deviceUuid,
    mac: baseInfo.mac,
    signal: baseInfo.signal,
    RSSI: baseInfo.RSSI,
    zigbeeMac: baseInfo.zigbeeMac,
    isConfig: baseInfo.isConfig,
    icon: infoRes.result.deviceIcon || '/assets/img/device/gateway.png',
    name: deviceName + `-${baseInfo.mac.substr(-4)}`,
    isChecked: false,
    client: new BleClient({ mac: baseInfo.mac, deviceUuid: baseInfo.deviceUuid }),
    roomId: roomBinding.store.currentRoom.roomId,
    roomName: roomBinding.store.currentRoom.roomName,
    switchList: [],
    status: 'waiting',
    requestTimes: 20,
    requesting: false,
    zigbeeRepeatTimes: 2,
  }

  // 面板需要显示按键信息编辑
  if (switchNum > 1 && bleDevice.proType === '0x21') {
    bleDevice.switchList = new Array(switchNum).fill('').map((_item, index) => {
      const num = index + 1
      return {
        switchId: num.toString(),
        switchName: `按键${num}`,
      }
    })
  }

  console.log('bleDevice', JSON.stringify(bleDevice))

  bleDevicesStore.bleDeivceList.push(bleDevice)

  runInAction(() => {
    bleDevicesStore.bleDeivceList = bleDevicesStore.bleDeivceList.concat([])
  })
}

export interface IBleDevice {
  proType: string // 品类码
  deviceUuid: string
  mac: string
  signal: string
  RSSI: number
  zigbeeMac: string
  isConfig: string
  name: string
  roomId: string
  roomName: string
  icon: string
  switchList: ISwitch[]
  client: BleClient
  status: 'waiting' | 'fail' | 'success' // 配网状态
  isChecked: boolean // 是否被选中
  requestTimes: number // 查询云端在线次数
  requesting: boolean
  zigbeeRepeatTimes: number // 配网自动重试次数
}

export interface ISwitch {
  switchId: string
  switchName: string
}

export interface IBleBaseInfo {
  deviceUuid: string
  RSSI: number
  signal: string
  brand: string
  isConfig: string
  mac: string
  zigbeeMac: string
  deviceCategory: string
  deviceModel: string
  version: string
  protocolVersion: string
}
