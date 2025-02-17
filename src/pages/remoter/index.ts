import pageBehaviors from '../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { initBleCapacity, storage, unique, isNullOrUnDef, emitter, delay } from '../../utils/index'
import remoterProtocol from '../../utils/remoterProtocol'
import { createBleServer, bleAdvertising } from '../../utils/remoterUtils'
import {
  deviceConfig,
  deviceConfigV2,
  MIN_RSSI,
  CMD,
  FREQUENCY_TIME,
  SEEK_INTERVAL,
  SEEK_TIMEOUT,
} from '../../config/remoter'
import { defaultImgDir } from '../../config/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { remoterStore, remoterBinding } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] }), pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    MIN_RSSI,
    _envVersion: 'release', // 当前小程序环境，默认为发布版，用于屏蔽部分实验功能
    _listenLocationTimeId: 0, // 监听系统位置信息是否打开的计时器， 0为不存在监听
    statusBarHeight: storage.get('statusBarHeight') as number,
    scrollTop: 0,
    scrollViewHeight:
      (storage.get('windowHeight') as number) -
      (storage.get('statusBarHeight') as number) -
      (storage.get('bottomBarHeight') as number) - // IPX
      (storage.get('navigationBarHeight') as number),
    showTips: false, // 首次进入显示操作提示
    tipsStep: 0,
    isSeeking: false, // 正在主动搜索设备
    _isDiscoverying: false, // 正在搜索设备（包括静默更新状态的情况）
    foundListHolder: false, // 临时显示发现列表的点位符
    canShowNotFound: false, // 已搜索过至少一次但未找到
    foundList: [] as Remoter.DeviceItem[], // 搜索到的设备
    _bleServer: null as WechatMiniprogram.BLEPeripheralServer | null,
    _time_id_end: 0 as any, // 定时终止搜索设备
    _lastPowerKey: '', // 记录上一次点击‘照明’时的指令键，用于反转处理
    _timer: 0, // 记录上次指令时间
    _holdBleScan: false, // onHide时保持蓝牙扫描的标志
    curShareAddr: '',
    totalAccess: 0,
    dayAccess: 0,
    monthAccess: 0,
    accessDate: 0,
    newAddTemp: [] as Remoter.DeviceItem[],
  },

  computed: {},

  methods: {
    async onLoad() {
      // 是否点击过场景使用提示的我知道了，如果没点击过就显示
      const hasConfirmRemoterTips = storage.get<boolean>('hasConfirmRemoterTips')
      if (!hasConfirmRemoterTips) {
        this.setData({
          showTips: true,
        })
      }

      // 初始化[我的设备]列表
      this.initDeviceList()

      // 根据通知,更新设备列表
      emitter.on('remoterChanged', async () => {
        await delay(0)
        const drag = this.selectComponent('#drag')
        drag?.init()
        wx.reportEvent('remoter_live', {
          rm_month_access: this.data.monthAccess,
          rm_day_access: this.data.dayAccess,
          rm_total_access: this.data.totalAccess,
          rm_live_type: 'delete',
          rm_device_type: 'none',
        })
      })
      emitter.on('remoterControl', (e) => {
        this.clearAddAndControlTemp(e.mac)
      })

      // 版本获取
      const info = wx.getAccountInfoSync()
      this.data._envVersion = info.miniProgram.envVersion

      this.getAccessCount()
    },
    async onShow() {
      this.data._holdBleScan = false
      await initBleCapacity()
      // 监听扫描到新设备事件
      wx.onBluetoothDeviceFound((res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) => {
        this.resolveFoundDevices(res)
      })

      await delay(0)
      // 如果未在发现模式，则搜索设备
      if (!this.data._isDiscoverying) {
        this.toSeek()
      }

      setTimeout(() => {
        this.saveShareDev()
      }, 500)
    },
    async saveShareDev() {
      const enterOption = wx.getEnterOptionsSync()
      if (enterOption.scene != 1007 && enterOption.scene != 1008) return
      const enterQuery = enterOption.query
      console.log('lmn>>>enterQuery=', JSON.stringify(enterQuery))
      const addr = enterQuery.addr
      if (this.data.curShareAddr === addr) return
      this.setData({
        curShareAddr: addr,
      })
      const list = remoterStore.remoterList
      for (let i = 0; i < list.length; i++) {
        if (list[i].addr === addr) {
          Toast('该遥控器已存在')
          return
        }
      }
      const isV2 = enterQuery.functionDes != undefined && enterQuery.functionDes.length > 1
      let config = null
      if (isV2) {
        config = deviceConfigV2[enterQuery.deviceType] || null
      } else {
        config = deviceConfig[enterQuery.deviceType][enterQuery.deviceModel] || null
      }
      if (!config) return
      const shareDev = {
        deviceId: `${new Date().valueOf()}`,
        addr: addr,
        version: parseInt(enterQuery.version),
        devicePic: config.devicePic,
        actions: config.actions,
        deviceName: enterQuery.deviceName,
        deviceType: enterQuery.deviceType,
        deviceModel: enterQuery.deviceModel,
        actionStatus: false,
        saved: false,
        defaultAction: 0,
        DISCOVERED: 0,
        isV2,
        functionDes: enterQuery.functionDes,
      }
      const orderNum = remoterStore.remoterList.length
      remoterStore.addRemoter({
        ...shareDev,
        orderNum,
        defaultAction: 0,
      } as Remoter.DeviceRx)
      await this.initDrag()
      Toast('添加分享设备成功')
    },
    onHide() {
      console.log('onHide on Index')

      wx.offBluetoothAdapterStateChange() // 移除蓝牙适配器状态变化事件的全部监听函数
      // wx.offBLECharacteristicValueChange() // 移除蓝牙低功耗设备的特征值变化事件的全部监听函数

      // 移除系统位置信息开关状态的监听
      if (this.data._listenLocationTimeId) {
        clearInterval(this.data._listenLocationTimeId)
      }

      if (!this.data._holdBleScan) {
        emitter.off('remoterChanged')
        wx.offBluetoothDeviceFound() // 移除搜索到新设备的事件的全部监听函数

        this.endSeek()
        // 关闭外围设备服务端
        if (this.data._bleServer) {
          this.data._bleServer.close()
          this.data._bleServer = null
        }

        // 取消计时器
        if (this.data._time_id_end) {
          clearTimeout(this.data._time_id_end)
          this.data._time_id_end = 0
        }
      }
    },
    onUnload() {
      this.endSeek()
      emitter.off('remoterControl')
    },

    // 拖拽列表初始化
    async initDrag() {
      // 有可能视图未更新，需要先等待nextTick
      await delay(0)

      const drag = this.selectComponent('#drag')
      drag?.init()
    },

    // 从storage初始化我的设备列表
    initDeviceList() {
      remoterStore.retrieveRmStore()

      this.initDrag()
      setTimeout(() => {
        remoterStore.remoterList.forEach((item) => {
          wx.reportEvent('remoter_operate', {
            rm_total_control: 0,
            rm_device_model: item.deviceModel,
            rm_device_type: item.deviceType,
            rm_device_mac: item.addr,
            rm_operate_type: 'read',
            rm_total_access: this.data.totalAccess,
          })
        })
      }, 500)
    },

    // 将新发现设备, 添加到[我的设备]
    async saveDevice(device: Remoter.DeviceItem) {
      const { addr } = device
      const index = this.data.foundList.findIndex((device) => device.addr === addr)
      const newDevice = this.data.foundList.splice(index, 1)[0]
      const orderNum = remoterStore.remoterList.length

      remoterStore.addRemoter({
        ...newDevice,
        orderNum,
        defaultAction: 0,
      } as Remoter.DeviceRx)

      this.setData({
        foundListHolder: !this.data.foundList.length,
        foundList: this.data.foundList,
      })
      await this.initDrag() // 设备列表增加了要刷新
      Toast('添加成功')

      // 发现列表已空，占位符显示2秒
      if (!this.data.foundList.length) {
        setTimeout(() => {
          this.setData({
            foundListHolder: false,
          })
          this.initDrag() // 动画结束了位置变化过又要刷新
        }, 2000)
      }
      const notTemp = this.data.newAddTemp.findIndex((item) => item.addr === newDevice.addr) == -1
      if (notTemp) {
        const temp = this.data.newAddTemp
        temp.push(newDevice)
        this.setData({
          newAddTemp: temp,
        })
      }
      wx.reportEvent('remoter_live', {
        rm_month_access: this.data.monthAccess,
        rm_day_access: this.data.dayAccess,
        rm_total_access: this.data.totalAccess,
        rm_live_type: 'add',
        rm_device_type: newDevice.deviceType,
      })
      wx.reportEvent('remoter_operate', {
        rm_total_control: 0,
        rm_device_model: newDevice.deviceModel,
        rm_device_type: newDevice.deviceType,
        rm_device_mac: newDevice.addr,
        rm_operate_type: 'add',
        rm_total_access: this.data.totalAccess,
      })
    },

    // 点击设备卡片
    async handleCardTap(e: WechatMiniprogram.TouchEvent) {
      const { deviceType, deviceModel, saved, addr, isV2, functionDes, isRSSIOK } = e.detail
      if (isNullOrUnDef(deviceType) || isNullOrUnDef(deviceModel)) {
        return
      }

      if (!saved) {
        if (isRSSIOK) this.saveDevice(e.detail as Remoter.DeviceItem)
        else Toast('请靠近设备再添加')
      }
      // 跳转到控制页
      else {
        this.data._holdBleScan = true
        const isV2Dev = isV2 !== undefined ? isV2 : deviceModel.length === 1
        if (isV2Dev) {
          let page = null
          if (deviceType === '26') {
            page = 'bath'
          } else if (deviceType === '40') {
            page = 'cool-bath'
          } else if (deviceType === 'a1') {
            page = 'vent-fan'
          } else if (deviceType === '17') {
            page = 'clothes'
          }
          if (!page) return
          wx.navigateTo({
            url: `/package-remoter/${page}/index?deviceType=${deviceType}&deviceModel=${deviceModel}&addr=${addr}&functionDes=${functionDes}`,
          })
        } else {
          let page = 'pannel'
          if (deviceType === '13') {
            page = deviceModel === '01' || deviceModel === '04' || deviceModel === '05' ? 'light' : 'fan-light'
          } else if (deviceType === '26') {
            const v2 = ['01', '02', '03', '07', '77', '22', '66', '27', '6f']
            if (v2.includes(deviceModel)) page = 'bath'
          } else if (deviceType === '40') {
            const v2 = ['03', '07', '23', '63', 'e7']
            if (v2.includes(deviceModel)) page = 'cool-bath'
          } else if (deviceType === '17') {
            page = 'clothes'
          }
          wx.navigateTo({
            url: `/package-remoter/${page}/index?deviceType=${deviceType}&deviceModel=${deviceModel}&addr=${addr}&functionDes=${functionDes}`,
          })
        }
      }
    },
    // 点击设备按钮
    async handleControlTap(e: WechatMiniprogram.TouchEvent) {
      const { isRSSIOK } = e.detail

      // 先触发本地保存，提高响应体验
      if (!e.detail.saved) {
        if (isRSSIOK) this.saveDevice(e.detail as Remoter.DeviceItem)
        else {
          Toast('请靠近设备再尝试')
          return
        }
      }

      const now = new Date().getTime()
      if (now - this.data._timer < FREQUENCY_TIME) {
        console.log('丢弃频繁操作')
        return
      }
      this.data._timer = now

      const { addr, actions, defaultAction, deviceModel, isV2, deviceType } = e.detail
      const isV2Dev = isV2 !== undefined ? isV2 : deviceModel.length === 1

      // HACK 特殊的照明按钮反转处理
      const { key } = actions[defaultAction]
      if (key === 'LIGHT_LAMP') {
        this.data._lastPowerKey = this.data._lastPowerKey === `${key}_OFF` ? `${key}_ON` : `${key}_OFF`
        // this.data._lastPowerKey = key
      }
      const payload = remoterProtocol.generalCmdString([CMD[key]], isV2Dev)

      // 建立BLE外围设备服务端
      if (!this.data._bleServer) {
        this.data._bleServer = await createBleServer()
      }

      // 广播控制指令
      await bleAdvertising(this.data._bleServer, {
        addr,
        payload,
        isV2: isV2Dev,
      })
      wx.reportEvent('remoter_live', {
        rm_month_access: this.data.monthAccess,
        rm_day_access: this.data.dayAccess,
        rm_total_access: this.data.totalAccess,
        rm_live_type: 'control',
        rm_device_type: deviceType,
      })
      this.clearAddAndControlTemp(addr)
      wx.reportEvent('remoter_control', {
        rm_control_function: key,
        rm_control_type: 'ad',
        rm_device_model: deviceModel,
        rm_device_type: deviceType,
        rm_device_mac: addr,
      })
    },

    /**
     * @description 搜索设备
     * @param isUserControlled 是否用户主动操作
     */
    async toSeek(e?: WechatMiniprogram.TouchEvent) {
      const isUserControlled = !!e // 若从wxml调用，即为用户主动操作

      // 若用户主动搜索，则设置搜索中标志
      if (isUserControlled) {
        const stauts = await initBleCapacity()

        if (!stauts) return

        this.setData({
          isSeeking: true,
        })
        clearTimeout(this.data._time_id_end)
        this.data._time_id_end = setTimeout(
          () =>
            this.setData({
              isSeeking: false,
              canShowNotFound: true,
            }),
          SEEK_TIMEOUT,
        )
      }

      if (this.data._isDiscoverying) {
        console.log('lmn>>>已在搜索设备中...')
      } else {
        this.setData({
          _isDiscoverying: true,
        })
        // 开始搜寻附近的蓝牙外围设备
        wx.startBluetoothDevicesDiscovery({
          allowDuplicatesKey: true,
          powerLevel: 'high',
          interval: SEEK_INTERVAL,
          fail: (err) => {
            console.log('lmn>>>开始搜索设备失败', JSON.stringify(err))
            this.setData({
              _isDiscoverying: false,
            })
            setTimeout(() => {
              this.toSeek()
            }, 1000)
          },
          success: () => console.log('lmn>>>开始搜索设备成功'),
        })
      }
    },
    // 停止搜索设备
    endSeek() {
      if (this.data._time_id_end) {
        clearTimeout(this.data._time_id_end)
        this.data._time_id_end = 0
      }
      wx.stopBluetoothDevicesDiscovery({
        success: () => {
          console.log('lmn>>>停止搜索设备')
          this.data._isDiscoverying = false
          this.setData({
            isSeeking: false,
            canShowNotFound: true,
          })
        },
      })

      this.data._isDiscoverying = false
    },

    // 处理搜索到的设备
    resolveFoundDevices(res: WechatMiniprogram.OnBluetoothDeviceFoundCallbackResult) {
      const sortList = res.devices.sort((a, b) => b.RSSI - a.RSSI)
      const recoveredListSrc =
        unique(sortList, 'deviceId') // 过滤重复设备
          .map((item) => remoterProtocol.searchDeviceCallBack(item)) // 过滤不支持的设备
          .filter((item) => !!item) || []

      // console.log('搜寻到的设备列表：', recoveredList)

      if (!recoveredListSrc?.length) {
        return
      }
      const recoveredList = recoveredListSrc.filter((object, index, self) => {
        return index === self.findIndex((selfObj) => selfObj?.addr === object?.addr)
      })

      // 在终止搜寻前先记录本次搜索的操作方式
      const isUserControlled = this.data.isSeeking

      // 更新我的设备列表
      remoterStore.renewRmState(recoveredList as Remoter.DeviceRx[])
      this.initDrag()

      // 静默搜索，只处理已保存列表的设备
      if (!isUserControlled) {
        return
      }
      console.log('lmn>>>------------搜索更新------------')

      // 用户主动搜索，刷新发现列表
      const newFoundList = [] as Remoter.DeviceDetail[]
      const curFoundList = this.data.foundList
      const suffixArr = {} as Record<string, number[]>
      const deviceInfo = wx.getDeviceInfo()
      const isIOS = deviceInfo.platform === 'ios'
      let addRSSI = 0
      const brandL = deviceInfo.brand.toLowerCase()
      if (brandL === 'honor' || brandL === 'huawei') {
        addRSSI = 5
      }
      console.log(`lmn>>>品牌:${brandL}=>阈值加${addRSSI}`)
      for (let j = 0; j < recoveredList.length; j++) {
        const item = recoveredList[j]
        const isSavedDevice = remoterStore.deviceAddrs.includes(item!.addr)
        const deviceType = item!.deviceType
        const deviceModel = item!.deviceModel
        let cusRSSI = this.data.MIN_RSSI
        if (item!.isV2) {
          cusRSSI = item!.deviceRSSI
        } else {
          if (deviceType === '13') {
            if (deviceModel === '02' || deviceModel === '03') {
              if (isIOS) cusRSSI = -80
              else cusRSSI = -75
            } else if (deviceModel === '04') cusRSSI = -70
            else if (deviceModel === '05') {
              if (isIOS) cusRSSI = -63
              else cusRSSI = -60
            } else if (deviceModel === '06') {
              cusRSSI = -63
            }
          } else if (deviceType === '26') {
            if (deviceModel === '0f' || deviceModel === '6f') {
              if (isIOS) cusRSSI = -68
            } else if (deviceModel === '66') {
              if (isIOS) cusRSSI = -66
            }
          }
        }
        cusRSSI += addRSSI
        let isExist = false
        if (curFoundList.length > 0) {
          isExist = curFoundList.findIndex((oldItem) => oldItem.addr === item?.addr) >= 0
        }
        const isRSSIOK = item!.RSSI >= cusRSSI
        if (isExist || !isSavedDevice) {
          let config = null
          if (item!.isV2) {
            config = deviceConfigV2[deviceType] || null
          } else {
            config = deviceConfig[deviceType][deviceModel] || null
          }
          if (!config) {
            // console.log(`lmn>>>不支持的设备:品类:${deviceType}/型号=${deviceModel}`)
            continue
          }

          const nameKey = config.deviceName
          if (suffixArr[nameKey] == undefined) {
            const names = remoterStore.deviceNames
            for (let i = 0; i < names.length; i++) {
              if (names[i].includes(nameKey)) {
                const numStr = names[i].replace(nameKey, '')
                let suffix = 0
                if (numStr) suffix = parseInt(numStr) || -1
                if (suffix < 0) continue
                if (suffixArr[nameKey] == undefined) suffixArr[nameKey] = [suffix]
                else suffixArr[nameKey].push(suffix)
              }
            }
          }
          let devSuffix = 0
          if (suffixArr[nameKey] == undefined) {
            suffixArr[nameKey] = [devSuffix]
          } else {
            const arr = suffixArr[nameKey]
            for (let i = 0; i < arr.length + 1; i++) {
              if (arr.includes(devSuffix)) devSuffix++
              else {
                suffixArr[nameKey].push(devSuffix)
                break
              }
            }
          }
          const deviceName = devSuffix ? nameKey + devSuffix : nameKey
          if (isRSSIOK) {
            console.log(
              `lmn>>>发现可添加设备::mac=${item!.addr}/品类=${deviceType}/型号=${deviceModel}/信号=${
                item!.RSSI
              }/阈值=${cusRSSI},命名=>${deviceName}`,
            )
          } else {
            console.warn(
              `lmn>>>发现弱信号设备::mac=${item!.addr}/品类=${deviceType}/型号=${deviceModel}/信号=${
                item!.RSSI
              }小于阈值=${cusRSSI},命名=>${deviceName}`,
            )
          }

          // 更新发现设备列表
          newFoundList.push({
            deviceId: item!.deviceId,
            addr: item!.addr,
            version: item!.version,
            devicePic: config.devicePic,
            actions: config.actions,
            deviceName,
            deviceType,
            deviceModel,
            actionStatus: false,
            saved: false,
            defaultAction: 0,
            DISCOVERED: 1,
            isV2: item!.isV2,
            functionDes: item!.functionDes,
            isRSSIOK,
          })
        } else {
          if (!isSavedDevice)
            console.warn(`lmn>>>设备(品类=${deviceType}/mac=${item!.addr}/信号=${item!.RSSI})信号小于${cusRSSI}被排除`)
        }
      }

      this.setData({ foundList: newFoundList })
    },
    onPageScroll() {
      // console.log(e.detail)
      // this.setData({
      //   scrollTop: e.detail.scrollTop,
      // })
      this.initDrag()
    },
    /**
     * 拖拽结束相关
     * @param e
     */
    async handleSortEnd(e: { detail: { listData: Remoter.DeviceRx[] } }) {
      // 更新列表数据
      remoterStore.saveRmStore(
        e.detail.listData.map((item, index) => ({
          ...item,
          orderNum: index,
        })),
      )
    },
    // 取消新手提示
    cancelTips() {
      this.setData({
        showTips: false,
      })
      storage.set('hasConfirmRemoterTips', true)
    },
    nextTips() {
      if (this.data.tipsStep === 1) {
        this.cancelTips()
      }
      this.setData({
        tipsStep: this.data.tipsStep + 1,
      })
    },
    getAccessCount() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this
      wx.batchGetStorage({
        keyList: ['REMOTERTOTALACCESS', 'REMOTERDAYACCESS', 'REMOTERMONTHACCESS', 'REMOTERACCESSDATE'],
        success(res: any) {
          const list = res.dataList
          that.setData({
            totalAccess: list[0] ? parseInt(list[0]) : 0,
            dayAccess: list[1] ? parseInt(list[1]) : 0,
            monthAccess: list[2] ? parseInt(list[2]) : 0,
            accessDate: list[3] ? parseInt(list[3]) : 0,
          })
          that.updateAccessCount()
        },
      })
    },
    updateAccessCount() {
      let total = this.data.totalAccess
      let dayCnt = this.data.dayAccess
      let monthCnt = this.data.monthAccess
      total++
      const now = new Date()
      const date = this.data.accessDate > 0 ? new Date(this.data.accessDate) : now
      if (date.getDate() === now.getDate()) dayCnt++
      else dayCnt = 1
      if (date.getMonth() === now.getMonth()) monthCnt++
      else monthCnt = 1
      this.setData({
        totalAccess: total,
        dayAccess: dayCnt,
        monthAccess: monthCnt,
      })
      this.setAccessCount()
      console.log('lmn>>>访问计数=', total, dayCnt, monthCnt, `@${now.toLocaleString()}`)
      wx.reportEvent('remoter_live', {
        rm_month_access: monthCnt,
        rm_day_access: dayCnt,
        rm_total_access: total,
        rm_live_type: 'access',
        rm_device_type: 'none',
      })
    },
    setAccessCount() {
      wx.batchSetStorage({
        kvList: [
          {
            key: 'REMOTERTOTALACCESS',
            value: `${this.data.totalAccess}`,
          },
          {
            key: 'REMOTERDAYACCESS',
            value: `${this.data.dayAccess}`,
          },
          {
            key: 'REMOTERMONTHACCESS',
            value: `${this.data.monthAccess}`,
          },
          {
            key: 'REMOTERACCESSDATE',
            value: `${new Date().valueOf()}`,
          },
        ],
      })
    },
    clearAddAndControlTemp(mac: string) {
      const temp = this.data.newAddTemp
      const index = temp.findIndex((item) => item.addr === mac)
      if (index >= 0) {
        wx.reportEvent('remoter_operate', {
          rm_total_control: 1,
          rm_device_model: temp[index].deviceModel,
          rm_device_type: temp[index].deviceType,
          rm_device_mac: temp[index].addr,
          rm_operate_type: 'add',
          rm_total_access: this.data.totalAccess,
        })
        temp.splice(index, 1)
        this.setData({
          newAddTemp: temp,
        })
      }
    },
  },
})
