import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { runInAction } from 'mobx-miniprogram'
import Toast from '@vant/weapp/toast/toast'
import { homeBinding, roomBinding, homeStore, deviceStore } from '../../store/index'
import { bleDevicesBinding, bleDevicesStore } from '../store/bleDeviceStore'
import { getCurrentPageParams, emitter, Logger, throttle } from '../../utils/index'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { getUnbindSensor, sendCmdAddSubdevice, bindDevice, batchUpdate, isDeviceOnline } from '../../apis/index'
import lottie from 'lottie-miniprogram'
import { addDevice } from '../assets/search-subdevice/lottie/index'
import PromiseQueue from '../../lib/promise-queue'
import { PRO_TYPE } from '../../config/index'
import dayjs from 'dayjs'

type StatusName = 'discover' | 'requesting' | 'success' | 'error'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, roomBinding, bleDevicesBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    _startTime: 0,
    _gatewayInfo: {
      channel: 0,
      extPanId: '',
      panId: 0,
    },
    _proType: '',
    _bleTaskQueue: new PromiseQueue({ concurrency: 3 }), // 允许同时进行蓝牙通讯配网的任务队列，暂定3个
    _zigbeeTaskQueue: new PromiseQueue({ concurrency: 6 }), // 允许同时进行zigbee设备配网的任务队列，暂定6个
    _id: Math.floor(Math.random() * 100),
    _errorList: [] as string[],
    _addModeTimeId: 0,
    _deviceMap: {} as {
      [x: string]: {
        startTime: number // 开始配网的时间
        bindTimeoutId: number // 绑定推送监听超时计时器
        zigbeeRepeatTimes: number // 配网自动重试次数
        zigbeeAddCallback: (
          value:
            | {
                success: boolean
                msg?: string | undefined
              }
            | PromiseLike<{
                success: boolean
                msg?: string | undefined
              }>,
        ) => void // 子设备入网回调
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
    confirmLoading: false,
  },

  computed: {
    pageTitle(data) {
      const titleMap = {
        discover: '附近的子设备',
        requesting: '添加设备',
        success: '添加设备',
        error: '附近的子设备',
      }

      return titleMap[data.status] || ''
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

      this.data._bleTaskQueue = new PromiseQueue({ concurrency: 2 })
      this.data._zigbeeTaskQueue = new PromiseQueue({ concurrency: 6 })

      bleDevicesStore.updateBleDeviceList()

      const { proType, productId, channel, extPanId, panId } = getCurrentPageParams()
      this.setData({
        proType,
      })
      this.data._productId = productId
      this.data._gatewayInfo = {
        channel: parseInt(channel), // 获取网关信道
        extPanId: extPanId,
        panId: parseInt(panId),
      }

      if (proType === PRO_TYPE.sensor) {
        bleDevicesStore.reset()

        const res = await this.startGwAddMode(false)

        if (!res.success) {
          Toast(res.msg)
          return
        }

        // 有WS时，触发前端查询绑定信息
        // _sensorList 列表，排除可能存在的 设备历史上报缓存
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
      // 退出页面时清除循环执行的代码
      this.data._zigbeeTaskQueue.clear()
      this.data._bleTaskQueue.clear()

      // 终止配网指令下发
      this.stopGwAddMode()

      // 终止蓝牙发现
      bleDevicesBinding.store.stopBLeDiscovery()

      // 清除闪烁指令
      this.stopFlash()

      // 清除推送监听定时器
      Object.values(this.data._deviceMap).forEach((item) => item.bindTimeoutId && clearTimeout(item.bindTimeoutId))
    },
  },

  methods: {
    /**
     * @description 主动查询已入网设备
     */
    async findSensor() {
      // 已绑定的相同设备数量
      const bindNum = deviceStore.allRoomDeviceList.filter(
        (item) => item.proType === PRO_TYPE.sensor && item.productId === this.data._productId,
      ).length

      const { gatewayId } = getCurrentPageParams()
      const res = await getUnbindSensor({ gatewayId })
      const list = res.result
        // 过滤非本次加入的传感器，过滤非指定型号传感器
        .filter(
          (device) => this.data._sensorList.includes(device.deviceId) && device.productId === this.data._productId,
        )
        .map((device, index) => {
          const deviceNum = bindNum + index // 已有相同设备数量
          return {
            ...device,
            name: `${device.productName}${deviceNum > 0 ? deviceNum + 1 : ''}`,
            proType: PRO_TYPE.sensor,
            isChecked: true,
            status: 'waiting' as const,
            deviceUuid: device.deviceId,
            roomId: roomBinding.store.currentRoom.roomId, // 默认为当前房间
            mac: device.deviceId,
          }
        })

      runInAction(() => {
        bleDevicesBinding.store.bleDeviceList = list
      })
    },
    startAnimation() {
      // 加载动画
      this.createSelectorQuery()
        .selectAll('#canvas')
        .node((res: IAnyObject) => {
          if (!res || !res.length) {
            return
          }
          const canvas = res[0].node
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
      this.stopFlash()

      item.isChecked = !item.isChecked

      bleDevicesStore.updateBleDeviceList()
    },

    showMac(e: WechatMiniprogram.CustomEvent) {
      const { mac, rssi } = e.currentTarget.dataset
      let msg = ''

      if (mac) {
        msg += `Mac：${mac}`
      }
      if (rssi) {
        msg += `  信号：${rssi}`
      }
      Toast(msg)
    },

    // 确认添加子设备
    async confirmAdd() {
      try {
        const selectedList = bleDevicesBinding.store.bleDeviceList.filter((item: Device.ISubDevice) => item.isChecked)

        bleDevicesBinding.store.stopBLeDiscovery()
        this.beginAddBleDevice(selectedList)
      } catch (err) {
        Logger.log('confirmAdd-err', err)
      }
    },

    // 确认添加传感器
    async confirmAddSensor() {
      this.setData({ confirmLoading: true })
      try {
        const selectedList = bleDevicesBinding.store.bleDeviceList.filter((item: Device.ISubDevice) => item.isChecked)

        this.beginAddSensor(selectedList)
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
          bleDevicesBinding.store.bleDeviceList.findIndex(
            (item) => item.isChecked && (item.status === 'waiting' || item.status === 'zigbeeBind'),
          ) >= 0
        // 若全部执行并等待完毕，则关闭监听、网关配网
        if (!hasWaitItem) {
          this.stopGwAddMode()

          Logger.log('失败原因列表', this.data._errorList)
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

      Logger.log('网关进入配网模式 | 是否蓝牙配网：', flag)
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
      Logger.debug('-------本次配网结束-----用时(ms)：', dayjs().valueOf() - this.data._startTime)

      return res
    },

    async beginAddSensor(list: Device.ISubDevice[]) {
      try {
        // setTimeout(() => {
        //   this.startAnimation()
        // }, 300)

        // 将整个列表发到云端标记为绑定
        for (const device of list) {
          const res = await bindDevice({
            deviceId: device.deviceId,
            houseId: homeBinding.store.currentHomeId,
            roomId: device.roomId,
            sn: '',
            deviceName: device.name,
          })

          device.status = res.success && res.result.isBind ? 'success' : 'fail'
        }
        bleDevicesStore.updateBleDeviceList()

        // HACK 成功页面仍共用请求状态
        this.setData({
          status: 'requesting',
        })
        Logger.log('添加传感器结束')
      } catch (err) {
        Logger.log('beginAddSensor-err', err)
      }
    },

    async beginAddBleDevice(list: Device.ISubDevice[]) {
      try {
        // 先关闭可能正在连接的子设备
        await this.stopFlash()

        Logger.debug('-------开始子设备配网------')
        this.data._startTime = dayjs().valueOf()
        const res = await this.startGwAddMode()

        if (!res.success) {
          Toast(res.msg)
          return
        }

        // 若为其余蓝牙子设备，则监听云端推送，判断哪些子设备绑定成功
        emitter.on('bind_device', (data) => {
          const bleDevice = bleDevicesStore.bleDeviceList.find(
            (item) => item.isChecked && item.zigbeeMac === data.deviceId,
          )

          if (bleDevice) {
            const deviceData = this.data._deviceMap[bleDevice.mac]
            const costTime = dayjs().valueOf() - deviceData.startTime

            Logger.log(`【${bleDevice.mac}】绑定推送成功， 推送等待时长(ms)：${costTime}`)

            if (bleDevice.status === 'success') {
              Logger.debug(`【${bleDevice.mac}】已经是成功状态，终止推送后续逻辑`)
              return
            }

            if (bleDevice.status === 'fail') {
              Logger.debug(`【${bleDevice.mac}】已经是失败状态`)
              this.bindBleDeviceToCloud(bleDevice)

              this.updateBleDeviceListView()
              return
            }

            bleDevice.status = 'zigbeeBind' // 标记子设备已入网关的zigbee网络

            if (deviceData.bindTimeoutId) {
              clearTimeout(deviceData.bindTimeoutId)

              deviceData.bindTimeoutId = 0
            }

            deviceData.zigbeeAddCallback({ success: true })
          }
        })

        this.setData({
          status: 'requesting',
        })

        setTimeout(() => {
          this.startAnimation()
        }, 300)

        type PromiseThunk = () => Promise<any>
        const zigbeeTaskList = [] as PromiseThunk[]

        list.forEach((item) => {
          // 等待zigbee子设备添加上报promise
          // 存在手动进入配网的情况，还没发送蓝牙配网指令就已经收到zigbee添加上报成功的情况，这种情况也需要当做配网成功且不需要重复发送蓝牙配网指令
          const waitingZigbeeAdd = new Promise<{ success: boolean; msg?: string }>((resolve) => {
            this.data._deviceMap[item.mac] = {
              startTime: 0,
              bindTimeoutId: 0,
              zigbeeRepeatTimes: 2,
              zigbeeAddCallback: resolve,
            }
          })

          zigbeeTaskList.push(async () => {
            Logger.debug(`【${item.mac}】开始zigbee配网任务`)
            // 数据埋点：上报尝试配网的子设备
            wx.reportEvent('add_device', {
              pro_type: item.proType,
              model_id: item.productId,
              add_type: 'discover',
            })

            // 已经手动进入配网状态且已经zigbee配网成功的，无需再次进入配网
            if (item.status === 'waiting') {
              this.data._bleTaskQueue.add(async () => {
                if (item.status === 'success') {
                  Logger.debug(`${item.mac}已zigbee配网成功，无需再下发蓝牙指令`)
                  return
                }

                Logger.debug(`【${item.mac}】蓝牙任务开始`)
                await this.startZigbeeNet(item)

                await item.client.close()

                Logger.debug(`【${item.mac}】蓝牙任务结束`)
              })
            } else {
              Logger.debug(`【${item.mac}】已手动完成配网`)
            }

            const waitingRes = await waitingZigbeeAdd

            Logger.log(`【${item.mac}】waitingRes`, waitingRes)

            if (!waitingRes.success) {
              item.status = 'fail'
              Logger.error(`【${item.mac}】配网失败：`, waitingRes.msg)
              this.data._errorList.push(`【${item.mac}】${waitingRes.msg}`)

              wx.reportEvent('zigbee_error', {
                model_id: item.productId,
                pro_type: item.proType,
                error_msg: waitingRes.msg,
              })
            } else {
              await this.bindBleDeviceToCloud(item)
            }

            this.updateBleDeviceListView()

            Logger.debug(`【${item.mac}】结束zigbee配网任务：`)
          })
        })

        this.data._zigbeeTaskQueue.add(zigbeeTaskList)
      } catch (err) {
        Logger.error('beginAddBleDevice-err', err)
      }
    },

    /**
     * 监听绑定推送超时处理
     * @param bleDevice
     */
    async handleZigbeeTimeout(bleDevice: Device.ISubDevice) {
      const deviceData = this.data._deviceMap[bleDevice.mac]
      const isOnline = await isDeviceOnline({ devIds: [bleDevice.zigbeeMac] })

      Logger.log(`【${bleDevice.mac}】监听超时，查询云端入网状态：${isOnline}`)

      isOnline && Logger.debug(`【${bleDevice.mac}】zigbee入网成功但没有收到推送`)

      deviceData.zigbeeAddCallback({ success: isOnline, msg: '绑定推送监听超时' })
    },

    async startZigbeeNet(bleDevice: Device.ISubDevice) {
      try {
        const timeout = 60 // 等待绑定推送，超时60s
        const deviceData = this.data._deviceMap[bleDevice.mac]

        Logger.log(
          `【${bleDevice.mac}】配网指令，第${3 - deviceData.zigbeeRepeatTimes}次, 检测配网状态：${bleDevice.isConfig}`,
        )

        // 过滤刚出厂设备刚起电时会默认进入配网状态期间，被网关绑定的情况，这种当做成功配网，无需再下发配网指令，否则重复发送配网指令可能会导致zigbee入网失败
        if (bleDevice.isConfig !== '02') {
          const configRes = await bleDevice.client.getZigbeeState()

          // 需要排除查询过程中收到绑定推送
          if (configRes.success && configRes.result.isConfig === '02' && bleDevice.status !== 'success') {
            Logger.log(`【${bleDevice.mac}】已zigbee配网成功，无需下发配网指令`)
            bleDevice.isConfig = configRes.result.isConfig
            // 等待绑定推送，超时处理
            deviceData.startTime = dayjs().valueOf()
            deviceData.bindTimeoutId = setTimeout(() => {
              this.handleZigbeeTimeout(bleDevice)
            }, timeout * 1000)

            return
          } else if (!configRes.success) {
            Logger.error(`【${bleDevice.mac}】getZigbeeState失败：`, configRes)
          }
        }

        deviceData.zigbeeRepeatTimes--

        if (bleDevice.status !== 'waiting') {
          Logger.debug(`【${bleDevice.mac}】子设备处于非等待状态，退出蓝牙配网流程`)
          return
        }

        const { channel, extPanId, panId } = this.data._gatewayInfo

        const res = await bleDevice.client.startZigbeeNet({ channel, extPanId, panId })

        if (res.success) {
          // 兼容新固件逻辑，子设备重复配网同一个网关，网关不会上报子设备入网，必须app手动查询设备入网状态
          if (res.code === '02') {
            const isOnline = await isDeviceOnline({ devIds: [bleDevice.zigbeeMac] })

            if (isOnline) {
              Logger.log(`【${bleDevice.mac}】手动查询子设备已入网`)
              deviceData.zigbeeAddCallback({ success: true })
              return
            }
          }
          bleDevice.isConfig = '02' // 将设备配网状态置为已配网，否则失败重试由于前面判断状态的逻辑无法重新添加成功
          // 等待绑定推送，超时处理
          deviceData.startTime = dayjs().valueOf()

          deviceData.bindTimeoutId = setTimeout(() => {
            this.handleZigbeeTimeout(bleDevice)
          }, timeout * 1000)
        } else if (deviceData.zigbeeRepeatTimes > 0) {
          // 配网指令失败重发
          await this.startZigbeeNet(bleDevice)
        } else {
          deviceData.zigbeeAddCallback({
            success: false,
            msg: `子设备蓝牙配网指令失败-${JSON.stringify(res)}`,
          })
        }
      } catch (err) {
        Logger.error(`【${bleDevice.mac}】startZigbeeNet-catch`, err)
      }
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
        device.status = 'success'
        Logger.log(`${device.mac}绑定家庭成功`)
        // 仅2-4路面板需要更改按键名称
        if (device.switchList.length > 1) {
          await this.editDeviceInfo({ deviceId: res.result.deviceId, switchList: device.switchList })
        }

        const deviceData = this.data._deviceMap[device.mac]
        const costTime = dayjs().valueOf() - deviceData.startTime

        wx.reportEvent('zigebee_add', {
          pro_type: device.proType,
          cost_time: deviceData.startTime === 0 ? -1 : costTime, // -1代表手动起网配上的子设备
          model_id: device.productId,
        })
      } else {
        device.status = 'fail'
        Logger.error(`${device.mac}绑定家庭失败`, res)
      }
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

      bleDeviceItem.requesting = true

      bleDevicesStore.updateBleDeviceList()

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
        bleDevice.requesting = false

        bleDevicesStore.updateBleDeviceList()
        bleDevice.client.close()
        return
      }

      const res = await bleDevice.client.flash()

      bleDevice.requesting = false

      bleDevicesStore.updateBleDeviceList()

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
    async stopFlash() {
      if (!this.data.flashInfo.mac) {
        return
      }

      const bleDevice = bleDevicesBinding.store.bleDeviceList.find(
        (item) => item.mac === this.data.flashInfo.mac,
      ) as Device.ISubDevice

      bleDevice.requesting = false

      bleDevicesStore.updateBleDeviceList()

      await bleDevice.client.close()

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

      this.beginAddBleDevice(failList)
    },

    finish() {
      homeBinding.store.updateCurrentHomeDetail()
      wx.closeBluetoothAdapter()
      bleDevicesStore.reset()

      this.goBackPrev()
    },

    toggleSelectAll() {
      runInAction(() => {
        bleDevicesBinding.store.bleDeviceList = bleDevicesBinding.store.bleDeviceList.map((item) => ({
          ...item,
          isChecked: !this.data.isAllSelected,
        }))
      })
    },

    goBackPrev() {
      wx.navigateBack({
        delta: this.data.proType === PRO_TYPE.sensor ? 4 : 3,
      })
    },
  },
})
