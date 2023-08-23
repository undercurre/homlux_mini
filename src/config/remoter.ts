/**
 * 设备交互数据配置，按设备类型区分
 */
export const deviceConfig: IAnyObject = {
  ceilLight: {
    deviceName: '吸顶灯',
    joystick: {
      up: {
        key: 'brightIncrease',
        icon: '/package-remoter/assets/bright1.png',
        iconActive: '/package-remoter/assets/bright0.png',
      },
      right: {
        icon: '/package-remoter/assets/light2.png',
        iconActive: '/package-remoter/assets/light0.png',
      },
      down: {
        icon: '/package-remoter/assets/bright3.png',
        iconActive: '/package-remoter/assets/bright2.png',
      },
      left: {
        icon: '/package-remoter/assets/light1.png',
        iconActive: '/package-remoter/assets/light0.png',
      },
    },
    mList: [
      {
        icon: '/package-remoter/assets/scene01.png',
        iconActive: '/package-remoter/assets/scene00.png',
        name: '日常',
      },
      {
        icon: '/package-remoter/assets/scene11.png',
        iconActive: '/package-remoter/assets/scene10.png',
        name: '休闲',
      },
      {
        icon: '/package-remoter/assets/scene21.png',
        iconActive: '/package-remoter/assets/scene20.png',
        name: '延时关',
      },
      {
        icon: '/package-remoter/assets/scene31.png',
        iconActive: '/package-remoter/assets/scene30.png',
        name: '助眠',
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
        name: '小夜灯',
      },
    ],
  },
  fanLight: {
    deviceName: '风扇灯',
    joystick: {
      up: {
        key: 'brightIncrease',
        icon: '/package-remoter/assets/bright1.png',
        iconActive: '/package-remoter/assets/bright0.png',
      },
      right: {
        icon: '/package-remoter/assets/light2.png',
        iconActive: '/package-remoter/assets/light0.png',
      },
      down: {
        icon: '/package-remoter/assets/bright3.png',
        iconActive: '/package-remoter/assets/bright2.png',
      },
      left: {
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
}

/**
 * 设备SN8->类型映射
 */
export const mfIdToType: Record<string, string> = {
  CA0A: 'ceilLight', // TODO 删除
  '4D11': 'ceilLight', // 吸顶灯
  '4D12': 'fanLight', // 风扇灯，TODO 预留
  '4D26': 'fanLight', // 浴霸，TODO 预留
}
