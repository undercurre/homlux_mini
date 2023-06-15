import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehavior from '../../behaviors/pageBehaviors'
import { storage, emitter, getCurrentPageParams } from '../../utils/index'
import { addScene, retryScene, updateScene } from '../../apis/index'
import { sceneStore, deviceStore, homeStore } from '../../store/index'
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
    _sceneData: {} as Scene.AddSceneDto | Scene.UpdateSceneDto,
    deviceList: Array<Device.DeviceItem>(),
  },

  computed: {
    finishNum(data) {
      return data.deviceList.filter((item) => item.status !== 'waiting').length
    },
    successNum(data) {
      return data.deviceList.filter((item) => item.status === 'success').length
    },
  },

  lifetimes: {
    async ready() {
      const pageParams = getCurrentPageParams()
      const sceneData = storage.get('scene_data') as Scene.AddSceneDto | Scene.UpdateSceneDto

      console.log('sceneData', sceneData)

      const selectIdList = [] as string[]

      for (const item of sceneData.deviceActions as Scene.DeviceAction[]) {
        // 去除后端不需要的字段
        for (const epItem of item.controlAction) {
          delete epItem.colorTempRange
          delete epItem.maxColorTemp
          delete epItem.minColorTemp
          delete epItem.deviceName
          delete epItem.devicePic
        }

        if (item.proType === PRO_TYPE.switch) {
          for (const epItem of item.controlAction) {
            selectIdList.push(`${item.deviceId}:${epItem.ep}`)
          }
        } else {
          selectIdList.push(item.deviceId)
        }
      }

      const deviceList = deviceStore.deviceFlattenList
        .filter((item) => selectIdList.includes(item.uniId))
        .map((item) => ({
          ...item,
          status: 'waiting',
        }))

      this.setData({
        _sceneData: sceneData,
        deviceList,
      })

      emitter.on('scene_device_result_status', (data) => {
        console.log('scene_device_result_status', data)
        const device = this.data.deviceList.find(
          (item) => item.uniId === data.devId || item.uniId === `${data.devId}:${data.ep}`,
        )

        if (device) {
          device.status = 'success'
          this.setData({
            deviceList,
          })
        }
      })

      let promise = pageParams.sceneId
        ? updateScene(sceneData as Scene.UpdateSceneDto)
        : addScene(sceneData as Scene.AddSceneDto)

      const res = await promise

      if (res.success) {
        setTimeout(() => {
          this.data.deviceList.forEach((item) => {
            if (item.status === 'waiting') {
              item.status = 'fail'
            }
          })

          this.setData({
            deviceList,
            sceneId: pageParams.sceneId || res.result.sceneId,
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
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async retry() {
      const { _sceneData, sceneId, deviceList } = this.data
      const deviceActions = [] as Scene.DeviceAction[]

      const failList = deviceList.filter((item) => item.status === 'fail')

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
        deviceList,
      })

      const res = await retryScene({
        deviceActions,
        sceneId,
      })

      if (res.success) {
        setTimeout(() => {
          this.data.deviceList.forEach((item) => {
            if (item.status === 'waiting') {
              item.status = 'fail'
            }
          })

          this.setData({
            deviceList,
          })
        }, 30000)
      } else {
        Toast({
          message: '重试失败',
        })
      }
    },
  },
})
