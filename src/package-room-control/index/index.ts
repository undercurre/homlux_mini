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
import { controlDevice, saveDeviceOrder } from '../../apis/index'
import { proName, proType } from '../../config/device'
import { emitter, WSEventType } from '../../utils/eventBus'

interface ClienRect {
  id: string // 节点的ID
  left: number // 节点的左边界坐标
  right: number // 节点的右边界坐标
  top: number // 节点的上边界坐标
  bottom: number // 节点的下边界坐标
  width: number // 节点的宽度
  height: number // 节点的高度
  dataset: Record<string, any> // 节点数据
}

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
    lightInfo: {
      Level: 0,
      ColorTemp: 0,
    },

    // 拖动排序
    touchLocation: {
      x: 0,
      y: 0,
    },
    isLongPress: false,
    longPressType: '',
    longPressDevice: {} as Device.DeviceItem,
    longPressBeginIndex: 0,
    lightCardElements: [] as ClienRect[],
    switchCardElements: [] as ClienRect[],
    curtainCardElements: [] as ClienRect[],
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
      if (data.currentRoomIndex !== undefined && data.roomList) {
        return data.roomList[data.currentRoomIndex]?.sceneList.slice(0, 4)
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
  },

  watch: {
    deviceList(value: Device.DeviceItem[]) {
      const lightList = [] as Device.DeviceItem[]
      const switchList = [] as Device.DeviceItem[]
      value.forEach((device) => {
        if (device.proType === proType.light) {
          lightList.push(device)
        } else if (device.proType === proType.switch) {
          device.switchInfoDTOList.forEach((switchItem) => {
            switchList.push({
              ...device,
              mzgdPropertyDTOList: {
                [switchItem.switchId]: device.mzgdPropertyDTOList[switchItem.switchId],
              },
              switchInfoDTOList: [switchItem],
              isSceneSwitch: false, // todo: 需要根据场景判断
              uniId: `${device.deviceId}:${switchItem.switchId}`,
            })
          })
        }
        // todo: 添加窗帘的
      })
      lightList.sort((a, b) => a.orderNum - b.orderNum)
      switchList.sort((a, b) => a.switchInfoDTOList[0].orderNum - b.switchInfoDTOList[0].orderNum)
      this.setData({
        lightList,
        switchList,
      })
      this.updataCardClienRect()
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      deviceStore.updateSubDeviceList().finally(() => {
        setTimeout(() => {
          wx.createSelectorQuery()
            .select('#content')
            .boundingClientRect()
            .exec((res) => {
              if (res[0] && res[0].height) {
                this.setData({
                  contentHeight: res[0].height,
                })
              }
            })
        }, 100)
      })
      sceneStore.updateSceneList()
      emitter.on('wsReceive', async (e) => {
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
          // const index = deviceStore.deviceList.findIndex(
          //   (device) => device.deviceId === (e.result.eventData as Record<string, any>).deviceId,
          // )
          // if (index !== -1) {
          //   const res = await queryDeviceInfoByDeviceId(
          //     deviceStore.deviceList[index].deviceId,
          //     deviceStore.deviceList[index].roomId,
          //   )
          //   if (res.success) {
          //     runInAction(() => {
          //       deviceStore.deviceList[index] = res.result
          //       deviceStore.deviceList = [...deviceStore.deviceList]
          //     })
          //   }
          // }
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

    onUnload() {
      // 退出页面前清理一下选中的列表
      runInAction(() => {
        deviceStore.selectList = []
        deviceStore.selectType = []
      })
      // 解除监听
      emitter.off('wsReceive')
    },

    updataCardClienRect() {
      setTimeout(() => {
        wx.createSelectorQuery()
          .selectAll('.light-card')
          .boundingClientRect()
          .exec((res) => {
            if (res.length > 0) {
              this.setData({
                lightCardElements: res[0],
              })
            }
          })
        wx.createSelectorQuery()
          .selectAll('.switch-card')
          .boundingClientRect()
          .exec((res) => {
            if (res.length > 0) {
              this.setData({
                switchCardElements: res[0],
              })
            }
          })
      }, 100)
    },
    reorder(e: WechatMiniprogram.TouchEvent) {
      const x = e.touches[0].pageX
      const y = e.touches[0].pageY
      let elementList = [] as ClienRect[]
      const deviceList = [...this.data.tempList]
      if (this.data.longPressType === 'light') {
        elementList = this.data.lightCardElements
      } else if (this.data.longPressType === 'switch') {
        elementList = this.data.switchCardElements
      } else if (this.data.longPressType === 'curtain') {
        elementList = this.data.curtainCardElements
      }
      for (let i = 0; i < elementList.length; i++) {
        const element = elementList[i]
        if (x > element.left && x < element.right && y > element.top && y < element.bottom) {
          const endIndex = element.dataset.index as number
          const beginIndex = this.data.longPressBeginIndex
          //向后移动
          if (beginIndex < endIndex) {
            const temp = deviceList[beginIndex]
            for (let j = beginIndex; j < endIndex; j++) {
              deviceList[j] = deviceList[j + 1]
            }
            deviceList[endIndex] = temp
          }
          //向前移动
          if (beginIndex > endIndex) {
            const temp = deviceList[beginIndex]
            for (let j = beginIndex; j > endIndex; j--) {
              deviceList[j] = deviceList[j - 1]
            }
            deviceList[endIndex] = temp
          }
        }
      }
      if (this.data.longPressType === 'light') {
        this.setData({
          lightList: deviceList,
        })
      } else if (this.data.longPressType === 'switch') {
        this.setData({
          switchList: deviceList,
        })
      } else if (this.data.longPressType === 'curtain') {
        this.setData({
          curtainList: deviceList,
        })
      }
    },
    saveOrder() {
      const orderData = {
        deviceInfoByDeviceVoList: [],
        type: '0',
      } as Device.OrderSaveData
      if (this.data.longPressType === 'light') {
        this.data.lightList.forEach((device, index) => {
          if (device.orderNum !== index) {
            orderData.deviceInfoByDeviceVoList.push({
              deviceId: device.deviceId,
              houseId: homeStore.currentHomeDetail.houseId,
              roomId: roomStore.roomList[roomStore.currentRoomIndex].roomId,
              orderNum: index.toString(),
            })
          }
        })
      } else if (this.data.longPressType === 'switch') {
        orderData.type = '1'
        console.log(this.data.switchList)
        this.data.switchList.forEach((device, index) => {
          if (device.switchInfoDTOList[0].orderNum !== index) {
            orderData.deviceInfoByDeviceVoList.push({
              deviceId: device.deviceId,
              houseId: homeStore.currentHomeDetail.houseId,
              roomId: roomStore.roomList[roomStore.currentRoomIndex].roomId,
              orderNum: index.toString(),
              switchId: device.switchInfoDTOList[0].switchId,
            })
          }
        })
      }
      saveDeviceOrder(orderData)
    },
    handleTouchMove(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        touchLocation: {
          x: e.touches[0].pageX,
          y: e.touches[0].pageY,
        },
      })
      this.reorder(e)
    },
    handleTouchEnd() {
      if (!this.data.isLongPress) {
        return
      }
      this.updataCardClienRect()
      this.setData({
        isLongPress: false,
      })
      let orderHasChange = false
      if (this.data.longPressType === 'light') {
        this.data.lightList.some((device, index) => {
          if (device.deviceId !== this.data.tempList[index].deviceId) {
            orderHasChange = true
            return true
          }
          return false
        })
      } else if (this.data.longPressType === 'switch') {
        this.data.switchList.some((device, index) => {
          if (device.uniId !== this.data.tempList[index].uniId) {
            orderHasChange = true
            return true
          }
          return false
        })
      }
      if (orderHasChange) {
        this.saveOrder()
      }
    },
    handleDeviceLongPress(e: {
      currentTarget: { dataset: { type: string; info: Device.DeviceItem; index: number } }
      touches: { pageX: number; pageY: number }[]
    }) {
      let tempList = [] as Device.DeviceItem[]
      if (e.currentTarget.dataset.type === 'light') {
        tempList = [...this.data.lightList]
      } else if (e.currentTarget.dataset.type === 'switch') {
        tempList = [...this.data.switchList]
      }
      this.setData({
        isLongPress: true,
        longPressBeginIndex: e.currentTarget.dataset.index,
        touchLocation: {
          x: e.touches[0].pageX,
          y: e.touches[0].pageY,
        },
        longPressType: e.currentTarget.dataset.type,
        longPressDevice: e.currentTarget.dataset.info,
        tempList,
      })
    },
    handleSceneTap() {
      wx.navigateTo({
        url: '/package-room-control/scene-list/index',
      })
    },
    handleCollect() {
      this.setData({
        showAddScenePopup: true,
      })
    },
    handleDeviceCardTap(e: { detail: Device.DeviceItem }) {
      const deviceMap = deviceStore.deviceMap
      if (e.detail.uniId) {
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
    async handleSwitchPowerToggle(e: { detail: Device.DeviceItem }) {
      const ep = e.detail.switchInfoDTOList[0].switchId
      await controlDevice(
        {
          topic: '/subdevice/control',
          deviceId: e.detail.gatewayId,
          method: 'lightControl',
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
