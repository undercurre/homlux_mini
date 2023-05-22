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
import pageBehavior from '../../behaviors/pageBehaviors'
import { controlDevice, execScene } from '../../apis/index'
import Toast from '@vant/weapp/toast/toast'
import { storage, emitter, WSEventType, rpx2px, _get } from '../../utils/index'
import { maxColorTempK, minColorTempK, proName, proType, LIST_PAGE } from '../../config/index'

/** 接口请求节流定时器，定时时间2s */
let requestThrottleTimer = 0
let hasUpdateInRequestTimer = false

type DeviceCard = Device.DeviceItem & { select: boolean; editSelect: boolean } & {
  clientRect: WechatMiniprogram.ClientRect
}

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
    // rpx2px(232) * 1,
    recycleViewHeight:
      (storage.get<number>('windowHeight') as number) -
      (storage.get<number>('statusBarHeight') as number) -
      (storage.get<number>('bottomBarHeight') as number) - // IPX
      rpx2px(170) - // 创建场景
      (storage.get<number>('navigationBarHeight') as number),
    /** 展示点中离线设备弹窗 */
    showDeviceOffline: false,
    /** 点击的离线设备的信息 */
    officeDeviceInfo: {} as DeviceCard,
    /** 控制面板 */
    controlPopup: false,
    /** 弹出控制面板时，页面底部留出空位 */
    popupPlaceholder: false,
    showAddScenePopup: false,
    // 设备卡片列表，二维数组
    devicePageList: [] as DeviceCard[][],
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
    editSelectList: [] as string[], // 编辑状态下，已勾选的设备id列表
    editSelectMode: false, // 是否编辑状态
    lightStatus: {} as Record<string, number>, // 当前选择的灯具的状态
    checkedType: [] as string[], // 已选择设备的类型
    deviceListInited: false, // 设备列表是否初始化完毕
  },

  computed: {
    roomHasGateway(data) {
      if (data.allRoomDeviceList) {
        return (
          (data.allRoomDeviceList as DeviceCard[]).filter(
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
          (data.allRoomDeviceList as DeviceCard[]).filter(
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
          data.deviceList.map((device: DeviceCard) => [device.deviceId, proName[device.proType]]),
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
      // this.setUpdatePerformanceListener({withDataPaths: true}, (res) => {
      //   console.debug('setUpdatePerformanceListener', res, res.pendingStartTimestamp - res.updateStartTimestamp, res.updateEndTimestamp - res.updateStartTimestamp, dayjs().format('YYYY-MM-DD HH:mm:ss'))
      // })

      // 再更新一遍数据
      await this.reloadData()

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

          // 组装要更新的设备数据
          const deviceInRoom = {} as DeviceCard
          deviceInRoom.deviceId = e.result.eventData.deviceId
          deviceInRoom.uniId = `${e.result.eventData.deviceId}:${e.result.eventData.ep}`
          deviceInRoom.mzgdPropertyDTOList = {}
          deviceInRoom.mzgdPropertyDTOList[e.result.eventData.ep] = {
            ...e.result.eventData.event,
          }
          this.updateDeviceList(deviceInRoom)
          return
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
      // 解除监听
      emitter.off('wsReceive')
    },
    handleKnownAddSceneTap() {
      storage.set('hasKnownUseAddScene', true, null)
      this.setData({
        showAddSceneTips: false,
      })
    },
    handleShowDeviceOffline(e: { detail: DeviceCard }) {
      this.setData({
        showDeviceOffline: true,
        officeDeviceInfo: e.detail,
      })
    },
    handleCloseDeviceOffline() {
      this.setData({
        showDeviceOffline: false,
      })
    },
    /**
     * @description 初始化或更新设备列表
     * @param e 设备对象，或包裹设备对象的事件
     */
    async updateDeviceList(e?: DeviceCard & { detail?: DeviceCard }) {
      console.log('[updateDeviceList]', e || '不带参数')

      // 单项更新
      if (e?.deviceId || e?.detail?.deviceId) {
        const device = e?.deviceId ? e : e.detail

        for (const groupIndex in this.data.devicePageList) {
          const index = this.data.devicePageList[groupIndex].findIndex((d: DeviceCard) => {
            if (d.proType === proType.switch) {
              return d.uniId === device!.uniId
            } else {
              return d.deviceId === device!.deviceId
            }
          })
          if (index !== -1) {
            const originDevice = this.data.devicePageList[groupIndex][index]
            const diffData = {} as IAnyObject
            // review 细致到字段的diff
            const renderList = ['deviceName', 'onLineStatus', 'select', 'editSelect'] // 需要刷新界面的字段

            // 子设备状态，目前只更新开关状态
            if (device!.mzgdPropertyDTOList) {
              const eq = originDevice.proType === proType.light ? 1 : originDevice.uniId.split(':')[1]
              renderList.push(`mzgdPropertyDTOList[${eq}].OnOff`)
              renderList.push(`mzgdPropertyDTOList[${eq}].Level`) // 暂不在界面上体现，只是统一更新数据
              renderList.push(`mzgdPropertyDTOList[${eq}].ColorTemp`) // 暂不在界面上体现
            }
            renderList.forEach((key) => {
              const newVal = _get(device!, key)
              const originVal = _get(originDevice, key)
              // 进一步检查，过滤确实有更新的字段
              if (newVal !== undefined && newVal !== originVal) {
                diffData[`devicePageList[${groupIndex}][${index}].${key}`] = newVal
              }
            })

            if (Object.keys(diffData).length) {
              this.setData(diffData)
              console.log('[updateDeviceList, %s, %s]单个卡片更新完成', groupIndex, index, diffData)
            } else {
              console.log('[updateDeviceList, %s, %s]diffData为空，不必更新', groupIndex, index)
            }
            break // 找到就中断
          }
        }
      } else {
        const flattenList = deviceStore.deviceFlattenList

        // 如果为空则不初始化
        if (!flattenList.length) {
          return
        }

        const _list = flattenList
          .map((device) => ({
            ...device,
            type: proName[device.proType],
            select: this.data.checkedList.includes(device.uniId),
            editSelect: this.data.editSelectList.includes(device.uniId),
          }))
          // 接口返回开关面板数据以设备为一个整体，需要前端拆开后排序
          .sort((a, b) => a.orderNum - b.orderNum)

        if (!this.data.deviceListInited) {
          console.log('[updateDeviceList]列表初始化')
        }
        // !! 整个列表刷新
        else {
          this.setData({
            devicePageList: [], // 清空
            deviceListInited: false,
          })
          console.log('[updateDeviceList]列表刷新')
        }

        // 分页加载
        for (let groupIndex = 0; _list.length > 0; ++groupIndex) {
          const group = _list.splice(0, LIST_PAGE)
          const diffData = {} as IAnyObject
          diffData[`devicePageList[${groupIndex}]`] = group
          this.setData(diffData)
        }

        this.setData({
          deviceListInited: true,
        })
        console.log('[updateDeviceList]列表更新完成', this.data.devicePageList)
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
      })
      this.setData({
        editSelectMode: false,
        editSelectList: [],
        showBeforeAddScenePopup: true,
      })
    },

    /**
     * @name 根据是否编辑状态，选择卡片点击事件
     * @param e 设备属性
     */
    handleCardTap(e: { detail: DeviceCard }) {
      if (this.data.editSelectMode) {
        this.handleCardEditSelect(e)
      } else {
        this.handleCardCommonTap(e)
      }
    },

    handleCardEditSelect(e: { detail: DeviceCard }) {
      const device = e.detail
      const { uniId } = device
      const toCheck = !this.data.editSelectList.includes(uniId)
      const list = [...this.data.editSelectList]

      if (toCheck) {
        list.push(uniId)
      } else {
        const index = list.findIndex((id) => uniId === id)
        list.splice(index, 1)
      }

      this.setData({
        editSelectList: list,
      })
      device.editSelect = toCheck
      this.updateDeviceList(device)

      console.log('handleCardEditSelect', list)
    },

    /**
     * @description 编辑状态全选/全不选
     * @param e
     */
    editSelectAll(e: { detail: boolean }) {
      const toCheckAll = e.detail
      const diffData = {} as IAnyObject
      diffData.editSelectList = toCheckAll ? deviceStore.deviceFlattenList.map((device) => device.uniId) : []
      for (const groupIndex in this.data.devicePageList) {
        this.data.devicePageList[groupIndex].forEach((device, index) => {
          // 如果状态已是一样，则不放diff，减少数据的变更
          if (device.editSelect !== toCheckAll) {
            diffData[`devicePageList[${groupIndex}][${index}].editSelect`] = toCheckAll
          }
        })
      }

      this.setData(diffData)
    },

    handleCardCommonTap(e: { detail: DeviceCard }) {
      const { uniId } = e.detail // 灯的 deviceId===uniId
      const isChecked = this.data.checkedList.includes(uniId) // 点击卡片前，卡片是否选中
      const toCheck = !isChecked // 本次点击需执行的选中状态

      // 取消选择
      if (toCheck && this.data.checkedList.length) {
        const oldCheckedId = this.data.checkedList[0]
        const oldDevice = {} as DeviceCard
        oldDevice.deviceId = oldCheckedId.split(':')[0]
        oldDevice.uniId = oldCheckedId
        oldDevice.select = false
        this.updateDeviceList(oldDevice)
      }

      // 选择逻辑
      this.data.checkedList = toCheck ? [uniId] : []

      // 选择灯卡片时，面板状态的处理
      const lightStatus = { Level: 0, ColorTemp: 0 }
      if (toCheck && e.detail.proType === proType.light) {
        lightStatus.Level = e.detail.mzgdPropertyDTOList['1'].Level
        lightStatus.ColorTemp = e.detail.mzgdPropertyDTOList['1'].ColorTemp
      }

      // 更新选中样式
      const device = e.detail
      device.select = this.data.checkedList.includes(uniId)
      this.updateDeviceList(device)

      // 选择时的卡片样式渲染
      const diffData = {} as IAnyObject

      // 合并数据变化
      diffData.checkedList = [...this.data.checkedList]
      diffData.lightStatus = lightStatus
      diffData.controlPopup = toCheck
      diffData.popupPlaceholder = toCheck

      // 更新视图
      this.setData(diffData)

      // TODO
      this.updateSelectType()

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
    },

    // 卡片点击时，按品类调用对应方法
    handleControlTap(e: { detail: DeviceCard }) {
      if (e.detail.proType === proType.light) {
        this.handleLightPowerToggle(e)
      } else {
        this.handleSwitchControlTapToggle(e)
      }
    },
    /** 灯具开关点击 */
    async handleLightPowerToggle(e: { detail: DeviceCard }) {
      // 即时改变视图，提升操作手感
      const device = { ...e.detail }
      const OldOnOff = device.mzgdPropertyDTOList[1].OnOff
      const newOnOff = OldOnOff ? 0 : 1
      device.mzgdPropertyDTOList[1].OnOff = newOnOff
      this.updateDeviceList(device)

      const res = await controlDevice({
        topic: '/subdevice/control',
        deviceId: e.detail.gatewayId,
        method: 'lightControl',
        inputData: [
          {
            devId: e.detail.deviceId,
            ep: 1,
            OnOff: newOnOff,
          },
        ],
      })
      if (!res.success) {
        device.mzgdPropertyDTOList[1].OnOff = OldOnOff
        this.updateDeviceList(device)
        Toast('控制失败')
      }

      // 首页需要更新灯光打开个数
      // review 偶现数量延迟或不准确的问题
      homeStore.updateCurrentHomeDetail()
    },
    /** 面板开关点击 TODO diff更新优化 */
    async handleSwitchControlTapToggle(e: { detail: DeviceCard }) {
      const device = { ...e.detail }
      const ep = device.switchInfoDTOList[0].switchId

      if (device.mzgdPropertyDTOList[ep].ButtonMode === 2) {
        const sceneId = deviceStore.switchSceneConditionMap[device.uniId]
        if (sceneId) {
          execScene(sceneId)
        }
      } else {
        // 即时改变视图，提升操作手感
        const OldOnOff = device.mzgdPropertyDTOList[ep].OnOff
        const newOnOff = OldOnOff ? 0 : 1
        device.mzgdPropertyDTOList[ep].OnOff = newOnOff
        this.updateDeviceList(device)

        const res = await controlDevice({
          topic: '/subdevice/control',
          deviceId: e.detail.gatewayId,
          method: 'panelSingleControl',
          inputData: [
            {
              devId: e.detail.deviceId,
              ep,
              OnOff: newOnOff,
            },
          ],
        })
        if (!res.success) {
          device.mzgdPropertyDTOList[ep].OnOff = OldOnOff
          this.updateDeviceList(device)
          Toast('控制失败')
        }
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
    handleLongpress(e: { detail: DeviceCard }) {
      // 已是编辑状态，不重复操作
      if (this.data.editSelectMode) {
        return
      }

      const device = e.detail
      const diffData = {} as IAnyObject

      // 选中当前长按卡片
      diffData.editSelectList = [device.uniId]
      // 只有创建者或者管理员能够进入编辑模式
      if (this.data.isCreator || this.data.isAdmin) {
        diffData.editSelectMode = true
      }

      // 取消普通选择
      if (this.data.checkedList?.length) {
        diffData.checkedList = []
        diffData.controlPopup = false
        diffData.popupPlaceholder = false
      }
      this.setData(diffData)
      device.select = false
      device.editSelect = true
      this.updateDeviceList(device)

      console.log('handleLongpress', e, diffData)
    },

    exitEditMode() {
      this.setData({
        editSelectMode: false,
        editSelectList: [],
      })
      this.editSelectAll({ detail: false })
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
    handleRoomMoveSuccess() {
      this.updateDeviceList()
    },
  },
})
