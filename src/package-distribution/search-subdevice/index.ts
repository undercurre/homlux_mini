import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import asyncPool from 'tiny-async-pool'
import { homeBinding, roomBinding, deviceBinding, homeStore } from '../../store/index'
import { bleUtil, IBleBaseInfo, BleClient, getCurrentPageParams, storage } from '../../utils/index'
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

type StatusName = 'discover' | 'requesting' | 'success' | 'error'

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
      roomName: '',
      switchList: [] as ISwitch[],
    },
    deviceList: Array<IBleDevice>(),
    // 已经发现并需要显示在界面的设备列表，由于deviceList的push变更存在云端接口校验，存在异步过程，
    // 由于现在发现蓝牙（允许上报重复设备），可能会重复显示设备的情况，需要通过_foundList实时同步的列表过滤重复设备
    _foundList: Array<string>(),
    status: 'discover' as StatusName,
  },

  computed: {
    pageTitle(data) {
      const titleMap = {
        discover: '附近的子设备',
        requesting: '添加设备',
        success: '添加设备',
        error: '附近的子设备',
      }

      return titleMap[data.status]
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

      this.initBle()

      this.setData({
        deviceList: JSON.parse(
          '[{"proType":"0x21","deviceUuid":"2405EEB6-EF0D-C8AB-FC47-CA9EE267CFB6","mac":"04CD15AEAEAE","signal":"weak","RSSI":-80,"zigbeeMac":"","icon":"https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/panel-4.png","name":"四路面板9-AEAE","isChecked":false,"client":{"key":"midea@homluxAEAE","isConnected":false,"serviceId":"BAE55B96-7D19-458D-970C-50613D801BC9","characteristicId":"","msgId":0,"mac":"04CD15AEAEAE","deviceUuid":"2405EEB6-EF0D-C8AB-FC47-CA9EE267CFB6"},"roomId":"3a7c6a656d3f443bb1676ecaa25d94cd","roomName":"卧室","switchList":[{"switchId":"1","switchName":"按键1"},{"switchId":"2","switchName":"按键2"},{"switchId":"3","switchName":"按键3"},{"switchId":"4","switchName":"按键4"}],"status":"waiting","requestTimes":20,"requesting":false,"zigbeeRepeatTimes":2},{"proType":"0x21","deviceUuid":"2FE9C556-EAC2-CA12-9DE6-DB85643146D1","mac":"04CD15AEB53A","signal":"weak","RSSI":-88,"zigbeeMac":"","icon":"https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/panel-4.png","name":"四路面板10-B53A","isChecked":false,"client":{"key":"midea@homluxB53A","isConnected":false,"serviceId":"BAE55B96-7D19-458D-970C-50613D801BC9","characteristicId":"","msgId":0,"mac":"04CD15AEB53A","deviceUuid":"2FE9C556-EAC2-CA12-9DE6-DB85643146D1"},"roomId":"3a7c6a656d3f443bb1676ecaa25d94cd","roomName":"卧室","switchList":[{"switchId":"1","switchName":"按键1"},{"switchId":"2","switchName":"按键2"},{"switchId":"3","switchName":"按键3"},{"switchId":"4","switchName":"按键4"}],"status":"waiting","requestTimes":20,"requesting":false,"zigbeeRepeatTimes":2}]',
        ),
      })
    },
    moved: function () {},
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
      const foundList = (storage.get('foundList', this.data.subdeviceList) as IBleBaseInfo[]) || []

      storage.remove('foundList')

      console.log('foundList', foundList)

      this.data._foundList = foundList.map((item) => item.deviceUuid)
      foundList.forEach((item) => {
        this.handleBleDeviceInfo(item)
      })

      // 初始化蓝牙模块
      const openBleRes = await wx
        .openBluetoothAdapter({
          mode: 'central',
        })
        .catch((error) => error)

      console.log('openBleRes', openBleRes)

      // 监听扫描到新设备事件
      bleUtil.onFoundHomluxDevice({
        success: (list) => {
          console.log('onFoundHomluxDevice-search', list)
          list = list.filter((item) => {
            const foundItem = this.data.deviceList.find((foundItem) => foundItem.deviceUuid === item.deviceUuid)

            if (foundItem) {
              foundItem.RSSI = item.RSSI
              foundItem.signal = item.signal
            }

            return !this.data._foundList.includes(item.deviceUuid)
          })

          if (list.length <= 0) {
            this.setData({
              deviceList: this.data.deviceList,
            })
            return
          }

          this.data._foundList = this.data._foundList.concat(list.map((item) => item.deviceUuid))
          list.forEach((device) => {
            this.handleBleDeviceInfo(device)
          })
        },
      })

      // 开始搜寻附近的蓝牙外围设备
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        powerLevel: 'high',
        interval: 3000,
        success(res) {
          console.log('startBluetoothDevicesDiscovery-search', res)
        },
      })
    },

    async handleBleDeviceInfo(baseInfo: IBleBaseInfo) {
      const infoRes = await queryProtypeInfo({
        proType: `0x${baseInfo.deviceCategory}`,
        mid: `0x${baseInfo.deviceModel}`,
      })

      if (!infoRes.success) {
        return
      }

      let { productName: deviceName } = infoRes.result
      const { switchNum } = infoRes.result

      if (baseInfo.deviceCategory === '21') {
        ++panelNum
        deviceName += panelNum > 1 ? panelNum : ''
        // deviceName += (panelNum > 1 ? strUtil.encodeS(panelNum) : '')
      } else if (baseInfo.deviceCategory === '13') {
        ++lightNum
        deviceName += lightNum > 1 ? lightNum : ''
      }

      const bleDevice: IBleDevice = {
        proType: `0x${baseInfo.deviceCategory}`,
        deviceUuid: baseInfo.deviceUuid,
        mac: baseInfo.mac,
        signal: baseInfo.signal,
        RSSI: baseInfo.RSSI,
        zigbeeMac: '',
        icon: infoRes.result.icon || '/assets/img/device/gateway.png',
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

      this.data.deviceList.push(bleDevice)
      console.log('this.data.deviceList', JSON.stringify(this.data.deviceList))

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
          Toast(res.msg)
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
        roomId: device.roomId,
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

      const deviceInfoUpdateVoList = switchList.map((item) => {
        return {
          deviceId: deviceId,
          houseId: homeStore.currentHomeId,
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
          roomId: item.roomId,
          roomName: item.roomName,
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
      bleDeviceItem.client.close() // 发送指令完毕后需要断开已连接的设备，否则连接数满了之后无法连接新的设备

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
      wx.closeBluetoothAdapter()

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
