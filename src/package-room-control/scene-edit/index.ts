import { deviceStore, homeStore, sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { maxColorTempK, minColorTempK, proType } from '../../config/index'
import { deleteScene, updateScene } from '../../apis/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { emitter } from '../../utils/eventBus'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'
import { removeSwitchRel } from '../utils/index'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    sceneId: '',
    sceneName: '',
    sceneIcon: '',
    switchList: [] as Device.DeviceItem[],
    isDefault: false,
    contentHeight: 0,
    showEditNamePopup: false,
    showEditIconPopup: false,
    showLinkPopup: false,
    sceneDeviceActionsFlatten: [] as Device.ActionItem[], // 将场景里多路的action拍扁
    linkSwitch: '',
    linkSwitchSelect: [] as string[],
    isEditAction: false,
    sceneEditTitle: '',
    showSceneEditLightPopup: false,
    showSceneEditSwitchPopup: false,
    sceneLightEditInfo: {} as IAnyObject,
    sceneSwitchEditInfo: {} as IAnyObject,
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
      const sceneDeviceActionsFlatten = [] as Device.ActionItem[]
      sceneStore.sceneList[sceneStore.selectSceneIndex].deviceActions?.forEach((device) => {
        if (deviceMap[device.deviceId].proType === proType.switch) {
          // 多路开关
          device.controlAction.forEach((action) => {
            const switchItem = deviceMap[device.deviceId].switchInfoDTOList.find(
              (item) => item.switchId === String(action.ep),
            )
            sceneDeviceActionsFlatten.push({
              uniId: `${device.deviceId}:${action.ep}`,
              proType: proType.switch,
              name: `${switchItem?.switchName ? switchItem?.switchName : switchItem?.switchId + '路开关'} | ${
                deviceMap[device.deviceId].deviceName
              }`,
              desc: action.OnOff ? ['打开'] : ['关闭'],
              pic:
                deviceMap[device.deviceId].switchInfoDTOList.find(
                  (switchInfo) => switchInfo.switchId === action.ep.toString(),
                )?.pic ?? '',
              value: action,
            })
          })
        } else {
          const action = {
            uniId: `${device.deviceId}`,
            name: `${deviceMap[device.deviceId].deviceName}`,
            desc: device.controlAction[0].OnOff ? ['打开'] : ['关闭'],
            pic: '',
            proType: '',
            value: device.controlAction[0],
          }
          if (deviceMap[device.deviceId].proType === proType.light) {
            if (typeof device.controlAction[0].Level === 'number') {
              action.desc.push(`亮度${device.controlAction[0].Level}%`)
            }
            if (typeof device.controlAction[0].ColorTemp === 'number') {
              const color = (device.controlAction[0].ColorTemp / 100) * (maxColorTempK - minColorTempK) + minColorTempK
              action.desc.push(`色温${color}K`)
            }
            action.pic = deviceMap[device.deviceId].pic
            action.proType = proType.light
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
              switchList: deviceStore.allRoomDeviceFlattenList.filter((device) => device.proType === proType.switch),
              sceneDeviceActionsFlatten,
              isDefault: sceneStore.sceneList[sceneStore.selectSceneIndex].isDefault === '1',
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
        } else {
          Toast('删除失败')
        }
      })
    },
    handleActionDelete(e: WechatMiniprogram.TouchEvent) {
      this.data.sceneDeviceActionsFlatten.splice(e.currentTarget.dataset.index, 1)
      this.setData({
        sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
        isEditAction: true,
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
      if (this.data.sceneDeviceActionsFlatten.length === 0) {
        // 删完actions按照删除场景处理
        Dialog.confirm({
          message: '清空操作将会删除场景，确定删除该场景？',
        }).then(async () => {
          const res = await deleteScene(this.data.sceneId)
          if (res.success) {
            emitter.emit('sceneEdit')
            homeStore.updateRoomCardList()
            wx.navigateBack()
          } else {
            Toast('删除失败')
          }
        })
        return
      }

      if (this.data.isEditAction) {
        // 将展开的action组合起来
        const deviceActions = [] as Scene.DeviceAction[]
        const deviceActionsMap = {} as Record<string, Scene.DeviceAction>
        this.data.sceneDeviceActionsFlatten.forEach((deviceAction) => {
          if (deviceAction.uniId.includes(':')) {
            // 开关，可能有多路
            const deviceId = deviceAction.uniId.split(':')[0]
            if (deviceActionsMap[deviceId]) {
              deviceActionsMap[deviceId].controlAction.push(deviceAction.value)
            } else {
              deviceActionsMap[deviceId] = {
                controlAction: [deviceAction.value],
                deviceId,
                deviceType: String(deviceMap[deviceId].deviceType),
                proType: deviceMap[deviceId].proType,
              }
            }
          } else {
            deviceActionsMap[deviceAction.uniId] = {
              controlAction: [deviceAction.value],
              deviceId: deviceAction.uniId,
              deviceType: String(deviceMap[deviceAction.uniId].deviceType),
              proType: deviceMap[deviceAction.uniId].proType,
            }
          }
        })
        deviceActions.push(...Object.values(deviceActionsMap))
        data.deviceActions = deviceActions
        data.updateType = '1'
      }

      if (this.data.linkSwitch) {
        if (
          deviceStore.switchSceneMap[this.data.linkSwitch] &&
          deviceStore.switchSceneMap[this.data.linkSwitch] !== this.data.sceneId
        ) {
          // 解绑开关原来的场景
          const res = await updateScene({
            sceneId: deviceStore.switchSceneMap[this.data.linkSwitch],
            updateType: '2',
          })
          if (!res.success) {
            Toast({
              message: '解除绑定失败',
              zIndex: 99999,
            })
            return
          }
        }
        // 新的开关如果有关联也需要解开关联
        const isSuccess = await removeSwitchRel(this.data.linkSwitch.split(':')[0], this.data.linkSwitch.split(':')[1])
        if (!isSuccess) {
          Toast({
            message: '解除绑定失败',
            zIndex: 99999,
          })
          return
        }
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
        // 删除绑定
        data.updateType = data.updateType === '0' ? '2' : '4'
      }
      const res = await updateScene(data)
      if (res.success) {
        emitter.emit('sceneEdit')
        Toast('修改成功')
        wx.navigateBack()
      } else {
        Toast('修改失败')
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
      if (this.data.isDefault) {
        return
      }
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
    handleSceneActionEdit(e: WechatMiniprogram.TouchEvent) {
      if (this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index].proType === proType.light) {
        this.setData({
          sceneEditTitle: this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index].name,
          sceneLightEditInfo: this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index].value,
          showSceneEditLightPopup: true,
          editIndex: e.currentTarget.dataset.index,
        })
      } else if (this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index].proType === proType.switch) {
        this.setData({
          sceneEditTitle: this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index].name,
          sceneSwitchEditInfo: this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index].value,
          showSceneEditSwitchPopup: true,
          editIndex: e.currentTarget.dataset.index,
        })
      }
    },
    handleSceneLightEditPopupClose() {
      this.setData({
        showSceneEditLightPopup: false,
      })
    },
    handleSceneSwitchEditPopupClose() {
      this.setData({
        showSceneEditSwitchPopup: false,
      })
    },
    handleSceneEditConfirm(e: { detail: IAnyObject }) {
      this.data.sceneDeviceActionsFlatten[this.data.editIndex].value = {
        ep: this.data.sceneDeviceActionsFlatten[this.data.editIndex].value.ep,
        ...e.detail,
      }
      if (this.data.sceneDeviceActionsFlatten[this.data.editIndex].proType === proType.light) {
        if (e.detail.OnOff) {
          const desc = e.detail.OnOff ? ['打开'] : ['关闭']
          const color = (e.detail.ColorTemp / 100) * (maxColorTempK - minColorTempK) + minColorTempK
          desc.push(`亮度${e.detail.Level}%`)
          desc.push(`色温${color}K`)
          this.data.sceneDeviceActionsFlatten[this.data.editIndex].desc = desc
        } else {
          this.data.sceneDeviceActionsFlatten[this.data.editIndex].desc = ['关闭']
        }
      } else if (this.data.sceneDeviceActionsFlatten[this.data.editIndex].proType === proType.switch) {
        this.data.sceneDeviceActionsFlatten[this.data.editIndex].desc = e.detail.OnOff ? ['打开'] : ['关闭']
      }
      this.setData({
        showSceneEditLightPopup: false,
        showSceneEditSwitchPopup: false,
        isEditAction: true,
        sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
      })
    },
  },
})
