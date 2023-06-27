import { aesUtil, delay, strUtil, Logger, isAndroid } from './index'

// 定义了与BLE通路相关的所有事件/动作/命令的集合；其值域及表示意义为：对HOMLUX设备主控与app之间可能的各种操作的概括分类
const CmdTypeMap = {
  DEVICE_CONTROL: 0x00, // 控制
  DEVICE_INFO_QUREY: 0x01, // 查询
} as const

// type CmdType = typeof CmdTypeMap

// /**
//  * 根据值获取对应的控制类型名称
//  * @param value
//  */
// function getCmdTypeName(value: CmdType[keyof CmdType]) {
//   return Object.entries(CmdTypeMap).find((item) => item[1] === value)![0]
// }

// 控制类子类型枚举
// CTL_CONFIG_ZIGBEE_NET				= 0x00,		//开启ZigBee配网模式
// CTL_DEVICE_ONOFF_ON	 			= 0x01,		//控制设备开关开
// CTL_DEVICE_ONOFF_OFF	 			= 0x02,		//控制设备开关关
// CTL_LIGHT_LEVEL	 					= 0x03,		//控制灯光亮度
// CTL_LIGHT_COLOR	 				= 0x04,		//控制灯光色温
const ControlSubType = {
  haveTry: [0x05],
  CTL_CONFIG_ZIGBEE_NET: [0x00, 0x00, 0x00, 0x00],
  QUERY_ZIGBEE_STATE: [0x01],
  QUREY_ONOFF_STATUS: [0x02],
  QUREY_LIGHT_STATUS: [0x03],
} as const

export class BleClient {
  mac: string
  key = ''

  isConnected = false // 是否正在连接

  deviceUuid: string
  serviceId = 'BAE55B96-7D19-458D-970C-50613D801BC9'
  characteristicId = '' // 灯具和面板的uid不一致，同类设备的uid是一样的
  msgId = 0

  constructor(params: { mac: string; deviceUuid: string }) {
    const { mac, deviceUuid } = params

    this.mac = mac
    this.deviceUuid = deviceUuid
    // 密钥为：midea@homlux0167   (0167为该设备MAC地址后四位
    this.key = `midea@homlux${mac.substr(-4, 4)}`

    const listener = (res: WechatMiniprogram.OnBLECharacteristicValueChangeCallbackResult) => {
      if (res.deviceId !== this.deviceUuid) {
        return
      }

      const hex = strUtil.ab2hex(res.value)
      let msg = aesUtil.decrypt(hex, this.key, 'Hex')

      // const resMsgId = parseInt(msg.substr(2, 2), 16) // 收到回复的指令msgId
      const packLen = parseInt(msg.substr(4, 2), 16) // 回复消息的Byte Msg Id到Byte Checksum的总长度，单位byte

      // Cmd Type	   Msg Id	   Package Len	   Parameter(s) 	Checksum
      // 1 byte	     1 byte	   1 byte	          N  bytes	    1 byte
      // 仅截取消息参数部分数据，
      msg = msg.substr(6, (packLen - 3) * 2)
    }

    wx.onBLECharacteristicValueChange(listener)
  }

  async connect() {
    const date1 = Date.now()

    Logger.log(`【${this.mac}】开始连接蓝牙`, this.deviceUuid)

    // 会出现createBLEConnection一直没返回的情况（低概率）
    // 微信bug，安卓端timeout参数无效
    const connectRes = await wx
      .createBLEConnection({
        deviceId: this.deviceUuid, // 搜索到设备的 deviceId
        timeout: 8000,
      })
      .catch((err: WechatMiniprogram.BluetoothError) => err)

    Logger.log(`【${this.mac}】 connect`, this.deviceUuid, connectRes, `连接蓝牙时间： ${Date.now() - date1}ms`)

    // 判断是否连接蓝牙，0为连接成功，-1为已经连接
    // 避免-1的情况，因为安卓如果重复调用 wx.createBLEConnection 创建连接，有可能导致系统持有同一设备多个连接的实例，导致调用 closeBLEConnection 的时候并不能真正的断开与设备的连接。占用蓝牙资源
    if (connectRes.errCode !== 0 && connectRes.errCode !== -1) {
      throw {
        code: -1,
        error: connectRes,
      }
    }

    this.isConnected = true

    // 存在蓝牙信号较差的情况，连接蓝牙设备后会中途断开的情况，需要做对应异常处理，超时处理
    const initRes = await Promise.race([
      this.initBleService(),
      delay(3000).then(() => ({ success: false, error: '获取蓝牙服务信息超时' })),
    ])

    Logger.log(`【${this.mac}]initRes`, initRes)
    if (!initRes.success) {
      await this.close() // 释放已连接的蓝牙资源
      throw {
        ...initRes,
        code: -1,
      }
    }

    return {
      code: 0,
      error: connectRes,
    }
  }

