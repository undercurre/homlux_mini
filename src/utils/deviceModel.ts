import {
  PRO_TYPE,
  AC_MODE,
  CAC_MODE,
  CAC_FA_WINDSPEED,
  WIND_SPEED_MAP,
  FAN_SCENE_MAP,
  autoSceneConditionPropertyOptions,
} from '../config/index'
import { isNullOrUnDef } from './index'
import _ from 'lodash'
/**
 * Deserted 此方法已不必使用，暂时保留代码
 *  子设备和wifi设备属性不一致,以子设备属性为标准转换
 * @param proType
 * @param properties
 */
export function transferDeviceProperty(proType: string, properties: IAnyObject) {
  const result = {} as IAnyObject

  if (isNullOrUnDef(properties)) {
    console.warn('转换标准属性失败，属性集为空')
    return result
  }
  // 开关属性
  // if (!isNullOrUnDef(properties.power) || !isNullOrUnDef(properties.power)) {
  //   result.power = properties.power ?? (properties.power === 'off' ? 0 : 1)
  // }
  if (!isNullOrUnDef(properties.power)) {
    result.power = properties.power
  }

  // 灯光属性
  if (proType === PRO_TYPE.light) {
    const { maxColorTemp, minColorTemp } = properties.colorTempRange || properties // 色温范围，房间首页的数据的色温属性可能已经被转换过，可能不存在colorTempRange属性

    result.maxColorTemp = maxColorTemp
    result.minColorTemp = minColorTemp

    // if (!isNullOrUnDef(properties.ColorTemp) || !isNullOrUnDef(properties.color_temperature)) {
    //   result.ColorTemp = properties.ColorTemp ?? Math.round((properties.color_temperature / 255) * 100)
    // }

    // if (!isNullOrUnDef(properties.Level) || !isNullOrUnDef(properties.brightness)) {
    //   result.Level = properties.Level ?? Math.round((properties.brightness / 255) * 100)
    // }
    if (!isNullOrUnDef(properties.colorTemperature)) {
      result.colorTemperature = properties.colorTemperature
    }

    if (!isNullOrUnDef(properties.brightness)) {
      result.brightness = properties.brightness
    }
  }
  // 目前只有WIFI窗帘一种
  else if (proType === PRO_TYPE.curtain) {
    return properties
  }

  return result
}

/**
 * Deserted 此方法已不必使用，暂时保留代码
 * 标准属性转wifi属性
 * @param proType
 * @param properties
 */
export function toWifiProperty(proType: string, properties: IAnyObject) {
  const result = {} as IAnyObject

  if (proType === PRO_TYPE.light) {
    // !isNullOrUnDef(properties.power) && (result.power = properties.power ? 'on' : 'off')
    !isNullOrUnDef(properties.power) && (result.power = properties.power)

    !isNullOrUnDef(properties.colorTemperature) && (result.colorTemperature = properties.colorTemperature)

    !isNullOrUnDef(properties.brightness) && (result.brightness = properties.brightness)
  }
  // 窗帘控制
  else if (proType === PRO_TYPE.curtain) {
    return properties
    // const { curtain_status, curtain_direction, curtain_position: pos } = properties
    // if (!isNullOrUnDef(pos)) {
    //   result.curtain_position = curtain_direction === 'reverse' ? 100 - Number(pos) : pos
    // }
    // if (!isNullOrUnDef(curtain_status)) {
    //   result.curtain_status = curtain_status
    // }
  }

  return result
}

/**
 * 获取转换后的色温显示值
 * @param params
 */
export function getColorTempText(params: { colorTemp: number; maxColorTemp: number; minColorTemp: number }) {
  const { colorTemp, maxColorTemp, minColorTemp } = params
  const color = (colorTemp / 100) * (maxColorTemp - minColorTemp) + minColorTemp
  return `${color}K`
}
/**
 * 转换成属性描述
 * @param proType
 * @param property 设备属性
 */
