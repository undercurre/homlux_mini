import { PRO_TYPE } from '../config/index'

export function transferDeviceProperty(proType: string, properties: IAnyObject) {
  if (proType === PRO_TYPE.light) {
    const { maxColorTemp, minColorTemp } = properties.colorTempRange // 色温范围

    // 子设备和wifi设备属性不一致,以子设备属性为标准转换
    return {
      ...properties,
      ColorTemp: properties.ColorTemp || properties.color_temperature,
      maxColorTemp,
      minColorTemp,
      OnOff: properties.OnOff || (properties.power === 'off' ? 0 : 1),
      Level: properties.Level || properties.brightness,
    }
  }

  return {
    ...properties,
  }
}

/**
 * 标准属性转wifi属性
 * @param proType
 * @param properties
 */
export function toWifiProperty(proType: string, properties: IAnyObject) {
  const result = {} as IAnyObject

  if (proType === PRO_TYPE.light) {
    result.power = properties.OnOff ? 'on' : 'off'

    properties.ColorTemp && (result.color_temperature = Math.round((properties.ColorTemp * 255) / 100))

    properties.Level && (result.brightness = Math.round((properties.Level * 255) / 100))
  }

  return result
}
