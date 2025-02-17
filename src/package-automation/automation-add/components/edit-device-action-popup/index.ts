import { ComponentWithComputed } from 'miniprogram-computed'
import {
  PRO_TYPE,
  AC_MODE,
  CAC_FA_WINDSPEED,
  CAC_MODE,
  FAN_PID,
  PRODUCT_ID,
  WIND_SPEED_MAP,
  FAN_SCENE_MAP,
} from '../../../../config/index'
import { transferWindSpeedProperty, getColorTempText } from '../../../../utils/index'
import { sendDevice } from '../../../../apis/index'
import Toast from '../../../../skyline-components/mz-toast/toast'

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
    editingPropertyInfo: {} as IAnyObject,
  },
  computed: {
    groupList(data) {
      const list = [] as Array<
        Array<{ title: string; key: string; propertyKey: string; disabled: boolean; value: string }>
      >
      if (data.deviceActionInfo.proType === PRO_TYPE.airConditioner) {
        const {
          power = 0,
          mode = '',
          temperature = 0,
          small_temperature = 0,
          wind_speed = 0,
        } = data.deviceActionInfo.sceneProperty

        list.push(
          [
            {
              title: '电源',
              key: 'power',
              propertyKey: 'power',
              disabled: false,
              value: power === 0 ? '关闭' : '开启',
            },
          ],
          [
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
              disabled: power === 0 || !mode || mode === 'fan',
              value: temperature === 0 ? '不设置' : `${temperature + small_temperature}℃`,
            },
            {
              title: '风速',
              key: 'wind_speed',
              propertyKey: 'acWindSpeed',
              disabled: power === 0 || !mode || mode === 'auto' || mode === 'dry',
              value: wind_speed === 0 ? '不设置' : transferWindSpeedProperty(wind_speed),
            },
          ],
        )
      }
      if (data.deviceActionInfo.proType === PRO_TYPE.centralAirConditioning) {
        const { power = 0, mode = 0, targetTemperature = 0, windSpeed = 0 } = data.deviceActionInfo.sceneProperty

        list.push(
          [
            {
              title: '电源',
              key: 'power',
              propertyKey: 'power',
              disabled: false,
              value: power === 0 ? '关闭' : '开启',
            },
          ],
          [
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
              disabled: power === 0 || !mode || mode === 4,
              value: targetTemperature === 0 ? '不设置' : `${targetTemperature}℃`,
            },
            {
              title: '风速',
              key: 'windSpeed',
              propertyKey: 'CacFaWindSpeed',
              disabled: power === 0 || !mode || mode === 2,
              value: windSpeed === 0 ? '不设置' : CAC_FA_WINDSPEED[`windSpeed_${windSpeed}`],
            },
          ],
        )
      }
      if (data.deviceActionInfo.proType === PRO_TYPE.floorHeating) {
        const { power = 0, targetTemperature = 0 } = data.deviceActionInfo.sceneProperty

        list.push(
          [
            {
              title: '电源',
              key: 'power',
              propertyKey: 'power',
              disabled: false,
              value: power === 0 ? '关闭' : '开启',
            },
          ],
          [
            {
              title: '温度',
              key: 'targetTemperature',
              propertyKey: 'fhTemperature',
              disabled: power === 0,
              value: targetTemperature === 0 ? '不设置' : `${targetTemperature}℃`,
            },
          ],
        )
      }
      if (data.deviceActionInfo.proType === PRO_TYPE.freshAir) {
        const { power = 0, windSpeed = 0 } = data.deviceActionInfo.sceneProperty

        list.push(
          [
            {
              title: '电源',
              key: 'power',
              propertyKey: 'power',
              disabled: false,
              value: power === 0 ? '关闭' : '开启',
            },
          ],
          [
            {
              title: '风速',
              key: 'windSpeed',
              propertyKey: 'CacFaWindSpeed',
              disabled: power === 0,
              value: windSpeed === 0 ? '不设置' : CAC_FA_WINDSPEED[`windSpeed_${windSpeed}`],
            },
          ],
        )
      }

      if (data.deviceActionInfo.proType === PRO_TYPE.light) {
        const {
          power = 0,
          brightness = 1,
          colorTemperature = 0,
          fan_power = 'off',
          fan_scene = 'fanmanual',
          fan_speed = 1,
        } = data.deviceActionInfo.sceneProperty

        if (FAN_PID.includes(data.deviceActionInfo.productId)) {
          const lightFuncList = [
            {
              title: '照明',
              key: 'power',
              propertyKey: 'power',
              disabled: false,
              value: power === 0 ? '关闭' : '开启',
            },
            ...(data.deviceActionInfo.productId !== PRODUCT_ID.fan_basic
              ? [
                  {
                    title: '亮度',
                    key: 'brightness',
                    propertyKey: 'brightness',
                    disabled: power === 0,
                    value: power === 0 ? '- -' : `${brightness}%`,
                  },
                  {
                    title: '色温',
                    key: 'colorTemperature',
                    propertyKey: 'colorTemperature',
                    disabled: power === 0,
                    value:
                      power === 0
                        ? '- -'
                        : getColorTempText({
                            colorTemp: colorTemperature,
                            maxColorTemp: data.deviceActionInfo.colorTempRange.maxColorTemp,
                            minColorTemp: data.deviceActionInfo.colorTempRange.minColorTemp,
                          }),
                  },
                ]
              : []),
          ]

          list.push(lightFuncList, [
            {
              title: '风扇',
              key: 'fan_power',
              propertyKey: 'fan_power',
              disabled: false,
              value: fan_power === 'off' ? '关闭' : '开启',
            },
            {
              title: '模式',
              key: 'fan_scene',
              propertyKey: 'fan_scene',
              disabled: fan_power === 'off',
              value: fan_power === 'off' ? '- -' : `${FAN_SCENE_MAP[fan_scene]}`,
            },
            {
              title: '档位',
              key: 'fan_speed',
              propertyKey: 'fan_speed',
              disabled: fan_power === 'off' || fan_scene !== 'fanmanual',
              value: fan_power === 'off' || fan_scene !== 'fanmanual' ? '- -' : `${WIND_SPEED_MAP[fan_speed]}档`,
            },
          ])
        } else {
          list.push(
            [
              {
                title: '开关',
                key: 'power',
                propertyKey: 'power',
                disabled: false,
                value: power === 0 ? '关闭' : '开启',
              },
            ],
            [
              {
                title: '亮度',
                key: 'brightness',
                propertyKey: 'brightness',
                disabled: power === 0,
                value: power === 0 ? '- -' : `${brightness}%`,
              },
              {
                title: '色温',
                key: 'colorTemperature',
                propertyKey: 'colorTemperature',
                disabled: power === 0,
                value:
                  power === 0
                    ? '- -'
                    : getColorTempText({
                        colorTemp: colorTemperature,
                        maxColorTemp: data.deviceActionInfo.colorTempRange.maxColorTemp,
                        minColorTemp: data.deviceActionInfo.colorTempRange.minColorTemp,
                      }),
              },
            ],
          )
        }
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
        const {
          power = 0,
          mode = '',
          temperature = 0,
          small_temperature = 0,
          wind_speed = 0,
        } = this.data.deviceActionInfo.sceneProperty
        const tempInfo = {
          power,
          mode,
          temperature,
          wind_speed,
          small_temperature,
        }
        this.setData(
          {
            editingPropertyInfo: {
              title: info.title,
              key: info.key,
              propertyKey: info.propertyKey,
              value:
                info.propertyKey === 'acTemperature'
                  ? tempInfo['temperature'] + tempInfo['small_temperature']
                  : tempInfo[info.key as keyof typeof tempInfo],
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

      if (this.data.deviceActionInfo.proType === PRO_TYPE.light) {
        const {
          power = 0,
          brightness = 1,
          colorTemperature = 0,
          fan_power = 'off',
          fan_scene = 'fanmanual',
          fan_speed = 1,
        } = this.data.deviceActionInfo.sceneProperty

        const tempInfo = {
          power,
          brightness,
          colorTemperature,
          fan_power,
          fan_scene,
          fan_speed,
        }
        this.setData(
          {
            editingPropertyInfo: {
              title: info.title,
              key: info.key,
              propertyKey: info.propertyKey,
              value: tempInfo[info.key as keyof typeof tempInfo],
              option: this.data.deviceActionInfo.colorTempRange,
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
    onSliderConfirm(event: WechatMiniprogram.CustomEvent<{ value: number }>) {
      console.log('onSliderConfirm', event)
      const sceneProperty = this.data.deviceActionInfo.sceneProperty

      sceneProperty[this.data.editingPropertyInfo.key] = event.detail.value

      this.setData({
        'deviceActionInfo.sceneProperty': sceneProperty,
        showPropertyPopup: false,
      })
    },
    onPropertyPopupConfirm(e: { detail: IAnyObject }) {
      console.log('onPropertyPopupConfirm', e.detail)
      const sceneProperty = this.data.deviceActionInfo.sceneProperty
      if (e.detail.optionTitle === '不设置') {
        if (e.detail.propertyKey === 'acTemperature') {
          delete sceneProperty['temperature']
          delete sceneProperty['small_temperature']
        } else {
          delete sceneProperty[e.detail.key]
        }
      } else {
        //家用WiFi空调的温度需要把整数和小数部分拆开
        if (e.detail.propertyKey === 'acTemperature') {
          const temperature = Math.floor(e.detail.value) // 获取整数部分
          const small_temperature = e.detail.value % 1 // 获取小数部分
          sceneProperty['temperature'] = temperature
          sceneProperty['small_temperature'] = small_temperature
        } else {
          sceneProperty[e.detail.key] = e.detail.value
        }
      }
      //如果电源为关闭，不能调节其他属性,风扇灯风扇属性（以fan_power作为电源开关）除外
      if (e.detail.propertyKey === 'power' && e.detail.value === 0) {
        for (const prop in sceneProperty) {
          // 排除风扇灯属性，以fan_开头
          if (prop !== 'modelName' && prop !== 'power' && prop.indexOf('fan_') >= 0) {
            delete sceneProperty[prop]
          }
        }
      } else if (
        e.detail.propertyKey === 'power' &&
        e.detail.value === 1 &&
        this.data.deviceActionInfo.proType === PRO_TYPE.light &&
        this.data.deviceActionInfo.productId !== PRODUCT_ID.fan_basic
      ) {
        // 如果电源为开启，灯具设备(支持亮度色温功能的)自动添加亮度、色温属性
        sceneProperty['brightness'] = 1
        sceneProperty['colorTemperature'] = 0
      }

      if (e.detail.propertyKey === 'fan_power' && e.detail.value === 'on') {
        // 如果风扇电源为开启，风扇灯设备自动添加模式、风速属性
        sceneProperty['fan_scene'] = 'fanmanual'
        sceneProperty['fan_speed'] = 1
      }

      // 如果风扇电源为关闭，不能调节其他风扇属性
      if (e.detail.propertyKey === 'fan_power' && e.detail.value === 'off') {
        for (const prop in sceneProperty) {
          // 排除风扇灯属性，以fan_开头
          if (prop.indexOf('fan_') >= 0) {
            delete sceneProperty[prop]
          }
        }
      }

      if (e.detail.propertyKey === 'fan_scene') {
        if (e.detail.value === 'breathing_wind') {
          // 如果风扇模式为自然风，风扇灯设备删除风速属性
          delete sceneProperty['fan_speed']
        } else {
          sceneProperty['fan_speed'] = 1
        }
      }

      //WIFI空调模式为不设置时,不可设置温度和风速
      if (e.detail.propertyKey === 'acMode' && e.detail.value === '') {
        delete sceneProperty['temperature']
        delete sceneProperty['small_temperature']
        delete sceneProperty['wind_speed']
      }
      //WIFI空调模式为自动和除湿时只能设置自动风
      if (e.detail.propertyKey === 'acMode' && (e.detail.value === 'auto' || e.detail.value === 'dry'))
        sceneProperty['wind_speed'] = 102
      //WIFI空调模式为送风时不能调节温度
      if (e.detail.propertyKey === 'acMode' && e.detail.value === 'fan') {
        delete sceneProperty['temperature']
        delete sceneProperty['small_temperature']
      }
      //485中央空调模式为不设置时,不可设置温度和风速
      if (e.detail.propertyKey === 'cacMode' && e.detail.value === 0) {
        delete sceneProperty['targetTemperature']
        delete sceneProperty['windSpeed']
      }
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
    async handleTry() {
      const res = await sendDevice({
        deviceId: this.data.deviceActionInfo.deviceId,
        gatewayId: this.data.deviceActionInfo.gatewayId,
        deviceType: this.data.deviceActionInfo.deviceType,
        proType: this.data.deviceActionInfo.proType,
        property: this.data.deviceActionInfo.sceneProperty,
      })

      if (!res.success) {
        Toast({ message: '控制失败', zIndex: 9999 })
        return
      }
      Toast({ message: '控制成功', zIndex: 9999 })
    },
  },
})
