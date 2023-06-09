import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import { addScene, updateScene } from '../../apis/scene'
import { proType } from '../../config/index'
import { deviceStore, homeStore, roomStore, sceneStore } from '../../store/index'
import { emitter } from '../../utils/index'
import pageBehavior from '../../behaviors/pageBehaviors'

ComponentWithComputed({
  behaviors: [pageBehavior],
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    step: 'selectDevice',
    deviceList: Array<Device.DeviceItem>(),
    sceneActions: Array<Device.ActionItem>(),
  },

  /**
   * 组件的方法列表
   */
  methods: {
    cancelCreate() {
      this.goBack()
    },

    confirmSelect(e: { detail: { sceneActions: Array<Device.ActionItem>; deviceList: Array<Device.DeviceItem> } }) {
      const { sceneActions, deviceList } = e.detail

      console.log('confirmSelect', sceneActions)

      this.setData({
        step: 'editInfo',
        deviceList: deviceList.map((item) => ({
          ...item,
          status: 'loading',
        })),
        sceneActions: sceneActions,
      })
    },

    cancelEdit() {
      this.setData({
        step: 'selectDevice',
      })
    },

    async confirmEdit(e: { detail: { sceneInfo: { sceneName: string; sceneIcon: string; linkSwitch: string } } }) {
      this.setData({
        step: 'requesting',
      })

      emitter.on('scene_device_result_status', (data) => {
        console.log('scene_device_result_status', data)
      })

      const sceneInfo = e.detail.sceneInfo
      console.log('confirmEdit', sceneInfo)

      const newSceneData = {
        conditionType: '0',
        deviceActions: [],
        deviceConditions: [],
        houseId: homeStore.currentHomeDetail.houseId,
        roomId: roomStore.roomList[roomStore.currentRoomIndex].roomId,
        sceneIcon: sceneInfo.sceneIcon,
        sceneName: sceneInfo.sceneName,
        sceneType: sceneInfo.linkSwitch ? '1' : '0',
        orderNum: 0,
      } as Scene.AddSceneDto

      // 如果关联了智能开关
      if (sceneInfo.linkSwitch) {
        const [deviceId, switchId] = sceneInfo.linkSwitch.split(':')
        // 绑定了开关
        newSceneData.deviceConditions = [
          {
            deviceId,
            controlEvent: [
              {
                ep: Number(switchId),
                ButtonScene: 1,
              },
            ],
          },
        ]
      }

      const switchSceneConditionMap = deviceStore.switchSceneConditionMap
      if (switchSceneConditionMap[sceneInfo.linkSwitch]) {
        // 如果这个开关已经绑定场景，先取消绑定原来的场景
        const res = await updateScene({
          conditionType: '0',
          sceneId: switchSceneConditionMap[sceneInfo.linkSwitch],
          updateType: '2',
        })
        if (!res.success) {
          Toast({
            message: '取绑原有场景失败',
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
      this.data.sceneActions.forEach((action: Device.ActionItem) => {
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
        sceneStore.updateAllRoomSceneList()
        sceneStore.updateSceneList()
        deviceStore.updateDeviceList()
        deviceStore.updateAllRoomDeviceList()
        homeStore.updateRoomCardList()
      } else {
        Toast({
          message: '创建失败',
          zIndex: 99999,
        })
      }
    },
  },
})
