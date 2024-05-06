import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehavior from '../../behaviors/pageBehaviors'
import { storage, emitter, getCurrentPageParams } from '../../utils/index'
import { addScene, retryScene, updateScene } from '../../apis/index'
import { sceneStore, deviceStore, homeStore } from '../../store/index'
import { PRO_TYPE } from '../../config/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    opearationType: 'add', // add创建edit编辑
    sceneId: '',
    _sceneData: {} as Scene.AddSceneDto | Scene.UpdateSceneDto,
    deviceList: Array<Device.DeviceItem>(),
    linkSwitchPopup: false,
    _timer: 0,
  },

  computed: {
    finishNum(data) {
      return data.deviceList.filter((item) => item.status !== 'waiting').length
    },
    successNum(data) {
      return data.deviceList.filter((item) => item.status === 'success').length
    },
    tipsText(data) {
      let text = '正在将一键场景数据下发至设备，请稍后…'

      if (data.finishNum === data.deviceList.length) {
        // text = `正在将场景配置下发至设备（${data.finishNum}/${data.deviceList.length}）…`
        text = '配置完成'
      }

      return text
    },
  },

  lifetimes: {
    async ready() {
      const pageParams = getCurrentPageParams()

      const sceneData = storage.get('scene_data') as Scene.AddSceneDto | Scene.UpdateSceneDto

      const sceneDeviceActionsFlatten = storage.get('sceneDeviceActionsFlatten') as AutoScene.AutoSceneFlattenAction[]

      console.log('scene-request-flatten', sceneDeviceActionsFlatten)

      const selectIdList = sceneDeviceActionsFlatten.map((item) => item.uniId)

      const deviceList = deviceStore.allRoomDeviceFlattenList
        .filter((item) => selectIdList.includes(item.uniId))
        .map((item) => {
          if (item.proType === PRO_TYPE.switch) {
            ;(item.pic = item.switchInfoDTOList[0]?.pic),
              (item.deviceName = `${item.switchInfoDTOList[0].switchName} | ${item.deviceName}`)
          }
          // 2024.5.6经与云端沟通，目前仅zigbee灯需要接收状态
          return {
            ...item,
            status: item.proType === PRO_TYPE.light ? 'waiting' : 'success',
          }
        })

      // 处理发送请求的deviceActions字段数据
      const deviceMap = deviceStore.allRoomDeviceMap
      // switch需要特殊处理
      const switchDeviceMap = {} as Record<string, IAnyObject[]>

      sceneDeviceActionsFlatten.forEach((action) => {
        const device = deviceMap[action.uniId]
        console.log('该设备', device)

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
            ctrlAction.modelName = device.proType === PRO_TYPE.light ? 'light' : 'wallSwitch1'
          }

          if (device.proType === PRO_TYPE.light) {
            ctrlAction.power = property.power

            if (property.power === 1) {
              ctrlAction.colorTemperature = property.colorTemperature
              ctrlAction.brightness = property.brightness
            }

            // if (device.deviceType === 3) {
            //   ctrlAction = toWifiProperty(device.proType, ctrlAction)
            // }
          } else if (device.proType === PRO_TYPE.curtain) {
            ctrlAction.curtain_position = property.curtain_position
          } else if (device.proType === PRO_TYPE.bathHeat) {
            ctrlAction.light_mode = property.light_mode
            ctrlAction.heating_temperature = property.heating_temperature
            ctrlAction.mode = property.mode
          } else if (device.proType === PRO_TYPE.clothesDryingRack) {
            ctrlAction.updown = property.updown
            ctrlAction.laundry = property.laundry
            ctrlAction.light = property.light
          } else if (this.isNewScenarioSettingSupported(device.proType)) {
            ctrlAction = action.sceneProperty!
          }
          sceneData?.deviceActions?.push({
            controlAction: [ctrlAction],
            deviceId: action.uniId,
            deviceType: device.deviceType,
            proType: device.proType,
          })
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

      this.setData({
        _sceneData: sceneData,
        deviceList,
      })

      emitter.on('scene_device_result_status', (data) => {
        // 2024.5.6经与云端沟通，目前仅zigbee灯需要接收状态
        if (!data.modelName.toLowerCase().includes('light')) return
        console.log('有用的scene_device_result_status', data)

        const device = this.data.deviceList.find(
          (item) => item.uniId === data.devId || item.uniId === `${data.devId}:${data.modelName}`,
        )

        if (device) {
          device.status = data.errCode === 0 ? 'success' : 'fail'
          //避免频繁更新
          this.data._timer && clearTimeout(this.data._timer)
          this.data._timer = setTimeout(() => {
            this.setData({
              deviceList,
            })
          }, 1000)
        }
      })
      this.setData({
        opearationType: pageParams.sceneId ? 'edit' : 'add',
      })
      const promise = pageParams.sceneId
        ? updateScene(sceneData as Scene.UpdateSceneDto)
        : addScene(sceneData as Scene.AddSceneDto)

      const res = await promise

      if (res.success) {
        this.setData({
          sceneId: pageParams.sceneId || res.result.sceneId,
        })

        setTimeout(() => {
          this.data.deviceList.forEach((item) => {
            if (item.status === 'waiting') {
              item.status = 'fail'
            }
          })

          this.setData(
            {
              deviceList,
            },
            () => {
              if (
                this.data.successNum < this.data.deviceList.length &&
                this.data.finishNum === this.data.deviceList.length
              ) {
                Dialog.confirm({
                  title: '创建失败',
                  message: '部分设备配置一键场景失败，请确保所有设备在线后重试',
                  showCancelButton: false,
                  confirmButtonText: '我知道了',
                })
                  .then(() => {
                    // on confirm
                  })
                  .catch(() => {
                    // on cancel
                  })
              }
            },
          )
        }, 30000)
      } else {
        Dialog.confirm({
          title: '创建失败',
          message: '部分设备配置一键场景失败，请确保所有设备在线后重试',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })
          .then(() => {
            // on confirm
          })
          .catch(() => {
            // on cancel
          })
      }
    },

    detached() {
      emitter.off('scene_device_result_status')
      sceneStore.updateAllRoomSceneList()
      deviceStore.updateAllRoomDeviceList()
      homeStore.updateRoomCardList()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleAddScenePopupClose() {
      this.setData({
        linkSwitchPopup: false,
      })
    },
    handleShowAddSceneSuccess() {
      if (this.data.opearationType === 'edit') {
        wx.navigateBack()
        emitter.emit('sceneEdit')
      } else {
        wx.redirectTo({ url: '/package-automation/scene-success/index' })
      }
    },
    linkSwitch() {
      this.setData({
        linkSwitchPopup: true,
      })
    },
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
        this.data.deviceList.forEach((item) => {
          if (item.status === 'waiting') {
            item.status = 'fail'
          }
        })

        this.setData({
          deviceList,
        })
      }
    },
    /**
     * 是否支持新的场景设置方案
     */
    isNewScenarioSettingSupported(proType: string) {
      return (
        proType === PRO_TYPE.airConditioner ||
        proType === PRO_TYPE.freshAir ||
        proType === PRO_TYPE.floorHeating ||
        proType === PRO_TYPE.centralAirConditioning
      )
    },
  },
})
