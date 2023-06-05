import { deviceStore, homeStore, sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { maxColorTempK, minColorTempK, proType } from '../../config/index'
import {
  deleteScene,
  findDevice,
  updateScene,
  getRelLampInfo,
  getRelDeviceInfo,
  delLampAndSwitchAssociated,
  delSwitchAndSwitchAssociated,
} from '../../apis/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import { emitter } from '../../utils/eventBus'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [pageBehavior],
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 页面的初始数据
   */
  data: {
    sceneId: '',
    sceneName: '',
    sceneIcon: '',
    /** 过滤出全屋开关，提供关联开关选择 */
    switchList: [] as Device.DeviceItem[],
    /** 是否默认场景，默认场景不允许改图标 */
    isDefault: false,
    /** 列表高度 */
    contentHeight: 0,
    showEditNamePopup: false,
    showEditIconPopup: false,
    showLinkPopup: false,
    /** 将当前场景里多路的action拍扁 */
    sceneDeviceActionsFlatten: [] as Device.ActionItem[],
    /** 开关是否被全家庭场景其中之一收藏 */
    sceneDeviceActionsFlattenMap: {} as Record<string, boolean>,
    /** 关联弹窗选中的开关确认后的开关uniId */
    linkSwitch: '',
    /** 关联选中的开关的已有关联绑定信息 */
    _linkSwitchRefInfo: {
      lampRelList: Array<Device.IMzgdLampRelGetDTO>(), // 当前面板的灯关联数据
      switchRelList: Array<Device.IMzgdRelGetDTO>(), // 当前面板的关联面板数据
    },
    /** 关联弹窗展示用的选择列表 */
    linkSwitchSelect: [] as string[],
    /** 是否修改过action */
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
        const deviceMap = deviceStore.allRoomDeviceMap
        const device = deviceMap[data.linkSwitch.split(':')[0]]
        const switchName = device.switchInfoDTOList.find(
          (switchItem) => switchItem.switchId === data.linkSwitch.split(':')[1],
        )?.switchName
        return device.deviceName.slice(0, 5) + switchName?.slice(0, 4)
      }
      return ' '
    },
    showSceneName(data) {
      console.log(data.sceneName)
      if (data.sceneName.length > 12) {
        return data.sceneName.slice(0, 12) + '...'
      }
      return data.sceneName
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      const deviceMap = deviceStore.allRoomDeviceMap
      const sceneDeviceActionsFlatten = [] as Device.ActionItem[]
      const sceneDeviceActionsFlattenMap = {} as Record<string, boolean>
      sceneStore.allRoomSceneList.forEach((scene) => {
        if (scene.deviceActions) {
          scene.deviceActions.forEach((actions) => {
            if (!deviceMap[actions.deviceId]) {
              console.log('不存在的设备', actions)
              return
            }
            if (deviceMap[actions.deviceId].proType === proType.switch) {
              // 多路开关
              actions.controlAction.forEach((action) => {
                const switchItem = deviceMap[actions.deviceId].switchInfoDTOList.find(
                  (item) => item.switchId === String(action.ep),
                )
                sceneDeviceActionsFlattenMap[`${actions.deviceId}:${action.ep}`] = true
                // 只将当前选中编辑的场景，拍扁action加入list
                if (sceneStore.sceneList[sceneStore.selectSceneIndex].sceneId === scene.sceneId) {
                  sceneDeviceActionsFlatten.push({
                    uniId: `${actions.deviceId}:${action.ep}`,
                    proType: proType.switch,
                    name: `${switchItem?.switchName ? switchItem?.switchName : switchItem?.switchId + '路开关'} | ${
                      deviceMap[actions.deviceId].deviceName
                    }`,
                    pic:
                      deviceMap[actions.deviceId].switchInfoDTOList.find(
                        (switchInfo) => switchInfo.switchId === action.ep.toString(),
                      )?.pic ?? '',
                    value: action,
                  })
                }
              })
            } else {
              // 单路设备
              const action = {
                uniId: `${actions.deviceId}`,
                name: `${deviceMap[actions.deviceId].deviceName}`,
                desc: actions.controlAction[0].OnOff ? ['打开'] : ['关闭'],
                pic: '',
                proType: '',
                value: actions.controlAction[0],
              }
              if (sceneStore.sceneList[sceneStore.selectSceneIndex].sceneId === scene.sceneId) {
                if (deviceMap[actions.deviceId].proType === proType.light) {
                  if (typeof actions.controlAction[0].Level === 'number') {
                    action.desc.push(`亮度${actions.controlAction[0].Level}%`)
                  }
                  if (typeof actions.controlAction[0].ColorTemp === 'number') {
                    const color =
                      (actions.controlAction[0].ColorTemp / 100) * (maxColorTempK - minColorTempK) + minColorTempK
                    action.desc.push(`色温${color}K`)
                  }
                  action.pic = deviceMap[actions.deviceId].pic
                  action.proType = proType.light
                }
                sceneDeviceActionsFlatten.push(action)
              }
              sceneDeviceActionsFlattenMap[`${actions.deviceId}`] = true
            }
          })
        }
      })
      const sceneId = sceneStore.sceneList[sceneStore.selectSceneIndex].sceneId
      const linkSwitch = sceneStore.sceneSwitchMap[sceneId] ? sceneStore.sceneSwitchMap[sceneId] : ''
      const switchList = deviceStore.allRoomDeviceFlattenList.filter((device) => device.proType === proType.switch)
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
              switchList,
              sceneDeviceActionsFlatten,
              sceneDeviceActionsFlattenMap,
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
          Toast({ message: '删除失败', zIndex: 9999 })
        }
      })
    },
    handleActionDelete(e: WechatMiniprogram.TouchEvent) {
      const item = this.data.sceneDeviceActionsFlatten.splice(e.currentTarget.dataset.index, 1)
      this.data.sceneDeviceActionsFlattenMap[item[0].uniId] = false
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
            Toast({ message: '删除失败', zIndex: 9999 })
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
          deviceStore.switchSceneConditionMap[this.data.linkSwitch] &&
          deviceStore.switchSceneConditionMap[this.data.linkSwitch] !== this.data.sceneId
        ) {
          // 解绑开关原来的场景
          const res = await updateScene({
            sceneId: deviceStore.switchSceneConditionMap[this.data.linkSwitch],
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

        const { lampRelList, switchRelList } = this.data._linkSwitchRefInfo
        const [deviceId, switchId] = this.data.linkSwitch.split(':')

        if (lampRelList.length) {
          // 删除指定面板和灯的关联数据

          const res = await delLampAndSwitchAssociated({
            deviceId: deviceId,
            switchId: switchId,
            relIds: lampRelList.map((item) => item.lampDeviceId).join(','),
          })

          if (!res.success) {
            Toast({ message: '删除面板已有的灯关联失败', zIndex: 9999 })
            return
          }
        }

        if (switchRelList.length) {
          // 删除指定面板和灯的关联数据

          const res = await delSwitchAndSwitchAssociated({
            relIds: switchRelList.map((item) => item.relId).join(','),
          })

          if (!res.success) {
            Toast({ message: '删除面板已有的开关关联失败', zIndex: 9999 })
            return
          }
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
        Toast({ message: '修改成功', zIndex: 9999 })
        wx.navigateBack()
      } else {
        Toast({ message: '修改失败', zIndex: 9999 })
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
    async handleSwitchSelect(e: { detail: string }) {
      const switchUnid = e.detail
      const { sceneDeviceActionsFlatten } = this.data

      if (sceneDeviceActionsFlatten.find((item) => item.uniId === switchUnid)) {
        Toast({ message: '无法选择，此开关已是当前场景的执行设备', zIndex: 9999 })
        return
      }

      if (this.data.linkSwitchSelect[0] === switchUnid) {
        this.setData({
          linkSwitchSelect: [],
        })
        return
      }

      const [deviceId, switchId] = switchUnid.split(':')

      // 查询所选面板与其他开关和灯的关联关系
      const res = await Promise.all([
        getRelLampInfo({
          primaryDeviceId: deviceId,
          primarySwitchId: switchId,
        }),
        getRelDeviceInfo({
          primaryDeviceId: deviceId,
          primarySwitchId: switchId,
        }),
      ])

      if (!res[0].success || !res[1].success) {
        Toast({ message: '查询设备信息失败', zIndex: 9999 })
        return
      }

      const lampRelList = res[0].result.lampRelList
      const switchRelList = res[1].result.primaryRelDeviceInfo.concat(res[1].result.secondRelDeviceInfo)
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      let linkDesc = ''

      if (lampRelList.length) {
        linkDesc = '灯具'
      } else if (switchRelList.length) {
        linkDesc = '开关'
      } else if (switchSceneConditionMap[switchUnid]) {
        linkDesc = '其他场景'
      }

      if (linkDesc) {
        const dialigRes = await Dialog.confirm({
          message: `此开关已关联${linkDesc}，确定变更？`,
          cancelButtonText: '取消',
          confirmButtonText: '变更',
          zIndex: 2000,
        })
          .then(() => true)
          .catch(() => false)

        if (!dialigRes) return
      }

      this.data._linkSwitchRefInfo.lampRelList = lampRelList
      this.data._linkSwitchRefInfo.switchRelList = switchRelList

      // 该弹窗逻辑暂不完善，无完美解决方案，暂时屏蔽
      // if (this.data.sceneDeviceActionsFlattenMap[switchUnid]) {
      //   const dialigRes = await Dialog.confirm({
      //     message: '此开关已作为其他场景的执行动作，确定变更？',
      //     cancelButtonText: '取消',
      //     confirmButtonText: '变更',
      //     zIndex: 2000,
      //   })
      //     .then(() => true)
      //     .catch(() => false)

      //   if (!dialigRes) return
      // }

      this.setData({
        linkSwitchSelect: [switchUnid],
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
      if (this.data.isDefault) {
        return
      }
      const deviceAction = this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index]
      const allRoomDeviceMap = deviceStore.allRoomDeviceFlattenMap
      const device = allRoomDeviceMap[deviceAction.uniId]
      if (this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index].proType === proType.light) {
        findDevice({ gatewayId: device.gatewayId, devId: device.deviceId })
        this.setData({
          sceneEditTitle: this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index].name,
          sceneLightEditInfo: this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index].value,
          showSceneEditLightPopup: true,
          editIndex: e.currentTarget.dataset.index,
        })
      } else if (this.data.sceneDeviceActionsFlatten[e.currentTarget.dataset.index].proType === proType.switch) {
        findDevice({
          gatewayId: device.gatewayId,
          devId: device.deviceId,
          ep: Number(device.switchInfoDTOList[0].switchId),
        })
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
      this.setData({
        showSceneEditLightPopup: false,
        showSceneEditSwitchPopup: false,
        isEditAction: true,
        sceneDeviceActionsFlatten: [...this.data.sceneDeviceActionsFlatten],
      })
    },
  },
})
