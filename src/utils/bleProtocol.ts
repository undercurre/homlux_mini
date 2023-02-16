import { aesUtil, strUtil } from './index'

wx.getConnectedBluetoothDevices({
  services: ['BAE55B96-7D19-458D-970C-50613D801BC9'],
  success: function (res) {
    console.log('getConnectedBluetoothDevices', res)
  },
})

// 定义了与BLE通路相关的所有事件/动作/命令的集合；其值域及表示意义为：对HOMLUX设备主控与app之间可能的各种操作的概括分类
const CmdTypeMap = {
  control: 0x00, // 控制
  query: 0x01, // 查询
} as const

// 控制类子类型枚举
// CTL_CONFIG_ZIGBEE_NET				= 0x00,		//开启ZigBee配网模式
// CTL_DEVICE_ONOFF_ON	 			= 0x01,		//控制设备开关开
// CTL_DEVICE_ONOFF_OFF	 			= 0x02,		//控制设备开关关
// CTL_LIGHT_LEVEL	 					= 0x03,		//控制灯光亮度
// CTL_LIGHT_COLOR	 				= 0x04,		//控制灯光色温
const ControlSubType = {
  haveTry: [0x05],
  CTL_CONFIG_ZIGBEE_NET: [0x00, 0x00, 0x00, 0x00],
} as const

export class BleClient {
  mac: string
  key = ''

  deviceUuid: string
  serviceId = 'BAE55B96-7D19-458D-970C-50613D801BC9'
  characteristicId = ''
  msgId = 0

  constructor(params: { mac: string; deviceUuid: string }) {
    const { mac, deviceUuid } = params

    this.mac = mac
    this.deviceUuid = deviceUuid
    // 密钥为：midea@homlux0167   (0167为该设备MAC地址后四位
    this.key = `midea@homlux${mac.substr(-4, 4)}`
  }

  async connect() {
    const date1 = Date.now()

    const connectRes = await wx
      .createBLEConnection({
        deviceId: this.deviceUuid, // 搜索到设备的 deviceId
      })
      .catch((err) => console.log('connectRes-err', err))

    console.log('connectRes', connectRes, Date.now() - date1)

    // 连接成功，获取服务
    // const bleServiceRes = await wx.getBLEDeviceServices({
    //   deviceId,
    // })

    // console.log('bleServiceRes', bleServiceRes)

    const characRes = await wx.getBLEDeviceCharacteristics({
      deviceId: this.deviceUuid,
      serviceId: this.serviceId,
    })

    const characteristicId = characRes.characteristics[0].uuid
    this.characteristicId = characteristicId

    const notifyRes = await wx.notifyBLECharacteristicValueChange({
      deviceId: this.deviceUuid,
      serviceId: this.serviceId,
      characteristicId,
      state: true,
      type: 'notification',
    })

    console.log('notifyRes', notifyRes)
  }

  async sendCmd(params: { cmdType: keyof typeof CmdTypeMap; subType: keyof typeof ControlSubType }) {
    await this.connect()

    const { cmdType, subType } = params
    const msgId = ++this.msgId // 等待回复的指令msgId
    // Cmd Type	   Msg Id	   Package Len	   Parameter(s) 	Checksum
    // 1 byte	     1 byte	   1 byte	          N  bytes	    1 byte
    const cmdArr = [CmdTypeMap[cmdType], msgId, 0x00]

    cmdArr.push(...ControlSubType[subType])

    cmdArr[2] = cmdArr.length

    cmdArr.push(bleUtil.getCheckNum(cmdArr))

    const hexArr = cmdArr.map((item) => item.toString(16).padStart(2, '0').toUpperCase())

    const msg = aesUtil.encrypt(hexArr.join(''), this.key, 'Hex')

    const buffer = strUtil.hexStringToArrayBuffer(msg)

    return new Promise<IAnyObject>((resolve) => {
      const listener = (res: WechatMiniprogram.OnBLECharacteristicValueChangeCallbackResult) => {
        console.log(`onBLECharacteristicValueChange ${res.characteristicId} has changed, now is ${res.value}`, res)
        if (res.deviceId !== this.deviceUuid) {
          return
        }

        const hex = strUtil.ab2hex(res.value)
        let msg = aesUtil.decrypt(hex, this.key, 'Hex')

        console.log('onBLECharacteristicValueChange-msg', msg)
        const resMsgId = parseInt(msg.substr(2, 2), 16) // 收到回复的指令msgId
        const packLen = parseInt(msg.substr(4, 2), 16) // 回复消息的Byte Msg Id到Byte Checksum的总长度，单位byte

        // Cmd Type	   Msg Id	   Package Len	   Parameter(s) 	Checksum
        // 1 byte	     1 byte	   1 byte	          N  bytes	    1 byte
        console.log('msgId', msgId, 'resMsgId', resMsgId)
        if (resMsgId !== msgId) {
          return
        }

        // 仅截取消息参数部分数据，
        msg = msg.substr(6, (packLen - 3) * 2)
        console.log('data-res', msg)
        wx.offBLECharacteristicValueChange(listener)
        resolve({
          code: msg.substr(2, 2),
          cmdType: msg.substr(0, 2),
        })
        console.log('resolve')
      }

      wx.onBLECharacteristicValueChange(listener)

      const wirteRes = wx.writeBLECharacteristicValue({
        deviceId: this.deviceUuid,
        serviceId: this.serviceId,
        characteristicId: this.characteristicId,
        value: buffer,
        success: () => {
          console.log('wirteRes', wirteRes)
        },
      })
    })
  }
}

export const bleUtil = {
  transferBroadcastData(msgStr: string) {
    const macStr = msgStr.substr(6, 12)
    let arr = []

    for (let i = 0; i < macStr.length; i = i + 2) {
      arr.push(macStr.substr(i, 2).toUpperCase())
    }

    arr = arr.reverse()

    return {
      brand: msgStr.substr(0, 4),
      isConfig: msgStr.substr(4, 2),
      mac: arr.join(''),
      deviceCategory: msgStr.substr(18, 2),
      deviceModel: msgStr.substr(20, 2),
      version: msgStr.substr(22, 2),
      protocolVersion: msgStr.substr(24, 2),
    }
  },

  getCheckNum(msgArr: Array<number>) {
    let sum = 0

    for (let i = 0; i < msgArr.length; i++) {
      sum += msgArr[i]
    }

    const temp = sum.toString(2).padStart(8, '0')

    sum = parseInt(this.exchange(temp), 2)
    sum += 1

    return sum
  },

  exchange(str: string) {
    const arr = str.split('')
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === '0') {
        arr[i] = '1'
      } else {
        arr[i] = '0'
      }
    }
    str = arr.join('')
    return str
  },
}