export function toPropertyDesc({
  proType,
  property,
  productId,
}: {
  proType: string
  property: IAnyObject
  productId?: string
}) {
  if (isNullOrUnDef(property)) {
    console.warn('转换属性描述失败，属性集为空')
    return []
  }
  let descList = [] as string[]
  if (proType === PRO_TYPE.light) {
    !isNullOrUnDef(property.power) &&
      descList.push(`${isNullOrUnDef(property.fan_power) ? '' : '照明:'}${property.power ? '打开' : '关闭'}`) // 风扇灯开关需要区分风扇和照明开关

    !isNullOrUnDef(property.fan_power) && descList.push(`风扇:${property.fan_power === 'on' ? '打开' : '关闭'}`)

    if (property.fan_power === 'on') {
      // WIND_SPEED_MAP, FAN_SCENE_MAP
      !isNullOrUnDef(property.fan_scene) && descList.push(`${FAN_SCENE_MAP[property.fan_scene]}`)

      !isNullOrUnDef(property.fan_speed) && descList.push(`${WIND_SPEED_MAP[property.fan_speed]}档`)
    }
    if (property.power === 1) {
      !isNullOrUnDef(property.brightness) && descList.push(`亮度${property.brightness}%`)

      if (!isNullOrUnDef(property.colorTemperature)) {
        const { maxColorTemp, minColorTemp } = property.colorTempRange || property
        const color = getColorTempText({
          colorTemp: property.colorTemperature,
          maxColorTemp,
          minColorTemp,
        })
        descList.push(`色温${color}`)
      }
    }
  }

  if (proType === PRO_TYPE.switch) {
    !isNullOrUnDef(property) && !isNullOrUnDef(property.power) && descList.push(property.power ? '打开' : '关闭')
  }

  if (proType === PRO_TYPE.curtain) {
    if (property.curtain_position === 0) {
      descList.push(`关闭`)
    } else if (property.curtain_position === 100) {
      descList.push(`打开`)
    } else {
      descList.push(`开启至${property.curtain_position}%`)
    }
  }

  if (proType === PRO_TYPE.sensor) {
    !isNullOrUnDef(property.occupancy) && descList.push(property.occupancy ? '有人移动' : '超时无人移动')
    !isNullOrUnDef(property.IlluminanceLevelStatus) &&
      descList.push(property.IlluminanceLevelStatus === '2' ? '环境光亮' : '环境光暗')
    !isNullOrUnDef(property.doorStatus) &&
      descList.push(
        property.doorStatus ? (!isNullOrUnDef(property.PIRToUnoccupiedDelay) ? '超时未关闭' : '打开') : '关闭',
      )
    !isNullOrUnDef(property.buttonClicked) &&
      descList.push(property.buttonClicked === 1 ? '单击' : property.buttonClicked === 2 ? '双击' : '长按')
  }

  if (proType === PRO_TYPE.bathHeat) {
    const { mode, light_mode, heating_temperature } = property
    if (mode?.indexOf('close_all') > -1) {
      descList.push('待机')
    }
    if (mode?.indexOf('heating') > -1) {
      if (Number(heating_temperature) >= 43) {
        descList.push('强暖')
      } else if (heating_temperature <= 42) {
        descList.push('弱暖')
      }
    }
    if (mode?.indexOf('ventilation') > -1) {
      descList.push('换气')
    }
    if (mode?.indexOf('blowing') > -1) {
      descList.push('吹风')
    }
    if (light_mode === 'main_light') {
      descList.push('照明')
    } else if (light_mode === 'night_light') {
      descList.push('夜灯')
    } else if (light_mode === 'close_all') {
      descList.push('关灯')
    }
  }

  if (proType === PRO_TYPE.clothesDryingRack) {
    const { updown, laundry, light } = property
    if (updown === 'up') {
      descList.push('上升')
    }
    if (updown === 'down') {
      descList.push('下降')
    }
    if (updown === 'pause') {
      descList.push('暂停')
    }
    if (laundry === 'on') {
      descList.push('一键晾衣')
    }
    if (light === 'on') {
      descList.push('照明')
    } else if (light === 'off') {
      descList.push('关灯')
    }
  }

  if (proType === PRO_TYPE.airConditioner) {
    !isNullOrUnDef(property.power) && descList.push(property.power === 1 ? '开启' : '关闭')
    !isNullOrUnDef(property.mode) && descList.push(AC_MODE[property.mode])
    !isNullOrUnDef(property.temperature) &&
      !isNullOrUnDef(property.small_temperature) &&
      descList.push(`${property.temperature + property.small_temperature}℃`)
    !isNullOrUnDef(property.wind_speed) && descList.push(transferWindSpeedProperty(property.wind_speed) + '风')
  }
  if (proType === PRO_TYPE.centralAirConditioning) {
    !isNullOrUnDef(property.power) && descList.push(property.power === 1 ? '开启' : '关闭')
    !isNullOrUnDef(property.mode) && descList.push(CAC_MODE[`mode_${property.mode}`])
    !isNullOrUnDef(property.targetTemperature) && descList.push(`${property.targetTemperature}℃`)
    !isNullOrUnDef(property.windSpeed) && descList.push(CAC_FA_WINDSPEED[`windSpeed_${property.windSpeed}`] + '风')
  }

  if (proType === PRO_TYPE.freshAir) {
    !isNullOrUnDef(property.power) && descList.push(property.power === 1 ? '开启' : '关闭')
    !isNullOrUnDef(property.windSpeed) && descList.push(CAC_FA_WINDSPEED[`windSpeed_${property.windSpeed}`] + '风')
  }

  if (proType === PRO_TYPE.floorHeating) {
    !isNullOrUnDef(property.power) && descList.push(property.power === 1 ? '开启' : '关闭')
    !isNullOrUnDef(property.targetTemperature) && descList.push(`${property.targetTemperature}℃`)
  }
  if (proType === PRO_TYPE.doorLock) {
    if (isNullOrUnDef(productId)) return []
    autoSceneConditionPropertyOptions[productId].forEach((item) => {
      if (_.isEqual(item.value, property)) {
        descList.push(item.title)
      }
    })
  }
  if (descList.length > 3) {
    descList = [...descList.slice(0, 2), '...']
  }

  return descList
}
/**
 * 转换WIFI空调的风速描述
 * @param windSpeed
 * @returns
 */
export function transferWindSpeedProperty(windSpeed: number) {
  if (isNullOrUnDef(windSpeed)) {
    console.warn('转换风速描述失败，属性值为空')
    return ''
  }
  if (windSpeed < 20) {
    return '1档'
  } else if (windSpeed < 40) {
    return '2档'
  } else if (windSpeed < 60) {
    return '3档'
  } else if (windSpeed < 80) {
    return '4档'
  } else if (windSpeed < 100) {
    return '5档'
  } else if (windSpeed === 100) {
    return '6档'
  } else if (windSpeed <= 102) {
    return '自动'
  }
  return ''
}