  async initBleService() {
    try {
      // 连接后蓝牙突然断开，下面的接口会无返回也不会报错，需要超时处理
      // 连接成功，获取服务,IOS无法跳过该接口，否则后续接口会报100004，找不到服务

      if (!isAndroid()) {
        const bleServiceRes = await wx
          .getBLEDeviceServices({
            deviceId: this.deviceUuid,
          })
          .catch((err) => {
            throw err
          })

        Logger.log(`【${this.mac}】bleServiceRes`, bleServiceRes)
      }

      // IOS无法跳过该接口，否则后续接口会报10005	no characteristic	没有找到指定特征
      const characRes = await wx
        .getBLEDeviceCharacteristics({
          deviceId: this.deviceUuid,
          serviceId: this.serviceId,
        })
        .catch((err) => {
          throw err
        })

      // 取第一个属性（固定，为可写可读可监听），不同品类的子设备的characteristicId不一样，同类的一样
      const characteristicId = characRes.characteristics[0].uuid
      this.characteristicId = characteristicId
      Logger.log(`【${this.mac}】characRes`, characRes)

      await wx
        .notifyBLECharacteristicValueChange({
          deviceId: this.deviceUuid,
          serviceId: this.serviceId,
          characteristicId: this.characteristicId,
          state: true,
          type: 'notification',
        })
        .catch((err) => {
          throw err
        })

      // 收到延迟，安卓平台上，在调用 wx.notifyBLECharacteristicValueChange 成功后立即调用本接口，在部分机型上会发生 10008 系统错误
      if (isAndroid()) {
        await delay(500)
      }

      return {
        success: true,
      }
    } catch (err) {
      Logger.error(`【${this.mac}】`, err)

      return {
        success: false,
        error: err,
      }
    }
  }

  async close() {
    if (!this.isConnected) {
      return
    }
    Logger.log(`【${this.mac}】${this.deviceUuid}开始关闭蓝牙连接`)
    this.isConnected = false
    const res = await wx.closeBLEConnection({ deviceId: this.deviceUuid }).catch((err) => err)

    Logger.log(`【${this.mac}】closeBLEConnection`, res)
  }

  async sendCmd(params: { cmdType: keyof typeof CmdTypeMap; subType: keyof typeof ControlSubType }) {
    try {
      if (!this.isConnected) {
        const connectRes = await this.connect()

        Logger.log(`【${this.mac}】connect`, connectRes)
        if (connectRes.code === -1) {
          throw connectRes
        }
      }

      const { cmdType, subType } = params

      Logger.log(`【${this.mac}】蓝牙指令发起，cmdType： ${params.cmdType}--${params.subType}`)

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

      const begin = Date.now()

      let timeId = 0

      let listener = (res: WechatMiniprogram.OnBLECharacteristicValueChangeCallbackResult) => {
        Logger.log(`listener-res`, res)
      }

      return new Promise<{ code: string; success: boolean; cmdType?: string; subCmdType?: string; resMsg: string }>(
        (resolve, reject) => {
          // 超时处理
          timeId = setTimeout(() => {
            resolve({ code: '-1', success: false, resMsg: '蓝牙指令回复超时', cmdType: cmdType, subCmdType: subType })
          }, 6000)

          listener = (res: WechatMiniprogram.OnBLECharacteristicValueChangeCallbackResult) => {
            if (res.deviceId !== this.deviceUuid) {
              return
            }

            const hex = strUtil.ab2hex(res.value)
            const msg = aesUtil.decrypt(hex, this.key, 'Hex')

            const resMsgId = parseInt(msg.substr(2, 2), 16) // 收到回复的指令msgId
            const packLen = parseInt(msg.substr(4, 2), 16) // 回复消息的Byte Msg Id到Byte Checksum的总长度，单位byte

            // Cmd Type	   Msg Id	   Package Len	   Parameter(s) 	Checksum
            // 1 byte	     1 byte	   1 byte	          N  bytes	    1 byte
            if (resMsgId !== msgId) {
              return
            }

            // 仅截取消息参数部分数据，
            const resMsg = msg.substr(6, (packLen - 3) * 2)

            resolve({
              code: '0',
              resMsg: resMsg.substr(2),
              success: true,
              cmdType: cmdType,
              subCmdType: subType,
            })
          }

          wx.onBLECharacteristicValueChange(listener)

          wx.writeBLECharacteristicValue({
            deviceId: this.deviceUuid,
            serviceId: this.serviceId,
            characteristicId: this.characteristicId,
            value: buffer,
          })
            .then((res) => {
              Logger.log(`【${this.mac}】writeBLECharacteristicValue`, res)
            })
            .catch((err) => {
              Logger.error(`【${this.mac}】writeBLECharacteristicValue-err`, err)
              reject(err)
            })
        },
      )
        .then((res) => {
          Logger.log(`【${this.mac}】 蓝牙指令回复时间： ${Date.now() - begin}ms`, cmdType, subType)

          return res
        })
        .catch(async (err) => {
          Logger.error(`【${this.mac}】sendCmd-err`, err)

          await this.close() // 异常关闭需要主动配合关闭连接closeBLEConnection，否则资源会被占用无法释放，导致无法连接蓝牙设备

          return {
            code: -1,
            success: false,
            error: err,
            resMsg: '',
          }
        })
        .finally(() => {
          wx.offBLECharacteristicValueChange(listener)

          clearTimeout(timeId)
        })
    } catch (err) {
      Logger.error(`【${this.mac}】sendCmd-err`, err)
      await this.close() // 异常关闭需要主动配合关闭连接closeBLEConnection，否则资源会被占用无法释放，导致无法连接蓝牙设备
      return {
        code: -1,
        success: false,
        error: err,
        resMsg: '',
      }
    }
  }

