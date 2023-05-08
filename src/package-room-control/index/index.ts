import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import {
  userBinding,
  roomBinding,
  deviceBinding,
  sceneBinding,
  homeBinding,
  deviceStore,
  sceneStore,
  roomStore,
  homeStore,
} from '../../store/index'
import { runInAction } from 'mobx-miniprogram'
import createRecycleContext from 'miniprogram-recycle-view'
import pageBehavior from '../../behaviors/pageBehaviors'
import { controlDevice, saveDeviceOrder, execScene } from '../../apis/index'
import Toast from '@vant/weapp/toast/toast'
import { showLoading, hideLoading, storage, emitter, WSEventType, rpx2px } from '../../utils/index'
import { maxColorTempK, minColorTempK, proName, proType } from '../../config/index'

/** 接口请求节流定时器，定时时间2s */
let requestThrottleTimer = 0
let hasUpdateInRequestTimer = false
/** 界面更新节流定时器，定时时间500ms */
let updateThrottleTimer = 0
let hasUpdateInUpdateTimer = false

// FIXME recycle-view 已有类型定义，但引用异常
// @ts-ignore
let ctx: recycleContext.RecycleContext

ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [userBinding, roomBinding, deviceBinding, sceneBinding, homeBinding] }),
    pageBehavior,
  ],
  /**
   * 页面的初始数据
   */
  data: {
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    /** 展示点中离线设备弹窗 */
    showDeviceOffline: false,
    /** 点击的离线设备的信息 */
    officeDeviceInfo: {} as Device.DeviceItem,
    /** 控制面板 */
    controlPopup: true,
    /** 弹出控制面板时，页面底部留出空位 */
    popupPlaceholder: false,
    showAddScenePopup: false,
    /** 待创建面板的设备选择弹出框 */
    showBeforeAddScenePopup: false,
    /** 添加场景成功提示 */
    showAddSceneSuccess: false,
    /** 添加场景成功提示位置 */
    sceneTitlePosition: {
      x: 0,
      y: 0,
    },
    /** 是否提示用户如何创建场景 */
    showAddSceneTips: false,
    /** 场景提示部分位置 */
    sceneTipsPositionStyle: '',
    scrollTop: 0,
    /** 控制选中个数 */
    selectCount: 0,
    dragging: false,
    /** 拖动过程中是否有数据更新，拖动完成后判断是否更新列表 */
    hasUpdate: false,
    checkedList: [] as string[], // 已选择设备的id列表
    lightStatus: {} as Record<string, number>, // 当前选择的灯具的状态
    recycleListInited: false,
  },

  computed: {
    roomHasGateway(data) {
      if (data.allRoomDeviceList) {
        return (
          (data.allRoomDeviceList as Device.DeviceItem[]).filter(
            (device) =>
              device.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId &&
              device.proType === proType.gateway,
          ).length > 0
        )
      }
      return false
    },
    roomHasSubDevice(data) {
      if (data.deviceList) {
        return (
          (data.allRoomDeviceList as Device.DeviceItem[]).filter(
            (device) =>
              device.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId &&
              device.proType !== proType.gateway,
          ).length > 0
        )
      }
      return false
    },
    title(data) {
      if (data.roomList && data.roomList[data.currentRoomIndex]) {
        return data.roomList[data.currentRoomIndex].roomName
      }
      return ''
    },
    sceneListInBar(data) {
      if (data.sceneList) {
        return data.sceneList.slice(0, 4)
      }
      return []
    },
    deviceIdTypeMap(data): Record<string, string> {
      if (data.deviceList) {
        return Object.fromEntries(
          data.deviceList.map((device: Device.DeviceItem) => [device.deviceId, proName[device.proType]]),
        )
      }
      return {}
    },
    hasSelectLight(data) {
      if (data.selectType) {
        return data.selectType.includes('light')
      }
      return false
    },
    hasSelectSwitch(data) {
      if (data.selectType) {
        return data.selectType.includes('switch')
      }
      return false
    },
    // 设备批量选择按钮文字
    allSelectBtnText(data) {
      return data.checkedList && data.checkedList.length > 0 ? '全不选' : '全选'
    },
    /** 是否有选中灯，一个或多个（单击选中） */
    isLightSelectSome(data) {
      if (!data.checkedList || data.checkedList.length === 0) {
        return false
      }
      const { deviceMap } = deviceStore
      return data.checkedList.some((uniId) => uniId.indexOf(':') === -1 && deviceMap[uniId].proType === proType.light)
    },
    /** 是否只控制选中一个开关 */
    // TODO 代码可删除
    isSwitchSelectOne(data) {
      if (data.checkedList) {
        const deviceMap = deviceStore.deviceFlattenMap
        let selectSwitchNum = 0
        data.checkedList.forEach((uniId: string) => {
          if (uniId.includes(':')) {
            if (deviceMap[uniId].proType === proType.switch) {
              selectSwitchNum++
            }
          }
        })
        return !!selectSwitchNum
      }
      return false
    },
    // 判断是否是创建者或者管理员，其他角色不能添加设备
    canAddDevice(data) {
      return data.isCreator || data.isAdmin
    },
    // ! recycle-view 宽度
    recycleViewWidth() {
      return rpx2px(750)
    },
    recycleViewHeight(data) {
      let amount = data.recycleList?.length || 0
      if (amount > 16) amount = 16
      return Math.ceil(amount / 4) * rpx2px(232)
    },
  },

  watch: {
    deviceList() {
      this.updateDeviceList()
    },
    // TODO 是否可以取消
    checkedList(value) {
      if (this.data.selectCount === 0 && value.length === 1) {
        this.setData({
          controlPopup: true,
        })
      }
      if (value.length === 0) {
        this.setData({
          popupPlaceholder: false,
        })
      }
      this.setData({
        selectCount: value.length,
      })
    },
    // dragging(value) {
    //   if (!value && this.data.hasUpdate) {
    //     deviceStore.updateSubDeviceList().then(() => {
    //       this.updateDeviceList()
    //     })
    //     this.data.hasUpdate = false
    //   }
    // },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    async onLoad() {
      // 创建长列表实例，列表不区分品类
      ctx = createRecycleContext({
        id: 'recycleListId',
        dataKey: 'recycleList',
        page: this,
        itemSize: {
          width: rpx2px(76),
          height: rpx2px(232),
        },
        useInPage: false,
      })

      // this.setUpdatePerformanceListener({withDataPaths: true}, (res) => {
      //   console.debug('setUpdatePerformanceListener', res, res.pendingStartTimestamp - res.updateStartTimestamp, res.updateEndTimestamp - res.updateStartTimestamp, dayjs().format('YYYY-MM-DD HH:mm:ss'))
      // })
      // 再更新一遍数据
      showLoading()
      await this.reloadData()
      hideLoading()
      emitter.on('wsReceive', async (e) => {
        if (e.result.eventType === WSEventType.device_property) {
          // 如果有传更新的状态数据过来，直接更新store
          const deviceInHouse = deviceStore.allRoomDeviceList.find(
            (device) => device.deviceId === e.result.eventData.deviceId,
          )
          if (deviceInHouse) {
            deviceInHouse.mzgdPropertyDTOList[e.result.eventData.ep] = {
              ...deviceInHouse.mzgdPropertyDTOList[e.result.eventData.ep],
              ...e.result.eventData.event,
            }
            roomStore.updateRoomCardLightOnNum()
            // 直接更新store里的数据，更新完退出回调函数
          }
          const deviceInRoom = deviceStore.deviceList.find((device) => device.deviceId === e.result.eventData.deviceId)
          if (deviceInRoom) {
            deviceInRoom.mzgdPropertyDTOList[e.result.eventData.ep] = {
              ...deviceInRoom.mzgdPropertyDTOList[e.result.eventData.ep],
              ...e.result.eventData.event,
            }
            this.updateDeviceList(deviceInHouse)
            // 直接更新store里的数据，更新完退出回调函数
            return
          }
        }
        // 如果是设备状态推送，而且本地数据没有该设备信息，之前全部更新
        if (
          [
            WSEventType.device_del,
            WSEventType.device_replace,
            WSEventType.device_property,
            WSEventType.device_online_status,
            WSEventType.device_offline_status,
          ].includes(e.result.eventType)
        ) {
          if (!requestThrottleTimer) {
            homeStore.updateRoomCardList()
            // 如果是当前房间，更新当前房间的状态
            // TODO 为何消息推送时要 reloadData?
            if (e.result.eventData.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId) {
              this.reloadData()
            }
            requestThrottleTimer = setTimeout(async () => {
              if (hasUpdateInRequestTimer) {
                await homeStore.updateRoomCardList()
                if (e.result.eventData.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId) {
                  this.reloadData()
                }
              }
              requestThrottleTimer = 0
              hasUpdateInRequestTimer = false
            }, 2000)
          } else {
            hasUpdateInRequestTimer = true
          }
        } else if (
          e.result.eventType === 'room_del' &&
          e.result.eventData.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId
        ) {
          // 房间被删除，退出到首页
          await homeStore.updateRoomCardList()
          wx.redirectTo({
            url: '/pages/index/index',
          })
        }
      })
      // 是否点击过场景使用提示的我知道了，如果没点击过就显示
      const hasKnownUseAddScene = storage.get<boolean>('hasKnownUseAddScene')
      if (!hasKnownUseAddScene) {
        this.createSelectorQuery()
          .select('#scene-card')
          .boundingClientRect((res) => {
            console.log('#scene-card', res)
            if (res) {
              this.setData({
                showAddSceneTips: true,
                sceneTipsPositionStyle: `left: ${res.left}px;top: ${res.top}px;width: ${res.width}px;height: ${res.height}px;`,
              })
            }
          })
          .exec()
      }
    },
    async reloadData() {
      try {
        await Promise.all([
          // deviceStore.updateAllRoomDeviceList(),
          deviceStore.updateSubDeviceList(),
          sceneStore.updateSceneList(),
          sceneStore.updateAllRoomSceneList(),
        ])
        this.updateDeviceList()
      } finally {
        wx.stopPullDownRefresh()
      }
    },

    // 页面滚动
    onPageScroll(e: { scrollTop: number }) {
      this.data.scrollTop = e.scrollTop
    },

    onUnload() {
      ctx.destroy()

      // 要手动清空实例，否则再次进入时，可能有早于onLoad的数据进行append
      ctx = null

      // 退出页面前清理一下选中的列表
      runInAction(() => {
        // deviceStore.selectList = []
        deviceStore.selectType = []
        deviceStore.isEditSelectMode = false
      })
      // 解除监听
      emitter.off('wsReceive')
    },
    handleKnownAddSceneTap() {
      storage.set('hasKnownUseAddScene', true, null)
      this.setData({
        showAddSceneTips: false,
      })
    },
    handleShowDeviceOffline(e: { detail: Device.DeviceItem }) {
      this.setData({
        showDeviceOffline: true,
        officeDeviceInfo: e.detail,
      })
    },
    handleCloseDeviceOffice() {
      this.setData({
        showDeviceOffline: false,
      })
    },
    updateDeviceListFn(device?: Device.DeviceItem) {
      // TODO 彻底解决view晚于method的问题
      console.log('updateDeviceListFn Begin, current List ==', this.data.recycleList)

      if (device) {
        // TODO 细致到字段的diff
        const item = this.data.recycleList.find((l: Device.DeviceItem) => l.deviceId === device.deviceId)
        const index = this.data.recycleList.findIndex((l: Device.DeviceItem) => l.deviceId === device.deviceId)

        ctx.update(index, item)
        console.log('after ctx.update', index, item)
      } else if (!this.data.recycleListInited) {
        const flattenList = deviceStore.deviceFlattenList

        // TODO 已存在列表，重复初始化时的处理
        // HACK 临时使用recycleListInited标志防止重复初始化
        if (!ctx) {
          return
        }
        // 初始化
        const _list = flattenList.map((device) => ({
          ...device,
          dragId: device.uniId,
          type: proName[device.proType],
          select: this.data.checkedList.includes(device.uniId),
        }))
        // 接口返回开关面板数据以设备为一个整体，需要前端拆开后排序
        _list.sort((a, b) => a.orderNum - b.orderNum) // TODO 链式合到上一行？
        // _list.splice(16) // MOCK
        console.log(
          'flattenList to recycleList==',
          _list.map((d) => ({
            deviceName: d.deviceName,
            orderNum: d.orderNum,
            proType: d.proType,
          })),
        )
        ctx.append(_list)
        this.data.recycleListInited = true
      }
      // 整个列表刷新 TODO review
      else {
        // const flattenList = deviceStore.deviceFlattenList
        // const _list = flattenList
        // // 接口返回开关面板数据以设备为一个整体，需要前端拆开后排序
        // _list.sort((a, b) => a.orderNum - b.orderNum) // TODO 链式合到上一行？
        // console.log('update list')
        // const diffData = {} as IAnyObject
        // _list.forEach((device: Device.DeviceItem & { select?: boolean }, index) => {
        //   const item = {} as IAnyObject
        //   ;(['select'] as const).forEach((key) => {
        //     const newVal = device[key]
        //     if (newVal !== this.data.recycleList[index][key]) {
        //       item[key] = newVal
        //     }
        //   })
        // })
        // this.setData(diffData)
      }
    },
    /** store设备列表数据更新到界面 */
    updateDeviceList(device?: Device.DeviceItem) {
      // 正在拖拽，先标记更新，拖拽结束后再处理
      if (this.data.dragging) {
        this.data.hasUpdate = true
        return
      }
      if (!updateThrottleTimer) {
        this.updateDeviceListFn(device)
        updateThrottleTimer = setTimeout(() => {
          if (hasUpdateInUpdateTimer) {
            this.updateDeviceListFn(device)
          }
          updateThrottleTimer = 0
          hasUpdateInUpdateTimer = false
        }, 500)
      } else {
        hasUpdateInUpdateTimer = true
      }
    },
    handleSceneTap() {
      wx.navigateTo({
        url: '/package-room-control/scene-list/index',
      })
    },
    /** 点击创建场景按钮回调 */
    handleCollect() {
      if (this.data.isVisitor) {
        Toast('仅创建者与管理员可创建场景')
        return
      }
      // 补充actions
      const deviceMap = deviceStore.deviceMap
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      const addSceneActions = [] as Device.ActionItem[]
      // 排除已经是场景开关的开关
      // TODO 是否可以优化？
      const selectList = deviceStore.deviceFlattenList.filter(
        (device) => !switchSceneConditionMap[device.uniId] && device.onLineStatus,
      )
      if (!selectList.length) {
        Toast('所有设备已离线，无法创建场景')
        return
      }
      selectList.forEach((device) => {
        if (device.proType === proType.switch) {
          // 开关
          const deviceId = device.uniId.split(':')[0]
          const ep = parseInt(device.uniId.split(':')[1])
          const OnOff = deviceMap[deviceId].mzgdPropertyDTOList[ep].OnOff
          addSceneActions.push({
            uniId: device.uniId,
            name: device.switchInfoDTOList[0].switchName + ' | ' + device.deviceName,
            desc: OnOff ? ['打开'] : ['关闭'],
            pic: device.switchInfoDTOList[0].pic,
            proType: device.proType,
            value: {
              ep,
              OnOff,
            },
          })
        } else if (device.proType === proType.light) {
          const properties = device.mzgdPropertyDTOList['1']
          const desc = properties.OnOff ? ['打开'] : ['关闭']
          const color = (properties.ColorTemp / 100) * (maxColorTempK - minColorTempK) + minColorTempK
          const action = {
            uniId: device.uniId,
            name: device.deviceName,
            desc,
            pic: device.pic,
            proType: device.proType,
            value: {
              ep: 1,
              OnOff: properties.OnOff,
            } as IAnyObject,
          }
          if (properties.OnOff) {
            desc.push(`亮度${properties.Level}%`)
            desc.push(`色温${color}K`)
            action.value.Level = properties.Level
            action.value.ColorTemp = properties.ColorTemp
          }
          addSceneActions.push(action)
        }
      })
      runInAction(() => {
        sceneStore.addSceneActions = addSceneActions
        deviceStore.isEditSelectMode = false
        deviceStore.editSelect = []
      })
      this.setData({
        showBeforeAddScenePopup: true,
      })
    },
    /**
     * @name 卡片点击事件
     * @param e 设备属性
     * @param forceCheck 强制设置是否选中。未发现此参数有使用场景。但本次重构暂时仍保留此逻辑
     */
    handleDeviceCardTap(
      e: { detail: Device.DeviceItem & { clientRect: WechatMiniprogram.ClientRect } },
      forceCheck?: boolean,
    ) {
      console.log('handleDeviceCardTap', e)

      const { uniId } = e.detail // 灯的 deviceId===uniId
      const isChecked = this.data.checkedList.includes(uniId) // 点击卡片前，卡片是否选中

      // 本次点击需执行的选中状态
      // ASSERT 如果forceCheck与当前状态不相同（包括undefined），则执行结果总是将isChecked置反
      const toCheck = forceCheck === undefined ? !isChecked : forceCheck

      // toCheck 与当前状态相同，则不需要执行
      if (isChecked === toCheck) {
        return
      }

      // 这是第一个被选中的设备卡片
      if (this.data.checkedList.length === 0) {
        this.setData({
          popupPlaceholder: true,
        })
        // 弹起的popup不能挡住卡片
        const divideRpxByPx = storage.get<number>('divideRpxByPx')
          ? (storage.get<number>('divideRpxByPx') as number)
          : 0.5
        const windowHeight = storage.get<number>('windowHeight') as number
        const bottom = windowHeight - 716 * divideRpxByPx
        const top = bottom - 216 * divideRpxByPx
        const scrollTop = this.data.scrollTop + e.detail.clientRect.top - top + 4
        wx.pageScrollTo({
          scrollTop,
          duration: 200,
          fail(res) {
            console.log('scroll-fail', res)
          },
        })
      }

      const { deviceMap } = deviceStore
      // 选择逻辑
      if (toCheck) {
        this.data.checkedList.push(uniId)
      } else {
        const index = this.data.checkedList.findIndex((item: string) => item === e.detail.uniId)
        this.data.checkedList.splice(index, 1)
      }
      this.setData({
        checkedList: [...this.data.checkedList],
      })

      // 选择灯卡片时，面板状态的处理
      if (e.detail.proType === proType.light) {
        if (toCheck) {
          this.setData({
            lightStatus: {
              Level: e.detail.mzgdPropertyDTOList['1'].Level,
              ColorTemp: e.detail.mzgdPropertyDTOList['1'].ColorTemp,
            },
          })
        } else {
          // 将面板的灯状态恢复到上一个选中的灯
          // TODO 可优化，反转遍历？
          let latestSelectLightId = ''
          deviceStore.selectList.forEach((deviceId) => {
            if (deviceMap[deviceId]?.proType === proType.light) {
              latestSelectLightId = deviceId
            }
          })
          if (latestSelectLightId) {
            this.setData({
              lightStatus: {
                Level: deviceMap[latestSelectLightId].mzgdPropertyDTOList['1'].Level,
                ColorTemp: deviceMap[latestSelectLightId].mzgdPropertyDTOList['1'].ColorTemp,
              },
            })
          }
        }
      }

      // 选择时的卡片样式渲染
      const diffData = {} as IAnyObject
      const index = this.data.recycleList.findIndex((l: Device.DeviceItem) => l.uniId === uniId)
      diffData[`recycleList[${index}].select`] = this.data.checkedList.includes(uniId)
      this.setData(diffData)

      // TODO
      this.updateSelectType()
      this.updateDeviceList(e.detail)
    },
    // 卡片点击时，按品类调用对应方法
    handleControlTap(e: { detail: Device.DeviceItem & { clientRect: WechatMiniprogram.ClientRect } }) {
      if (e.detail.proType === proType.light) {
        this.handleLightPowerToggle(e)
      } else {
        this.handleSwitchControlTapToggle(e)
      }
    },
    /** 灯具开关点击 */
    async handleLightPowerToggle(e: { detail: Device.DeviceItem & { clientRect: WechatMiniprogram.ClientRect } }) {
      const index = this.data.recycleList.findIndex((l: Device.DeviceItem) => l.deviceId === e.detail.deviceId)
      const device = this.data.recycleList[index]
      const OldOnOff = device.mzgdPropertyDTOList['1'].OnOff

      // ! 此处使用 setData 精确更新 diff 数据，渲染效率优于使用 ctx.update
      const diffData = {} as IAnyObject
      diffData[`recycleList[${index}].mzgdPropertyDTOList[1].OnOff`] = OldOnOff ? 0 : 1
      this.setData(diffData)

      // prof 疑似重复更新，暂时注释
      // this.updateDeviceList()
      const res = await controlDevice({
        topic: '/subdevice/control',
        deviceId: e.detail.gatewayId,
        method: 'lightControl',
        inputData: [
          {
            devId: e.detail.deviceId,
            ep: 1,
            OnOff: e.detail.mzgdPropertyDTOList['1'].OnOff === 1 ? 0 : 1,
          },
        ],
      })
      if (!res.success) {
        diffData[`recycleList[${index}].mzgdPropertyDTOList[1].OnOff`] = OldOnOff
        this.setData(diffData)

        Toast('控制失败')
      }
      this.updateDeviceList(e.detail)
      // 首页需要更新灯光打开个数
      homeStore.updateCurrentHomeDetail()
    },
    async handleLightSortEnd(e: { detail: { listData: Device.DeviceItem[] } }) {
      const orderData = {
        deviceInfoByDeviceVoList: [],
        type: '0',
      } as Device.OrderSaveData
      e.detail.listData.forEach((device, index) => {
        if (device.orderNum !== index) {
          orderData.deviceInfoByDeviceVoList.push({
            deviceId: device.deviceId,
            houseId: homeStore.currentHomeId,
            roomId: device.roomId,
            orderNum: index.toString(),
          })
        }
      })
      if (orderData.deviceInfoByDeviceVoList.length === 0) {
        return
      }
      await saveDeviceOrder(orderData)
      deviceStore.updateSubDeviceList()
    },
    async handleSwitchSortEnd(e: { detail: { listData: Device.DeviceItem[] } }) {
      const orderData = {
        deviceInfoByDeviceVoList: [],
        type: '1',
      } as Device.OrderSaveData
      e.detail.listData.forEach((device, index) => {
        if (device.switchInfoDTOList[0].orderNum !== index) {
          orderData.deviceInfoByDeviceVoList.push({
            deviceId: device.deviceId,
            houseId: homeStore.currentHomeId,
            roomId: device.roomId,
            orderNum: index.toString(),
            switchId: device.switchInfoDTOList[0].switchId,
          })
        }
      })
      if (orderData.deviceInfoByDeviceVoList.length === 0) {
        return
      }
      await saveDeviceOrder(orderData)
      this.reloadData()
    },
    /** 面板开关点击 TODO diff更新优化 */
    async handleSwitchControlTapToggle(e: {
      detail: Device.DeviceItem & { clientRect: WechatMiniprogram.ClientRect }
    }) {
      const ep = e.detail.switchInfoDTOList[0].switchId
      if (e.detail.mzgdPropertyDTOList[ep].ButtonMode && e.detail.mzgdPropertyDTOList[ep].ButtonMode === 2) {
        const sceneId = deviceStore.switchSceneConditionMap[e.detail.uniId]
        if (sceneId) {
          execScene(sceneId)
        }
      } else {
        const device = deviceStore.deviceList.find((device) => device.deviceId === e.detail.deviceId)!
        const OnOff = device.mzgdPropertyDTOList[ep].OnOff
        runInAction(() => {
          device.mzgdPropertyDTOList[ep].OnOff = OnOff ? 0 : 1
          deviceStore.deviceList = [...deviceStore.deviceList]
        })
        // prof 疑似重复更新，暂时注释
        // this.updateDeviceList()
        const res = await controlDevice({
          topic: '/subdevice/control',
          deviceId: e.detail.gatewayId,
          method: 'panelSingleControl',
          inputData: [
            {
              devId: e.detail.deviceId,
              ep,
              OnOff: e.detail.mzgdPropertyDTOList[ep].OnOff === 1 ? 0 : 1,
            },
          ],
        })
        if (!res.success) {
          runInAction(() => {
            device.mzgdPropertyDTOList[ep].OnOff = OnOff
            deviceStore.deviceList = [...deviceStore.deviceList]
          })
          Toast('控制失败')
        }
        this.updateDeviceList(e.detail)
      }
    },
    handlePopUp(e: { detail: 'up' | 'down' }) {
      this.setData({
        controlPopup: e.detail === 'up',
      })
    },
    handleAddScenePopupClose() {
      this.setData({
        showAddScenePopup: false,
      })
    },
    handleAddScenePopupReturn() {
      this.setData({
        showAddScenePopup: false,
        showBeforeAddScenePopup: true,
      })
    },
    handleBeforeAddScenePopupClose() {
      this.setData({
        showBeforeAddScenePopup: false,
      })
    },
    handleBeforeAddScenePopupNext() {
      this.setData({
        showBeforeAddScenePopup: false,
        showAddScenePopup: true,
      })
    },
    handleShowAddSceneSuccess() {
      this.updateDeviceList()
      setTimeout(() => {
        wx.createSelectorQuery()
          .select('#scene-title')
          .boundingClientRect()
          .exec((res) => {
            if (res.length > 0 && res[0]) {
              this.setData({
                sceneTitlePosition: {
                  x: res[0].left,
                  y: res[0].top,
                },
              })
              this.setData({
                showAddSceneSuccess: true,
              })
              setTimeout(() => {
                this.setData({
                  showAddSceneSuccess: false,
                })
              }, 3000)
            }
          })
      }, 100)
    },
    updateSelectType() {
      const typeList = new Set()
      this.data.checkedList.forEach((deviceId: string) => {
        if (deviceId.includes(':')) {
          typeList.add('switch')
          return
        }
        typeList.add(this.data.deviceIdTypeMap[deviceId])
      })
      runInAction(() => {
        deviceStore.selectType = Array.from(typeList) as string[]
      })
    },
    /** 点击空位收起弹窗 */
    handleScreenTap() {
      if (this.data.controlPopup) {
        this.setData({
          controlPopup: false,
        })
      }
    },
    handleLongpress(e: { detail: { dragging: boolean } & Device.DeviceItem }) {
      console.log('handleLongpress', e)
      if (!this.data.dragging) {
        runInAction(() => {
          if (!deviceStore.editSelect.length) {
            deviceStore.editSelect = [e.detail.uniId]
          }
          // 只有创建者或者管理员能够进入编辑模式
          deviceStore.isEditSelectMode = this.data.isCreator || this.data.isAdmin
          // deviceStore.selectList = []
        })
        // this.updateDeviceList()
      }
      this.setData({
        dragging: true,
      })
    },

    exitEditMode() {
      this.setData({
        dragging: false,
      })
    },

    // TODO refactor
    handleAllSelect() {
      let checkedList = [] as string[] // 默认全不选
      let popupPlaceholder = false
      let controlPopup = false

      // 如果一个也没选中，则执行全选
      const noChecked = !this.data.checkedList || this.data.checkedList.length === 0
      if (noChecked) {
        checkedList = deviceStore.deviceFlattenList.filter((d) => d.onLineStatus).map((d) => d.uniId)
        popupPlaceholder = true
        controlPopup = true
      }

      this.setData({
        checkedList,
        popupPlaceholder,
        controlPopup,
      })

      // 执行全选，设定第一个灯的状态为弹框状态
      if (!this.data.isLightSelectOne) {
        for (const device of deviceStore.deviceList) {
          if (device.proType === proType.light) {
            this.setData({
              lightStatus: {
                Level: device.mzgdPropertyDTOList['1'].Level,
                ColorTemp: device.mzgdPropertyDTOList['1'].ColorTemp,
              },
            })
            break
          }
        }
      }

      this.updateSelectType()

      // 更新选中状态
      const diffData = {} as IAnyObject
      this.data.recycleList.forEach((_: Device.DeviceItem, index: number) => {
        diffData[`recycleList[${index}].select`] = noChecked
      })
      this.setData(diffData)

      // this.updateDeviceList()
    },

    // TODO refactor
    handleSwitchAllSelect() {
      const deviceMap = deviceStore.deviceFlattenMap
      const newList = [] as string[]
      if (this.data.isSwitchSelectOne) {
        // 执行全不选
        deviceStore.selectList.forEach((uniId) => {
          if (!uniId.includes(':') || deviceMap[uniId].proType !== proType.switch) {
            newList.push(uniId)
          }
        })
      } else {
        // 执行全选
        newList.push(...deviceStore.selectList)
        deviceStore.deviceFlattenList.forEach((device) => {
          if (device.proType === proType.switch && !newList.includes(device.uniId) && device.onLineStatus) {
            newList.push(device.uniId)
          }
        })
      }
      if (!this.data.isLightSelectOne && deviceStore.selectList.length === 0) {
        this.setData({
          popupPlaceholder: true,
          controlPopup: true,
        })
      }
      runInAction(() => {
        deviceStore.selectList = newList
      })
      if (!deviceStore.selectList.length) {
        this.setData({
          popupPlaceholder: false,
        })
      }
      this.updateSelectType()
      this.updateDeviceList()
    },
    handleAddDevice() {
      wx.navigateTo({ url: '/package-distribution/scan/index' })
    },
    handleRebindGateway() {
      const gateway = deviceStore.allRoomDeviceMap[this.data.officeDeviceInfo.gatewayId]
      wx.navigateTo({
        url: `/package-distribution/wifi-connect/index?type=changeWifi&sn=${gateway.sn}`,
      })
    },
    // TODO review
    handleRoomMoveSuccess() {
      // const deviceMap = deviceStore.allRoomDeviceFlattenMap
      // runInAction(() => {
      //   deviceStore.selectList = deviceStore.selectList.filter(
      //     (uniId) => deviceMap[uniId].roomId === roomStore.currentRoom.roomId,
      //   )
      // })
      this.updateSelectType()
    },
  },
})
