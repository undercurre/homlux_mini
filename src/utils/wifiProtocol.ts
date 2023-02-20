import { aesUtil, strUtil } from '../utils/index'

let instance: WifiSocket | null

export class WifiSocket {
  tcpClient: WechatMiniprogram.TCPSocket = wx.createTCPSocket()

  udpClient: WechatMiniprogram.UDPSocket = wx.createUDPSocket()

  SSID = ''

  key: string

  deviceInfo = {
    ip: '', // 默认为广播地址
    udpPort: 6266,
    tcpPort: 6466,
  }

  retryTimes = 3

  cmdCallbackMap: IAnyObject = {}

  onMessageHandlerList: ((data: IAnyObject) => void)[] = []

  constructor(params: { ssid: string }) {
    // 防止端口被占用，检查释放之前生成的实例
    if (instance) {
      instance.close()
    }

    this.SSID = params.ssid

    this.key = `homlux@midea${params.ssid.substr(-4, 4)}`

    this.initUdpSocket()

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this
  }

  async connect() {
    const res = await this.connectWifi()

    console.log(`connectWifi${this.SSID}`, res)

    const result = {
      success: true,
    }

    if (res.success) {
      await this.initGatewayInfo()
    } else {
      result.success = false
    }

    return result
  }

  connectWifi() {
    return new Promise<{ success: boolean }>((resolve) => {
      const res = { success: true }

      const listen = async (onWifiConnectRes: WechatMiniprogram.OnWifiConnectedCallbackResult) => {
        console.log('onWifiConnected', onWifiConnectRes)

        if (onWifiConnectRes.wifi.SSID === this.SSID) {
          wx.offWifiConnected(listen)
          resolve(res)
        }
      }
      wx.onWifiConnected(listen)

      wx.connectWifi({
        SSID: this.SSID,
        password: '12345678',
        partialInfo: false,
        complete: (connectRes) => {
          console.log('connectWifi', connectRes)

          if ((connectRes as IAnyObject).wifiMsg?.includes('already connected')) {
            wx.offWifiConnected(listen)
            resolve(res)
          }
        },
      })
    })
  }

  initTcpSocket() {
    return new Promise((resolve) => {
      this.tcpClient.onConnect((res) => {
        console.log('tcpClient.onConnect', res)
        resolve(res)
      })

      this.tcpClient.onBindWifi((res) => {
        console.log('tcpClient.onBindWifi', res)
      })

      this.tcpClient.connect({
        address: this.deviceInfo.ip,
        port: this.deviceInfo.tcpPort,
      })

      this.tcpClient.onMessage((res) => {
        console.log('tcpClient.onMessage', res)

        const reply = decodeCmd(res.message, this.key)
        console.log('reply', reply)

        const callback = this.cmdCallbackMap[reply.reqId]

        if (callback) {
          callback(reply.data)

          delete this.cmdCallbackMap[reply.reqId] // 删除已经执行的callback
        } else {
          this.onMessageHandlerList.map((handler) => handler(reply))
        }
      })

      this.tcpClient.onError((res) => {
        console.log('tcpClient.onError', res)
      })

      this.tcpClient.onClose((res) => {
        console.log('tcpClient.onClose', res)
      })
    })
  }

  initUdpSocket() {
    const port = this.udpClient.bind(6366)

    console.log('initUdpSocket', port)

    if (port === 0) {
      wx.showModal({
        content: '端口被占用，无法正常配网，请重启微信',
        showCancel: false,
      })

      return
    }

    this.udpClient.onMessage((res) => {
      console.log('udpClient.onMessage', res)

      const reply = decodeCmd(res.message, this.key)
      console.log('reply', reply)

      const callback = this.cmdCallbackMap[reply.reqId]

      if (callback) {
        callback(reply.data)

        delete this.cmdCallbackMap[reply.reqId] // 删除已经执行的callback
      } else {
        this.onMessageHandlerList.map((handler) => handler(reply))
      }
    })

    this.udpClient.onError((res) => {
      console.log('udpClient.onError', res)
    })

    this.udpClient.onClose(() => {
      console.log('udpClient.onClose')
    })
  }

  async sendCmdForDeviceIp() {
    const res = await this.sendCmd({
      topic: '/gateway/net/serverip', //指令名称:获取网关IP
      data: {},
      method: 'UDP',
    })

    console.log('initGatewayInfo', res)

    if (res.errorCode === 0) {
      this.deviceInfo.ip = res.ip
    }
  }

  getDeviceIp() {
    return new Promise((resolve) => {
      const interId = setInterval(() => {
        if (this.deviceInfo.ip) {
          clearInterval(interId)
          resolve(true)
        }

        this.sendCmdForDeviceIp()
      }, 2000)
    })
  }
  /**
   * 通过广播更新网关IP地址并与网关建立tcp连接
   */
  async initGatewayInfo() {
    await this.getDeviceIp()

    await this.initTcpSocket()
  }

  /**
   * 发送udp/tcp指令
   * @param params
   */
  sendCmd(params: { topic: string; data: IAnyObject; method?: 'TCP' | 'UDP' }) {
    params.method = params.method || 'TCP'

    if (params.method === 'TCP' && !this.deviceInfo.ip) {
      console.error('TCP通讯请先调用updateGatewayInfo，获取网关局域网IP')
      return { errorCode: -1 } as IAnyObject
    }

    return new Promise<{ errorCode: number } & IAnyObject>((resolve) => {
      const reqId = Date.now().toString()

      const msgData = {
        reqId,
        topic: params.topic, //指令名称:获取网关IP
        data: params.data,
      }

      console.log(`${params.method}-send:`, msgData)

      const message = aesUtil.encrypt(JSON.stringify(msgData), this.key)
      const sendMsg = strUtil.hexStringToArrayBuffer(message)

      // 由于设备端是异步上报对应的消息回复，通过reqId注册对应命令的消息回调，
      // 后续在消息监听onmessage通过reqId匹配并把对应的回复resolve，达到同步调用的效果
      this.cmdCallbackMap[reqId] = (data: { errorCode: number } & IAnyObject) => {
        console.log(`${params.method}-res:`, params.topic, data)

        resolve(data)
      }

      params.method === 'TCP'
        ? this.tcpClient.write(sendMsg)
        : this.udpClient.send({
            address: '255.255.255.255',
            port: this.deviceInfo.udpPort,
            message: sendMsg,
          })
    })
  }

  /**
   * 释放相关资源
   */
  close() {
    this.cmdCallbackMap = {}
    this.onMessageHandlerList = []
    this.tcpClient?.close()
    this.udpClient?.close()
    instance = null
  }

  /**
   * 监听udp广播
   * @param handler
   */
  onMessage(handler: (data: IAnyObject) => void) {
    if (handler) {
      this.onMessageHandlerList.push(handler)
    }
  }
}

function decodeCmd(message: ArrayBuffer, key: string) {
  const msg = strUtil.ab2hex(message)

  const reply = aesUtil.decrypt(msg, key)

  return JSON.parse(reply) as { topic: string; reqId: string; data: IAnyObject }
}