  async startZigbeeNet() {
    const res = await this.sendCmd({ cmdType: 'DEVICE_CONTROL', subType: 'CTL_CONFIG_ZIGBEE_NET' })

    let zigbeeMac = ''

    if (res.success) {
      const macStr = res.resMsg.substr(2)
      let arr = []

      for (let i = 0; i < macStr.length; i = i + 2) {
        arr.push(macStr.substr(i, 2).toUpperCase())
      }

      arr = arr.reverse()
      zigbeeMac = arr.join('')
    }

    const result = {
      ...res,
      result: {
        zigbeeMac,
      },
    }

    Logger.log(`【${this.mac}】startZigbeeNet`, result)

    return result
  }

  /**
   * 闪烁指令
   */
  async flash() {
    const res = await this.sendCmd({ cmdType: 'DEVICE_CONTROL', subType: 'haveTry' })

    Logger.log(`【${this.mac}】flash`, res)

    return res
  }

  /**
   * 查询ZigBee网关连接状态
   */
  async getZigbeeState() {
    const res = await this.sendCmd({ cmdType: 'DEVICE_INFO_QUREY', subType: 'QUERY_ZIGBEE_STATE' })

    let isConfig = ''

    if (res.success) {
      isConfig = res.resMsg
    }

    const result = {
      ...res,
      result: {
        isConfig,
      },
    }

    Logger.log(`【${this.mac}】getZigbeeState`, result)

    return result
  }

  /**
   * 查询灯光状态
   */
  async getLightState() {
    const res = await this.sendCmd({ cmdType: 'DEVICE_INFO_QUREY', subType: 'QUREY_LIGHT_STATUS' })

    Logger.log(`【${this.mac}】getLightState`, res)

    return {
      ...res,
      result: {},
    }
  }
}

export const bleUtil = {
  transferBroadcastData(advertisData: ArrayBuffer) {
    const msgStr = strUtil.ab2hex(advertisData)
    const macStr = msgStr.substr(6, 16)

    let arr = []

    for (let i = 0; i < macStr.length; i = i + 2) {
      arr.push(macStr.substr(i, 2).toUpperCase())
    }

    arr = arr.reverse()

    const zigbeeMac = arr.join('')

    return {
      brand: msgStr.substr(0, 4),
      isConfig: msgStr.substr(4, 2),
      mac: zigbeeMac.substr(0, 6) + zigbeeMac.substr(-6, 6),
      zigbeeMac,
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

// todo: 测试代码，可删除
wx.onBLEConnectionStateChange(function (res) {
  // 该方法回调中可以用于处理连接意外断开等异常情况
  if (!res.connected) {
    Logger.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
  }

  setTimeout(() => {
    wx.getConnectedBluetoothDevices({
      services: [],
      success(res) {
        Logger.log('getConnectedBluetoothDevices', res)
      },
    })
  }, 500)
})
