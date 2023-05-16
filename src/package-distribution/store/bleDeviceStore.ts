import { observable, runInAction } from 'mobx-miniprogram'
import { BleClient, unique, bleUtil, Loggger } from '../../utils/index'
import { roomBinding, deviceBinding } from '../../store/index'
import { checkDevice } from '../../apis/index'

let _foundList = [] as IBleBaseInfo[]

export const bleDevicesStore = observable({
  available: false, // 是否打开蓝牙开关

  discovering: false, // 是否正在搜索蓝牙

  isStart: false, // 业务字段，标志是否开始了发现蓝牙设备流程，用于蓝牙开关被中途关掉（会终止蓝牙搜索）又打开的情况，恢复蓝牙搜索状态

  bleDeviceList: [] as IBleDevice[],

  // todo: 测试数据
  // bleDeviceList: JSON.parse('[{"proType":"0x13","deviceUuid":"1C:34:F1:5D:BD:A7","mac":"1C34F15DBDA7","signal":"strong","RSSI":-58,"zigbeeMac":"1C34F1FFFE5DBDA7","isConfig":"00","icon":"https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/midea.hlight.002.001.png","productId":"midea.hlight.002.001","name":"睿铂灯带","isChecked":false,"client":{"key":"midea@homluxBDA7","isConnected":false,"serviceId":"BAE55B96-7D19-458D-970C-50613D801BC9","characteristicId":"","msgId":0,"mac":"1C34F15DBDA7","deviceUuid":"1C:34:F1:5D:BD:A7"},"roomId":"dead9933c2c447538ec26f6c55f1cd84","roomName":"主卧","switchList":[],"status":"waiting","requesting":false},{"proType":"0x21","deviceUuid":"04:CD:15:AE:9E:28","mac":"04CD15AE9E28","signal":"normal","RSSI":-74,"zigbeeMac":"04CD15FFFEAE9E28","isConfig":"02","icon":"https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/1-1.png","productId":"midea.mfswitch.005.003","name":"一路面板","isChecked":false,"client":{"key":"midea@homlux9E28","isConnected":false,"serviceId":"BAE55B96-7D19-458D-970C-50613D801BC9","characteristicId":"","msgId":0,"mac":"04CD15AE9E28","deviceUuid":"04:CD:15:AE:9E:28"},"roomId":"dead9933c2c447538ec26f6c55f1cd84","roomName":"主卧","switchList":[],"status":"waiting","requesting":false},{"proType":"0x13","deviceUuid":"1C:34:F1:54:02:5D","mac":"1C34F154025D","signal":"weak","RSSI":-81,"zigbeeMac":"1C34F1FFFE54025D","isConfig":"02","icon":"https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/midea.hlight.002.001.png","productId":"midea.hlight.002.001","name":"睿铂灯带2","isChecked":false,"client":{"key":"midea@homlux025D","isConnected":false,"serviceId":"BAE55B96-7D19-458D-970C-50613D801BC9","characteristicId":"","msgId":0,"mac":"1C34F154025D","deviceUuid":"1C:34:F1:54:02:5D"},"roomId":"dead9933c2c447538ec26f6c55f1cd84","roomName":"主卧","switchList":[],"status":"waiting","requesting":false}]') as IBleDevice[],

  startBleDiscovery() {
    if (this.discovering) {
      Loggger.error('已经正在搜索蓝牙')
      return
    }

    runInAction(() => {
      this.isStart = true
    })
    // 监听扫描到新设备事件
    wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
      res.devices = unique(res.devices, 'deviceId') as WechatMiniprogram.BlueToothDevice[] // 去重

      const deviceList = res.devices
        .filter((item) => {
          const foundItem = bleDevicesStore.bleDeviceList.find((foundItem) => foundItem.deviceUuid === item.deviceId)

          if (foundItem) {
            const baseInfo = getBleDeviceBaseInfo(item)
            foundItem.RSSI = baseInfo.RSSI
            foundItem.signal = baseInfo.signal
            foundItem.isConfig = baseInfo.isConfig

            runInAction(() => {
              bleDevicesStore.bleDeviceList = bleDevicesStore.bleDeviceList.concat([])
            })
          }
          // localName为homlux_ble且过滤【已经显示在列表的】、【蓝牙信号值低于-90】的设备
          return item.localName && item.localName.includes('homlux_ble') && !foundItem && item.RSSI > -90
        })
        .map((item) => getBleDeviceBaseInfo(item))
      // 过滤已经配网的设备
      // 设备网络状态 0x00：未入网   0x01：正在入网   0x02:  已经入网
      // 但由于丢包情况，设备本地状态不可靠，需要查询云端是否存在该设备的绑定状态（是否存在家庭绑定关系）结合判断是否真正配网

      deviceList.forEach(async (item) => {
        // 设备配网状态没变化的同一设备不再查询，防止重复查询同一设备的云端信息接口
        if (
          _foundList.find(
            (foundItem) => foundItem.deviceUuid === item.deviceUuid && foundItem.isConfig === item.isConfig,
          )
        ) {
          return
        }

        _foundList.push(item)
        handleBleDeviceInfo(item)
      })
    })

    // 开始搜寻附近的蓝牙外围设备
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      powerLevel: 'high',
      interval: 3000,
      success(res) {
        Loggger.log('startBluetoothDevicesDiscovery, allowDuplicatesKey: true', res)
      },
    })
  },

  stopBLeDiscovery() {
    wx.stopBluetoothDevicesDiscovery()
    wx.offBluetoothDeviceFound()
    runInAction(() => {
      this.isStart = false
    })
  },

  reset() {
    Loggger.log('重置蓝牙store')
    const systemSetting = wx.getSystemSetting()

    runInAction(() => {
      this.bleDeviceList = []

      this.discovering = false
      this.available = systemSetting.bluetoothEnabled
    })

    _foundList = []

    wx.offBluetoothAdapterStateChange()

    wx.onBluetoothAdapterStateChange((res) => {
      Loggger.log('onBluetoothAdapterStateChange-store', res)

      runInAction(() => {
        bleDevicesStore.discovering = res.discovering
        bleDevicesStore.available = res.available

        if (this.isStart && !res.discovering) {
          wx.startBluetoothDevicesDiscovery({
            allowDuplicatesKey: true,
            powerLevel: 'high',
            interval: 3000,
            success() {
              Loggger.log('restartBluetoothDevicesDiscovery')
            },
          })
        }
      })
    })
  },

  updateBleDeviceList() {
    runInAction(() => {
      this.bleDeviceList = this.bleDeviceList.concat([])
    })
  },

  // 清除缓存信息
  clearCache() {
    _foundList = []
  },
})

