import { ComponentWithComputed } from 'miniprogram-computed'
import { deviceStore } from '../../../../store/index'
import { findDevice } from '../../../../apis/index'
import { proType } from '../../../../config/index'

ComponentWithComputed({
  options: {
    styleIsolation: 'apply-shared',
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
    showSceneEditLightPopup: false,
    showSceneEditSwitchPopup: false,
    allDeviceList: [] as Device.DeviceItem[], // 可选的设备列表
    showDeviceListPopup: false,
    _cacheDeviceStatusMap: {} as IAnyObject, // 缓存选中前的设备状态集合
    selectList: Array<string>(), // 已选择的设备列表
    cacheSelectList: Array<string>(), // 设备列表弹窗的已选的设备列表
  },

  computed: {
    // 场景包含的设备的卡片数据
    showDeviceList(data) {
      return deviceStore.deviceFlattenList.filter((item) => data.selectList.includes(item.uniId))
    },
  },

  lifetimes: {
    ready() {
      // 排除已经关联了场景的开关设备
      this.setData({
        allDeviceList: deviceStore.deviceFlattenList.filter((item) => {
          const [, switchId] = item.uniId.split(':')

          return !switchId || (switchId && item.mzgdPropertyDTOList[switchId].ButtonMode !== 2)
        }),
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    addDevice() {
      this.setData({
        showDeviceListPopup: true,
        cacheSelectList: this.data.selectList.concat([]),
      })
    },

    closeDeviceListPopup() {
      this.setData({
        showDeviceListPopup: false,
      })
    },

    handleDeviceSelect(e: { detail: string }) {
      console.log('handleDeviceSelect', e)
      const deviceMap = deviceStore.deviceFlattenMap
      const selectId = e.detail

      // 取消选择逻辑
      if (this.data.cacheSelectList.includes(selectId)) {
        const index = this.data.cacheSelectList.findIndex((id) => id === selectId)
        this.data.cacheSelectList.splice(index, 1)
        this.setData({
          cacheSelectList: [...this.data.cacheSelectList],
        })
        return
      }

      const device = deviceMap[selectId]

      // 缓存原始状态，用于退出创建时还原设备状态
      if (this.data._cacheDeviceStatusMap[selectId]) {
        this.data._cacheDeviceStatusMap[selectId] = JSON.parse(JSON.stringify(device))
      }

      findDevice({ gatewayId: device.gatewayId, devId: device.deviceId })

      this.setData({
        cacheSelectList: [...this.data.cacheSelectList, selectId],
      })
    },

    // 全选
    clickTitleLeftBtn() {
      this.setData({
        cacheSelectList: this.data.allDeviceList.map((item) => item.uniId),
      })
    },

    handleLDeviceSelectConfirm() {
      this.setData({
        showDeviceListPopup: false,
        selectList: this.data.cacheSelectList,
      })
    },

    cancelCreate() {
      this.triggerEvent('cancel')
    },

    next() {
      // 补充actions
      const deviceMap = deviceStore.deviceMap
      const addSceneActions = [] as Device.ActionItem[]
      const { selectList } = this.data

      const selectDeviceList = deviceStore.deviceFlattenList.filter((device) => selectList.includes(device.uniId))

      selectDeviceList.forEach((device) => {
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

      this.triggerEvent('confirm', { sceneActions: addSceneActions, deviceList: this.data.showDeviceList })
    },

    handleCardTap(e: WechatMiniprogram.CustomEvent) {
      console.log('handleCardTap', e)
      const device = e.detail as Device.DeviceItem

      if (device.proType === proType.light) {
        findDevice({ gatewayId: device.gatewayId, devId: device.deviceId })
        this.setData({
          actionEditTitle: device.deviceName,
          sceneLightEditInfo: device.mzgdPropertyDTOList[1],
          showSceneEditLightPopup: true,
        })
      } else if (device.proType === proType.switch) {
        const [, switchId] = device.uniId.split(':')

        findDevice({
          gatewayId: device.gatewayId,
          devId: device.deviceId,
          ep: Number(switchId),
        })
        this.setData({
          actionEditTitle: device.deviceName,
          sceneSwitchEditInfo: device.mzgdPropertyDTOList[1],
          showSceneEditSwitchPopup: true,
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
      console.log('handleSceneEditConfirm', e.detail)
      this.setData({
        showSceneEditLightPopup: false,
        showSceneEditSwitchPopup: false,
      })
    },
  },
})
