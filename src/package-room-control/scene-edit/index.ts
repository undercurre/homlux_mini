import { deviceStore, homeStore, sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { maxColorTempK, minColorTempK, proType } from '../../config/index'
import Dialog from '@vant/weapp/dialog/dialog'
import { deleteScene, updateScene } from '../../apis/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { emitter } from '../../utils/eventBus'

interface DeviceActionsFlattenItem {
  id: string
  title: string
  desc: string
  image: string
  controlAction: Record<string, number>
}

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    sceneId: '',
    sceneName: '',
    sceneIcon: '',
    list: [] as Device.DeviceItem[],
    contentHeight: 0,
    showEditNamePopup: false,
    showEditIconPopup: false,
    showLinkPopup: false,
    sceneDeviceActionsFlatten: [] as DeviceActionsFlattenItem[], // 将场景里多路的action拍扁
    sceneDeviceActionsDelete: [] as DeviceActionsFlattenItem[],
    linkSwitch: '',
    linkSwitchSelect: [] as string[],
  },

  computed: {
    linkSwitchName(data) {
      if (data.linkSwitch) {
        const deviceMap = deviceStore.deviceMap
        const device = deviceMap[data.linkSwitch.split(':')[0]]
        const switchName = device.switchInfoDTOList.find(
          (switchItem) => switchItem.switchId === data.linkSwitch.split(':')[1],
        )?.switchName
        return device.deviceName.slice(0, 5) + switchName?.slice(0, 4)
      }
      return ''
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      const deviceMap = deviceStore.deviceMap
      const sceneDeviceActionsFlatten = [] as DeviceActionsFlattenItem[]
      sceneStore.sceneList[sceneStore.selectSceneIndex].deviceActions?.forEach((device) => {
        if (deviceMap[device.deviceId].proType === proType.switch) {
          // 多路开关
          device.controlAction.forEach((action) => {
            const switchItem = deviceMap[device.deviceId].switchInfoDTOList.find(
              (item) => item.switchId === String(action.ep),
            )
            sceneDeviceActionsFlatten.push({
              id: `${device.deviceId}:${action.ep}`,
              title: `${deviceMap[device.deviceId].deviceName}${
                switchItem?.switchName ? switchItem?.switchName : switchItem?.switchId + '路开关'
              } | ${deviceMap[device.deviceId].roomName}`,
              desc: action.OnOff ? '打开' : '关闭',
              image:
                deviceMap[device.deviceId].switchInfoDTOList.find(
                  (switchInfo) => switchInfo.switchId === action.ep.toString(),
                )?.pic ?? '',
              controlAction: action,
            })
          })
        } else {
          const action = {
            id: `${device.deviceId}`,
            title: `${deviceMap[device.deviceId].deviceName} | ${deviceMap[device.deviceId].roomName}`,
            desc: device.controlAction[0].OnOff ? '打开' : '关闭',
            image: '',
            controlAction: device.controlAction[0],
          }
          if (deviceMap[device.deviceId].proType === proType.light) {
            if (typeof device.controlAction[0].Level === 'number') {
              action.desc += ` 亮度${device.controlAction[0].Level}%`
            }
            if (typeof device.controlAction[0].ColorTemp === 'number') {
              const color = (device.controlAction[0].ColorTemp / 100) * (maxColorTempK - minColorTempK) + minColorTempK
              action.desc += `色温${color}K`
            }
            action.image = deviceMap[device.deviceId].pic
          }
          sceneDeviceActionsFlatten.push(action)
        }
      })
      const sceneId = sceneStore.sceneList[sceneStore.selectSceneIndex].sceneId
      const linkSwitch = sceneStore.sceneSwitchMap[sceneId] ? sceneStore.sceneSwitchMap[sceneId] : ''
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
              sceneId,
              sceneName: sceneStore.sceneList[sceneStore.selectSceneIndex].sceneName,
              sceneIcon: sceneStore.sceneList[sceneStore.selectSceneIndex].sceneIcon,
              switchList: deviceStore.deviceFlattenList.filter((device) => device.proType === proType.switch),
              sceneDeviceActionsFlatten,
              linkSwitch,
              linkSwitchSelect: linkSwitch ? [linkSwitch] : [],
            })
          }
        })
    },
    handleSceneDelete() {
      Dialog.confirm({
        message: '确定删除该场景？',
      }).then(async () => {
        const res = await deleteScene(this.data.sceneId)
        if (res.success) {
          emitter.emit('sceneEdit')
          homeStore.updateRoomCardList()
          wx.navigateBack()
          wx.showToast({
            icon: 'success',
            title: '删除成功',
          })
        } else {
          wx.showToast({
            icon: 'error',
            title: '删除失败',
          })
        }
      })
    },
    handleActionDelete(e: WechatMiniprogram.TouchEvent) {
      const action = this.data.sceneDeviceActionsFlatten.splice(e.currentTarget.dataset.index, 1)
      this.setData({
        sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
        sceneDeviceActionsDelete: [...this.data.sceneDeviceActionsDelete, ...action],
      })
    },
    async handleSave() {
      const deviceMap = deviceStore.deviceMap
      const data = { sceneId: this.data.sceneId, updateType: '0', conditionType: '0' } as Scene.UpdateSceneDto
      if (this.data.sceneName !== sceneStore.sceneList[sceneStore.selectSceneIndex].sceneName) {
        data.sceneName = this.data.sceneName
      }
      if (this.data.sceneIcon !== sceneStore.sceneList[sceneStore.selectSceneIndex].sceneName) {
        data.sceneIcon = this.data.sceneIcon
      }
      if (this.data.sceneDeviceActionsDelete.length !== 0) {
        // 将展开的action组合起来
        const deviceActions = [] as Scene.DeviceAction[]
        const deviceActionsMap = {} as Record<string, Scene.DeviceAction>
        this.data.sceneDeviceActionsDelete.forEach((deviceAction) => {
          if (deviceAction.id.includes(':')) {
            // 开关，可能有多路
            const deviceId = deviceAction.id.split(':')[0]
            if (deviceActionsMap[deviceId]) {
              deviceActionsMap[deviceId].controlAction.push(deviceAction.controlAction)
            } else {
              deviceActionsMap[deviceId] = {
                controlAction: [deviceAction.controlAction],
                deviceId,
                deviceType: String(deviceMap[deviceId].deviceType),
                proType: deviceMap[deviceId].proType,
              }
            }
          } else {
            deviceActionsMap[deviceAction.id] = {
              controlAction: [deviceAction.controlAction],
              deviceId: deviceAction.id,
              deviceType: String(deviceMap[deviceAction.id].deviceType),
              proType: deviceMap[deviceAction.id].proType,
            }
          }
        })
        deviceActions.push(...Object.values(deviceActionsMap))
        data.deviceActions = deviceActions
        data.updateType = '1'
      }
      if (this.data.linkSwitch !== sceneStore.sceneSwitchMap[this.data.sceneId]) {
        // 绑定发生变化
        if (this.data.linkSwitch) {
          data.deviceConditions = [
            {
              deviceId: this.data.linkSwitch.split(':')[0],
              controlEvent: [
                {
                  ep: Number(this.data.linkSwitch.split(':')[1]),
                  ButtonScene: 1,
                },
              ],
            },
          ]
          data.updateType = data.updateType === '0' ? '3' : '5'
        } else {
          if (sceneStore.sceneSwitchMap[this.data.sceneId]) {
            // 删除绑定
            data.updateType = data.updateType === '0' ? '2' : '4'
          }
        }
      }
      const res = await updateScene(data)
      if (res.success) {
        homeStore.updateRoomCardList()
        emitter.emit('sceneEdit')
        wx.showToast({
          icon: 'success',
          title: '修改成功',
        })
      } else {
        wx.showToast({
          icon: 'error',
          title: '修改失败',
        })
      }
    },
    handleEditNameShow() {
      this.setData({
        showEditNamePopup: true,
      })
    },
    handleEditNameClose() {
      this.setData({
        showEditNamePopup: false,
      })
    },
    handleEditNameConfirm(e: { detail: string }) {
      this.setData({
        showEditNamePopup: false,
        sceneName: e.detail,
      })
    },
    handleEditIconShow() {
      this.setData({
        showEditIconPopup: true,
      })
    },
    handleEditIconClose() {
      this.setData({
        showEditIconPopup: false,
      })
    },
    handleEditIconConfirm(e: { detail: string }) {
      console.log(e)
      this.setData({
        showEditIconPopup: false,
        sceneIcon: e.detail,
      })
    },
    handleSwitchSelect(e: { detail: string }) {
      console.log(deviceStore.switchSceneMap[e.detail], deviceStore.switchSceneMap[e.detail] !== this.data.sceneId)
      if (deviceStore.switchSceneMap[e.detail] && deviceStore.switchSceneMap[e.detail] !== this.data.sceneId) {
        wx.showToast({
          icon: 'none',
          title: '开关已绑定场景',
        })
        return
      }
      if (this.data.linkSwitchSelect[0] === e.detail) {
        this.setData({
          linkSwitchSelect: [],
        })
        return
      }
      this.setData({
        linkSwitchSelect: [e.detail],
      })
    },
    handleLinkSwitchPopup() {
      this.setData({
        showLinkPopup: true,
      })
    },
    handleLinkPopupClose() {
      this.setData({
        showLinkPopup: false,
      })
    },
    handleLinkPopupConfirm() {
      this.setData({
        showLinkPopup: false,
        linkSwitch: this.data.linkSwitchSelect[0] ? this.data.linkSwitchSelect[0] : '',
      })
    },
  },
})