export const bleDevicesBinding = {
  store: bleDevicesStore,
  fields: ['discovering', 'available', 'bleDeviceList'],
  actions: [],
}

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
    Loggger.error(`设备${baseInfo.mac}云端不存在注册记录`)
    return
  }

  // 1、存在接口查询过程，过滤期间重复添加的设备
  // 2、过滤云端存在房间绑定关系且设备本地状态为02(已绑定状态)的设备
  if (
    bleDevicesStore.bleDeviceList.find((foundItem) => foundItem.deviceUuid === baseInfo.deviceUuid) ||
    (infoRes.result.roomId && baseInfo.isConfig === '02')
  ) {
    Loggger.log(`${infoRes.result.productName}：${baseInfo.mac}已绑定`)
    return
  }

  let { productName: deviceName } = infoRes.result
  const { proType, switchNum, modelId, productIcon } = infoRes.result

  Loggger.log(`成功发现${deviceName}：${baseInfo.mac}`)

  const bindNum = deviceBinding.store.allRoomDeviceList.filter(
    (item) => item.proType === proType && item.productId === modelId,
  ).length // 已绑定的相同设备数量

  const newNum = bleDevicesStore.bleDeviceList.filter(
    (item) => item.proType === proType && item.productId === modelId,
  ).length // 已新发现的相同设备数量

  const deviceNum = bindNum + newNum // 已有相同设备数量

  deviceName += deviceNum > 0 ? deviceNum + 1 : ''

  const bleDevice: IBleDevice = {
    proType: proType,
    deviceUuid: baseInfo.deviceUuid,
    mac: baseInfo.mac,
    signal: baseInfo.signal,
    RSSI: baseInfo.RSSI,
    zigbeeMac: baseInfo.zigbeeMac,
    isConfig: baseInfo.isConfig,
    icon: productIcon,
    productId: modelId,
    name: deviceName,
    isChecked: false,
    client: new BleClient({ mac: baseInfo.mac, deviceUuid: baseInfo.deviceUuid }),
    roomId: roomBinding.store.currentRoom.roomId,
    roomName: roomBinding.store.currentRoom.roomName,
    switchList: [],
    status: 'waiting',
    requesting: false,
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

  bleDevicesStore.bleDeviceList.push(bleDevice)

  runInAction(() => {
    bleDevicesStore.bleDeviceList = bleDevicesStore.bleDeviceList.concat([])
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
  productId: string
  switchList: Device.ISwitch[]
  client: BleClient
  status: 'waiting' | 'fail' | 'success' // 配网状态
  isChecked: boolean // 是否被选中
  requesting: boolean // 是否正在发送试一试命令
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
