// 搜寻蓝牙设备时的信号强度阈值(最小值)
export const MIN_RSSI = -65

// 搜寻超时时间
export const SEEK_TIMEOUT = 5000

// 操作间隔时间
export const FREQUENCY_TIME = 700

// 轮询设备状态的上报间隔时间
export const SEEK_INTERVAL = 4000

// 工厂调试用Mac地址
export const FACTORY_ADDR = '112233445566'

// 默认加密
export const DEFAULT_ENCRYPT = true

// 浴霸温度最大最小值
export const MAX_TEMPERATURE = 40
export const MIN_TEMPERATURE = 20

/**
 * 灯类色温范围
 * {key} === {品类码}{型号码}
 * 型号码: 0x01 吸顶灯; 0x02 风扇灯
 */
export const COLORTEMP_RANGE: Record<string, number[]> = {
  '1301': [3000, 5700],
  '1302': [2700, 6500],
}

/**
 * @description 设备交互数据配置，按设备类型区分
 * TODO REFACTOR 随着型号增加，这样做功能配置会很臃肿，参考美居晾衣架等品类进行重构
 * { deviceType: { deviceModel: { configDetail }}}
 */
export const deviceConfig: Record<string, Record<string, Remoter.ConfigItem>> = {
  '13': {
    '01': {
      deviceName: '吸顶灯',
      devicePic: '/assets/img/remoter/ceilLight.png',
      actions: [
        {
          key: 'LIGHT_LAMP',
          name: '照明',
        },
        {
          key: 'LIGHT_NIGHT_LAMP',
          name: '夜灯',
        },
      ],
    },
    '02': {
      deviceName: '风扇灯',
      devicePic: '/assets/img/remoter/fanLight.png',
      actions: [
        {
          key: 'LIGHT_LAMP',
          name: '照明',
        },
        {
          key: 'FAN_SWITCH',
          name: '风扇',
        },
      ],
    },
    '03': {
      deviceName: '风扇灯',
      devicePic: '/assets/img/remoter/fanLight.png',
      actions: [
        {
          key: 'LIGHT_LAMP',
          name: '照明',
        },
        {
          key: 'FAN_SWITCH',
          name: '风扇',
        },
      ],
    },
    '04': {
      deviceName: '吸顶灯',
      devicePic: '/assets/img/remoter/ceilLight.png',
      actions: [
        {
          key: 'LIGHT_LAMP',
          name: '照明',
        },
        {
          key: 'LIGHT_NIGHT_LAMP',
          name: '夜灯',
        },
      ],
    },
  },
  '26': {
    // Q30系列 // 0001 不支持摆风，可调温
    '01': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {},
        right: {
          key: 'BATH_TEMPERATURE_ADD',
          icon: '/package-remoter/assets/temp3.png',
          iconActive: '/package-remoter/assets/temp2.png',
        },
        down: {},
        left: {
          key: 'BATH_TEMPERATURE_SUB',
          icon: '/package-remoter/assets/temp1.png',
          iconActive: '/package-remoter/assets/temp0.png',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
        {
          key: 'BATH_WARM_UP',
          icon: '/package-remoter/assets/scene01.png',
          iconActive: '/package-remoter/assets/scene00.png',
          name: '取暖',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
    // Y5系列 // 0010 无人感，支持摆风，不可调温（无法判断是否可以调光）
    '02': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'BATH_WARM_STRONG',
          icon: '/package-remoter/assets/warm3.png',
          iconActive: '/package-remoter/assets/warm2.png',
          name: '强暖',
        },
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'BATH_WARM_SOFT',
          icon: '/package-remoter/assets/warm1.png',
          iconActive: '/package-remoter/assets/warm0.png',
          name: '弱暖',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
    // Q20系列 // 0011 可调温 支持摆风 不支持人感 色温不可调
    '03': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {},
        right: {
          key: 'BATH_TEMPERATURE_ADD',
          icon: '/package-remoter/assets/temp3.png',
          iconActive: '/package-remoter/assets/temp2.png',
        },
        down: {},
        left: {
          key: 'BATH_TEMPERATURE_SUB',
          icon: '/package-remoter/assets/temp1.png',
          iconActive: '/package-remoter/assets/temp0.png',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_SWING',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '摆风',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
        {
          key: 'BATH_WARM_UP',
          icon: '/package-remoter/assets/scene01.png',
          iconActive: '/package-remoter/assets/scene00.png',
          name: '取暖',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
    // Y6系列 // 0110 有人感
    '06': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'BATH_WARM_STRONG',
          icon: '/package-remoter/assets/warm3.png',
          iconActive: '/package-remoter/assets/warm2.png',
          name: '强暖',
        },
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'BATH_WARM_SOFT',
          icon: '/package-remoter/assets/warm1.png',
          iconActive: '/package-remoter/assets/warm0.png',
          name: '弱暖',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
    // A80系列 // 0111 温度可调
    '07': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'BATH_TEMPERATURE_ADD',
          icon: '/package-remoter/assets/temp3.png',
          iconActive: '/package-remoter/assets/temp2.png',
        },
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'BATH_TEMPERATURE_SUB',
          icon: '/package-remoter/assets/temp1.png',
          iconActive: '/package-remoter/assets/temp0.png',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'BATH_WARM_UP',
          icon: '/package-remoter/assets/scene01.png',
          iconActive: '/package-remoter/assets/scene00.png',
          name: '取暖',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
          btnWidth: '654rpx',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
    // A70系列 // 1111 温度可调，色温可调
    '0f': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      showTemperature: false, // TODO 暂时不予实现
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'BATH_TEMPERATURE_ADD',
          icon: '/package-remoter/assets/temp3.png',
          iconActive: '/package-remoter/assets/temp2.png',
        },
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'BATH_TEMPERATURE_SUB',
          icon: '/package-remoter/assets/temp1.png',
          iconActive: '/package-remoter/assets/temp0.png',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        // {
        //   key: 'TEMPERATURE_SETTING_ADD',
        //   name: '温度+',
        // },
        // {
        //   key: 'TEMPERATURE_SETTING_SUB',
        //   name: '温度-',
        // },
        {
          key: 'BATH_WARM_UP',
          icon: '/package-remoter/assets/scene01.png',
          iconActive: '/package-remoter/assets/scene00.png',
          name: '取暖',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
          btnWidth: '654rpx',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
    // Y10W系列 // 00010111 温度可调，色温可调
    '77': {
      deviceName: '浴霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      showTemperature: false, // TODO 暂时不予实现
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'BATH_TEMPERATURE_ADD',
          icon: '/package-remoter/assets/temp3.png',
          iconActive: '/package-remoter/assets/temp2.png',
        },
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'BATH_TEMPERATURE_SUB',
          icon: '/package-remoter/assets/temp1.png',
          iconActive: '/package-remoter/assets/temp0.png',
        },
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        // {
        //   key: 'TEMPERATURE_SETTING_ADD',
        //   name: '温度+',
        // },
        // {
        //   key: 'TEMPERATURE_SETTING_SUB',
        //   name: '温度-',
        // },
        {
          key: 'BATH_WARM_UP',
          icon: '/package-remoter/assets/scene01.png',
          iconActive: '/package-remoter/assets/scene00.png',
          name: '取暖',
        },
        {
          key: 'BATH_WIND',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          icon: '/package-remoter/assets/sceneB1.png',
          iconActive: '/package-remoter/assets/sceneB0.png',
          name: '干燥',
        },
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
          btnWidth: '654rpx',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_WIND',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
        {
          key: 'BATH_DRY',
          name: '干燥',
        },
      ],
    },
  },
  '40': {
    // L8、B8 // 0011 支持摆风，电控无法区分L8和B8（B8带小夜灯）
    '03': {
      deviceName: '凉霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      mList: [
        {
          key: 'KITCHEN_WIND_STRONG',
          icon: '/package-remoter/assets/oldHighWindOff.png',
          iconActive: '/package-remoter/assets/oldHighWindOn.png',
          name: '强吹风',
        },
        {
          key: 'KITCHEN_WIND_SOFT',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_SWING',
          icon: '/package-remoter/assets/oldSwingOff.png',
          iconActive: '/package-remoter/assets/oldSwingOn.png',
          name: '摆风',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
      ],
    },
    // B7系列 // 0111 支持摆风，带人感
    '07': {
      deviceName: '凉霸',
      devicePic: '/assets/img/remoter/bathHeater.png',
      joystick: {
        up: {
          key: 'BATH_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {},
        down: {
          key: 'BATH_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {},
        middle: {
          key: 'FACTORY',
        },
      },
      mList: [
        {
          key: 'KITCHEN_WIND_STRONG',
          icon: '/package-remoter/assets/oldHighWindOff.png',
          iconActive: '/package-remoter/assets/oldHighWindOn.png',
          name: '强吹风',
        },
        {
          key: 'KITCHEN_WIND_SOFT',
          icon: '/package-remoter/assets/scene91.png',
          iconActive: '/package-remoter/assets/scene90.png',
          name: '吹风',
        },
        {
          key: 'BATH_VENTILATE',
          icon: '/package-remoter/assets/sceneA1.png',
          iconActive: '/package-remoter/assets/sceneA0.png',
          name: '换气',
        },
        {
          key: 'BATH_SWING',
          icon: '/package-remoter/assets/oldSwingOff.png',
          iconActive: '/package-remoter/assets/oldSwingOn.png',
          name: '摆风',
        },
      ],
      bList: [
        {
          key: 'BATH_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '待机',
        },
      ],
      actions: [
        {
          key: 'BATH_LAMP',
          name: '照明',
        },
        {
          key: 'BATH_ALL_OFF',
          name: '待机',
        },
        {
          key: 'BATH_VENTILATE',
          name: '换气',
        },
      ],
    },
  },
}

// 控制指令
export const CMD: Record<string, number> = {
  // 吸顶灯
  LIGHT_LAMP: 0x06, // 灯开关
  LIGHT_BRIGHT: 0x51, // 亮度设值
  LIGHT_COLOR_TEMP: 0x55, // 色温设置
  LIGHT_BRIGHT_PLUS: 0x2c, // 亮度+ 短按
  LIGHT_BRIGHT_MINUS: 0x2a, // 亮度- 短按
  LIGHT_COLOR_TEMP_PLUS: 0x25, // 色温+ 短按
  LIGHT_COLOR_TEMP_MINUS: 0x21, // 色温- 短按
  LIGHT_SCENE_DAILY: 0x19, // 日常
  LIGHT_SCENE_RELAX: 0x1a, // 休闲
  LIGHT_SCENE_DELAY_OFF: 0x1d, // 延时关（延时2分钟关灯）
  LIGHT_SCENE_SLEEP: 0x1b, // 助眠
  LIGHT_SCENE_MIX: 0x5b, // 亮度及色温同时设置
  LIGHT_NIGHT_LAMP: 0x1c, // 小夜灯

  // 风扇灯
  FAN_SWITCH: 0x09, // 风扇开关
  FAN_NEGATIVE: 0x1c, // 风扇正反转
  FAN_NATURE: 0x1b, // 自然风
  FAN_SPEED_1: 0x19, // 1档风
  FAN_SPEED_2: 0x1a, // 2档风
  FAN_SPEED_3: 0x81, // 3档风
  FAN_SPEED_4: 0x88, // 4档风
  FAN_SPEED_5: 0x85, // 5档风
  FAN_SPEED_6: 0x86, // 6档风
  FAN_DELAY_OFF_CANCEL: 0x50, // 延时关风扇取消
  FAN_DELAY_OFF_1: 0x52, // 延时1小时关风扇
  FAN_DELAY_OFF_2: 0x53, // 延时2小时关风扇
  FAN_DELAY_OFF_3: 0x54, // 延时3小时关风扇
  FAN_DELAY_OFF_4: 0x56, // 延时4小时关风扇
  FAN_DELAY_OFF_5: 0x57, // 延时5小时关风扇
  FAN_DELAY_OFF_6: 0x58, // 延时6小时关风扇
  CLOSE_DISPLAY: 0x8c, //关闭屏显

  // 浴霸
  BATH_ALL_OFF: 0x0d, // 全关，待机
  BATH_LAMP: 0x06, // 照明
  BATH_NIGHT_LAMP: 0x08, // 小夜灯
  BATH_AUTO: 0x19, // 安心沐浴
  BATH_DRY: 0x1a, // 干燥
  BATH_VENTILATE: 0x1b, // 换气
  BATH_WIND: 0x1d, // 吹风
  BATH_WARM_SOFT: 0x05, // 弱暖
  BATH_WARM_STRONG: 0x01, // 强暖
  BATH_SWING: 0x18, // 摆风
  BATH_BRIGHT_PLUS: 0x0c, // 亮度+
  BATH_BRIGHT_PLUS_ACC: 0x0c, // 亮度+，长按与短按指令暂用一个
  BATH_BRIGHT_MINUS: 0x0a, // 亮度- 短按
  BATH_BRIGHT_MINUS_ACC: 0x0a, // 亮度- 长按
  BATH_TEMPERATURE_ADD: 0x88, // 温度+
  BATH_TEMPERATURE_SUB: 0x81, // 温度-
  BATH_WARM_UP: 0x8c, // 取暖
  BATH_DELAY_CLOSE: 0x41, // 延时关
  BATH_RADAR: 0x42, //人感
  BATH_ANION: 0x43, //负离子
  BATH_TVOC: 0x44, //异味感应

  // 凉霸（其余指令同浴霸）
  KITCHEN_WIND_STRONG: 0x02, // 强吹风
  KITCHEN_WIND_SOFT: 0x03, // 吹风（弱风）

  // 厂测指令（调试用）
  FACTORY: 0x13,

  // 指令终止（松手时发送）
  END: 0x00,

  // 断开连接
  DISCONNECT: 0xfe,
}

// 下拉选项配置
export const ACTIONSHEET_MAP: Record<string, IAnyObject> = {
  FAN_SPEED: {
    title: '风速',
    columns: [
      {
        text: '1档风',
        key: 'FAN_SPEED_1',
      },
      {
        text: '2档风',
        key: 'FAN_SPEED_2',
      },
      {
        text: '3档风',
        key: 'FAN_SPEED_3',
      },
      {
        text: '4档风',
        key: 'FAN_SPEED_4',
      },
      {
        text: '5档风',
        key: 'FAN_SPEED_5',
      },
      {
        text: '6档风',
        key: 'FAN_SPEED_6',
      },
    ],
  },
  FAN_DELAY_OFF: {
    title: '风扇延时关',
    columns: [
      {
        text: '1小时',
        key: 'FAN_DELAY_OFF_1',
      },
      {
        text: '2小时',
        key: 'FAN_DELAY_OFF_2',
      },
      {
        text: '3小时',
        key: 'FAN_DELAY_OFF_3',
      },
      {
        text: '4小时',
        key: 'FAN_DELAY_OFF_4',
      },
      {
        text: '5小时',
        key: 'FAN_DELAY_OFF_5',
      },
      {
        text: '6小时',
        key: 'FAN_DELAY_OFF_6',
      },
      {
        text: '取消延时关',
        key: 'FAN_DELAY_OFF_CANCEL',
      },
    ],
  },
}
