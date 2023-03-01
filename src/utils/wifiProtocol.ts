import { aesUtil, strUtil } from '../utils/index'

let instance: WifiSocket | null

const deviceInfo = wx.getDeviceInfo()

export class WifiSocket {
  tcpClient: WechatMiniprogram.TCPSocket = wx.createTCPSocket()

  udpClient: WechatMiniprogram.UDPSocket = wx.createUDPSocket()

  SSID = ''

  key = ''

  date = Date.now()

  deviceInfo = {
    ip: '192.168.11.1', // 网关默认的ip为192.168.11.1
    udpPort: 6266,
    tcpPort: 6466,
    isConnectTcp: false,
  }

  retryTimes = 3

  cmdCallbackMap: IAnyObject = {}

  onMessageHandlerList: ((data: IAnyObject) => void)[] = []

  constructor(params: { ssid: string }) {
    if (instance && instance.SSID === params.ssid) {
      return instance
    }
    // 防止端口被占用，检查释放之前生成的实例
    if (instance) {
      instance.close()
    }

    this.SSID = params.ssid

    this.date = Date.now()

    this.key = `homlux@midea${params.ssid.substr(-4, 4)}`

    this.initUdpSocket()

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    instance = this
  }

  async connect() {
    const now = Date.now()

    const res = await this.connectWifi()

    console.log(`连接wifi:${this.SSID}时长：`, Date.now() - now)

    const result = {
      errCode: res.errCode,
      success: res.success,
    }

    if (res.success && !this.deviceInfo.isConnectTcp) {
      const initRes = await this.initGatewayInfo()

      result.success = initRes.success
      result.errCode = initRes.errCode
    }

    return result
  }

  connectWifi() {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<{ errCode: number; success: boolean; msg?: string }>(async (resolve) => {
      const res = { success: true, errCode: 0 }

      const connectedRes = await wx.getConnectedWifi().catch((err) => console.log('getConnectedWifi-err', err))

      console.log('connectedRes', connectedRes)

      if (connectedRes && connectedRes.wifi?.SSID === this.SSID) {
        console.log(`${this.SSID}已连接`)
        resolve(res)
        return
      }

      // 连接热点超时回调
      const timeId = setTimeout(() => {
        console.log('连接热点超时', new Date(this.date))
        resolve({ success: false, errCode: -1 })
      }, 120000)

      const listen = async (onWifiConnectRes: WechatMiniprogram.OnWifiConnectedCallbackResult) => {
        console.log('onWifiConnected-wifiProt', onWifiConnectRes)

        if (onWifiConnectRes.wifi.SSID === this.SSID) {
          wx.offWifiConnected(listen)

          clearTimeout(timeId)
          resolve(res)
        }
      }
      wx.onWifiConnected(listen)

      wx.connectWifi({
        SSID: this.SSID,
        password: '12345678',
        partialInfo: false,
        maunal: deviceInfo.system.includes('Android 10'), // Android 微信客户端 7.0.22 以上版本，connectWifi 的实现在 Android 10 及以上的手机无法生效，需要配置 maunal 来连接 wifi。详情参考官方文档
        complete: (connectRes) => {
          console.log('connectWifi', connectRes)

          // todo: 前面已做wifi已连接判断，该判断逻辑可删除
          if ((connectRes as IAnyObject).wifiMsg?.includes('already connected') || (connectRes as IAnyObject).wifi) {
            wx.offWifiConnected(listen)
            clearTimeout(timeId)
            resolve(res)
          } else if (connectRes.errCode === 12007) {
            wx.offWifiConnected(listen)
            clearTimeout(timeId)
            resolve({
              errCode: connectRes.errCode,
              success: false,
              msg: '用户拒绝授权链接 Wi-Fi',
            })
          }
        },
      })
    })
  }

  initTcpSocket() {
    return new Promise((resolve) => {
      this.tcpClient.onConnect((res) => {
        console.log('tcpClient.onConnect', res)
        this.deviceInfo.isConnectTcp = true
        resolve(res)
      })

      this.tcpClient.onBindWifi((res) => {
        console.log('tcpClient.onBindWifi', res)
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
        console.log('tcpClient.onError', res, res.errMsg.includes('close'))
        if (res.errMsg.includes('closed')) {
          this.deviceInfo.isConnectTcp = false
          this.tcpClient.close()
        }
      })

      this.tcpClient.onClose((res) => {
        console.log('tcpClient.onClose', res)
      })

      this.tcpClient.connect({
        address: this.deviceInfo.ip,
        port: this.deviceInfo.tcpPort,
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

    this.udpClient.onClose((res) => {
      console.log('udpClient.onClose', res)
    })
  }

  async sendCmdForDeviceIp() {
    const res = await this.sendCmd({
      topic: '/gateway/net/serverip', //指令名称:获取网关IP
      data: {},
      method: 'UDP',
    })

    if (res.errorCode === 0) {
      this.deviceInfo.ip = res.ip
    }
  }

  getDeviceIp() {
    let times = 3 // 最多请求3次

    return new Promise<boolean>((resolve) => {
      if (this.deviceInfo.ip) {
        resolve(true)

        return
      }

      const interId = setInterval(() => {
        if (times <= 0) {
          clearInterval(interId)
          resolve(false)

          return
        }
        if (this.deviceInfo.ip) {
          clearInterval(interId)
          resolve(true)

          return
        }

        times--
        this.sendCmdForDeviceIp()
      }, 5000)
    })
  }
  /**
   * 通过广播更新网关IP地址并与网关建立tcp连接
   */
  async initGatewayInfo() {
    // const res = await this.getDeviceIp()

    // if (res) {
    await this.initTcpSocket()
    // }

    return {
      errCode: 0,
      success: true,
    }
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
