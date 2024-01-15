import { ComponentWithComputed } from 'miniprogram-computed'
import { PRO_TYPE } from '../../../../config/index'
import { AC_MODE, CAC_FA_WINDSPEED, CAC_MODE } from '../../../../config/index'
import { transferWindSpeedProperty } from '../../../../utils/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
    },
    deviceActionInfo: {
      type: Object,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    showPropertyPopup: false,
    editingPropertyInfo: {},
  },
  computed: {
    cellList(data) {
      const list = []
      if (data.deviceActionInfo.proType === PRO_TYPE.airConditioner) {
        const { power = 0, mode = '', temperature = 0, wind_speed = 0 } = data.deviceActionInfo.sceneProperty

        list.push(
          { title: '电源', key: 'power', propertyKey: 'power', disabled: false, value: power === 0 ? '关闭' : '开启' },
          {
            title: '模式',
            key: 'mode',
            propertyKey: 'acMode',
            disabled: power === 0,
            value: AC_MODE[mode] ? AC_MODE[mode] : '不设置',
          },
          {
            title: '温度',
            key: 'temperature',
            propertyKey: 'acTemperature',
            disabled: power === 0 || mode === 'fan',
            value: temperature === 0 ? '不设置' : `${temperature}℃`,
          },
          {
            title: '风速',
            key: 'wind_speed',
            propertyKey: 'acWindSpeed',
            disabled: power === 0 || mode === 'auto' || mode === 'dry',
            value: wind_speed === 0 ? '不设置' : transferWindSpeedProperty(wind_speed),
          },
        )
      }
      if (data.deviceActionInfo.proType === PRO_TYPE.centralAirConditioning) {
        const { power = 0, mode = 0, targetTemperature = 0, windSpeed = 0 } = data.deviceActionInfo.sceneProperty

        list.push(
          { title: '电源', key: 'power', propertyKey: 'power', disabled: false, value: power === 0 ? '关闭' : '开启' },
          {
            title: '模式',
            key: 'mode',
            propertyKey: 'cacMode',
            disabled: power === 0,
            value: CAC_MODE[`mode_${mode}`] ? CAC_MODE[`mode_${mode}`] : '不设置',
          },
          {
            title: '温度',
            key: 'targetTemperature',
            propertyKey: 'cacTemperature',
            disabled: power === 0 || mode === 4,
            value: targetTemperature === 0 ? '不设置' : `${targetTemperature}℃`,
          },
          {
            title: '风速',
            key: 'windSpeed',
            propertyKey: 'CacFaWindSpeed',
            disabled: power === 0 || mode === 2,
            value: windSpeed === 0 ? '不设置' : CAC_FA_WINDSPEED[`windSpeed_${windSpeed}`],
          },
        )
      }
      if (data.deviceActionInfo.proType === PRO_TYPE.floorHeating) {
        const { power = 0, targetTemperature = 0 } = data.deviceActionInfo.sceneProperty

        list.push(
          { title: '电源', key: 'power', propertyKey: 'power', disabled: false, value: power === 0 ? '关闭' : '开启' },
          {
            title: '温度',
            key: 'targetTemperature',
            propertyKey: 'fhTemperature',
            disabled: power === 0,
            value: targetTemperature === 0 ? '不设置' : `${targetTemperature}℃`,
          },
        )
      }
      if (data.deviceActionInfo.proType === PRO_TYPE.freshAir) {
        const { power = 0, windSpeed = 0 } = data.deviceActionInfo.sceneProperty

        list.push(
          { title: '电源', key: 'power', propertyKey: 'power', disabled: false, value: power === 0 ? '关闭' : '开启' },
          {
            title: '风速',
            key: 'windSpeed',
            propertyKey: 'CacFaWindSpeed',
            disabled: power === 0,
            value: windSpeed === 0 ? '不设置' : CAC_FA_WINDSPEED[`windSpeed_${windSpeed}`],
          },
        )
      }
      return list
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    cellClicked(e: { currentTarget: { dataset: { item: IAnyObject } } }) {
      const info = e.currentTarget.dataset.item
      if (info.disabled) return
      if (this.data.deviceActionInfo.proType === PRO_TYPE.airConditioner) {
        const { power = 0, mode = '', temperature = 0, wind_speed = 0 } = this.data.deviceActionInfo.sceneProperty
        const tempInfo = {
          power,
          mode,
          temperature,
          wind_speed,
        }
        this.setData(
          {
            editingPropertyInfo: {
              title: info.title,
              key: info.key,
              propertyKey: info.propertyKey,
              value: tempInfo[info.key as keyof typeof tempInfo],
            },
          },
          () => {
            this.setData({
              showPropertyPopup: true,
            })
          },
        )
      }
      if (this.data.deviceActionInfo.proType === PRO_TYPE.centralAirConditioning) {
        const { power = 0, mode = 0, targetTemperature = 0, windSpeed = 0 } = this.data.deviceActionInfo.sceneProperty

        const tempInfo = {
          power,
          mode,
          targetTemperature,
          windSpeed,
        }
        this.setData(
          {
            editingPropertyInfo: {
              title: info.title,
              key: info.key,
              propertyKey: info.propertyKey,
              value: tempInfo[info.key as keyof typeof tempInfo],
            },
          },
          () => {
            this.setData({
              showPropertyPopup: true,
            })
          },
        )
      }
      if (this.data.deviceActionInfo.proType === PRO_TYPE.floorHeating) {
        const { power = 0, targetTemperature = 0 } = this.data.deviceActionInfo.sceneProperty
        const tempInfo = {
          power,
          targetTemperature,
        }
        this.setData(
          {
            editingPropertyInfo: {
              title: info.title,
              key: info.key,
              propertyKey: info.propertyKey,
              value: tempInfo[info.key as keyof typeof tempInfo],
            },
          },
          () => {
            this.setData({
              showPropertyPopup: true,
            })
          },
        )
      }
      if (this.data.deviceActionInfo.proType === PRO_TYPE.freshAir) {
        const { power = 0, windSpeed = 0 } = this.data.deviceActionInfo.sceneProperty

        const tempInfo = {
          power,
          windSpeed,
        }
        this.setData(
          {
            editingPropertyInfo: {
              title: info.title,
              key: info.key,
              propertyKey: info.propertyKey,
              value: tempInfo[info.key as keyof typeof tempInfo],
            },
          },
          () => {
            this.setData({
              showPropertyPopup: true,
            })
          },
        )
      }
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', this.data.deviceActionInfo.sceneProperty)
    },
    blank() {},
    onPropertyPopupClose() {
      this.setData({
        showPropertyPopup: false,
      })
    },
    onPropertyPopupConfirm(e: { detail: IAnyObject }) {
      console.log(e, this.data.deviceActionInfo.sceneProperty)
      const sceneProperty = this.data.deviceActionInfo.sceneProperty
      if (e.detail.optionTitle === '不设置') {
        delete sceneProperty[e.detail.key]
      } else {
        sceneProperty[e.detail.key] = e.detail.value
      }
      //如果电源为关闭，不能调节其他属性
      if (e.detail.propertyKey === 'power' && e.detail.value === 0) {
        const allProps = Object.keys(sceneProperty)
        for (const prop in sceneProperty) {
          if (prop !== 'modelName' && prop !== 'power' && allProps.includes(prop)) {
            delete sceneProperty[prop]
          }
        }
      }
      //WIFI空调模式为自动和除湿时只能设置自动风
      if (e.detail.propertyKey === 'acMode' && (e.detail.value === 'auto' || e.detail.value === 'dry'))
        sceneProperty['wind_speed'] = 102
      //WIFI空调模式为送风时不能调节温度
      if (e.detail.propertyKey === 'acMode' && e.detail.value === 'fan') delete sceneProperty['temperature']
      //485中央空调模式为送风时不能调节温度
      if (e.detail.propertyKey === 'cacMode' && e.detail.value === 4) delete sceneProperty['targetTemperature']
      //485中央空调模式为除湿时不能调节风速
      if (e.detail.propertyKey === 'cacMode' && e.detail.value === 2) delete sceneProperty['windSpeed']

      this.setData({
        'deviceActionInfo.sceneProperty': sceneProperty,
        showPropertyPopup: false,
      })
      console.log(this.data.deviceActionInfo.sceneProperty)
    },
  },
})
