import { ComponentWithStore } from 'mobx-miniprogram-bindings'
import { deviceStore, sceneStore, roomStore, homeStore } from '../../store/index'
import { runInAction } from 'mobx-miniprogram'
import pageBehavior from '../../behaviors/pageBehaviors'
import { sendDevice, execScene, saveDeviceOrder, queryGroup, queryAuthGetStatus } from '../../apis/index'
import Toast from '../../skyline-components/mz-toast/toast'
import {
  storage,
  emitter,
  WSEventType,
  rpx2px,
  _get,
  throttle,
  isConnect,
  verifyNetwork,
  Logger,
  strUtil,
} from '../../utils/index'
import {
  maxColorTemp,
  minColorTemp,
  proName,
  PRO_TYPE,
  LIST_PAGE,
  CARD_W,
  CARD_H,
  getModelName,
  CARD_REFRESH_TIME,
  sceneImgDir,
  defaultImgDir,
  MAX_DEVICES_USING_WS,
  NO_WS_REFRESH_INTERVAL,
  NO_UPDATE_INTERVAL,
  SCREEN_PID,
  ZHONGHONG_PID,
} from '../../config/index'
import homOs from 'js-homos'

type DeviceCard = Device.DeviceItem & {
  x: string
  y: string
  orderNum: number
  type: string
  select: boolean
  linkSceneName: string
  isRefresh: boolean // 是否整个列表刷新
  timestamp: number // 加入队列时打上的时间戳
  isScreen?: boolean
  isZhongHong?: boolean
  deleted: boolean
}

