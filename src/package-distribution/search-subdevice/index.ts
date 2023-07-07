import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { runInAction } from 'mobx-miniprogram'
import Toast from '@vant/weapp/toast/toast'
import asyncPool from 'tiny-async-pool'
import { homeBinding, roomBinding, homeStore } from '../../store/index'
import { bleDevicesBinding, bleDevicesStore } from '../store/bleDeviceStore'
import { getCurrentPageParams, emitter, Logger, throttle } from '../../utils/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { getUnbindSensor, sendCmdAddSubdevice, bindDevice, batchUpdate } from '../../apis/index'
import lottie from 'lottie-miniprogram'
import { addDevice } from '../assets/search-subdevice/lottie/index'
import { PRO_TYPE } from '../../config/index'

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
    _proType: '',
    _addModeTimeId: 0,
    _deviceMap: {} as {
      [x: string]: {
        bindTimeoutId: number
        requestTimes: number // 查询云端在线次数
        zigbeeRepeatTimes: number // 配网自动重试次数
      }
    }, // 发现到的子设备配网数据集合（无关UI展示的），key为mac
    _sensorList: [] as string[], // 已通过ws通知入网的传感器设备列表
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
    flashInfo: {
      timeId: 0,
      mac: '',
    },
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

      return list.filter((item: Device.ISubDevice) => item.isChecked)
    },
    failList(data) {
      return data.selectedList.filter((item: Device.ISubDevice) => item.status === 'fail') as Device.ISubDevice[]
    },
    successList(data) {
      return data.selectedList.filter((item: Device.ISubDevice) => item.status === 'success')
    },

    isAllSelected(data) {
      const list = data.bleDeviceList || []

      return data.selectedList.length === list.length
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    async ready() {
      // 开始配子设备后，侧滑离开当前页面时，重置发现的蓝牙设备列表的状态，以免返回扫码页重进当前页面时状态不对
      bleDevicesStore.bleDeviceList.forEach((item) => {
        item.isChecked = false
        item.status = 'waiting'
      })

      bleDevicesStore.updateBleDeviceList()

      const { proType } = getCurrentPageParams()
      this.data._proType = proType
      if (proType === PRO_TYPE.sensor) {
        const res = await this.startGwAddMode(false)

        if (!res.success) {
          Toast(res.msg)
          return
        }

        // 有WS时，前端查询绑定信息
        // TOOD 建立 bind_device 列表，排除可能存在的 设备历史上报缓存
        // TODO 停止监听的规则与ble配网规则合并
        emitter.on('bind_device', (data) => {
          Logger.log('bind_device', data)

          // 过滤非传感器设备
          if (data.proType !== PRO_TYPE.sensor) {
            return
          }

          this.data._sensorList.push(data.deviceId)
          this.findSensor()
        })
      } else {
        bleDevicesBinding.store.startBleDiscovery()
      }
    },
    detached() {
      console.log('detached')
      // 退出页面时清除循环执行的代码

      // 终止配网指令下发
      this.stopGwAddMode()

      // 终止蓝牙发现
      bleDevicesBinding.store.stopBLeDiscovery()

      // 清除闪烁指令
      this.stopFlash()
    },
  },

  methods: {
    /**
     * @description 主动查询已入网设备
     */
    async findSensor() {
      const { gatewayId } = getCurrentPageParams()
      const res = await getUnbindSensor({ gatewayId })
      const list = res.result
        // 过滤非本次加入的传感器
        .filter((device) => this.data._sensorList.includes(device.deviceId))
        .map((device) => ({
          ...device,
          name: device.productName,
          proType: PRO_TYPE.sensor,
          isChecked: false,
          status: 'waiting' as const,
        }))

      runInAction(() => {
        bleDevicesBinding.store.bleDeviceList = list
      })
    },
    startAnimation() {
      // 加载动画
      this.createSelectorQuery()
        .selectAll('#canvas')
        .node((res) => {
          const canvas = (res as IAnyObject)[0].node
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

      bleDevicesStore.updateBleDeviceList()
    },

    showMac(e: WechatMiniprogram.CustomEvent) {
      const { mac, rssi } = e.currentTarget.dataset

      Toast(`Mac：${mac}  信号：${rssi}`)
    },

    // 确认添加设备
    async confirmAdd() {
      try {
        const selectedList = bleDevicesBinding.store.bleDeviceList.filter((item: Device.ISubDevice) => item.isChecked)

        if (this.data._proType === PRO_TYPE.sensor) {
          this.beginAddSensor(selectedList)
        } else {
          bleDevicesBinding.store.stopBLeDiscovery()
          this.beginAddDevice(selectedList)
        }
      } catch (err) {
        Logger.log('confirmAdd-err', err)
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
        }
      }

      this.updateBleDeviceListThrottle()
    },

    /**
     * 节流更新蓝牙设备列表，根据实际业务场景使用
     */
    updateBleDeviceListThrottle: throttle(() => {
      bleDevicesStore.updateBleDeviceList()
    }, 3000),

    /**
     * @description 网关进入配网模式
     * @param flag 保持配网状态，是否需要附加条件
     * TODO 将条件解耦
     */
    async startGwAddMode(flag = true) {
      const pageParams = getCurrentPageParams()
      const expireTime = 60

      Logger.log('网关进入配网模式', flag)
      const res = await sendCmdAddSubdevice({
        deviceId: pageParams.gatewayId,
        expire: expireTime,
        buzz: this.data._addModeTimeId ? 0 : 1,
      })

      // 子设备配网阶段，保持网关在配网状态
      if (res.success) {
        this.data._addModeTimeId = setTimeout(() => {
          if (flag) {
            const hasWaitItem = bleDevicesStore.bleDeviceList.findIndex((item) => item.status === 'waiting') >= 0 // 检测是否还存在需要配网的设备

            hasWaitItem && this.startGwAddMode()
          } else {
            this.startGwAddMode(false)
          }
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
        Logger.log('结束网关配网状态')
      }

      emitter.off('bind_device')
      Logger.log('关闭子设备绑定监听')

      return res
    },

    async beginAddSensor(list: Device.ISubDevice[]) {
      try {
        // 将整个列表发到云端标记为绑定
        for (let device of list) {
          const res = await bindDevice({
            deviceId: device.deviceId,
            houseId: homeBinding.store.currentHomeId,
            roomId: roomBinding.store.currentRoom.roomId,
            sn: '',
            deviceName: device.name,
          })

          device.status = res.success && res.result.isBind ? 'success' : 'fail'
        }
        bleDevicesStore.updateBleDeviceList()

        this.setData({
          status: 'requesting',
        })

        Logger.log('添加传感器结束')
      } catch (err) {
        Logger.log('beginAddSensor-err', err)
      }
    },

    async beginAddDevice(list: Device.ISubDevice[]) {
      try {
        wx.getConnectedBluetoothDevices({
          services: [],
          success(res) {
            Logger.log('getConnectedBluetoothDevices', res)
          },
        })

        this.stopFlash()

        const res = await this.startGwAddMode()

        if (!res.success) {
          Toast(res.msg)
          return
        }

        list.forEach((item) => {
          this.data._deviceMap[item.mac] = {
            bindTimeoutId: 0,
            requestTimes: 20,
            zigbeeRepeatTimes: 2,
          }
        })

        // 若为其余蓝牙子设备，则监听云端推送，判断哪些子设备绑定成功
        emitter.on('bind_device', (data) => {
          Logger.log('bind_device', data)

          const bleDevice = bleDevicesStore.bleDeviceList.find(
            (item) => item.isChecked && item.zigbeeMac === data.deviceId,
          )

          if (bleDevice) {
            Logger.log(bleDevice.mac, '绑定推送成功')
            this.data._deviceMap[bleDevice.mac].bindTimeoutId &&
              clearTimeout(this.data._deviceMap[bleDevice.mac].bindTimeoutId)
            this.bindBleDeviceToCloud(bleDevice)
          }
        })

        this.setData({
          status: 'requesting',
        })

        setTimeout(() => {
          this.startAnimation()
        }, 300)

        const tempList: string[] = []

        const iteratorFn = async (item: Device.ISubDevice) => {
          tempList.push(item.mac)
          Logger.log('开始蓝牙任务：', item.mac, '当前蓝牙指令任务：', JSON.stringify(tempList))

          wx.reportEvent('add_device', {
            pro_type: item.proType,
            model_id: item.productId,
            add_type: 'discover',
          })

          await this.startZigbeeNet(item)

          await item.client.close()

          return item
        }

        for await (const value of asyncPool(1, list, iteratorFn)) {
          const index = tempList.findIndex((item) => item === value.mac)

          tempList.splice(index, 1)

          Logger.log('蓝牙任务结束：', value.mac, '当前蓝牙指令任务：', JSON.stringify(tempList))
        }

        Logger.log('所有蓝牙指令任务结束')
      } catch (err) {
        Logger.log('beginAddDevice-err', err)
      }
    },

    async startZigbeeNet(bleDevice: Device.ISubDevice) {
      Logger.log(`【${bleDevice.mac}】开始子设备配网，第${3 - this.data._deviceMap[bleDevice.mac].zigbeeRepeatTimes}次`)

      const timeout = 90 // 等待绑定推送，超时60s
      // 过滤刚出厂设备刚起电时会默认进入配网状态期间，被网关绑定的情况，这种当做成功配网，无需再下发配网指令，否则可能会导致zigbee入网失败
      if (bleDevice.isConfig !== '02') {
        Logger.log(`【${bleDevice.mac}】检测配网状态：${bleDevice.isConfig}`)
        const configRes = await bleDevice.client.getZigbeeState()

        if (configRes.success && configRes.result.isConfig === '02') {
          bleDevice.isConfig = configRes.result.isConfig
          // 等待绑定推送，超时处理
          this.data._deviceMap[bleDevice.mac].bindTimeoutId = setTimeout(() => {
            if (bleDevice.status === 'waiting') {
              bleDevice.status = 'fail'
              Logger.error(bleDevice.mac + '绑定推送监听超时')
              this.updateBleDeviceListView()
            }
          }, timeout * 1000)

          return
        }
      }

      this.data._deviceMap[bleDevice.mac].zigbeeRepeatTimes--

      const res = await bleDevice.client.startZigbeeNet()

      if (res.success) {
        bleDevice.isConfig = '02' // 将设备配网状态置为已配网，否则失败重试由于前面判断状态的逻辑无法重新添加成功
        // 等待绑定推送，超时处理
        setTimeout(() => {
          if (bleDevice.status === 'waiting') {
            bleDevice.status = 'fail'
            Logger.error(bleDevice.mac + '绑定监听超时')
            this.updateBleDeviceListView()
          }
        }, timeout * 1000)
      } else if (this.data._deviceMap[bleDevice.mac].zigbeeRepeatTimes === 0) {
        Logger.error(`子设备配网失败：${bleDevice.mac}`, res)
        bleDevice.status = 'fail'

        this.updateBleDeviceListView()
      } else {
        // 配网指令允许重发2次
        await this.startZigbeeNet(bleDevice)
      }

      Logger.log(bleDevice.mac, 'startZigbeeNet-end')
    },

    async bindBleDeviceToCloud(device: Device.ISubDevice) {
      const res = await bindDevice({
        deviceId: device.zigbeeMac,
        houseId: homeBinding.store.currentHomeId,
        roomId: device.roomId,
        sn: '',
        deviceName: device.name,
      })

      if (res.success && res.result.isBind) {
        // 仅2-4路面板需要更改按键名称
        if (device.switchList.length > 1) {
          await this.editDeviceInfo({ deviceId: res.result.deviceId, switchList: device.switchList })
        }

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
      this.stopFlash()
      const { id } = event.currentTarget.dataset

      const item = bleDevicesBinding.store.bleDeviceList.find((item) => item.deviceUuid === id) as Device.ISubDevice

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
      Logger.log('confirmEditDevice', event)
      const { detail } = event
      const item = bleDevicesBinding.store.bleDeviceList.find(
        (item) => item.deviceUuid === this.data.editDeviceInfo.deviceUuid,
      ) as Device.ISubDevice

      item.roomId = detail.roomId
      item.roomName = detail.roomName
      item.name = detail.deviceName
      item.switchList = detail.switchList

      this.setData({
        isEditDevice: false,
      })

      bleDevicesStore.updateBleDeviceList()
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

      const bleDeviceItem = bleDevicesBinding.store.bleDeviceList.find(
        (item) => item.deviceUuid === id,
      ) as Device.ISubDevice

      // 停止之前正在闪烁的设备
      if (this.data.flashInfo.mac === bleDeviceItem.mac) {
        this.stopFlash()
        return
      }

      this.setData({
        'flashInfo.mac': bleDeviceItem.mac,
      })
      this.keepFlash(bleDeviceItem)
    },

    // 循环下发闪烁
    async keepFlash(bleDevice: Device.ISubDevice) {
      if (bleDevice.mac !== this.data.flashInfo.mac) {
        bleDevice.client.close()
        return
      }

      const res = await bleDevice.client.flash()

      console.log('flash', res, this.data.flashInfo.mac)
      if (!res.success) {
        this.stopFlash()
        return
      }

      this.data.flashInfo.timeId = setTimeout(() => {
        this.keepFlash(bleDevice)
      }, 4500)
    },

    /**
     * 停止闪烁
     */
    stopFlash() {
      if (!this.data.flashInfo.mac) {
        return
      }

      const bleDevice = bleDevicesBinding.store.bleDeviceList.find(
        (item) => item.mac === this.data.flashInfo.mac,
      ) as Device.ISubDevice

      bleDevice.client.close()

      this.setData({
        'flashInfo.mac': '',
      })

      clearTimeout(this.data.flashInfo.timeId)
    },

    // 重新添加
    async reAdd() {
      const failList = bleDevicesBinding.store.bleDeviceList.filter(
        (item: Device.ISubDevice) => item.isChecked && item.status === 'fail',
      )

      for (const item of failList) {
        item.status = 'waiting'
      }

      bleDevicesStore.updateBleDeviceList()

      this.beginAddDevice(failList)
    },

    finish() {
      homeBinding.store.updateCurrentHomeDetail()
      wx.closeBluetoothAdapter()

      wx.navigateBack({
        delta: 2,
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
