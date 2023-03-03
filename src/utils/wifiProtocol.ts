import { aesUtil, strUtil } from '../utils/index'

let _instance: WifiSocket | null = null

const deviceInfo = wx.getDeviceInfo()

export class WifiSocket {
  tcpClient: WechatMiniprogram.TCPSocket = wx.createTCPSocket()

  udpClient: WechatMiniprogram.UDPSocket = wx.createUDPSocket()

  SSID = ''

  key = ''

  date = Date.now()

  deviceInfo = {
    ip: '', // 网关默认的ip为192.168.11.1
    udpPort: 6266,
    isConnectingUdp: false, // 是否正在连接udp
    tcpPort: 6466,
  }

  cmdCallbackMap: IAnyObject = {}

  onMessageHandlerList: ((data: IAnyObject) => void)[] = []

  constructor(params: { ssid: string }) {
    if (_instance && _instance.SSID === params.ssid) {
      console.log('实例重用')
      return _instance
    }
    // 防止端口被占用，检查释放之前生成的实例
    if (_instance) {
      _instance.close()
    }

    this.SSID = params.ssid

    this.date = Date.now()

    this.key = `homlux@midea${params.ssid.substr(-4, 4)}`

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    _instance = this
  }

  async connect() {
    const now = Date.now()

    const res = await this.connectWifi()

    console.log(`连接${this.SSID}时长：`, Date.now() - now, res)

    if (!res.success) {
      return res
    }

    const port = this.initUdpSocket()

    console.log(`initUdpSocket时长：`, Date.now() - now)

    if (port === 0) {
      return { errCode: -1, success: false, msg: 'UDP初始化失败' }
    }

    const ipRes = await this.getDeviceIp()

    console.log(`getDeviceIp`, Date.now() - now)

    if (!ipRes.success) {
      return { errCode: -1, success: false, msg: '获取IP失败' }
    }

    this.initTcpSocket()

    console.log(`initTcpSocket`, Date.now() - now)

    return res
  }

  connectWifi() {
    return new Promise<{ errCode: number; success: boolean; msg?: string }>((resolve) => {
      const res = { success: true, errCode: 0 }

      wx.getConnectedWifi({
        complete: (connectedRes) => {
          console.log('getConnectedWifi：complete', connectedRes)

          if (connectedRes && (connectedRes as IAnyObject).wifi?.SSID === this.SSID) {
            console.log(`${this.SSID}已连接`)
            resolve(res)
            return
          }

          const systemVersion = parseInt(deviceInfo.system.toLowerCase().replace(deviceInfo.platform, ''))
          console.log('systemVersion', deviceInfo.platform, systemVersion)

          wx.connectWifi({
            SSID: this.SSID,
            password: '12345678',
            partialInfo: false,
            maunal: deviceInfo.platform === 'android' && systemVersion >= 10, // Android 微信客户端 7.0.22 以上版本，connectWifi 的实现在 Android 10 及以上的手机无法生效，需要配置 maunal 来连接 wifi。详情参考官方文档
            complete: (connectRes) => {
              console.log('connectWifi', connectRes)

              if (connectRes.errCode === 12007) {
                resolve({
                  errCode: connectRes.errCode,
                  success: false,
                  msg: '用户拒绝授权链接 Wi-Fi',
                })

                return
              }

              const listen = (onWifiConnectRes: WechatMiniprogram.OnWifiConnectedCallbackResult) => {
                console.log('onWifiConnected-wifiProt', onWifiConnectRes)

                if (onWifiConnectRes.wifi.SSID === this.SSID) {
                  console.log('offWifiConnected')
                  wx.offWifiConnected(listen)

                  clearTimeout(timeId)
                  resolve(res)
                }
              }

              // 连接热点超时回调
              const timeId = setTimeout(() => {
                console.log('连接热点超时', new Date(this.date))
                wx.offWifiConnected(listen)
                resolve({ success: false, errCode: -1 })
              }, 90000)

              wx.onWifiConnected(listen)
            },
          })
        },
      })
    })
  }

  bindUdp() {
    console.log('bindUdp')
    if (this.deviceInfo.isConnectingUdp) {
      return
    }

    this.deviceInfo.isConnectingUdp = true
    const port = _instance?.udpClient.bind(6366)

    console.log('port', port)

    if (port === 0) {
      wx.showModal({
        content: '端口被占用，无法正常配网，请重启微信',
        showCancel: false,
      })
    }

    return port
  }

  closeUdp() {
    console.log('closeUdp')
    _instance?.udpClient.close()
  }

  initTcpSocket() {
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

      this.tcpClient.close() // 每次发送完数据，网关都会主动断开TCP连接，app需要配合释放对应tcp资源，否则会影响下一次的连接
    })

    this.tcpClient.onError((res) => {
      console.log('tcpClient.onError', res)
      if (res.errMsg.includes('closed')) {
        this.tcpClient.close()
      }
    })

    this.tcpClient.onClose((res) => {
      console.log('tcpClient.onClose', res)
    })
  }

  initUdpSocket() {
    const port = this.bindUdp()

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
      this.deviceInfo.isConnectingUdp = false
    })

    wx.onAppHide(this.closeUdp)

    wx.onAppShow(this.bindUdp)

    return port
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
    return new Promise<{ success: boolean }>((resolve) => {
      if (this.deviceInfo.ip) {
        resolve({ success: true })

        return
      }

      this.sendCmdForDeviceIp().then(() => {
        resolve({ success: Boolean(this.deviceInfo.ip) })
      })
    })
  }

  // 创建
  connectTcp() {
    return new Promise<{ success: boolean }>((resolve) => {
      const start = Date.now()

      const listen = (res: WechatMiniprogram.GeneralCallbackResult) => {
        console.log('tcpClient.onConnect', res)
        console.debug('TCP连接时间：', Date.now() - start)

        resolve({ success: true })
        this.tcpClient.offConnect(listen)
      }

      this.tcpClient.onConnect(listen)

      this.tcpClient.connect({
        address: this.deviceInfo.ip,
        port: this.deviceInfo.tcpPort,
      })
    })
  }

  /**
   * 发送udp/tcp指令
   * @param params
   */
  async sendCmd(params: { topic: string; data: IAnyObject; method?: 'TCP' | 'UDP' }) {
    params.method = params.method || 'TCP'

    if (params.method === 'TCP') {
      await this.connectTcp()
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

      // 超时回复处理
      const timeId = setTimeout(() => {
        console.log(`${params.method}-超时回复:`, params.topic)
        this.cmdCallbackMap[reqId] && delete this.cmdCallbackMap[reqId]
        console.debug('指令发送-回复时间：', Date.now() - parseInt(reqId))
        resolve({ errorCode: -1, msg: '请求超时' })
      }, 4000)
      // 由于设备端是异步上报对应的消息回复，通过reqId注册对应命令的消息回调，
      // 后续在消息监听onmessage通过reqId匹配并把对应的回复resolve，达到同步调用的效果
      this.cmdCallbackMap[reqId] = (data: { errorCode: number } & IAnyObject) => {
        console.log(`${params.method}-res:`, params.topic, data)
        clearTimeout(timeId)
        console.debug('指令发送-回复时间：', Date.now() - parseInt(reqId))

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
    if (!_instance) {
      return
    }

    console.log('socket实例close')
    this.cmdCallbackMap = {}
    this.onMessageHandlerList = []
    this.tcpClient.close()
    this.udpClient.close()
    wx.offAppHide(this.closeUdp)
    wx.offAppShow(this.bindUdp)
    _instance = null
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
