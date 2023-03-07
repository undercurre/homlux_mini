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
import { proName, proType } from '../../config/device'
import { emitter, WSEventType } from '../../utils/eventBus'

ComponentWithComputed({
  behaviors: [
    BehaviorWithStore({ storeBindings: [userBinding, roomBinding, deviceBinding, sceneBinding] }),
    pageBehavior,
  ],
  /**
   * 页面的初始数据
   */
  data: {
    controlPopupUp: true,
    showAddScenePopup: false,
    contentHeight: 0,
    lightList: [] as Device.DeviceItem[],
    switchList: [] as Device.DeviceItem[],
    curtainList: [] as Device.DeviceItem[],
    showAddSceneSuccess: false,
    sceneTitlePosition: {
      x: 0,
      y: 0,
    },
    isRefresh: false,
    pageMetaScrollTop: 0,
    scrollTop: 0,
    tempList: [] as Device.DeviceItem[],
  },

  computed: {
    title(data) {
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return data.roomList[data.currentRoomIndex]?.roomName
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
    opacity(data) {
      if (data.scrollTop) {
        return 30 - data.scrollTop < 0 ? 0 : (30 - data.scrollTop) / 30
      }
      return 1
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      this.onPullDownRefresh()
      emitter.on('wsReceive', async (e) => {
        console.log(
          e.result.eventData.roomId,
          roomStore.roomList[roomStore.currentRoomIndex].roomId,
          e.result.eventData.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId,
        )
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
            const res = await queryDeviceInfoByDeviceId(
              deviceStore.deviceList[index].deviceId,
              deviceStore.deviceList[index].roomId,
            )
            if (res.success) {
              runInAction(() => {
                deviceStore.deviceList[index] = res.result
                deviceStore.deviceList = [...deviceStore.deviceList]
              })
            }
          } else {
            // 可能是新绑的设备，直接更新房间
            deviceStore.updateSubDeviceList()
          }
        } else if (
          typeof e.result.eventData === 'object' &&
          e.result.eventType === 'room_del' &&
          e.result.eventData.roomId === roomStore.roomList[roomStore.currentRoomIndex].roomId
        ) {
          // 房间被删除，退出到首页
          wx.showToast({
            title: '该房间已被删除',
          })
          wx.redirectTo({
            url: '/pages/index/index',
          })
        }
      })
    },

    async onPullDownRefresh() {
      try {
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

    updateDeviceList() {
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
      if (deviceStore.selectList.length === 0) {
        wx.showToast({
          icon: 'none',
          title: '请先选择设备',
        })
        return
      }
      this.setData({
        showAddScenePopup: true,
      })
    },
    handleDeviceCardTap(e: { detail: Device.DeviceItem }) {
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
            if (deviceMap[deviceId].proType === proType.light) {
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
    async handleLightPowerToggle(e: { detail: Device.DeviceItem }) {
      await controlDevice(
        {
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
        },
        { loading: true },
      )
    },
    handleLightSortEnd(e: { detail: { listData: Device.DeviceItem[] } }) {
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
      saveDeviceOrder(orderData)
    },
    handleSwitchSortEnd(e: { detail: { listData: Device.DeviceItem[] } }) {
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
      saveDeviceOrder(orderData)
    },
    async handleSwitchControlTapToggle(e: { detail: Device.DeviceItem }) {
      const ep = e.detail.switchInfoDTOList[0].switchId
      if (e.detail.mzgdPropertyDTOList[ep].ButtonMode && e.detail.mzgdPropertyDTOList[ep].ButtonMode === 2) {
        const sceneId = deviceStore.switchSceneMap[e.detail.uniId]
        if (sceneId) {
          execScene(sceneId)
        }
      } else {
        await controlDevice(
          {
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
          },
          { loading: true },
        )
      }
    },
    handlePopMove() {
      this.setData({
        controlPopupUp: !this.data.controlPopupUp,
      })
    },
    handleAddScenePopupClose() {
      this.setData({
        showAddScenePopup: !this.data.showAddScenePopup,
      })
    },
    handleShowAddSceneSuccess() {
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
  },
})
