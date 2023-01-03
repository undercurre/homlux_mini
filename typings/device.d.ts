// TODO：下面结构是开发时用于mock，需要根据接口进行修改
declare namespace Device {
  interface DeviceInfoBase {
    deviceId: string
    deviceName: string
    deviceType: 'light' | 'switch' | 'curtain'
    isOnline: boolean
  }
  interface LightInfo extends DeviceInfoBase {
    power: boolean
    brightness: number
    colorTemperature: number
  }
  interface SwitchInfo extends DeviceInfoBase {
    switchType: number // 1：关联智能开关 2：关联智能灯 3：关联场景
    power: boolean
    linkDeviceId: string
  }
  interface CurtainInfo extends DeviceInfoBase {
    openDeg: number
  }
}
