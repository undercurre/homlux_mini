import { PRO_TYPE } from '../config/index'
import { isNullOrUnDef } from './index'

/**
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
  if (!isNullOrUnDef(properties.OnOff) || !isNullOrUnDef(properties.power)) {
    result.OnOff = properties.OnOff ?? (properties.power === 'off' ? 0 : 1)
  }

  // 灯光属性
  if (proType === PRO_TYPE.light) {
    const { maxColorTemp, minColorTemp } = properties.colorTempRange // 色温范围

    result.maxColorTemp = maxColorTemp
    result.minColorTemp = minColorTemp

    if (!isNullOrUnDef(properties.ColorTemp) || !isNullOrUnDef(properties.color_temperature)) {
      result.ColorTemp = properties.ColorTemp ?? Math.round((properties.color_temperature / 255) * 100)
    }

    if (!isNullOrUnDef(properties.Level) || !isNullOrUnDef(properties.brightness)) {
      result.Level = properties.Level ?? Math.round((properties.brightness / 255) * 100)
    }
  }
  // 目前只有WIFI窗帘一种
  else if (proType === PRO_TYPE.curtain) {
    return properties
    // const { curtain_status, curtain_direction, curtain_position: pos } = properties
    // if (!isNullOrUnDef(pos)) {
    //   result.curtain_position = curtain_direction === 'reverse' ? 100 - Number(pos) : pos
    // }
    // if (isNullOrUnDef(curtain_status)) {
    //   result.curtain_status = curtain_status
    // }
  }

  return result
}

/**
 * 标准属性转wifi属性
 * @param proType
 * @param properties
 */
export function toWifiProperty(proType: string, properties: IAnyObject) {
  const result = {} as IAnyObject

  if (proType === PRO_TYPE.light) {
    !isNullOrUnDef(properties.OnOff) && (result.power = properties.OnOff ? 'on' : 'off')

    !isNullOrUnDef(properties.ColorTemp) && (result.color_temperature = Math.round((properties.ColorTemp * 255) / 100))

    !isNullOrUnDef(properties.Level) && (result.brightness = Math.round((properties.Level * 255) / 100))
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
 * 转换成属性描述
 * @param proType
 * @param property 设备属性
 */
export function toPropertyDesc(proType: string, property: IAnyObject) {
  const descList = [] as string[]
  !isNullOrUnDef(property.OnOff) && descList.push(property.OnOff ? '打开' : '关闭')

  if (proType === PRO_TYPE.light && property.OnOff === 1) {
    !isNullOrUnDef(property.Level) && descList.push(`亮度${property.Level}%`)

    if (!isNullOrUnDef(property.ColorTemp)) {
      const color = (property.ColorTemp / 100) * (property.maxColorTemp - property.minColorTemp) + property.minColorTemp
      descList.push(`色温${color}K`)
    }
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

  return descList
}
