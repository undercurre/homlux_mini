import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import {
  userBinding,
  roomBinding,
  deviceBinding,
  deviceStore,
  sceneBinding,
  sceneStore,
  roomStore,
  homeStore,
} from '../../store/index'
import { runInAction } from 'mobx-miniprogram'
import pageBehavior from '../../behaviors/pageBehaviors'
import { controlDevice, saveDeviceOrder, queryDeviceInfoByDeviceId, execScene } from '../../apis/index'
import Toast from '@vant/weapp/toast/toast'
import { storage, emitter, WSEventType } from '../../utils/index'
import { maxColorTempK, minColorTempK, proName, proType } from '../../config/index'

let throttleTimer = 0
ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [userBinding, roomBinding, deviceBinding, sceneBinding] }),
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
    showDeviceOffline: false,
    officeDeviceInfo: {} as Device.DeviceItem,
    controlPopup: true,
    popupPlaceholder: false,
    showAddScenePopup: false,
    contentHeight: 0,
    lightList: [] as Device.DeviceItem[],
    switchList: [] as Device.DeviceItem[],
    curtainList: [] as Device.DeviceItem[],
    showBeforeAddScenePopup: false,
    showAddSceneSuccess: false,
    sceneTitlePosition: {
      x: 0,
      y: 0,
    },
    isRefresh: false,
    pageMetaScrollTop: 0,
    scrollTop: 0,
    tempList: [] as Device.DeviceItem[],
    selectCount: 0,
    dragging: false,
    hasUpdate: false,
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
  },

  watch: {
    deviceList() {
      this.updateDeviceList()
    },
    selectList(value) {
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
    dragging(value) {
      if (!value && this.data.hasUpdate) {
        deviceStore.updateSubDeviceList().then(() => {
          this.updateDeviceList()
        })
        this.setData({
          hasUpdate: false,
        })
      }
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      // 先从已加载数据拿出来
      runInAction(() => {
        deviceStore.deviceList = deviceStore.allRoomDeviceList.filter(
          (device) =>
            device.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId &&
            device.proType !== proType.gateway,
        )
      })
      // 再更新一遍数据
      this.reloadData()
      emitter.on('wsReceive', async (e) => {
        if (!throttleTimer) {
          throttleTimer = setTimeout(() => {
            homeStore.updateRoomCardList()
            throttleTimer = 0
          }, 500)
        }
        // 设备相关的消息推送根据条件判断是否刷新
        if (
          typeof e.result.eventData === 'object' &&
          [WSEventType.device_del, WSEventType.device_online_status, WSEventType.device_property].includes(
            e.result.eventType,
          ) &&
          e.result.eventData.roomId &&
          e.result.eventData.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId
        ) {
          // 如果是当前房间的设备状态发生变化，更新设备状态
          const index = deviceStore.deviceList.findIndex((device) => device.deviceId === e.result.eventData.deviceId)
          if (index !== -1) {
            const res = await queryDeviceInfoByDeviceId({
              deviceId: deviceStore.deviceList[index].deviceId,
              roomId: deviceStore.deviceList[index].roomId,
            })
            if (res.success) {
              runInAction(() => {
                deviceStore.deviceList[index] = res.result
                deviceStore.deviceList = [...deviceStore.deviceList]
              })
              this.updateDeviceList()
            }
            // 可能开关绑定了场景
            await sceneStore.updateAllRoomSceneList()
            this.updateDeviceList()
          } else {
            // 可能是新绑的设备，直接更新房间
            await deviceStore.updateSubDeviceList()
            this.updateDeviceList()
          }
        } else if (
          typeof e.result.eventData === 'object' &&
          e.result.eventType === 'room_del' &&
          e.result.eventData.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId
        ) {
          // 房间被删除，退出到首页
          homeStore.updateRoomCardList()
          wx.redirectTo({
            url: '/pages/index/index',
          })
        }
      })
    },

    async reloadData() {
      try {
        await sceneStore.updateAllRoomSceneList()
        await deviceStore.updateSubDeviceList()
        await sceneStore.updateSceneList()
        this.updateDeviceList()
      } finally {
        wx.stopPullDownRefresh()
      }
    },

    // 页面滚动
    onPageScroll(e: { scrollTop: number }) {
      this.setData({
        scrollTop: e.scrollTop,
      })
    },

    onUnload() {
      // 退出页面前清理一下选中的列表
      runInAction(() => {
        deviceStore.selectList = []
        deviceStore.selectType = []
      })
      // 解除监听
      emitter.off('wsReceive')
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

    updateDeviceList() {
      if (this.data.dragging) {
        this.setData({
          hasUpdate: true,
        })
        return
      }
      const flattenList = deviceStore.deviceFlattenList
      const lightList = flattenList
        .filter((device) => device.proType === proType.light)
        .map((device) => ({
          ...device,
          dragId: device.uniId,
          type: proName[device.proType],
          select: deviceStore.selectList.includes(device.uniId),
        }))
      const switchList = flattenList
        .filter((device) => device.proType === proType.switch)
        .map((device) => ({
          ...device,
          dragId: device.uniId,
          type: proName[device.proType],
          select: deviceStore.selectList.includes(device.uniId),
        }))
      lightList.sort((a, b) => a.orderNum - b.orderNum)
      switchList.sort((a, b) => a.switchInfoDTOList[0].orderNum - b.switchInfoDTOList[0].orderNum)
      this.setData({
        lightList,
        switchList,
      })
      setTimeout(() => {
        const dragLight = this.selectComponent('#drag-light')
        if (dragLight && lightList.length > 0) {
          dragLight.init()
        }
        const dragSwitch = this.selectComponent('#drag-switch')
        if (dragSwitch && switchList.length > 0) {
          dragSwitch.init()
        }
      }, 50)
    },

    handleScroll(e: { detail: { scrollTop: number } }) {
      this.setData({
        pageMetaScrollTop: e.detail.scrollTop,
      })
    },
    handleSceneTap() {
      wx.navigateTo({
        url: '/package-room-control/scene-list/index',
      })
    },
    handleCollect() {
      // 补充actions
      const deviceMap = deviceStore.deviceMap
      const switchSceneMap = deviceStore.switchSceneMap
      const addSceneActions = [] as Device.ActionItem[]
      // 排除已经是场景开关的开关
      const selectList = deviceStore.deviceFlattenList.filter((device) => !switchSceneMap[device.uniId])
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
          const color = (properties.ColorTemp / 100) * (maxColorTempK - minColorTempK) + maxColorTempK
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
        showBeforeAddScenePopup: true,
      })
    },
    handleDeviceCardTap(e: { detail: Device.DeviceItem & { clientRect: WechatMiniprogram.ClientRect } }) {
      console.log('handleDeviceCardTap', e.detail)
      if (deviceStore.selectList.length === 0) {
        this.setData({
          popupPlaceholder: true,
        })
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
      const deviceMap = deviceStore.deviceMap
      if (e.detail.proType === proType.switch) {
        // 开关选择逻辑
        if (deviceStore.selectList.includes(e.detail.uniId)) {
          const index = deviceStore.selectList.findIndex((item: string) => item === e.detail.uniId)
          deviceStore.selectList.splice(index, 1)
          runInAction(() => {
            deviceStore.selectList = [...deviceStore.selectList]
          })
        } else {
          runInAction(() => {
            deviceStore.selectList = [...deviceStore.selectList, e.detail.uniId]
          })
        }
      } else {
        // 灯、窗帘选择逻辑
        if (deviceStore.selectList.includes(e.detail.deviceId)) {
          const index = deviceStore.selectList.findIndex((item: string) => item === e.detail.deviceId)
          deviceStore.selectList.splice(index, 1)
          runInAction(() => {
            deviceStore.selectList = [...deviceStore.selectList]
          })
          // 将面板的灯状态恢复到上一个选中的灯
          let latestSelectLightId = ''
          deviceStore.selectList.forEach((deviceId) => {
            if (deviceMap[deviceId]?.proType === proType.light) {
              latestSelectLightId = deviceId
            }
          })
          if (latestSelectLightId) {
            runInAction(() => {
              deviceStore.lightInfo = {
                Level: deviceMap[latestSelectLightId].mzgdPropertyDTOList['1'].Level,
                ColorTemp: deviceMap[latestSelectLightId].mzgdPropertyDTOList['1'].ColorTemp,
              }
            })
          }
        } else {
          runInAction(() => {
            deviceStore.selectList = [...deviceStore.selectList, e.detail.deviceId]
            if (e.detail.proType === proType.light) {
              deviceStore.lightInfo = {
                Level: e.detail.mzgdPropertyDTOList['1'].Level,
                ColorTemp: e.detail.mzgdPropertyDTOList['1'].ColorTemp,
              }
            }
          })
        }
      }
      this.updateSelectType()
      this.updateDeviceList()
    },
    async handleDevicePowerTap(e: { detail: Device.DeviceItem }) {
      console.log(e)
    },
    async handleLightPowerToggle(e: { detail: Device.DeviceItem & { clientRect: WechatMiniprogram.ClientRect } }) {
      const device = deviceStore.deviceList.find((device) => device.deviceId === e.detail.deviceId)!
      const OnOff = device.mzgdPropertyDTOList['1'].OnOff
      // 如果是打开则默认选择设备
      if (!OnOff) {
        this.handleDeviceCardTap(e)
      }
      runInAction(() => {
        device.mzgdPropertyDTOList['1'].OnOff = OnOff ? 0 : 1
        deviceStore.deviceList = [...deviceStore.deviceList]
      })
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
        runInAction(() => {
          device.mzgdPropertyDTOList['1'].OnOff = OnOff
          deviceStore.deviceList = [...deviceStore.deviceList]
        })
        Toast('控制失败')
      }
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
    },
    async handleSwitchControlTapToggle(e: {
      detail: Device.DeviceItem & { clientRect: WechatMiniprogram.ClientRect }
    }) {
      console.log(e)
      const ep = e.detail.switchInfoDTOList[0].switchId
      if (e.detail.mzgdPropertyDTOList[ep].ButtonMode && e.detail.mzgdPropertyDTOList[ep].ButtonMode === 2) {
        const sceneId = deviceStore.switchSceneMap[e.detail.uniId]
        if (sceneId) {
          execScene(sceneId)
        }
      } else {
        const device = deviceStore.deviceList.find((device) => device.deviceId === e.detail.deviceId)!
        const OnOff = device.mzgdPropertyDTOList[ep].OnOff
        // 如果是打开则默认选择设备
        if (!OnOff) {
          this.handleDeviceCardTap(e)
        }
        runInAction(() => {
          device.mzgdPropertyDTOList[ep].OnOff = OnOff ? 0 : 1
          deviceStore.deviceList = [...deviceStore.deviceList]
        })
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
      deviceStore.selectList.forEach((deviceId: string) => {
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
    handleScreenTap() {
      if (this.data.controlPopup) {
        this.setData({
          controlPopup: false,
        })
      }
    },
    handleDrag(e: { detail: boolean }) {
      console.log('drag', e.detail)
      this.setData({
        dragging: e.detail,
      })
    },
    handleCancelSelce(e: WechatMiniprogram.TouchEvent) {
      if (e.currentTarget.dataset.type === 'light') {
        const newSelectList = deviceStore.selectList.filter((uniId) => {
          if (uniId.includes(':')) {
            return true
          } else if (deviceStore.deviceMap[uniId].proType !== proType.light) {
            return true
          }
          return false
        })
        runInAction(() => {
          deviceStore.selectList = newSelectList
        })
      } else if (e.currentTarget.dataset.type === 'switch') {
        const newSelectList = deviceStore.selectList.filter((uniId) => {
          if (uniId.includes(':')) {
            return false
          }
          return false
        })
        runInAction(() => {
          deviceStore.selectList = newSelectList
        })
      }
      this.updateSelectType()
      this.updateDeviceList()
    },
    handleAddDevice() {
      wx.navigateTo({ url: '/package-distribution/scan/index' })
    },
  },
})