ComponentWithStore({
  behaviors: [pageBehavior],
  storeBindings: [
    {
      store: deviceStore,
      fields: ['deviceFlattenList'],
      actions: {},
    },
    {
      store: homeStore,
      fields: ['isManager'],
      actions: {},
    },
    {
      store: roomStore,
      fields: ['currentRoom'],
      actions: {},
    },
    {
      store: sceneStore,
      fields: ['sceneList'],
      actions: {},
    },
  ],
  /**
   * 页面的初始数据
   */
  data: {
    itemHeight: CARD_H,
    itemWidth: CARD_W,
    sceneImgDir,
    defaultImgDir,
    loading: true,
    _firstShow: true, // 是否首次进入
    _from: '', // 页面进入来源
    _updating: false, // 列表更新中标志
    _delayUpdateFlag: false, // 列表延迟更新标志
    // 更新等待队列
    _diffWaitlist: [] as DeviceCard[],
    // 待更新到视图的数据，便于多个更新合并到一次setData中（updateDeviceList专用）
    _diffCards: {
      data: {} as IAnyObject,
      created: 0, // 创建时间
    },
    _wait_timeout: null as null | number, // 卡片等待更新时间
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    toolboxTop: (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number), // 工具栏上边补白
    showPerfLog: (storage.get('show_perf_log') as boolean) ?? false,
    /** 展示点中离线设备弹窗 */
    showDeviceOffline: false,
    /** 点击的离线设备的信息 */
    offlineDevice: {} as DeviceCard,
    /** 弹层要控制的设备品类 */
    controlType: '',
    showAuthDialog: false, // 显示确权弹层
    deviceIdForQueryAuth: '', // 用于确权的设备id
    _cardEventType: '' as 'card' | 'control', // 触发确权前的操作类型
    // 设备卡片列表
    deviceCardList: [] as DeviceCard[],
    cardListConfig: {
      draggable: true,
      showShadow: true,
      showGradientBg: true,
      showControl: true,
    },
    /** 待创建面板的设备选择弹出框 */
    // scrollTop: 0,
    checkedList: [] as string[], // 已选择设备的id列表
    editMode: false, // 是否编辑状态
    checkedDeviceInfo: {} as DeviceCard, // 选中设备的数据
    deviceListInited: false, // 设备列表是否初始化完毕
    roomLight: {
      brightness: 0,
      colorTemperature: 0,
      maxColorTemp,
      minColorTemp,
      power: 0,
    },
    _timeId: null as null | number, // 自动刷新定时
    _delayTimeId: null as null | number, // 延时更新定时
    title: '',
    sceneListInBar: [] as Scene.SceneItem[],
    // eslint-disable-next-line
    colorTempFormatter: (_: number) => {}, // 房间亮度toast格式化
    hasRoomLightOn: false, // 房间灯光可控状态
    roomHasLight: false, // 房间存在可显示的灯具
    roomHasDevice: false, // 房间存在可显示的设备
    allSelectBtnText: '', // 设备批量选择按钮文字
    isLightSelectSome: false, // 是否选中灯具有，包括一个或多个
    toolboxContentHeight: 60, // 工具栏内容区域高度
    scrollViewHeight: '0px', // 可滚动区域高度
    isShowCommonControl: false, // 是否打开控制面板
  },
  observers: {
    currentRoom(currentRoom) {
      this.setData({
        title: currentRoom?.roomName ?? '',
      })
    },
    roomLight(roomLight) {
      const { maxColorTemp, minColorTemp } = roomLight
      this.setData({
        colorTempFormatter: (value: number) =>
          `${Math.round((value / 100) * (maxColorTemp - minColorTemp) + minColorTemp)}K`,
      })
    },
    'deviceCardList.**, editMode'(deviceCardList: DeviceCard[], editMode) {
      const deviceList = deviceCardList.filter((d) => !d.deleted)
      Logger.trace('[observers]deviceList', deviceList)
      const hasRoomLightOn = deviceList.some(
        (d) => !!(d.proType === PRO_TYPE.light && d.mzgdPropertyDTOList['light'].power),
      )
      const roomHasLight = deviceList.some((d) => !!(d.proType === PRO_TYPE.light))
      const roomHasDevice = !!deviceList?.length
      const toolboxContentHeight = roomHasLight ? 150 : 60
      let baseHeight =
        (storage.get('windowHeight') as number) -
        (storage.get('statusBarHeight') as number) -
        (storage.get('navigationBarHeight') as number) -
        (storage.get('bottomBarHeight') as number) -
        toolboxContentHeight
      if (editMode) {
        baseHeight -= rpx2px(298)
      }
      const scrollViewHeight = baseHeight + 'px'
      this.setData({
        hasRoomLightOn,
        roomHasLight,
        roomHasDevice,
        toolboxContentHeight,
        scrollViewHeight,
        'cardListConfig.showControl': !editMode,
      })
    },
    checkedList(checkedList) {
      const { deviceMap } = deviceStore
      const allSelectBtnText = checkedList?.length > 0 ? '全不选' : '全选'
      const isLightSelectSome = checkedList?.some(
        (uniId: string) => uniId.indexOf(':') === -1 && deviceMap[uniId].proType === PRO_TYPE.light,
      )
      this.setData({
        allSelectBtnText,
        isLightSelectSome,
      })
    },
    controlType(controlType) {
      this.setData({
        isShowCommonControl:
          controlType &&
          (controlType === PRO_TYPE.light ||
            controlType === PRO_TYPE.switch ||
            controlType === PRO_TYPE.gateway ||
            controlType === PRO_TYPE.curtain ||
            controlType === PRO_TYPE.sensor),
      })
    },
    sceneList(sceneList) {
      this.setData({
        sceneListInBar: sceneList?.slice(0, 4) ?? [],
      })
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    async onLoad(query: { from?: string }) {
      Logger.log('[room-onLoad]', query)
      this.data._from = query.from ?? ''

      if (this.data.showPerfLog) {
        this.setUpdatePerformanceListener({ withDataPaths: true }, (res) => {
          Logger.debug(
            '[Performance]',
            '等待时长：',
            res.updateStartTimestamp - res.pendingStartTimestamp,
            '执行时长：',
            res.updateEndTimestamp - res.updateStartTimestamp,
            res.dataPaths ?? '',
          )
        })
      }
    },

    async onShow() {
      Logger.log('room-onShow, _firstShow', this.data._firstShow)

      verifyNetwork() // 先主动查一次；不等待结果

      // 首次进入
      if (this.data._firstShow && this.data._from !== 'addDevice') {
        this.updateQueue({ isRefresh: true })
        this.queryGroupInfo()
        this.autoRefreshDevice()
      }
      // 如果从配网页面返回
      else {
        this.reloadDeviceList()
      }

      this.data._firstShow = false

      emitter.on('deviceListRetrieve', () => {
        console.log('deviceListRetrieve，isConnect', isConnect())
        this.reloadDataThrottle()
      })

      // 当全屋列表更新时，房间列表数据也主动同步
      emitter.on('roomDeviceSync', () => {
        this.updateQueue({ isRefresh: true })
      })

      emitter.on('device_property', (eventData: IAnyObject) => {
        if (!eventData.isMqtt) return

        const device = {} as DeviceCard
        device.deviceId = eventData.deviceId
        device.mzgdPropertyDTOList = {}
        device.mzgdPropertyDTOList[eventData.modelName] = {
          ...eventData.event,
        }
        // console.log('☄ [index][isMqtt]', device)

        this.updateQueue(device)
      })

      // ws消息处理
      emitter.on('wsReceive', async (e) => {
        // console.log('☄ [index]wsReceive', e)
        const { eventType, eventData } = e.result

        // 特别地，绑定设备的消息无法带房间id
        if (eventType === WSEventType.bind_device) {
          this.reloadDeviceListThrottle(e)
          return
        }

        // 过滤非本房间的消息
        if (eventData.roomId && eventData.roomId !== roomStore.currentRoomId) {
          return
        }

        if (eventType === WSEventType.updateHomeDataLanInfo) {
          const isConnected = isConnect()
          this.updateQueue({ isRefresh: true, onLineStatus: isConnected ? 1 : 0 })
          return
        }

        // 出现控制失败，控制与消息的对应关系已不可靠，刷新整体数据
        if (eventType === WSEventType.control_fail) {
          this.reloadDataThrottle()
          return
        }

        if (eventType === WSEventType.device_property) {
          // 组装要更新的设备数据，更新的为flatten列表，结构稍不同
          const device = {} as DeviceCard
          device.deviceId = eventData.deviceId
          device.uniId = `${eventData.deviceId}:${eventData.modelName}`
          device.mzgdPropertyDTOList = {}
          device.mzgdPropertyDTOList[eventData.modelName] = {
            ...eventData.event,
          }

          this.updateQueue(device)

          return
        }
        // 更新设备在线状态
        // 网关 device_online_status；WIFI设备 screen_online_status_wifi_device
        // 子设备 screen_online_status_sub_device
        else if (
          eventType === WSEventType.device_online_status ||
          eventType === WSEventType.device_offline_status ||
          eventType === WSEventType.screen_online_status_sub_device ||
          eventType === WSEventType.screen_online_status_wifi_device
        ) {
          const { deviceId, status } = eventData
          const deviceInRoom = deviceStore.deviceMap[deviceId]
          if (!deviceInRoom || deviceInRoom.onLineStatus === status) {
            return
          }
          // 更新状态
          runInAction(() => {
            deviceInRoom.onLineStatus = status
          })
          // 更新视图
          const modelName = getModelName(deviceInRoom.proType, deviceInRoom.productId)
          const device = {} as DeviceCard
          device.deviceId = deviceId
          device.uniId = modelName ? `${deviceId}:${modelName}` : deviceId
          device.onLineStatus = status
          this.updateQueue(device)
        }
        // 节流更新本地数据
        else if (
          [
            WSEventType.device_replace,
            WSEventType.group_upt,
            WSEventType.group_add,
            // WSEventType.group_device_result_status,
            // WSEventType.device_del,
          ].includes(eventType)
        ) {
          this.reloadDeviceListThrottle(e)
        } else if (eventType === WSEventType.room_del && eventData.roomId === roomStore.currentRoomId) {
          // 房间被删除，退出到首页
          await homeStore.updateRoomCardList()
          wx.redirectTo({
            url: '/pages/index/index',
          })
        }
      })
    },

    async onReady() {
      this.setData({
        loading: false,
      })
    },

    // 响应控制弹窗中单灯/灯组的控制变化，直接按本地设备列表数值以及设置值，刷新房间灯的状态
    refreshLightStatus() {
      let sumOfBrightness = 0,
        sumOfColorTemp = 0,
        count = 0,
        brightness = 0,
        colorTemperature = 0

      // 房间所有灯的亮度计算
      deviceStore.deviceFlattenList.forEach((device) => {
        const { proType, deviceType, mzgdPropertyDTOList, onLineStatus } = device

        // 只需要灯需要参与计算，过滤属性数据不完整的数据，过滤灯组，过滤不在线设备，过滤未开启设备
        if (
          proType !== PRO_TYPE.light ||
          deviceType === 4 ||
          onLineStatus !== 1 ||
          mzgdPropertyDTOList?.light?.power !== 1
        ) {
          return
        }

        sumOfBrightness += mzgdPropertyDTOList.light?.brightness ?? 0
        sumOfColorTemp += mzgdPropertyDTOList.light?.colorTemperature ?? 0
        count++
      })

      if (count) {
        brightness = sumOfBrightness / count
        colorTemperature = sumOfColorTemp / count
      }

      console.log('本地更新房间灯状态', { brightness, colorTemperature })

      this.setData({
        'roomLight.brightness': brightness,
        'roomLight.colorTemperature': colorTemperature,
      })
    },

    // 查询房间分组详情
    async queryGroupInfo() {
      const res = await queryGroup({ groupId: roomStore.currentRoom.groupId })
      if (res.success) {
        const roomStatus = res.result.controlAction[0]
        const { colorTempRangeMap } = res.result
        this.setData({
          roomLight: {
            brightness: roomStatus.brightness,
            colorTemperature: roomStatus.colorTemperature,
            maxColorTemp: colorTempRangeMap.maxColorTemp,
            minColorTemp: colorTempRangeMap.minColorTemp,
            power: roomStatus.power,
          },
        })
      }
    },

    async reloadData() {
      Logger.log('[reloadData]isConnect:', isConnect())
      // 未连接网络，所有设备直接设置为离线
      if (!isConnect()) {
        this.updateQueue({ isRefresh: true, onLineStatus: 0 })
        deviceStore.updateAllRoomDeviceOnLineStatus(false)
        return
      }

      try {
        this.reloadDeviceListThrottle()

        sceneStore.updateAllRoomSceneList()

        this.queryGroupInfo()

        this.autoRefreshDevice()
      } finally {
        wx.stopPullDownRefresh()
      }
    },

    // 只单独更新列表
    async reloadDeviceList() {
      Logger.log('[Only ReloadDeviceList]', isConnect())
      // 未连接网络，所有设备直接设置为离线
      if (!isConnect()) {
        this.updateQueue({ isRefresh: true, onLineStatus: 0 })
        deviceStore.updateAllRoomDeviceOnLineStatus(false)
        return
      }

      await deviceStore.updateRoomDeviceList()

      this.updateQueue({ isRefresh: true })

      this.queryGroupInfo()
    },

    // 节流更新房间各种关联信息
    reloadDataThrottle: throttle(function (this: IAnyObject) {
      this.reloadData()
    }, 4000),

    // 节流更新设备列表
    reloadDeviceListThrottle: throttle(function (this: IAnyObject) {
      this.reloadDeviceList()
    }, 3000),

    // 页面滚动
    // onPageScroll(e: { detail: { scrollTop: number } }) {
    //   this.data.scrollTop = e?.detail?.scrollTop || 0
    // },
    clearJobs() {
      console.log('[room onHide/onUnload] clear()')
      // 解除监听
      emitter.off('wsReceive')
      emitter.off('deviceListRetrieve')
      emitter.off('roomDeviceSync')
      emitter.off('device_property')

      if (this.data._wait_timeout) {
        clearTimeout(this.data._wait_timeout)
        this.data._wait_timeout = null
      }

      if (this.data._timeId) {
        clearTimeout(this.data._timeId)
        this.data._timeId = null
      }

      if (this.data._delayTimeId) {
        clearTimeout(this.data._delayTimeId)
        this.data._delayTimeId = null
      }
    },

    onUnload() {
      this.clearJobs()
    },
    onHide() {
      this.clearJobs()
    },
    handleShowDeviceOffline(e: { detail: DeviceCard }) {
      console.log('isSupportLan', e.detail, homOs.isSupportLan({ deviceId: e.detail.deviceId }))

      const deviceInfo = e.detail

      this.setData({
        showDeviceOffline: true,
        offlineDevice: {
          ...deviceInfo,
          isScreen: SCREEN_PID.includes(deviceInfo.productId),
          isZhongHong: ZHONGHONG_PID.includes(deviceInfo.productId),
        },
      })
    },
    handleCloseDeviceOffline() {
      this.setData({
        showDeviceOffline: false,
      })
    },
    // 根据场景信息，比较出关联场景名字
    getLinkSceneName(device: Device.DeviceItem) {
      if (device?.proType !== PRO_TYPE.switch) {
        return ''
      }
      const switchId = device.uniId.split(':')[1]
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      const sceneIdMap = sceneStore.sceneIdMap
      const uId = `${device.deviceId}:${switchId}`

      if (
        switchSceneConditionMap[uId] &&
        sceneIdMap[switchSceneConditionMap[uId]] &&
        sceneIdMap[switchSceneConditionMap[uId]].sceneName
      ) {
        return sceneIdMap[switchSceneConditionMap[uId]].sceneName.slice(0, 4)
      }
      return ''
    },
    /**
     * @description 初始化或更新设备列表
     * @param e 设备对象属性
     */
    async updateDeviceList(e?: DeviceCard) {
      if (!e) {
        this.data._updating = false
        return
      }

      // 单项更新
      if (!e.isRefresh) {
        const device = e as DeviceCard
        let originDevice: DeviceCard

        const index = this.data.deviceCardList.findIndex((d: DeviceCard) => {
          if (d.proType === PRO_TYPE.switch) {
            return d.uniId === device!.uniId
          } else {
            return d.deviceId === device!.deviceId
          }
        })

        if (index !== -1) {
          originDevice = this.data.deviceCardList[index]
          // const diffData = {} as IAnyObject
          // Review 细致到字段的diff
          const renderList = ['deviceName', 'onLineStatus'] // 需要刷新界面的字段

          renderList.forEach((key) => {
            const newVal = _get(device!, key)
            const originVal = _get(originDevice, key)
            // 进一步检查，过滤确实有更新的字段
            if (newVal !== undefined && newVal !== originVal) {
              this.data._diffCards.data[`deviceCardList[${index}].${key}`] = newVal
            }
          })

          const modelName =
            originDevice.proType === PRO_TYPE.switch
              ? originDevice.uniId.split(':')[1]
              : getModelName(originDevice.proType, originDevice.productId)

          // 如果mzgdPropertyDTOList、switchInfoDTOList字段存在，则覆盖更新
          if (device!.mzgdPropertyDTOList) {
            let newVal
            // 485设备，拆分为多条单属性上报
            const cache = this.data._diffCards.data[`deviceCardList[${index}].mzgdPropertyDTOList.${modelName}`]
            if (cache) {
              newVal = {
                ...cache,
                ...device?.mzgdPropertyDTOList[modelName],
              }
            } else {
              newVal = {
                ...originDevice.mzgdPropertyDTOList[modelName],
                ...device?.mzgdPropertyDTOList[modelName],
              }
            }

            this.data._diffCards.data[`deviceCardList[${index}].mzgdPropertyDTOList.${modelName}`] = newVal
          }
          // 更新面板、按键信息
          if (device!.switchInfoDTOList) {
            const newVal = {
              ...originDevice.switchInfoDTOList[0],
              ...device?.switchInfoDTOList[0],
            }
            this.data._diffCards.data[`deviceCardList[${index}].switchInfoDTOList[0]`] = newVal
          }
          // 更新场景关联信息
          const linkSceneName = this.getLinkSceneName({
            ...device!,
            proType: originDevice.proType, // 补充关键字段
          })
          if (linkSceneName !== originDevice.linkSceneName) {
            this.data._diffCards.data[`deviceCardList[${index}].linkSceneName`] = linkSceneName
          }

          // 如果控制弹框为显示状态，则同步选中设备的状态
          // 因为【灯】异常推送较多，暂时不对弹框中的设备状态进行更新
          // 因为【窗帘】需要等待轨道运行，推送迟缓，不对弹框中的设备状态进行更新
          if (
            device!.mzgdPropertyDTOList &&
            this.data.checkedList.includes(originDevice!.deviceId) &&
            originDevice!.select &&
            (originDevice.proType === PRO_TYPE.bathHeat || originDevice.proType === PRO_TYPE.clothesDryingRack)
          ) {
            const newVal = {
              ...originDevice,
              ...device,
              ...device.mzgdPropertyDTOList[modelName], // 设备属性扁平化（一维、冗余），以便与场景弹框统一逻辑
            }
            this.data._diffCards.data.checkedDeviceInfo = newVal
          }

          // 处理更新逻辑
          if (Object.keys(this.data._diffCards.data).length) {
            const now = new Date().getTime()
            if (!this.data._diffCards.created) {
              this.data._diffCards.created = now
            }
            const wait = now - this.data._diffCards.created
            if (wait >= CARD_REFRESH_TIME && device.timestamp) {
              // 先清空已有的更新等待
              if (this.data._wait_timeout) {
                clearTimeout(this.data._wait_timeout)
                this.data._wait_timeout = null
              }
              this.setData(this.data._diffCards.data)
              this.data._diffCards = {
                data: {},
                created: 0,
              }
              Logger.debug('▤ [%s] 更新完成，已等待 %sms', index, wait)
            } else {
              console.log('▤ [%s] 更新推迟，已等待 %sms', index, wait)
            }
          } else {
            console.log('▤ [%s] diffData为空，不必更新', index)
          }
        }
      }
      // 整个列表更新
      else {
        const flattenList = deviceStore.deviceFlattenList

        // 如果为空则不初始化
        // if (!flattenList.length) {
        //   this.data._updating = false
        //   return
        // }

        const _list = flattenList
          // 接口返回开关面板数据以设备为一个整体，需要前端拆开后排序
          // 补充字段
          .map((device, index) => {
            const select = this.data.checkedList.includes(device.uniId)
            return {
              ...device,
              id: device.uniId,
              // !! 重排orderNum，从1开始
              // TRICK 排序过程orderNum代替index使用，而不必改变数组的真实索引
              orderNum: index + 1,
              type: proName[device.proType],
              tag: device.deviceType === 4 ? 'group' : 'single', // 可排序标识
              select,
              linkSceneName: this.getLinkSceneName(device),
              onLineStatus: e.onLineStatus ?? device.onLineStatus, // 传参数直接设置指定的在线离线状态
            }
          })

        if (!this.data.deviceListInited) {
          Logger.debug('▤ [updateDeviceList] 列表初始化')
        }
        // !! 整个列表刷新
        else {
          Logger.debug('▤ [updateDeviceList] 列表重新加载')
        }

        const oldListLength = this.data.deviceCardList.length
        const newListLength = _list.length

        // 分批渲染
        for (let groupIndex = 0; _list.length > 0; ++groupIndex) {
          const group = _list.splice(0, LIST_PAGE)
          const diffData = {} as IAnyObject
          for (let index = 0; index < group.length; ++index) {
            diffData[`deviceCardList[${index + groupIndex * LIST_PAGE}]`] = group[index]
          }
          this.setData(diffData)
        }

        // 直接清空旧列表，再重新加载会引起闪烁，此处只清空‘旧列表比新列表多出的项’
        if (oldListLength > newListLength) {
          const diffData = {} as IAnyObject
          for (let index = newListLength; index < oldListLength; ++index) {
            diffData[`deviceCardList[${index}]`] = { deleted: true }
          }
          this.setData(diffData)
        }

        if (!this.data.deviceListInited) {
          this.setData({
            deviceListInited: true,
          })
        }

        Logger.debug('▤ [updateDeviceList] 列表更新完成', this.data.deviceCardList)
      }

      // 模拟堵塞任务执行
      // await delay(100)
      // console.log('▤ [updateDeviceList] Ended', this.data._diffWaitlist.length)

      // 恢复更新标志
      this.data._updating = false
      // 如果等待列表不为空，则递归执行
      if (this.data._diffWaitlist.length) {
        this.updateQueue()
      }
      // 如果等待列表已空，则节流执行视图更新
      else if (Object.keys(this.data._diffCards.data).length) {
        if (this.data._wait_timeout) {
          clearTimeout(this.data._wait_timeout)
          this.data._wait_timeout = null
        }
        this.data._wait_timeout = setTimeout(() => {
          this.setData(this.data._diffCards.data)
          console.log('▤ 清空更新队列', this.data._diffCards.data)
          this.data._diffCards = {
            data: {},
            created: 0,
          }
        }, CARD_REFRESH_TIME)
      }
    },

    /**
     * @description 引入任务队列处理列表更新，对更新动作进行节流、队列处理
     * @param e 设备属性 | 包裹在事件中的设备属性 | 空对象（表示全量更新）| 不传值则执行下一个
     */
    async updateQueue(e?: (DeviceCard & { detail?: DeviceCard }) | Optional<DeviceCard>) {
      if (e) {
        let device: DeviceCard

        // 如果是包裹在事件中的设备属性，则简化结构
        if (Object.prototype.hasOwnProperty.call(e, 'detail')) {
          const { detail } = e as { detail: DeviceCard }
          device = detail
        }
        // e：设备属性 |
        else {
          device = e as DeviceCard
        }

        // 未初始化完毕不接受单独更新，所有初始化完成前的更新将被丢弃
        if (!this.data.deviceListInited && !device.isRefresh) {
          console.log('▤ [No deviceListInited, updateQueue Quit]')
          return
        }

        const timestamp = new Date().getTime()
        this.data._diffWaitlist.push({ ...device, timestamp })
        if (this.data._diffWaitlist.length > 1) {
          console.log('▤ [updateQueue Pushed] Queue Len:', this.data._diffWaitlist.length)
        }
      }

      // 未在更新中
      if (!this.data._updating) {
        const diff = this.data._diffWaitlist.shift() // 从队首取一个执行
        this.data._updating = true

        if (this.data._delayTimeId) {
          clearTimeout(this.data._delayTimeId)
        }

        this.data._delayUpdateFlag = true
        this.data._delayTimeId = setTimeout(() => {
          this.data._delayUpdateFlag = false
          this.data._delayTimeId = null
          Logger.log('setTimeout _delayUpdateFlag', this.data._delayUpdateFlag)
        }, NO_UPDATE_INTERVAL)

        this.updateDeviceList(diff)
      }
    },

    // 基于云端更新数据
    async updateRoomListOnCloud() {
      await deviceStore.updateRoomDeviceList()
      this.updateQueue({ isRefresh: true })
    },

    /**
     * @description 更新选中状态并渲染
     * @param uniId
     * @param toCheck 可选，若指定则设为指定状态；若不指定则置反
     */
    toSelect(uniId: string, toCheck?: boolean) {
      const index = this.data.deviceCardList.findIndex((d) => d.uniId === uniId)
      if (index !== -1) {
        const diffData = {} as IAnyObject
        diffData[`deviceCardList[${index}].select`] = toCheck ?? !this.data.deviceCardList[index].select
        console.log(diffData)
        this.setData(diffData)
      }
    },

    // 保存排序结果
    async handleSortSaving(e: WechatMiniprogram.CustomEvent<{ isMoved: boolean; list: DeviceCard[] }>) {
      const { isMoved, list } = e.detail
      if (!isMoved) return // 未移动，不作保存

      const deviceOrderData = {
        deviceInfoByDeviceVoList: [],
      } as Device.OrderSaveData
      const switchOrderData = {
        deviceInfoByDeviceVoList: [],
      } as Device.OrderSaveData

      const diffData = {} as IAnyObject

      for (const index in list) {
        const device = list[index]
        if (device.orderNum === this.data.deviceCardList[index].orderNum) continue

        if (device.proType !== PRO_TYPE.switch) {
          deviceOrderData.deviceInfoByDeviceVoList.push({
            deviceId: device.deviceId,
            houseId: homeStore.currentHomeId,
            roomId: device.roomId,
            orderNum: String(device.orderNum),
            type: device.deviceType === 4 ? '2' : '0', // 灯组为2，普通设备为0
          })
        }
        // 若开关按键参与排序，需要按 type: '1' 再保存
        else {
          switchOrderData.deviceInfoByDeviceVoList.push({
            deviceId: device.deviceId,
            houseId: homeStore.currentHomeId,
            roomId: device.roomId,
            orderNum: String(device.orderNum),
            switchId: device.switchInfoDTOList[0].switchId,
            type: '1',
          })
        }
        diffData[`deviceCardList[${index}].orderNum`] = device.orderNum
      }
      if (deviceOrderData.deviceInfoByDeviceVoList.length) {
        await saveDeviceOrder(deviceOrderData)
      }
      if (switchOrderData.deviceInfoByDeviceVoList.length) {
        await saveDeviceOrder(switchOrderData)
      }
      // 统一视图列表变量
      this.setData(diffData)
      // console.log('[handleSortSaving]', diffData)
    },

    handleSceneTap() {
      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-automation/automation/index', {
          selectedRoomId: roomStore.currentRoomId,
        }),
      })
    },
    /** 点击创建场景按钮回调 */
    handleCollect() {
      if (this.data.isVisitor) {
        Toast('仅创建者与管理员可创建场景')
        return
      }

      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-automation/automation-add/index', {
          roomid: roomStore.currentRoomId,
        }),
      })
    },

    /**
     * 区分控制卡片事件，是直接控制，还是点卡片呼出弹窗
     * TODO 进一步简化事件间的调用关系，尽量扁平，减少多层嵌套
     */
    cardTap(e: { detail: DeviceCard & { clientRect: WechatMiniprogram.ClientRect; type: string } }) {
      const { type } = e.detail
      if (this.data.editMode) {
        this.handleCardTap(e)
        return
      }
      if (type === 'offline') {
        this.handleShowDeviceOffline(e)
      } else if (type === 'card') {
        this.handleCardTap(e)
      } else if (type === 'control') {
        this.queryAuthBeforeControlTap(e)
      }
    },

    /**
     * @description 卡片点击事件处理
     * @param e 设备属性
     */
    async handleCardTap(e: { detail: DeviceCard & { clientRect: WechatMiniprogram.ClientRect } }) {
      // 如果在编辑状态，则选择或取消选择卡片
      if (this.data.editMode) {
        this.handleCardEditSelect(e)
        return
      }
      // 不在编辑状态，如果是WIFI设备
      else if (
        e.detail.deviceType === 3 &&
        e.detail.onLineStatus &&
        (e.detail.authStatus === 1 || e.detail.authStatus === 2)
      ) {
        const { deviceId } = e.detail
        const res = await queryAuthGetStatus({ houseId: homeStore.currentHomeId, deviceId })
        // 若设备未确权、待确权，则弹出指引弹窗
        if (!res.success) {
          Toast('设备确权异常')
          return
        } else if (res.result.status === 1 || res.result.status === 2) {
          this.setData({ showAuthDialog: true, deviceIdForQueryAuth: deviceId })
          this.data._cardEventType = 'card'
          return
        }
      }

      // 其余情况正常响应点击
      this.handleCardCommonTap(e)
    },

    handleAuthSuccess() {
      const detail = deviceStore.deviceList.find((d) => d.deviceId === this.data.deviceIdForQueryAuth) as DeviceCard

      if (this.data._cardEventType === 'card') {
        this.handleCardCommonTap({ detail })
      } else {
        this.handleControlTap({ detail })
      }
      this.setData({ showAuthDialog: false })
    },

    handleAuthCancel() {
      this.setData({ showAuthDialog: false })
    },

    // 编辑模式下再点选
    handleCardEditSelect(e: { detail: DeviceCard }) {
      const device = e.detail
      const { uniId } = device
      const toCheck = !this.data.checkedList.includes(uniId)
      const list = [...this.data.checkedList]

      // 未选中，则追加到已选中列表
      if (toCheck) {
        list.push(uniId)
      }
      // 从列表中移除
      else {
        const index = list.findIndex((id) => uniId === id)
        list.splice(index, 1)
      }

      // 选择样式渲染
      // this.toSelect(uniId)

      this.setData({
        checkedList: list,
      })

      console.log('handleCardEditSelect', list)
    },

    /**
     * @description 编辑状态全选/全不选
     * @param e
     */
    editSelectAll(e: { detail: boolean }) {
      const toCheckAll = e.detail
      const diffData = {} as IAnyObject
      diffData.checkedList = toCheckAll ? deviceStore.deviceFlattenList.map((device) => device.uniId) : []
      this.data.deviceCardList.forEach((device, index) => {
        // 如果状态已是一样，则不放diff，减少数据的变更
        if (device.select !== toCheckAll) {
          diffData[`deviceCardList[${index}].select`] = toCheckAll
        }
      })

      this.setData(diffData)
    },

    handleCardCommonTap(e: { detail: DeviceCard }) {
      // console.log('e.detail', e.detail)
      const { uniId } = e.detail // 灯的 deviceId===uniId
      console.log('isSupportLan', e.detail.deviceId, homOs.isSupportLan({ deviceId: e.detail.deviceId }))
      const isChecked = this.data.checkedList.includes(uniId) // 点击卡片前，卡片是否选中
      const toCheck = !isChecked // 本次点击需执行的选中状态

      // 取消旧选择
      // if (toCheck && this.data.checkedList.length) {
      // const oldCheckedId = this.data.checkedList[0]
      // this.toSelect(oldCheckedId)
      // }

      // 选择样式渲染
      // this.toSelect(uniId)

      const diffData = {} as IAnyObject

      // 选择项，只能单选，但仍沿用数组的形式
      this.data.checkedList = toCheck ? [uniId] : []

      // 选择卡片时，同步设备状态到控制弹窗
      if (toCheck) {
        const modelName = getModelName(e.detail.proType, e.detail.productId)
        diffData.checkedDeviceInfo = {
          ...e.detail,
          ...e.detail.mzgdPropertyDTOList[modelName],
        }
      }

      // 合并数据变化
      diffData.checkedList = [...this.data.checkedList]
      diffData.controlType = e.detail.proType

      // 更新视图
      this.setData(diffData)

      // 弹起popup后，选中卡片滚动到视图中央，以免被遮挡
      // type: DeviceCard & { clientRect: WechatMiniprogram.ClientRect }
      // 作用不大，减小渲染压力，暂时注释
      // this.setData({
      //   scrollTop: this.data.scrollTop + e.detail.clientRect.top - this.data.scrollViewHeight / 2,
      // })
    },

    /**
     * @description 卡片控制事件处理
     * @param e 设备属性
     */
    async queryAuthBeforeControlTap(e: { detail: DeviceCard }) {
      // 如果是WIFI设备，设备在线
      if (
        e.detail.deviceType === 3 &&
        e.detail.onLineStatus &&
        (e.detail.authStatus === 1 || e.detail.authStatus === 2)
      ) {
        const { deviceId } = e.detail
        const res = await queryAuthGetStatus({ houseId: homeStore.currentHomeId, deviceId })
        // 若设备未确权、待确权，则弹出指引弹窗
        if (res.result.status === 1 || res.result.status === 2) {
          this.setData({ showAuthDialog: true, deviceIdForQueryAuth: deviceId })
          this.data._cardEventType = 'control'
          return
        }
      }

      // 其余情况正常响应控制事件
      this.handleControlTap(e)
    },

    // 卡片点击时，按品类调用对应方法
    async handleControlTap(e: { detail: DeviceCard }) {
      const device = { ...e.detail }
      const modelName = device.switchInfoDTOList
        ? device.switchInfoDTOList[0].switchId
        : getModelName(device.proType, device.productId)

      // 若面板关联场景
      if (device.proType === PRO_TYPE.switch && device.mzgdPropertyDTOList[modelName].ButtonMode === 2) {
        const sceneId = deviceStore.switchSceneConditionMap[device.uniId]
        if (sceneId) {
          execScene(sceneId)
        }
        return
      }

      // 窗帘
      if (device.proType === PRO_TYPE.curtain) {
        const OldPosition = device.mzgdPropertyDTOList[modelName].curtain_position
        const NewPosition = Number(OldPosition) > 0 ? '0' : '100'
        const res = await sendDevice({
          proType: device.proType,
          deviceType: device.deviceType,
          deviceId: device.deviceId,
          property: { curtain_position: NewPosition },
        })

        if (!res.success) {
          Toast('控制失败')
        }
        return
      }

      // 灯和面板、空调
      const OldOnOff = device.mzgdPropertyDTOList[modelName].power
      const newOnOff = OldOnOff ? 0 : 1

      // 不等待云端，即时改变视图，提升操作手感 // TODO 不插入队列
      device.mzgdPropertyDTOList[modelName].power = newOnOff
      this.updateQueue(device)

      const res = await sendDevice({
        proType: device.proType,
        deviceType: device.deviceType,
        deviceId: device.deviceId,
        modelName,
        gatewayId: device.gatewayId,
        property: { power: newOnOff },
      })

      if (!res.success) {
        device.mzgdPropertyDTOList[modelName].power = OldOnOff
        this.updateQueue(device)

        Toast('控制失败')
      }
    },
    /** 点击空位的操作 */
    handleScreenTap() {
      this.cancelCheckAndPops()
    },
    /** 取消单选，收起弹窗 */
    cancelCheckAndPops() {
      // 有选中项才执行置反操作
      if (!this.data.controlType) {
        return
      }

      // 更新选中状态样式
      const deviceId = this.data.checkedList[0]
      this.toSelect(deviceId, false)

      // 收起弹窗
      this.setData({
        checkedList: [],
        controlType: '',
      })
    },
    // 进入拖动模式的同时，进入编辑状态
    handleEditMode(e: { detail: DeviceCard & { clientRect: WechatMiniprogram.ClientRect } }) {
      // 已是编辑状态，不重复操作
      if (this.data.editMode) {
        return
      }
      // 只有创建者或者管理员能够进入编辑模式
      if (!this.data.isManager) {
        return
      }

      const device = e.detail
      const diffData = {} as IAnyObject

      // 进入编辑模式
      diffData.editMode = true

      // 选中当前长按卡片
      diffData.checkedList = [device.uniId]

      // 取消普通选择
      if (this.data.checkedList?.length) {
        this.handleScreenTap()
      }
      this.setData(diffData)

      // this.toSelect(device.uniId, true)

      // 弹起popup后，选中卡片滚动到视图中央，以免被遮挡
      // this.setData({
      //   scrollTop: this.data.scrollTop + e.detail.clientRect.top - this.data.scrollViewHeight / 2,
      // })

      console.log('handleEditMode', e.detail, diffData)
    },

    exitEditMode() {
      this.setData({
        editMode: false,
        checkedList: [],
      })
      this.editSelectAll({ detail: false })
    },

    async handleAddDevice() {
      const res = await wx.getNetworkType()
      if (res.networkType === 'none') {
        Toast('当前无法连接网络\n请检查网络设置')
        return
      }
      wx.navigateTo({ url: '/package-distribution/pages/choose-device/index' })
    },
    // ! 目前只有网关离线卡片会有重新联网操作
    handleRebindGateway() {
      const gateway = deviceStore.allRoomDeviceMap[this.data.offlineDevice.deviceId]
      wx.navigateTo({
        url: `/package-distribution/pages/wifi-connect/index?type=changeWifi&sn=${gateway.sn}`,
      })
    },
    handleLevelEnd(e: { detail: number }) {
      this.setData({
        'roomLight.brightness': e.detail,
      })
      this.lightSendDeviceControl('brightness')
    },
    handleColorTempEnd(e: { detail: number }) {
      this.setData({
        'roomLight.colorTemperature': e.detail,
      })
      this.lightSendDeviceControl('colorTemperature')
    },
    handleRoomLightTouch() {
      if (!this.data.hasRoomLightOn) {
        Toast('控制房间色温和亮度前请先开启灯')
      }
    },
    async lightSendDeviceControl(type: 'colorTemperature' | 'brightness') {
      const deviceId = roomStore.currentRoom.groupId

      const res = await sendDevice({
        proType: PRO_TYPE.light,
        deviceType: 4,
        deviceId,
        property: {
          [type]: this.data.roomLight[type],
        },
      })

      if (!res.success) {
        Toast('控制失败')
      }
    },
    // 定时更新设备列表，符合条件则递归执行
    autoRefreshDevice() {
      Logger.log('[autoRefreshDevice]devices amount:', deviceStore.allRoomDeviceList.length)

      if (deviceStore.allRoomDeviceList.length < MAX_DEVICES_USING_WS) {
        if (this.data._timeId) {
          clearTimeout(this.data._timeId)
          this.data._timeId = null
        }
        return
      }

      if (this.data._timeId) {
        clearTimeout(this.data._timeId)
      }
      this.data._timeId = setTimeout(() => {
        // 如果最近刚更新过，则本次自动更新跳过
        if (!this.data._delayUpdateFlag) {
          this.reloadDeviceList()
        }
        this.autoRefreshDevice()
      }, NO_WS_REFRESH_INTERVAL)
    },
  },
})
