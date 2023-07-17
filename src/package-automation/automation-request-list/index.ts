import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehavior from '../../behaviors/pageBehaviors'
import { storage, emitter, toWifiProperty } from '../../utils/index'
import { addScene, retryScene, updateScene } from '../../apis/index'
import { sceneStore, deviceStore, homeStore, autosceneStore } from '../../store/index'
import { PRO_TYPE } from '../../config/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    sceneId: '',
    _sceneData: {} as AutoScene.AddAutoSceneDto, // | Scene.UpdateSceneDto,
    waitingList: [] as IAnyObject[],
  },

  computed: {
    finishNum(data) {
      return data.waitingList.filter((item) => item.status !== 'waiting').length
    },
    successNum(data) {
      return data.waitingList.filter((item) => item.status === 'success').length
    },
    tipsText(data) {
      let text = '配置完成'

      if (data.finishNum !== data.waitingList.length) {
        text = `正在将场景配置下发至设备（${data.finishNum}/${data.waitingList.length}）…`
      }

      return text
    },
  },

  lifetimes: {
    async ready() {
      const sceneData = storage.get('autoscene_data') as AutoScene.AddAutoSceneDto //| Scene.UpdateSceneDto
      const autosceneDeviceActionsFlatten = storage.get(
        'autosceneDeviceActionsFlatten',
      ) as AutoScene.AutoSceneFlattenAction[]
      const autosceneDeviceConditionsFlatten = storage.get(
        'autosceneDeviceConditionsFlatten',
      ) as AutoScene.AutoSceneFlattenCondition[]

      // console.log('sceneData配置', sceneData)
      // console.log('autosceneDeviceActionsFlatten配置', autosceneDeviceActionsFlatten)
      // console.log('autosceneDeviceConditionsFlatten配置', autosceneDeviceConditionsFlatten)

      const actionDevicesIdList = autosceneDeviceActionsFlatten.map((item) => item.uniId)
      // const conditionDevicesIdList = autosceneDeviceConditionsFlatten.map((item) => item.uniId)
      const selectIdList: string[] = [...actionDevicesIdList] //...conditionDevicesIdList

      const deviceList = deviceStore.allRoomDeviceFlattenList
        .filter((item) => selectIdList.includes(item.uniId))
        .map((item) => ({
          ...item,
          status: 'waiting',
        }))

      const sceneList = sceneStore.allRoomSceneList
        .filter((item) => selectIdList.includes(item.sceneId))
        .map((item) => ({
          ...item,
          deviceType: 5,
          pic: `../../assets/img/scene/${item.sceneIcon}.png`,
          status: 'waiting',
          uniId: item.sceneId,
        }))

      const waitingList = [...deviceList, ...sceneList]

      // 处理发送请求的deviceActions字段数据
      const deviceMap = deviceStore.allRoomDeviceMap
      // switch需要特殊处理
      const switchDeviceMap = {} as Record<string, IAnyObject[]>
      let delaySec = 0
      autosceneDeviceActionsFlatten.forEach((action) => {
        if (action.uniId === 'delay') {
          delaySec = action.value.delaySec
        } else {
          const device = deviceMap[action.uniId] || deviceMap[action.uniId.split(':')[0]]

          if (device) {
            if (action.proType === PRO_TYPE.switch) {
              const deviceId = action.uniId.split(':')[0]
              if (switchDeviceMap[deviceId]) {
                switchDeviceMap[deviceId].push(action.value)
              } else {
                switchDeviceMap[deviceId] = [action.value]
              }
            } else {
              const property = action.value
              let ctrlAction = {} as IAnyObject

              if (device.deviceType === 2) {
                ctrlAction.ep = 1
              }

              if (device.proType === PRO_TYPE.light) {
                ctrlAction.OnOff = property.OnOff

                if (property.OnOff === 1) {
                  ctrlAction.ColorTemp = property.ColorTemp
                  ctrlAction.Level = property.Level
                }

                if (device.deviceType === 3) {
                  ctrlAction = toWifiProperty(device.proType, ctrlAction)
                }
              } else if (device.proType === PRO_TYPE.curtain) {
                ctrlAction.curtain_position = property.curtain_position
              }

              sceneData?.deviceActions?.push({
                controlAction: [ctrlAction],
                deviceId: action.uniId,
                deviceType: device.deviceType,
                proType: device.proType,
              })
            }
          } else {
            //场景
            sceneData?.deviceActions?.push({
              controlAction: [],
              deviceId: action.uniId,
              deviceType: action.type,
            })
          }
        }
      })

      // 再将switch放到要发送的数据里面
      sceneData?.deviceActions?.push(
        ...Object.entries(switchDeviceMap).map(([deviceId, actions]) => ({
          controlAction: actions,
          deviceId: deviceId,
          deviceType: deviceMap[deviceId].deviceType,
          proType: deviceMap[deviceId].proType,
        })),
      )
      //是否有延时操作
      if (delaySec !== 0) {
        sceneData.deviceActions.forEach((item) => {
          item.delayTime = delaySec
        })
      }

      //处理发送请求的deviceConditions字段数据
      autosceneDeviceConditionsFlatten.forEach((action) => {
        const device = deviceMap[action.uniId]
        if (device) {
          sceneData?.deviceConditions?.push({
            controlEvent: [{ ep: 1, ...action.property }],
            deviceId: action.uniId,
          })
        }
      })

      this.setData({
        _sceneData: sceneData,
        waitingList,
      })

      emitter.on('scene_device_result_status', (data) => {
        console.log('scene_device_result_status', data)
        const device = this.data.waitingList.find(
          (item) => item.uniId === data.devId || item.uniId === `${data.devId}:${data.ep}`,
        )

        if (device) {
          device.status = data.errCode === 0 ? 'success' : 'fail'
          this.setData({
            waitingList,
          })
        }
      })
      console.log('创建自动化', waitingList, sceneData)

      const promise = sceneData.sceneId
        ? updateScene(sceneData as AutoScene.AddAutoSceneDto)
        : addScene(sceneData as AutoScene.AddAutoSceneDto)

      // const promise = addScene(sceneData as AutoScene.AddAutoSceneDto)

      const res = await promise

      if (res.success) {
        this.setData({
          sceneId: sceneData.sceneId || res.result.sceneId,
        })

        setTimeout(() => {
          this.data.waitingList.forEach((item) => {
            if (item.status === 'waiting') {
              item.status = 'fail'
            }
          })

          this.setData({
            waitingList,
          })
        }, 30000)
      } else {
        Toast({
          message: '创建失败',
        })
      }
    },

    detached() {
      emitter.off('scene_device_result_status')
      sceneStore.updateAllRoomSceneList()
      sceneStore.updateSceneList()
      deviceStore.updateSubDeviceList()
      deviceStore.updateAllRoomDeviceList()
      homeStore.updateRoomCardList()
      autosceneStore.updateAllRoomAutoSceneList()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async retry() {
      const { _sceneData, sceneId, waitingList } = this.data
      const deviceActions = [] as Scene.DeviceAction[]

      const failList = waitingList.filter((item) => item.status === 'fail')

      // 由于云端场景下发逻辑，仅zigbee灯会存在场景下发失败的情况，暂时只考虑灯的重试处理逻辑
      failList.forEach((device) => {
        device.status = 'waiting'
        const action = (_sceneData.deviceActions as Scene.DeviceAction[]).find(
          (actionItem) => actionItem.deviceId === device.deviceId,
        ) as Scene.DeviceAction

        if (device.proType === PRO_TYPE.light) {
          deviceActions.push(action)
        }
      })

      this.setData({
        waitingList,
      })

      const res = await retryScene({
        deviceActions,
        sceneId,
      })

      if (res.success) {
        setTimeout(() => {
          this.data.waitingList.forEach((item) => {
            if (item.status === 'waiting') {
              item.status = 'fail'
            }
          })

          this.setData({
            waitingList,
          })
        }, 30000)
      } else {
        Toast({
          message: '重试失败',
        })
      }
    },

    handleFinish() {
      wx.switchTab({
        url: '/pages/automation/index',
      })
    },
  },
})
