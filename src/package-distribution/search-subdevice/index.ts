import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import asyncPool from 'tiny-async-pool'
import { homeBinding, roomBinding, deviceBinding } from '../../store/index'
import { bleUtil, strUtil, BleClient, getCurrentPageParams } from '../../utils/index'
import { IBleDevice, ISwitch } from './types'
import pageBehaviors from '../../behaviors/pageBehaviors'
import {
  sendCmdAddSubdevice,
  bindDevice,
  queryDeviceOnlineStatus,
  queryProtypeInfo,
  batchUpdate,
} from '../../apis/index'
import lottie from 'lottie-miniprogram'
import { addDevice } from '../../assets/lottie/index'

type StatusName = 'discover' | 'requesting' | 'success' | 'error' | 'openBle'

let lightNum = 0 // 灯数量
let panelNum = 0 // 面板数

ComponentWithComputed({
  options: {
    addGlobalClass: true,
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEditDevice: false,
    editDeviceInfo: {
      index: -1,
      deviceId: '',
      deviceName: '',
      roomId: '',
      switchList: [] as ISwitch[],
    },
    deviceList: Array<IBleDevice>(),
    status: 'discover' as StatusName,
  },

  computed: {
    pageTitle(data) {
      const titleMap = {
        discover: '附近的子设备',
        requesting: '添加设备',
        success: '添加设备',
        error: '附近的子设备',
        openBle: '附近的子设备',
      }

      return titleMap[data.status]
    },
    defaultRoom(data) {
      const list = data.currentHomeDetail?.roomList || []
      return list[0] || {}
    },
    selectedList(data) {
      return data.deviceList.filter((item) => item.isChecked) as IBleDevice[]
    },
    failList(data) {
      return data.selectedList.filter((item: IBleDevice) => item.status === 'fail') as IBleDevice[]
    },
    successList(data) {
      return data.selectedList.filter((item: IBleDevice) => item.status === 'success')
    },

    isAllSelected(data) {
      return data.selectedList.length === data.deviceList.length
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    ready: function () {
      lightNum = deviceBinding.store.allRoomDeviceList.filter((item) => item.proType === '0x13').length // 灯数量
      panelNum = deviceBinding.store.allRoomDeviceList.filter((item) => item.proType === '0x21').length // 面板数
      console.log('lightNum', lightNum, panelNum)

      this.initBle()

      // this.setData({
      //   deviceList: JSON.parse(
      //     '[{"proType":"0x13","deviceUuid":"04:CD:15:A9:B5:B7","mac":"04CD15A9B5B7","zigbeeMac":"","icon":"https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/midea.light.003.002-3.png","name":"灯具B5B7","isChecked":false,"client":{"key":"midea@homluxB5B7","serviceId":"BAE55B96-7D19-458D-970C-50613D801BC9","characteristicId":"","msgId":0,"mac":"04CD15A9B5B7","deviceUuid":"04:CD:15:A9:B5:B7"},"roomId":"","roomName":"","switchList":[],"status":"waiting","requestTimes":20,"requesting":false,"zigbeeRepeatTimes":2}, {"proType":"0x21","deviceUuid":"04:CD:15:AE:AA:8D","mac":"04CD15AEAA8D","zigbeeMac":"","icon":"https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/panel-4.png","name":"面板AA8D","isChecked":false,"client":{"key":"midea@homluxAA8D","serviceId":"BAE55B96-7D19-458D-970C-50613D801BC9","characteristicId":"","msgId":0,"mac":"04CD15AEAA8D","deviceUuid":"04:CD:15:AE:AA:8D"},"roomId":"","roomName":"","switchList":[{"switchId":"1","switchName":"按键1"},{"switchId":"2","switchName":"按键2"}],"status":"waiting","requestTimes":20,"requesting":false,"zigbeeRepeatTimes":2},{"proType":"0x21","deviceUuid":"04:CD:15:AE:B5:3A","mac":"04CD15AEB53A","zigbeeMac":"","icon":"https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/panel-4.png","name":"面板B53A","isChecked":false,"client":{"key":"midea@homluxB53A","serviceId":"BAE55B96-7D19-458D-970C-50613D801BC9","characteristicId":"","msgId":0,"mac":"04CD15AEB53A","deviceUuid":"04:CD:15:AE:B5:3A"},"roomId":"","roomName":"","switchList":[{"switchId":"1","switchName":"按键1"},{"switchId":"2","switchName":"按键2"},{"switchId":"3","switchName":"按键3"},{"switchId":"4","switchName":"按键4"}],"status":"waiting","requestTimes":20,"requesting":false,"zigbeeRepeatTimes":2}]',
      //   ),
      // })
    },
    moved: function () {},
    detached: function () {
      wx.closeBluetoothAdapter()
    },
  },

  pageLifetimes: {
    hide() {},
  },

  methods: {
    startAnimation() {
      // 加载动画
      this.createSelectorQuery()
        .selectAll('#canvas')
        .node((res) => {
          const canvas = (res as any)[0].node
          const context = canvas.getContext('2d')

          canvas.width = 400
          canvas.height = 400

          lottie.setup(canvas)
          lottie.loadAnimation({
            loop: true,
            autoplay: true,
            animationData: JSON.parse(addDevice),
            rendererSettings: {
              context,
            },
          })
        })
        .exec()
    },
    openSystemBluetoothSetting() {
      wx.openSystemBluetoothSetting({
        success(res) {
          console.log('openSystemBluetoothSetting', res)
        },
      })
    },

    openAppAuthorizeSetting() {
      wx.openAppAuthorizeSetting({
        success(res) {
          console.log('openAppAuthorizeSetting', res)
        },
      })
    },
    async initBle() {
      wx.onBluetoothAdapterStateChange((changeRes) => {
        console.log('onBluetoothAdapterStateChange', changeRes)
      })

      // 初始化蓝牙模块
      const openBleRes = await wx
        .openBluetoothAdapter({
          mode: 'central',
        })
        .catch((error) => error)

      console.log('openBleRes', openBleRes)

      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
        const deviceList = res.devices.filter((item) => {
          let flag = false

          // localName为homlux_ble且没有被发现过的
          if (
            item.localName &&
            item.localName.includes('homlux_ble') &&
            this.data.deviceList.findIndex((listItem) => item.deviceId === listItem.deviceUuid) < 0
          ) {
            flag = true
          }

          return flag
        })

        if (deviceList.length <= 0) return

        deviceList.forEach((device) => {
          this.handleBleDeviceInfo(device)
        })
      })

      wx.onBLEConnectionStateChange((res) => {
        // 该方法回调中可以用于处理连接意外断开等异常情况
        if (!res.connected) {
          const item = this.data.deviceList.find((item) => item.deviceUuid === res.deviceId) as IBleDevice
          console.log(
            'onBLEConnectionStateChange-search-subdevice',
            `device ${item.mac} state has changed, connected: ${res.connected}`,
          )
        }
      })

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

    async handleBleDeviceInfo(device: WechatMiniprogram.BlueToothDevice) {
      const dataMsg = strUtil.ab2hex(device.advertisData)
      const msgObj = bleUtil.transferBroadcastData(dataMsg)

      console.log('handleBleDeviceInfo', msgObj)

      // 过滤已经配网的设备
      if (msgObj.isConfig !== '00') {
        return
      }

      const infoRes = await queryProtypeInfo({
        proType: `0x${msgObj.deviceCategory}`,
        mid: `0x${msgObj.deviceModel}`,
      })

      if (!infoRes.success) {
        return
      }

      let { productName: deviceName } = infoRes.result
      const { switchNum } = infoRes.result

      if (msgObj.deviceCategory === '21') {
        ++panelNum
        deviceName += panelNum > 1 ? panelNum : ''
        // deviceName += (panelNum > 1 ? strUtil.encodeS(panelNum) : '')
      } else if (msgObj.deviceCategory === '13') {
        ++lightNum
        deviceName += lightNum > 1 ? lightNum : ''
      }

      const bleDevice: IBleDevice = {
        proType: `0x${msgObj.deviceCategory}`,
        deviceUuid: device.deviceId,
        mac: msgObj.mac,
        zigbeeMac: '',
        icon: infoRes.result.icon || '/assets/img/device/gateway.png',
        name: deviceName,
        isChecked: false,
        client: new BleClient({ mac: msgObj.mac, deviceUuid: device.deviceId }),
        roomId: '',
        roomName: '',
        switchList: [],
        status: 'waiting',
        requestTimes: 20,
        requesting: false,
        zigbeeRepeatTimes: 2,
      }

      if (switchNum > 1 && bleDevice.proType === '0x21') {
        bleDevice.switchList = new Array(switchNum).fill('').map((_item, index) => {
          const num = index + 1
          return {
            switchId: num.toString(),
            switchName: `按键${num}`,
          }
        })
      }

      this.data.deviceList.push(bleDevice)

      console.log('bleDevice', JSON.stringify(bleDevice))

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    // 切换选择发现的设备
    toggleDevice(e: WechatMiniprogram.CustomEvent) {
      const index = e.currentTarget.dataset.index as number
      const item = this.data.deviceList[index]

      item.isChecked = !item.isChecked

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    // 确认添加设备
    async confirmAdd() {
      try {
        wx.stopBluetoothDevicesDiscovery().catch((err) => err)

        this.beginAddDevice(this.data.selectedList)
      } catch (err) {
        console.log('confirmAdd-err', err)
      }
    },

    async beginAddDevice(list: IBleDevice[]) {
      try {
        const pageParams = getCurrentPageParams()

        const res = await sendCmdAddSubdevice({
          deviceId: pageParams.gatewayId,
          expire: 60,
          buzz: 1,
        })

        if (!res.success) {
          wx.showToast({ title: res.msg })
          return
        }

        this.setData({
          status: 'requesting',
        })

        setTimeout(() => {
          this.startAnimation()
        }, 300)

        for (const item of list) {
          item.status = 'waiting'
          item.requestTimes = 20
          item.zigbeeRepeatTimes = 2
        }

        this.setData({
          deviceList: this.data.deviceList,
        })

        const iteratorFn = async (item: IBleDevice) => {
          console.info('开始任务：', item.mac, Date.now())
          await this.startZigbeeNet(item)

          return item
        }

        for await (const value of asyncPool(3, list, iteratorFn)) {
          console.info('任务结束：', value.mac)
        }
      } catch (err) {
        console.log('beginAddDevice-err', err)
      }
    },

    async startZigbeeNet(bleDevice: IBleDevice) {
      console.group(`startZigbeeNet:${bleDevice.mac}`)
      console.log(`开始子设备配网：${bleDevice.mac}，第${3 - bleDevice.zigbeeRepeatTimes}次`)
      bleDevice.zigbeeRepeatTimes--

      const res = await bleDevice.client.startZigbeeNet()

      // 配网指令允许重发3次
      if (!res.success && bleDevice.zigbeeRepeatTimes > 0) {
        await this.startZigbeeNet(bleDevice)

        return
      }

      if (res.success) {
        bleDevice.zigbeeMac = res.result.zigbeeMac

        this.queryDeviceOnlineStatus(bleDevice)
      } else {
        console.error(`子设备配网失败：${bleDevice.mac}`, res)
        bleDevice.status = 'fail'

        this.setData({
          deviceList: this.data.deviceList,
        })
      }

      bleDevice.client.close()

      console.groupEnd()
    },

    async queryDeviceOnlineStatus(device: IBleDevice) {
      const pageParams = getCurrentPageParams()

      const queryRes = await queryDeviceOnlineStatus({
        deviceId: device.zigbeeMac,
        deviceType: '2',
        sn: pageParams.gatewaySn,
      })

      console.log('queryDeviceOnlineStatus', queryRes)

      if (queryRes.result.onlineStatus === 0 || !queryRes.result.deviceId) {
        // 限制最多查询云端设备在线状态次数：device.requestTimes，超过则置为失败
        device.requestTimes--

        if (device.requestTimes <= 0) {
          device.status = 'fail'
          this.setData({
            deviceList: this.data.deviceList,
          })

          return
        }

        setTimeout(() => {
          this.queryDeviceOnlineStatus(device)
        }, 3000)

        return
      }

      const res = await bindDevice({
        deviceId: device.zigbeeMac,
        houseId: homeBinding.store.currentHomeId,
        roomId: device.roomId || this.data.defaultRoom.roomId,
        sn: '',
        deviceName: device.name,
      })

      if (res.success && res.result.isBind) {
        await this.editDeviceInfo({ deviceId: res.result.deviceId, switchList: device.switchList })
        device.status = 'success'
      } else {
        device.status = 'fail'
      }

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    async editDeviceInfo(data: { deviceId: string; switchList: ISwitch[] }) {
      const { deviceId, switchList } = data
      // const res = await queryDeviceInfoByDeviceId({ deviceId })

      // let switchListCloud = res.result.switchInfoDTOList

      const deviceInfoUpdateVoList = switchList.map((item) => {
        return {
          deviceId: deviceId,
          switchId: item.switchId,
          switchName: item.switchName,
          type: '3',
        }
      })

      await batchUpdate({ deviceInfoUpdateVoList })
    },

    /**
     * 编辑设备信息
     * @param event
     */
    editDevice(event: WechatMiniprogram.BaseEvent) {
      const { index } = event.currentTarget.dataset

      const item = this.data.deviceList[index]

      console.log('item', item)

      this.setData({
        isEditDevice: true,
        editDeviceInfo: {
          index: index,
          deviceId: item.deviceUuid,
          deviceName: item.name,
          roomId: item.roomId || this.data.defaultRoom.roomId,
          switchList: item.switchList,
        },
      })
    },

    confirmEditDevice(event: WechatMiniprogram.CustomEvent) {
      console.log('confirmEditDevice', event)
      const { detail } = event
      const item = this.data.deviceList[this.data.editDeviceInfo.index]

      item.roomId = detail.roomId
      item.roomName = detail.roomName
      item.name = detail.deviceName
      item.switchList = detail.switchList

      this.setData({
        isEditDevice: false,
        deviceList: this.data.deviceList,
      })
    },

    cancelEditDevice() {
      this.setData({
        isEditDevice: false,
      })
    },

    /**
     * 试一试
     */
    async tryControl(event: WechatMiniprogram.CustomEvent) {
      const { id } = event.currentTarget.dataset

      const bleDeviceItem = this.data.deviceList.find((item) => item.deviceUuid === id) as IBleDevice

      if (bleDeviceItem.requesting) {
        return
      }

      bleDeviceItem.requesting = true

      this.setData({
        deviceList: this.data.deviceList,
      })

      const res = await bleDeviceItem.client.sendCmd({
        cmdType: 'control',
        subType: 'haveTry',
      })

      console.log('tryControl-res', res)

      bleDeviceItem.requesting = false

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    // 重新添加
    async reAdd() {
      this.beginAddDevice(this.data.failList)
    },

    finish() {
      homeBinding.store.updateCurrentHomeDetail()

      wx.switchTab({
        url: '/pages/index/index',
      })
    },

    toggleSelectAll() {
      this.setData({
        deviceList: this.data.deviceList.map((item) => ({
          ...item,
          isChecked: !this.data.isAllSelected,
        })),
      })
    },
  },
})
