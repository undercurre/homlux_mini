import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { runInAction } from 'mobx-miniprogram'
import Toast from '@vant/weapp/toast/toast'
import asyncPool from 'tiny-async-pool'
import { homeBinding, roomBinding, homeStore } from '../../store/index'
import { bleDevicesBinding, IBleDevice, bleDevicesStore } from '../store/bleDeviceStore'
import { getCurrentPageParams, emitter, Loggger } from '../../utils/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { sendCmdAddSubdevice, bindDevice, batchUpdate } from '../../apis/index'
import lottie from 'lottie-miniprogram'
import { addDevice } from '../assets/search-subdevice/lottie/index'

type StatusName = 'discover' | 'requesting' | 'success' | 'error'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding, bleDevicesBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    _addModeTimeId: 0,
    _bindTimeOutIdMap: {} as IAnyObject, // 等待绑定成功推送的超时等待的timeId集合，key为mac
    isEditDevice: false,
    editDeviceInfo: {
      deviceUuid: '',
      deviceId: '',
      deviceName: '',
      roomId: '',
      roomName: '',
      switchList: [] as Device.ISwitch[],
    },
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
      const list = data.bleDeviceList || []

      return list.filter((item: IBleDevice) => item.isChecked)
    },
    failList(data) {
      return data.selectedList.filter((item: IBleDevice) => item.status === 'fail') as IBleDevice[]
    },
    successList(data) {
      return data.selectedList.filter((item: IBleDevice) => item.status === 'success')
    },

    isAllSelected(data) {
      const list = data.bleDeviceList || []

      return data.selectedList.length === list.length
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    ready: function () {
      bleDevicesBinding.store.startBleDiscovery()
    },
    moved: function () {},
  },

  pageLifetimes: {
    hide() {
      this.stopGwAddMode()
      bleDevicesBinding.store.stopBLeDiscovery()
    },
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

    // 切换选择发现的设备
    toggleDevice(e: WechatMiniprogram.CustomEvent) {
      const index = e.currentTarget.dataset.index as number
      const item = bleDevicesBinding.store.bleDeviceList[index]

      item.isChecked = !item.isChecked

      this.updateBleDeviceListView()
    },

    showMac(e: WechatMiniprogram.CustomEvent) {
      const mac = e.currentTarget.dataset.mac

      Toast(mac)
    },

    // 确认添加设备
    async confirmAdd() {
      try {
        bleDevicesBinding.store.stopBLeDiscovery()

        const selectedList = bleDevicesBinding.store.bleDeviceList.filter((item: IBleDevice) => item.isChecked)

        this.beginAddDevice(selectedList)
      } catch (err) {
        Loggger.log('confirmAdd-err', err)
      }
    },

    /**
     * 更新设备列表数据
     * @param isCheckAddMode 是否需要检查网关配网状态
     */
    updateBleDeviceListView(isCheckAddMode = true) {
      if (isCheckAddMode) {
        const hasWaitItem =
          bleDevicesBinding.store.bleDeviceList.findIndex((item) => item.isChecked && item.status === 'waiting') >= 0
        // 若全部执行并等待完毕，则关闭监听、网关配网
        if (!hasWaitItem) {
          this.stopGwAddMode()

          Loggger.log('配网结束')
        }
      }

      runInAction(() => {
        bleDevicesBinding.store.bleDeviceList = bleDevicesBinding.store.bleDeviceList.concat([])
      })
    },

    async startGwAddMode() {
      const pageParams = getCurrentPageParams()
      const expireTime = 60

      const res = await sendCmdAddSubdevice({
        deviceId: pageParams.gatewayId,
        expire: expireTime,
        buzz: 1,
      })

      // 子设备配网阶段，保持网关在配网状态
      if (res.success) {
        this.data._addModeTimeId = setTimeout(() => {
          const hasWaitItem = bleDevicesStore.bleDeviceList.findIndex((item) => item.status === 'waiting') >= 0 // 检测是否还存在需要配网的设备

          hasWaitItem && this.startGwAddMode()
        }, (expireTime - 10) * 1000)
      }

      return res
    },

    async stopGwAddMode() {
      if (this.data._addModeTimeId === 0) {
        return
      }

      const pageParams = getCurrentPageParams()

      clearTimeout(this.data._addModeTimeId)
      this.data._addModeTimeId = 0

      const res = await sendCmdAddSubdevice({
        deviceId: pageParams.gatewayId,
        expire: 0,
        buzz: 0,
      })

      // 子设备配网阶段，保持网关在配网状态
      if (res.success) {
        Loggger.log('结束网关配网状态')
      }

      emitter.off('bind_device')
      Loggger.log('关闭子设备绑定监听')

      return res
    },

    async beginAddDevice(list: IBleDevice[]) {
      try {
        const res = await this.startGwAddMode()

        if (!res.success) {
          Toast(res.msg)
          return
        }

        // 监听云端推送，判断哪些子设备绑定成功
        emitter.on('bind_device', (data) => {
          Loggger.log('bind_device', data)

          const bleDevice = bleDevicesStore.bleDeviceList.find(
            (item) => item.isChecked && item.zigbeeMac === data.deviceId,
          )

          if (bleDevice) {
            Loggger.log(bleDevice.mac, '绑定推送成功')
            this.data._bindTimeOutIdMap[bleDevice.mac] && clearTimeout(this.data._bindTimeOutIdMap[bleDevice.mac])
            this.bindBleDeviceToClound(bleDevice)
          }
        })

        this.setData({
          status: 'requesting',
        })

        setTimeout(() => {
          this.startAnimation()
        }, 300)

        const tempList: string[] = []

        const iteratorFn = async (item: IBleDevice) => {
          tempList.push(item.mac)
          Loggger.log('开始蓝牙任务：', item.mac, '当前蓝牙指令任务：', JSON.stringify(tempList))

          wx.reportEvent('add_device', {
            pro_type: item.proType,
            model_id: item.productId,
            add_type: 'discover',
          })

          await this.startZigbeeNet(item)

          Loggger.log(item.mac, 'close-start')
          item.client.close()

          Loggger.log(item.mac, 'close-end')
          return item
        }

        for await (const value of asyncPool(3, list, iteratorFn)) {
          const index = tempList.findIndex((item) => item === value.mac)

          tempList.splice(index, 1)

          Loggger.log('蓝牙任务结束：', value.mac, '当前蓝牙指令任务：', JSON.stringify(tempList))
        }

        Loggger.log('所有蓝牙指令任务结束')
      } catch (err) {
        Loggger.log('beginAddDevice-err', err)
      }
    },

    async startZigbeeNet(bleDevice: IBleDevice) {
      Loggger.log(`开始子设备配网：${bleDevice.mac}，第${3 - bleDevice.zigbeeRepeatTimes}次`)

      const timeout = 60 // 等待绑定推送，超时60s
      // 过滤刚出厂设备刚起电时会默认进入配网状态期间，被网关绑定的情况，这种当做成功配网，无需再下发配网指令，否则可能会导致zigbee入网失败
      if (bleDevice.isConfig !== '02') {
        const configRes = await bleDevice.client.getZigbeeState()

        if (configRes.success && configRes.result.isConfig === '02') {
          // 等待绑定推送，超时处理
          this.data._bindTimeOutIdMap[bleDevice.mac] = setTimeout(() => {
            if (bleDevice.status === 'waiting') {
              bleDevice.status = 'fail'
              Loggger.error(bleDevice.mac + '绑定推送监听超时')
              this.updateBleDeviceListView()
              delete this.data._bindTimeOutIdMap[bleDevice.mac]
            }
          }, timeout * 1000)

          return
        }
      }

      bleDevice.zigbeeRepeatTimes--

      const res = await bleDevice.client.startZigbeeNet()
      
      if (res.success) {
        // 等待绑定推送，超时处理
        setTimeout(() => {
          if (bleDevice.status === 'waiting') {
            bleDevice.status = 'fail'
            Loggger.error(bleDevice.mac + '绑定监听超时')
            this.updateBleDeviceListView()
          }
        }, timeout * 1000)
      } else if (bleDevice.zigbeeRepeatTimes === 0) {
        Loggger.error(`子设备配网失败：${bleDevice.mac}`, res)
        bleDevice.status = 'fail'

        this.updateBleDeviceListView()
      } else {
        // 配网指令允许重发2次
        await this.startZigbeeNet(bleDevice)
      }

      Loggger.log(bleDevice.mac, 'startZigbeeNet-end')
    },

    async bindBleDeviceToClound(device: IBleDevice) {
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

      this.updateBleDeviceListView()
    },

    async editDeviceInfo(data: { deviceId: string; switchList: Device.ISwitch[] }) {
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
      const { id } = event.currentTarget.dataset

      const item = bleDevicesBinding.store.bleDeviceList.find((item) => item.deviceUuid === id) as IBleDevice

      this.setData({
        isEditDevice: true,
        editDeviceInfo: {
          deviceUuid: item.deviceUuid,
          deviceId: item.deviceUuid,
          deviceName: item.name,
          roomId: item.roomId,
          roomName: item.roomName,
          switchList: item.switchList,
        },
      })
    },

    confirmEditDevice(event: WechatMiniprogram.CustomEvent) {
      Loggger.log('confirmEditDevice', event)
      const { detail } = event
      const item = bleDevicesBinding.store.bleDeviceList.find(
        (item) => item.deviceUuid === this.data.editDeviceInfo.deviceUuid,
      ) as IBleDevice

      item.roomId = detail.roomId
      item.roomName = detail.roomName
      item.name = detail.deviceName
      item.switchList = detail.switchList

      this.setData({
        isEditDevice: false,
      })

      this.updateBleDeviceListView()
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

      const bleDeviceItem = bleDevicesBinding.store.bleDeviceList.find((item) => item.deviceUuid === id) as IBleDevice

      if (bleDeviceItem.requesting) {
        return
      }

      bleDeviceItem.requesting = true

      this.updateBleDeviceListView(false)

      const res = await bleDeviceItem.client.sendCmd({
        cmdType: 'DEVICE_CONTROL',
        subType: 'haveTry',
      })

      Loggger.log('tryControl-res', res)
      bleDeviceItem.client.close() // 发送指令完毕后需要断开已连接的设备，否则连接数满了之后无法连接新的设备

      bleDeviceItem.requesting = false

      this.updateBleDeviceListView(false)
    },

    /**
     * 试一试
     */
    async getLightState(event: WechatMiniprogram.CustomEvent) {
      const { id } = event.currentTarget.dataset

      const bleDeviceItem = bleDevicesBinding.store.bleDeviceList.find((item) => item.deviceUuid === id) as IBleDevice

      const res = await bleDeviceItem.client.getZigbeeState()

      // const res = await bleDeviceItem.client.getLightState()

      Loggger.log('getLightState-res', res)
      bleDeviceItem.client.close() // 发送指令完毕后需要断开已连接的设备，否则连接数满了之后无法连接新的设备
    },

    // 重新添加
    async reAdd() {
      const failList = bleDevicesBinding.store.bleDeviceList.filter(
        (item: IBleDevice) => item.isChecked && item.status === 'fail',
      )

      for (const item of failList) {
        item.status = 'waiting'
        item.requestTimes = 20
        item.zigbeeRepeatTimes = 2
      }

      this.updateBleDeviceListView()

      this.beginAddDevice(failList)
    },

    finish() {
      homeBinding.store.updateCurrentHomeDetail()
      wx.closeBluetoothAdapter()

      wx.switchTab({
        url: '/pages/index/index',
      })
    },

    toggleSelectAll() {
      runInAction(() => {
        bleDevicesBinding.store.bleDeviceList = bleDevicesBinding.store.bleDeviceList.map((item) => ({
          ...item,
          isChecked: !this.data.isAllSelected,
        }))
      })
    },
  },
})
