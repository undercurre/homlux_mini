import { addScene, updateScene } from '../../../../apis/scene'
import { proType, sceneList } from '../../../../config/index'
import { deviceStore, homeStore, roomStore, sceneStore } from '../../../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          setTimeout(() => {
            this.getHeight()
          }, 100)
        }
        this.setData({
          sceneIcon: 'general',
          sceneName: '',
          linkSwitch: '',
        })
      },
    },
    actions: {
      type: Array,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sceneIcon: '',
    sceneName: '',
    contentHeight: 0,
    sceneList: sceneList.filter((scene) => !scene[1].isDefault),
    list: [] as (Device.DeviceItem | Scene.SceneItem)[],
    linkSelectList: [] as string[],
    linkSwitch: '', // 上一个确认的结果保存在这里
    showLinkPopup: false,
    isAddingScene: false,
  },

  computed: {
    disabled(data) {
      return !data.sceneName
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getHeight() {
      this.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
    handleReturn() {
      this.triggerEvent('return')
    },
    handleClose() {
      this.triggerEvent('close')
    },
    async handleConfirm() {
      if (!this.data.sceneName) {
        Toast({
          message: '场景名不能为空',
          zIndex: 99999,
        })
        return
      }
      if (this.data.sceneName.length > 15) {
        Toast({
          message: '场景名称不能超过15个字符',
          zIndex: 99999,
        })
        return
      }
      this.setData({
        isAddingScene: true
      })
      const newSceneData = {
        conditionType: '0',
        deviceActions: [],
        deviceConditions: [],
        houseId: homeStore.currentHomeDetail.houseId,
        roomId: roomStore.roomList[roomStore.currentRoomIndex].roomId,
        sceneIcon: this.data.sceneIcon,
        sceneName: this.data.sceneName,
        sceneType: this.data.linkSwitch ? '1' : '0',
        orderNum: 0,
      } as Scene.AddSceneDto
      if (this.data.linkSwitch) {
        // 绑定了开关
        newSceneData.deviceConditions = [
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
      }
      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      if (switchSceneConditionMap[this.data.linkSwitch]) {
        // 如果这个开关已经绑定场景，先取消绑定原来的场景
        const res = await updateScene({
          conditionType: '0',
          sceneId: switchSceneConditionMap[this.data.linkSwitch],
          updateType: '2',
        })
        if (!res.success) {
          Toast({
            message: '取绑原有场景失败',
            zIndex: 99999,
          })
          this.setData({
            isAddingScene: false
          })
          return
        }
      }
      await sceneStore.updateAllRoomSceneList()
      // 将新场景排到最后
      sceneStore.sceneList.forEach((scene) => {
        if (scene.orderNum && scene.orderNum >= newSceneData.orderNum) {
          newSceneData.orderNum = scene.orderNum + 1
        }
      })
      // 补充actions
      const deviceMap = deviceStore.deviceMap
      // switch需要特殊处理
      const switchDeviceMap = {} as Record<string, IAnyObject[]>
      this.data.actions.forEach((action: Device.ActionItem) => {
        if (action.uniId.includes(':')) {
          const deviceId = action.uniId.split(':')[0]
          if (switchDeviceMap[deviceId]) {
            switchDeviceMap[deviceId].push(action.value)
          } else {
            switchDeviceMap[deviceId] = [action.value]
          }
        } else if (deviceMap[action.uniId].proType === proType.light) {
          newSceneData.deviceActions.push({
            controlAction: [action.value],
            deviceId: action.uniId,
            deviceType: deviceMap[action.uniId].deviceType.toString(),
            proType: deviceMap[action.uniId].proType,
          })
        }
      })
      // 再将switch放到要发送的数据里面
      newSceneData.deviceActions.push(
        ...Object.entries(switchDeviceMap).map(([deviceId, actions]) => ({
          controlAction: actions,
          deviceId: deviceId,
          deviceType: deviceMap[deviceId].deviceType.toString(),
          proType: deviceMap[deviceId].proType,
        })),
      )
      const res = await addScene(newSceneData)
      if (res.success) {
        this.triggerEvent('addSuccess')
        sceneStore.updateAllRoomSceneList()
        sceneStore.updateSceneList()
        deviceStore.updateDeviceList()
        deviceStore.updateAllRoomDeviceList()
        homeStore.updateRoomCardList()
      } else {
        Toast({
          message: '收藏失败',
          zIndex: 99999,
        })
      }
      this.setData({
        isAddingScene: false
      })
      console.log('setData-isAddingScene', this.data.isAddingScene)
      this.triggerEvent('close')
    },
    handleClear() {
      this.setData({
        sceneName: '',
      })
    },
    handleSceneNameInput(e: { detail: { value: string } }) {
      this.setData({
        sceneName: e.detail.value,
      })
    },
    handleSceneIconTap(e: { currentTarget: { dataset: { scene: string } } }) {
      this.setData({
        sceneIcon: e.currentTarget.dataset.scene,
      })
    },
    handleLinkSwitchPopup() {
      this.setData({
        showLinkPopup: true,
        list: deviceStore.allRoomDeviceFlattenList.filter((item) => {
          if (!item.uniId.includes(':')) {
            return false
          }
          // 排除掉已在待创建场景执行动作中的开关
          return !sceneStore.addSceneActions.some((action) => action.uniId === item.uniId)
        }),
        linkSelectList: this.data.linkSwitch ? [this.data.linkSwitch] : [],
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
        linkSwitch: this.data.linkSelectList[0] ? this.data.linkSelectList[0] : '',
      })
    },
    handleLinkSelect(e: { detail: string }) {
      if (this.data.linkSelectList[0] && this.data.linkSelectList[0] === e.detail) {
        this.setData({
          linkSelectList: [],
        })
        return
      }
      const isInActions = this.data.actions.some((action: Device.ActionItem) => {
        return action.uniId === e.detail
      })
      if (isInActions) {
        Dialog.confirm({
          message: '此开关已被其他场景使用，是否需要变更？',
          cancelButtonText: '取消',
          confirmButtonText: '变更',
          context: this,
          zIndex: 9999,
        }).then(() => {
          this.setData({
            linkSelectList: [e.detail],
          })
        })
      } else {
        this.setData({
          linkSelectList: [e.detail],
        })
      }
    },
  },
})
