import { ComponentWithComputed } from 'miniprogram-computed'
import { proType } from '../../config/index'
import { deviceStore } from '../../store/index'
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
    sceneActions: Array<Device.ActionItem>(),
  },

  /**
   * 组件的方法列表
   */
  methods: {
    cancelCreate() {
      this.goBack()
    },

    confirmSelect(e: { deatil: Array<string> }) {
      const selectIdList = e.deatil

      console.log('confirmSelect', selectIdList)

      // 补充actions
      const deviceMap = deviceStore.deviceMap
      const addSceneActions = [] as Device.ActionItem[]

      const selectList = deviceStore.deviceFlattenList.filter((device) => selectIdList.includes(device.uniId))
      selectList.forEach((device) => {
        if (device.proType === proType.switch) {
          // 开关
          const deviceId = device.uniId.split(':')[0]
          const ep = parseInt(device.uniId.split(':')[1])
          const OnOff = deviceMap[deviceId].mzgdPropertyDTOList[ep].OnOff
          addSceneActions.push({
            uniId: device.uniId,
            name: device.switchInfoDTOList[0].switchName + ' | ' + device.deviceName,
            pic: device.switchInfoDTOList[0].pic,
            proType: device.proType,
            value: {
              ep,
              OnOff,
            },
          })
        } else if (device.proType === proType.light) {
          const properties = device.mzgdPropertyDTOList['1']
          // const color = (properties.ColorTemp / 100) * (maxColorTempK - minColorTempK) + minColorTempK
          const action = {
            uniId: device.uniId,
            name: device.deviceName,
            pic: device.pic,
            proType: device.proType,
            value: {
              ep: 1,
              OnOff: properties.OnOff,
            } as IAnyObject,
          }
          if (properties.OnOff) {
            action.value.Level = properties.Level
            action.value.ColorTemp = properties.ColorTemp
          }
          addSceneActions.push(action)
        }
      })

      this.setData({
        step: 'editInfo',
        sceneActions: addSceneActions,
      })
    },

    cancelEdit() {
      this.setData({
        step: 'selectDevice',
      })
    },

    confirmEdit() {},
  },
})
