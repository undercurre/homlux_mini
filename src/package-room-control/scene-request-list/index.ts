import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehavior from '../../behaviors/pageBehaviors'
import { storage, emitter } from '../../utils/index'
import { addScene } from '../../apis/index'
import { sceneStore, deviceStore, homeStore } from '../../store/index'
import { proType } from '../../config/index'

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
      const sceneData = storage.get('scene_data') as Scene.AddSceneDto

      console.log('sceneData', sceneData)

      const selectIdList = [] as string[]

      for (const item of sceneData.deviceActions) {
        if (item.proType === proType.switch) {
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

      const res = await addScene(sceneData)
      if (res.success) {
        setTimeout(() => {
          this.data.deviceList.forEach((item) => {
            item.status = 'fail'
          })

          this.setData({
            deviceList,
          })
        }, 30000)
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

    detached() {
      emitter.off('scene_device_result_status')
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    ignoreError() {},

    retry() {},
  },
})
