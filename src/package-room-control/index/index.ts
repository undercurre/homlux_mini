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
import { sendDevice, execScene, saveDeviceOrder } from '../../apis/index'
import Toast from '@vant/weapp/toast/toast'
import {
  storage,
  emitter,
  WSEventType,
  rpx2px,
  _get,
  throttle,
  toPropertyDesc,
  transferDeviceProperty,
} from '../../utils/index'
import { proName, PRO_TYPE, LIST_PAGE, CARD_W, CARD_H } from '../../config/index'

type DeviceCard = Device.DeviceItem & {
  x: string
  y: string
  orderNum: number
  type: string
  select: boolean
  editSelect: boolean
  linkSceneName: string
}

/**
 * 根据index计算坐标位置
 * @returns {x, y}
 */
function getPos(index: number): Record<'x' | 'y', string> {
  // console.log('getPos', index)
  const x = `${(index % 4) * CARD_W}px`
  const y = `${Math.floor(index / 4) * CARD_H}px`
  return { x, y }
}

/**
 * 根据坐标位置计算index
 * @returns index
 */
function getIndex(x: number, y: number) {
  const maxIndex = deviceStore.deviceFlattenList.length - 1 // 防止越界
  const ix = Math.floor((x + CARD_W / 2) / CARD_W)
  const iy = Math.floor((y + CARD_H / 2) / CARD_H)
  return Math.min(ix + 4 * iy, maxIndex)
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
    movableAreaHeight: 236, // 可移动区域高度
    /** 展示点中离线设备弹窗 */
    showDeviceOffline: false,
    /** 点击的离线设备的信息 */
    officeDeviceInfo: {} as DeviceCard,
    /** 控制面板 */
    controlPopup: false,
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
    checkedList: [] as string[], // 已选择设备的id列表
    editSelectList: [] as string[], // 编辑状态下，已勾选的设备id列表
    editSelectMode: false, // 是否编辑状态
    lightStatus: {} as Record<string, number>, // 当前选择的灯具的状态
    curtainStatus: {} as Record<string, string>, // 当前选择的窗帘的状态
    checkedType: [] as string[], // 已选择设备的类型
    deviceListInited: false, // 设备列表是否初始化完毕
    isMoving: false, // 是否正在拖拽中
    hasMoved: false, // 排序变更过
    placeholder: {
      orderNum: -1, // 占位符当前对应的排序
      index: -1, // 占位符当前对应元素的数据索引
      groupIndex: -1,
      x: '',
      y: '',
    },
  },

  computed: {
    roomHasGateway(data) {
      if (data.allRoomDeviceList) {
        return (
          (data.allRoomDeviceList as DeviceCard[]).filter(
            (device) =>
              device.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId &&
              device.proType === PRO_TYPE.gateway,
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
              device.proType !== PRO_TYPE.gateway,
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
      return data.checkedList.some((uniId) => uniId.indexOf(':') === -1 && deviceMap[uniId].proType === PRO_TYPE.light)
    },
    /** 是否只控制选中一个开关 */
    // TODO 代码可删除
    isSwitchSelectOne(data) {
      if (data.checkedList) {
        const deviceMap = deviceStore.deviceFlattenMap
        let selectSwitchNum = 0
        data.checkedList.forEach((uniId: string) => {
          if (uniId.includes(':')) {
            if (deviceMap[uniId].proType === PRO_TYPE.switch) {
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
    // 可滚动区域高度
    scrollViewHeight(data) {
      let baseHeight =
        (storage.get<number>('windowHeight') as number) -
        (storage.get<number>('statusBarHeight') as number) -
        (storage.get<number>('navigationBarHeight') as number)
      if (data.controlPopup) {
        baseHeight -= rpx2px(600)
      } else if (data.editSelectMode) {
        baseHeight -= rpx2px(368)
      }
      return baseHeight
    },
  },

  watch: {
    'currentRoom.endCount'(value) {
      this.setData({
        movableAreaHeight: Math.ceil(value / 4) * 236,
      })
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    async onLoad() {
      // this.setUpdatePerformanceListener({withDataPaths: true}, (res) => {
      //   console.debug('setUpdatePerformanceListener', res, res.pendingStartTimestamp - res.updateStartTimestamp, res.updateEndTimestamp - res.updateStartTimestamp, dayjs().format('YYYY-MM-DD HH:mm:ss'))
      // })

      // ws消息处理
      emitter.on('wsReceive', async (e) => {
        if (e.result.eventType === WSEventType.device_property) {
          // 如果有传更新的状态数据过来，直接更新store
          const deviceInHouse = deviceStore.allRoomDeviceList.find(
            (device) => device.deviceId === e.result.eventData.deviceId,
          )
          if (deviceInHouse) {
            runInAction(() => {
              deviceInHouse.mzgdPropertyDTOList[e.result.eventData.ep] = {
                ...deviceInHouse.mzgdPropertyDTOList[e.result.eventData.ep],
                ...e.result.eventData.event,
              }
            })
            roomStore.updateRoomCardLightOnNum()
          }

          // 组装要更新的设备数据
          const deviceInRoom = deviceStore.deviceList.find(
            (device) => device.deviceId === e.result.eventData.deviceId,
          ) as DeviceCard
          if (deviceInRoom) {
            runInAction(() => {
              deviceInRoom.mzgdPropertyDTOList[e.result.eventData.ep] = {
                ...deviceInRoom.mzgdPropertyDTOList[e.result.eventData.ep],
                ...e.result.eventData.event,
              }
            })
          }

          // 组装要更新的设备数据，更新的为flatten列表，结构稍不同
          const device = {} as DeviceCard
          device.deviceId = e.result.eventData.deviceId
          device.uniId = `${e.result.eventData.deviceId}:${e.result.eventData.ep}`
          device.mzgdPropertyDTOList = {}
          device.mzgdPropertyDTOList[e.result.eventData.ep] = {
            ...e.result.eventData.event,
          }
          // WIFI灯状态更新
          if (Object.prototype.hasOwnProperty.call(e.result.eventData.event, 'power')) {
            device.mzgdPropertyDTOList[e.result.eventData.ep].OnOff = e.result.eventData.event.power === 'on' ? 1 : 0
          }
          this.updateDeviceList(device)
          return
        }
        // 更新在线状态
        else if (
          e.result.eventType === WSEventType.screen_online_status_sub_device ||
          e.result.eventType === WSEventType.screen_online_status_wifi_device
        ) {
          const { deviceId, ep, status } = e.result.eventData
          const device = {} as DeviceCard
          device.deviceId = deviceId
          device.uniId = ep ? `${deviceId}:${ep}` : deviceId
          device.onLineStatus = status
          this.updateDeviceList(device)
        }
        // 节流更新本地数据
        else if (
          [
            WSEventType.device_del,
            WSEventType.device_replace,
            WSEventType.device_online_status,
            WSEventType.device_offline_status,
            WSEventType.group_device_result_status,
            WSEventType.screen_move_sub_device,
          ].includes(e.result.eventType)
        ) {
          this.updateRoomData(e)
        } else if (
          e.result.eventType === WSEventType.room_del &&
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

    async onShow() {
      // 再更新一遍数据
      await this.reloadData()
    },

    async reloadData() {
      try {
        await Promise.all([
          deviceStore.updateAllRoomDeviceList(),
          deviceStore.updateSubDeviceList(),
          homeStore.updateRoomCardList(),
          sceneStore.updateSceneList(),
          sceneStore.updateAllRoomSceneList(),
        ])
        this.updateDeviceList()
      } finally {
        wx.stopPullDownRefresh()
      }
    },

    // 节流更新房间各种信息
    updateRoomData: throttle(function (this: IAnyObject) {
      this.reloadData()
    }, 3000),

    // 页面滚动
    onPageScroll(e: { detail: { scrollTop: number } }) {
      this.data.scrollTop = e.detail.scrollTop
      if (e.detail.scrollTop !== 0) {
        this.setData({
          showAddSceneTips: false,
        })
      }
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
    // 根据场景信息，比较出关联场景名字
    getLinkSceneName(device: Device.DeviceItem) {
      if (device?.proType !== PRO_TYPE.switch) {
        return ''
      }
      const switchId = device.uniId.split(':')[1]
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      const sceneIdMp = sceneStore.sceneIdMp
      const uId = `${device.deviceId}:${switchId}`

      if (
        switchSceneConditionMap[uId] &&
        sceneIdMp[switchSceneConditionMap[uId]] &&
        sceneIdMp[switchSceneConditionMap[uId]].sceneName
      ) {
        return sceneIdMp[switchSceneConditionMap[uId]].sceneName.slice(0, 4)
      }
      return ''
    },
    /**
     * @description 初始化或更新设备列表
     * @param e 设备对象，或包裹设备对象的事件
     */
    async updateDeviceList(e?: DeviceCard & { detail?: DeviceCard }) {
      console.log('[updateDeviceList Begin]', e?.detail ?? e ?? '')

      // 单项更新
      if (e?.deviceId || e?.detail?.deviceId) {
        const device = e?.deviceId ? e : e.detail
        let originDevice: DeviceCard

        for (const groupIndex in this.data.devicePageList) {
          const index = this.data.devicePageList[groupIndex].findIndex((d: DeviceCard) => {
            if (d.proType === PRO_TYPE.switch) {
              return d.uniId === device!.uniId
            } else {
              return d.deviceId === device!.deviceId
            }
          })
          if (index !== -1) {
            originDevice = this.data.devicePageList[groupIndex][index]
            const diffData = {} as IAnyObject
            // review 细致到字段的diff
            const renderList = ['deviceName', 'onLineStatus', 'select', 'editSelect'] // 需要刷新界面的字段

            renderList.forEach((key) => {
              const newVal = _get(device!, key)
              const originVal = _get(originDevice, key)
              // 进一步检查，过滤确实有更新的字段
              if (newVal !== undefined && newVal !== originVal) {
                diffData[`devicePageList[${groupIndex}][${index}].${key}`] = newVal
              }
            })

            // 如果mzgdPropertyDTOList、switchInfoDTOList字段存在，则覆盖更新
            if (device!.mzgdPropertyDTOList) {
              const eq = originDevice.proType === PRO_TYPE.switch ? originDevice.uniId.split(':')[1] : 1
              const newVal = {
                ...originDevice.mzgdPropertyDTOList[eq],
                ...device?.mzgdPropertyDTOList[eq],
              }

              diffData[`devicePageList[${groupIndex}][${index}].mzgdPropertyDTOList[${eq}]`] = newVal

              // 更新场景关联信息
              diffData[`devicePageList[${groupIndex}][${index}].linkSceneName`] = this.getLinkSceneName({
                ...device!,
                proType: originDevice.proType, // 补充关键字段
              })
            }
            if (device!.switchInfoDTOList) {
              const newVal = {
                ...originDevice.switchInfoDTOList[0],
                ...device?.switchInfoDTOList[0],
              }
              diffData[`devicePageList[${groupIndex}][${index}].switchInfoDTOList[0]`] = newVal
            }

            // 如果控制框为显示状态，且是当前更新项，则同步更新
            if (
              device!.mzgdPropertyDTOList &&
              this.data.checkedList.includes(originDevice!.deviceId) &&
              originDevice!.select
            ) {
              const prop = transferDeviceProperty(originDevice.proType, device!.mzgdPropertyDTOList['1'])
              if (originDevice.proType === PRO_TYPE.light) {
                diffData.lightStatus = {
                  Level: prop.Level,
                  ColorTemp: prop.ColorTemp,
                  OnOff: prop.OnOff,
                }
              } else if (originDevice.proType === PRO_TYPE.curtain) {
                diffData.curtainStatus = {
                  position: prop.curtain_position,
                }
              }
            }

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
          // 接口返回开关面板数据以设备为一个整体，需要前端拆开后排序
          // 排除灯组
          .filter((device) => !deviceStore.lightsInGroup.includes(device.deviceId))
          // 先排序再映射字段
          .sort((a, b) => a.orderNum - b.orderNum && parseInt(a.deviceId) - parseInt(b.deviceId))
          .map((device, index) => ({
            ...device,
            ...getPos(index),
            // !! 整理orderNum，从0开始
            // TRICK 排序过程orderNum代替index使用，而不必改变数组的真实索引
            orderNum: index,
            type: proName[device.proType],
            select: this.data.checkedList.includes(device.uniId),
            editSelect: this.data.editSelectList.includes(device.uniId),
            linkSceneName: this.getLinkSceneName(device),
          }))

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

        // 拆分为二维数组，以便分页渲染
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

    // 开始拖拽，初始化placeholder
    movableTouchStart(e: WechatMiniprogram.TouchEvent) {
      const orderNum = e.currentTarget.dataset.ordernum // ! 注意大小写
      const groupIndex = e.currentTarget.dataset.group
      const index = e.currentTarget.dataset.index

      const diffData = {} as IAnyObject
      diffData.isMoving = true
      diffData.placeholder = {
        ...getPos(orderNum),
        orderNum,
        groupIndex,
        index,
      }
      console.log('movableTouchStart:', diffData)

      this.setData(diffData)
    },

    /**
     * 拖拽时触发的卡片移动效果
     */
    movableChange: throttle(function (this: IAnyObject, e: WechatMiniprogram.TouchEvent) {
      const targetOrder = getIndex(e.detail.x, e.detail.y)
      if (this.data.placeholder.orderNum !== targetOrder && e.detail.source === 'touch') {
        const oldOrder = this.data.placeholder.orderNum
        console.log('movableChange: %d-->%d', oldOrder, targetOrder, e)

        // 更新placeholder的位置
        const dPos = getPos(targetOrder)
        const diffData = {} as IAnyObject
        diffData[`placeholder.orderNum`] = targetOrder
        diffData[`placeholder.x`] = dPos.x
        diffData[`placeholder.y`] = dPos.y

        // 更新联动卡片的位置
        let moveCount = 0
        for (const groupIndex in this.data.devicePageList) {
          const group = this.data.devicePageList[groupIndex]
          for (const index in group) {
            const _orderNum = group[index].orderNum
            const isForward = oldOrder < targetOrder
            if (
              (isForward && _orderNum > oldOrder && _orderNum <= targetOrder) ||
              (!isForward && _orderNum >= targetOrder && _orderNum < oldOrder)
            ) {
              ++moveCount
              const dOrderNum = isForward ? _orderNum - 1 : _orderNum + 1
              const dpos = getPos(dOrderNum)
              diffData[`devicePageList[${groupIndex}][${index}].x`] = dpos.x
              diffData[`devicePageList[${groupIndex}][${index}].y`] = dpos.y
              diffData[`devicePageList[${groupIndex}][${index}].orderNum`] = dOrderNum

              // 减少遍历消耗
              if (moveCount >= Math.abs(targetOrder - oldOrder)) {
                break
              }
            }
            if (moveCount >= Math.abs(targetOrder - oldOrder)) {
              break
            }
          }
        }

        // 更新被拖拽卡片的排序num
        const groupIndex = this.data.placeholder.groupIndex
        const index = this.data.placeholder.index
        diffData[`devicePageList[${groupIndex}][${index}].orderNum`] = targetOrder
        console.log(diffData)
        this.setData(diffData)

        this.data.hasMoved = true
      }
    }, 100),

    movableTouchEnd() {
      if (!this.data.isMoving) {
        return
      }
      const groupIndex = this.data.placeholder.groupIndex
      const index = this.data.placeholder.index
      const dpos = getPos(this.data.placeholder.orderNum)

      const diffData = {} as IAnyObject
      diffData.isMoving = false
      // 修正卡片位置
      diffData[`devicePageList[${groupIndex}][${index}].x`] = dpos.x
      diffData[`devicePageList[${groupIndex}][${index}].y`] = dpos.y
      diffData[`placeholder.orderNum`] = -1
      diffData[`placeholder.index`] = -1
      diffData[`placeholder.groupIndex`] = -1
      this.setData(diffData)
      console.log('movableTouchEnd:', diffData)

      this.handleSortSaving()
    },
    async handleSortSaving() {
      if (!this.data.hasMoved) {
        return
      }
      this.data.hasMoved = false

      const deviceOrderData = {
        deviceInfoByDeviceVoList: [],
        type: '0',
      } as Device.OrderSaveData
      const switchOrderData = {
        deviceInfoByDeviceVoList: [],
        type: '1',
      } as Device.OrderSaveData

      for (const groupIndex in this.data.devicePageList) {
        const group = this.data.devicePageList[groupIndex]
        for (const index in group) {
          const device = group[index]
          if (device.proType !== PRO_TYPE.switch) {
            deviceOrderData.deviceInfoByDeviceVoList.push({
              deviceId: device.deviceId,
              houseId: homeStore.currentHomeId,
              roomId: device.roomId,
              orderNum: String(device.orderNum),
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
            })
          }
        }
      }
      if (deviceOrderData.deviceInfoByDeviceVoList.length) {
        await saveDeviceOrder(deviceOrderData)
      }
      if (switchOrderData.deviceInfoByDeviceVoList.length) {
        await saveDeviceOrder(switchOrderData)
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
      const addSceneActions = [] as Device.ActionItem[]

      // 排除已经是场景开关的开关或者离线的设备
      // ButtonMode 0 普通面板或者关联开关 2 场景 3 关联灯
      let deviceList = [] as Device.DeviceItem[]

      for (const list of this.data.devicePageList) {
        deviceList = deviceList.concat(list)
      }

      const selectList = deviceList.filter((device) => {
        let [, switchId] = device.uniId.split(':')

        switchId = switchId ?? 1

        return device.mzgdPropertyDTOList[switchId].ButtonMode !== 2 && device.onLineStatus
      })

      if (!selectList.length) {
        Toast('所有设备已离线，无法创建场景')
        return
      }

      selectList.forEach((device) => {
        if (device.proType === PRO_TYPE.switch) {
          // 开关
          const ep = parseInt(device.uniId.split(':')[1])
          const OnOff = device.mzgdPropertyDTOList[ep].OnOff
          const desc = toPropertyDesc(device.proType, device.mzgdPropertyDTOList[ep])

          addSceneActions.push({
            uniId: device.uniId,
            name: device.switchInfoDTOList[0].switchName + ' | ' + device.deviceName,
            desc: desc,
            pic: device.switchInfoDTOList[0].pic,
            proType: device.proType,
            deviceType: device.deviceType,
            value: {
              ep,
              OnOff,
            },
          })
        } else {
          const properties = transferDeviceProperty(device.proType, device.mzgdPropertyDTOList['1'])
          const desc = toPropertyDesc(device.proType, properties)

          const action = {
            uniId: device.uniId,
            name: device.deviceName,
            desc,
            pic: device.pic,
            proType: device.proType,
            deviceType: device.deviceType,
            value: {
              ep: 1,
              ...properties,
            } as IAnyObject,
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
    handleCardTap(e: { detail: DeviceCard & { clientRect: WechatMiniprogram.ClientRect } }) {
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
      device.select = false
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

    handleCardCommonTap(e: { detail: DeviceCard & { clientRect: WechatMiniprogram.ClientRect } }) {
      const { uniId } = e.detail // 灯的 deviceId===uniId
      const isChecked = this.data.checkedList.includes(uniId) // 点击卡片前，卡片是否选中
      const toCheck = !isChecked // 本次点击需执行的选中状态

      // 选择时的卡片样式渲染
      const diffData = {} as IAnyObject

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
      if (toCheck) {
        const prop = e.detail.mzgdPropertyDTOList['1']
        if (e.detail.proType === PRO_TYPE.light) {
          diffData.lightStatus = {
            Level: prop.Level,
            ColorTemp: prop.ColorTemp,
            OnOff: prop.OnOff,
          }
        } else if (e.detail.proType === PRO_TYPE.curtain) {
          diffData.curtainStatus = {
            position: prop.curtain_position,
          }
        }
      }

      // 更新选中样式
      const device = e.detail
      device.select = this.data.checkedList.includes(uniId)
      this.updateDeviceList(device)

      // 合并数据变化
      diffData.checkedList = [...this.data.checkedList]
      diffData.controlPopup = toCheck

      // 弹起popup后，选中卡片滚动到视图中央，以免被遮挡
      const divideRpxByPx = storage.get<number>('divideRpxByPx')
        ? (storage.get<number>('divideRpxByPx') as number)
        : 0.5
      const windowHeight = storage.get<number>('windowHeight') as number
      const bottom = windowHeight - 716 * divideRpxByPx
      const top = bottom - 216 * divideRpxByPx

      diffData.scrollTop = this.data.scrollTop + e.detail.clientRect.top - top + 4

      // 更新视图
      this.setData(diffData)

      // TODO
      this.updateSelectType()
    },

    // 卡片点击时，按品类调用对应方法
    async handleControlTap(e: { detail: DeviceCard }) {
      const device = { ...e.detail }
      const ep = device.switchInfoDTOList ? device.switchInfoDTOList[0].switchId : 1

      // 若面板关联场景
      if (device.proType === PRO_TYPE.switch && device.mzgdPropertyDTOList[ep].ButtonMode === 2) {
        const sceneId = deviceStore.switchSceneConditionMap[device.uniId]
        if (sceneId) {
          execScene(sceneId)
        }
        return
      }

      if (device.proType === PRO_TYPE.curtain) {
        const OldPosition = device.mzgdPropertyDTOList[1].curtain_position
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

      // 灯和面板
      const OldOnOff = device.mzgdPropertyDTOList[ep].OnOff
      const newOnOff = OldOnOff ? 0 : 1

      // 即时改变视图，提升操作手感
      device.mzgdPropertyDTOList[ep].OnOff = newOnOff
      this.updateDeviceList(device)
      this.setData({
        'lightStatus.OnOff': newOnOff,
      })

      const res = await sendDevice({
        proType: device.proType,
        deviceType: device.deviceType,
        deviceId: device.deviceId,
        ep,
        gatewayId: device.gatewayId,
        property: { OnOff: newOnOff },
      })

      if (!res.success) {
        device.mzgdPropertyDTOList[ep].OnOff = OldOnOff
        this.updateDeviceList(device)
        this.setData({
          'lightStatus.OnOff': OldOnOff,
        })
        Toast('控制失败')
      }

      // 首页需要更新灯光打开个数
      homeStore.updateCurrentHomeDetail()
    },

    handlePopMove(e: { detail: 'up' | 'down' }) {
      if (e.detail === 'down') {
        this.cancelCheckAndPops()
      }
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
      this.setData({
        showAddSceneSuccess: false,
      })

      wx.navigateTo({
        url: '/package-room-control/scene-request-list/index',
      })

      // this.updateDeviceList()
      // setTimeout(() => {
      //   wx.createSelectorQuery()
      //     .select('#scene-title')
      //     .boundingClientRect()
      //     .exec((res) => {
      //       if (res.length > 0 && res[0]) {
      //         this.setData({
      //           sceneTitlePosition: {
      //             x: res[0].left,
      //             y: res[0].top,
      //           },
      //         })
      //         setTimeout(() => {
      //           this.setData({
      //             showAddSceneSuccess: false,
      //           })
      //         }, 3000)
      //       }
      //     })
      // }, 100)
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
    },
    /** 点击空位的操作 */
    handleScreenTap() {
      this.cancelCheckAndPops()
    },
    /** 取消单选，收起弹窗 */
    cancelCheckAndPops() {
      if (!this.data.controlPopup) {
        return
      }

      // 更新选中状态样式
      const deviceId = this.data.checkedList[0]
      const device = {
        deviceId,
        uniId: deviceId,
        select: false,
      } as DeviceCard
      device.deviceId = this.data.checkedList[0]
      device.uniId = this.data.checkedList[0]
      this.updateDeviceList(device)

      // 收起弹窗
      this.setData({
        checkedList: [],
        controlPopup: false,
      })
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
        this.handleScreenTap()
      }
      this.setData(diffData)
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
