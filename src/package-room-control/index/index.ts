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
import { controlDevice, execScene } from '../../apis/index'
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
    recycleViewWidth: rpx2px(720), // recycle-view 宽度
    recycleViewHeight:
      (storage.get<number>('windowHeight') as number) -
      (storage.get<number>('statusBarHeight') as number) -
      (storage.get<number>('bottomBarHeight') as number) - // IPX
      rpx2px(170) - // 创建场景、标题栏
      (storage.get<number>('navigationBarHeight') as number),
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
    dragging: false,
    /** 拖动过程中是否有数据更新，拖动完成后判断是否更新列表 */
    // hasUpdate: false,
    checkedList: [] as string[], // 已选择设备的id列表
    lightStatus: {} as Record<string, number>, // 当前选择的灯具的状态
    checkedType: [] as string[], // 已选择设备的类型
    recycleListInited: false,
    showLowerBtn: false,
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
      if (data.checkedType) {
        return data.checkedType.includes('light')
      }
      return false
    },
    hasSelectSwitch(data) {
      if (data.checkedType) {
        return data.checkedType.includes('switch')
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

    // recycleViewHeight(data) {
    //   let amount = data.recycleList?.length || 0
    //   if (amount > 16) amount = 16
    //   return Math.ceil(amount / 4) * rpx2px(232)
    // },
  },

  watch: {
    // FIXME 无法跟踪变更源头的监听，但每次变更都可能导致重复更新页面，是否可删除
    // deviceList() {
    //   this.updateDeviceList()
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

      // ws消息处理
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
        // deviceStore.selectType = []
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
    /**
     * @description 初始化或更新设备列表
     * @param e 设备对象，或包裹设备对象的事件
     */
    updateDeviceListFn(e?: Device.DeviceItem & { detail?: Device.DeviceItem }) {
      console.log('Begin of updateDeviceListFn, recycleList==, e==\n', this.data.recycleList, e)

      if (e?.deviceId || e?.detail?.deviceId) {
        const device = e?.deviceId ? e : e.detail

        // TODO 细致到字段的diff
        const index = this.data.recycleList.findIndex(
          (d: Device.DeviceItem) => d.uniId === device!.uniId || d.deviceId === device!.deviceId,
        )
        const diffData = {} as IAnyObject
        diffData[`recycleList[${index}]`] = device
        this.setData(diffData)

        console.log('after one item update', index, device)
      } else {
        const flattenList = deviceStore.deviceFlattenList

        // 如果为空则不初始化，否则会recycleList.length===0导致在视图中销毁recycleView导致错误堵塞
        // TODO review 是否会引起其他问题
        // TODO 可通过recycleList内部方法，显示空内容彻底解决此问题
        if (!flattenList.length) {
          return
        }

        // HACK 使用recycleListInited标志防止重复初始化
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
          'updateDeviceListFn _list===\n',
          _list,
          // .map((d) => ({
          //   deviceName: d.deviceName,
          //   orderNum: d.orderNum,
          //   proType: d.proType,
          // })),
        )

        if (!this.data.recycleListInited) {
          ctx.append(_list)
          this.data.recycleListInited = true
        }
        // ! 整个列表刷新，算法需要重点优化，同时寻源，转向精确更新，减少全列表更新
        // 暂时只更新列表条数一样的情况
        else {
          const diffData = {} as IAnyObject
          _list.forEach((device: Device.DeviceItem & { select?: boolean }, index) => {
            ;(['deviceName', 'onLineStatus', 'select'] as const).forEach((key) => {
              // 需要检查的字段 // mzgdPropertyDTOList? switchInfoDTOList?
              const newVal = device[key]
              if (newVal !== this.data.recycleList[index][key]) {
                diffData[`recycleList[${index}].${key}`] = newVal
              }
            })
            // diffData[`recycleList[${index}].switchInfoDTOList`] = device.switchInfoDTOList
          })

          console.log('update list, diffData', diffData)

          this.setData(diffData)
        }
      }
    },
    /** store设备列表数据更新到界面 */
    updateDeviceList(device?: Device.DeviceItem & { detail?: Device.DeviceItem }) {
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

      // 选择灯卡片时，面板状态的处理
      const lightStatus = { Level: 0, ColorTemp: 0 }
      if (e.detail.proType === proType.light) {
        if (toCheck) {
          lightStatus.Level = e.detail.mzgdPropertyDTOList['1'].Level
          lightStatus.ColorTemp = e.detail.mzgdPropertyDTOList['1'].ColorTemp
        } else {
          // 将面板的灯状态恢复到上一个选中的灯
          // TODO 可优化，反转遍历？
          let latestSelectLightId = ''
          this.data.checkedList.forEach((deviceId) => {
            if (deviceMap[deviceId]?.proType === proType.light) {
              latestSelectLightId = deviceId
            }
          })
          if (latestSelectLightId) {
            lightStatus.Level = deviceMap[latestSelectLightId].mzgdPropertyDTOList['1'].Level
            lightStatus.ColorTemp = deviceMap[latestSelectLightId].mzgdPropertyDTOList['1'].ColorTemp
          }
        }
      }

      // 选择时的卡片样式渲染
      const diffData = {} as IAnyObject
      const index = this.data.recycleList.findIndex((l: Device.DeviceItem) => l.uniId === uniId)
      diffData[`recycleList[${index}].select`] = this.data.checkedList.includes(uniId)

      // 合并前面的数据变化
      diffData.checkedList = [...this.data.checkedList]
      diffData.lightStatus = lightStatus
      if (toCheck && this.data.checkedList.length === 1) {
        diffData.controlPopup = true
        diffData.popupPlaceholder = true
      } else if (!toCheck && this.data.checkedList.length === 0) {
        diffData.controlPopup = false
        diffData.popupPlaceholder = false
      }

      // 更新视图
      this.setData(diffData)

      // TODO
      this.updateSelectType()
      // this.updateDeviceList(e.detail)
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
      this.setData({
        checkedType: Array.from(typeList) as string[],
      })
      // runInAction(() => {
      //   deviceStore.selectType = Array.from(typeList) as string[]
      // })
    },
    /** 点击空位收起弹窗 */
    handleScreenTap() {
      if (this.data.controlPopup) {
        this.setData({
          controlPopup: false,
        })
      }
    },
    // 长按选择，进入编辑状态
    handleLongpress(e: { detail: Device.DeviceItem }) {
      // 已是编辑状态，不重复操作
      if (deviceStore.isEditSelectMode) {
        return
      }
      console.log('handleLongpress', e)

      // 选中当前长按卡片
      runInAction(() => {
        deviceStore.editSelect = [e.detail.uniId]

        // 只有创建者或者管理员能够进入编辑模式
        if (this.data.isCreator || this.data.isAdmin) {
          deviceStore.isEditSelectMode = true
        }
      })

      // 取消普通选择
      if (this.data.checkedList?.length) {
        this.handleAllSelect()
      }
    },

    // exitEditMode() {
    //   this.setData({
    //     isEditSelectMode: false,
    //   })
    // },

    handleAllSelect() {
      let checkedList = [] as string[] // 默认全不选
      let popupPlaceholder = false
      let controlPopup = false

      // 操作前状态是全不选，则执行全选
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
    recycleViewScroll(e: IAnyObject) {
      const offset = 100 // 每100上报一次，有时刚好在阈值上导致检测不到滚动到底部
      const scrollBottom = e.detail.scrollTop + this.data.recycleViewHeight
      console.log('recycleViewScroll', e, scrollBottom)

      if (this.data.showLowerBtn && scrollBottom < e.detail.scrollHeight) {
        this.setData({
          showLowerBtn: false,
        })
      } else if (!this.data.showLowerBtn && scrollBottom + offset >= e.detail.scrollHeight) {
        this.setData({
          showLowerBtn: true,
        })
      }
    },
  },
})
