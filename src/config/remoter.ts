// 搜寻蓝牙设备时的信号强度阈值(最小值)
export const MIN_RSSI = -75

// 搜寻超时时间
export const SEEK_TIMEOUT = 3000

/**
 * @description 设备交互数据配置，按设备类型区分
 * { deviceType: { deviceModel: { configDetail }}}
 */
export const deviceConfig: Record<string, Record<string, Remoter.ConfigItem>> = {
  '13': {
    '01': {
      deviceName: '吸顶灯',
      devicePic: '/assets/img/remoter/ceilLight.png',
      joystick: {
        up: {
          key: 'LIGHT_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'LIGHT_COLOR_TEMP_PLUS',
          icon: '/package-remoter/assets/light2.png',
          iconActive: '/package-remoter/assets/light0.png',
        },
        down: {
          key: 'LIGHT_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'LIGHT_COLOR_TEMP_MINUS',
          icon: '/package-remoter/assets/light1.png',
          iconActive: '/package-remoter/assets/light0.png',
        },
      },
      mList: [
        {
          key: 'LIGHT_SCENE_DAILY',
          icon: '/package-remoter/assets/scene01.png',
          iconActive: '/package-remoter/assets/scene00.png',
          name: '日常',
        },
        {
          key: 'LIGHT_SCENE_RELAX',
          icon: '/package-remoter/assets/scene11.png',
          iconActive: '/package-remoter/assets/scene10.png',
          name: '休闲',
        },
        {
          key: 'LIGHT_SCENE_DELAY_OFF',
          icon: '/package-remoter/assets/scene21.png',
          iconActive: '/package-remoter/assets/scene20.png',
          name: '延时关',
        },
        {
          key: 'LIGHT_SCENE_SLEEP',
          icon: '/package-remoter/assets/scene31.png',
          iconActive: '/package-remoter/assets/scene30.png',
          name: '助眠',
        },
      ],
      bList: [
        {
          key: 'LIGHT_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          key: 'LIGHT_NIGHT_LAMP',
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '小夜灯',
        },
      ],
    },
    '02': {
      deviceName: '风扇灯',
      devicePic: '/assets/img/remoter/fanLight.png',
      joystick: {
        up: {
          key: 'LIGHT_BRIGHT_PLUS',
          icon: '/package-remoter/assets/bright1.png',
          iconActive: '/package-remoter/assets/bright0.png',
        },
        right: {
          key: 'LIGHT_COLOR_TEMP_PLUS',
          icon: '/package-remoter/assets/light2.png',
          iconActive: '/package-remoter/assets/light0.png',
        },
        down: {
          key: 'LIGHT_BRIGHT_MINUS',
          icon: '/package-remoter/assets/bright3.png',
          iconActive: '/package-remoter/assets/bright2.png',
        },
        left: {
          key: 'LIGHT_COLOR_TEMP_MINUS',
          icon: '/package-remoter/assets/light1.png',
          iconActive: '/package-remoter/assets/light0.png',
        },
      },
      mList: [
        {
          icon: '/package-remoter/assets/scene41.png',
          iconActive: '/package-remoter/assets/scene40.png',
          name: '风速减',
        },
        {
          icon: '/package-remoter/assets/scene51.png',
          iconActive: '/package-remoter/assets/scene50.png',
          name: '风速加',
        },
        {
          icon: '/package-remoter/assets/scene61.png',
          iconActive: '/package-remoter/assets/scene60.png',
          name: '定时',
        },
        {
          icon: '/package-remoter/assets/scene71.png',
          iconActive: '/package-remoter/assets/scene70.png',
          name: '负离子',
        },
      ],
      bList: [
        {
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '照明',
        },
        {
          icon: '/package-remoter/assets/power1.png',
          iconActive: '/package-remoter/assets/power0.png',
          name: '风扇',
        },
      ],
    },
  },
  '26': {
    // MY-S5X28-Y5W，MY-S5X28-Y6W
    '01': {
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
      },
      mList: [
        {
          key: 'BATH_AUTO',
          icon: '/package-remoter/assets/scene81.png',
          iconActive: '/package-remoter/assets/scene80.png',
          name: '安心沐浴',
        },
        {
          key: 'BATH_AUTO',
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
    },
  },
}

// 控制指令
export const CMD: Record<string, number> = {
  // 吸顶灯
  LIGHT_LAMP_ON: 0x06, // 开灯
  LIGHT_LAMP_OFF: 0x07, // 关灯
  LIGHT_BRIGHT_PLUS_ACC: 0x0c, // 亮度+ 长按
  LIGHT_BRIGHT_MINUS_ACC: 0x0a, // 亮度- 长按
  LIGHT_COLOR_TEMP_PLUS_ACC: 0x05, // 色温+ 长按
  LIGHT_COLOR_TEMP_MINUS_ACC: 0x01, // 色温- 长按
  LIGHT_BRIGHT_PLUS: 0x2c, // 亮度+ 短按
  LIGHT_BRIGHT_MINUS: 0x2a, // 亮度- 短按
  LIGHT_COLOR_TEMP_PLUS: 0x25, // 色温+ 短按
  LIGHT_COLOR_TEMP_MINUS: 0x21, // 色温- 短按
  LIGHT_SCENE_DAILY: 0x19, // 日常
  LIGHT_SCENE_RELAX: 0x1a, // 休闲
  LIGHT_SCENE_DELAY_OFF: 0x1d, // 延时关
  LIGHT_SCENE_SLEEP: 0x1b, // 助眠
  LIGHT_NIGHT_LAMP: 0x1c, // 小夜灯

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
  BATH_BRIGHT_PLUS: 0x0c, // 亮度+，数字遥控独有
  BATH_BRIGHT_MINUS: 0x0a, // 亮度- 短按

  // 指令终止（松手时发送）
  END: 0x00,
}
