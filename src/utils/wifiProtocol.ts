import dayjs from 'dayjs'
import { aesUtil, delay, strUtil } from '../utils/index'

let _instance: WifiSocket | null = null

const deviceInfo = wx.getDeviceInfo()
const tcpClient: WechatMiniprogram.TCPSocket = wx.createTCPSocket()

let udpClient: WechatMiniprogram.UDPSocket | undefined = undefined

export class WifiSocket {
  time = dayjs().format('HH:mm:ss')

  SSID = ''

  pw = '12345678'

  key = ''

  date = Date.now()

  deviceInfo = {
    ip: '', // 网关默认的ip为192.168.11.1
    udpPort: 6266,
    isConnectingUdp: false, // 是否正在连接udp
    tcpPort: 6466,
  }

  queryWifiTimeId = 0 // 查询当前wiFi延时器

  wifiTimeoutTimeId = 0 // wifi超时计时器

  cmdCallbackMap: IAnyObject = {}

  onMessageHandlerList: ((data: IAnyObject) => void)[] = []

  constructor(params: { ssid: string }) {
    if (_instance && _instance.SSID === params.ssid) {
      console.log('WifiSocket实例重用')
      return _instance
    }
    // 防止端口被占用，检查释放之前生成的实例
    if (_instance) {
      _instance.close()
    }

    this.SSID = params.ssid

    this.date = Date.now()

    this.key = `homlux@midea${params.ssid.substr(-4, 4)}`

    this.queryWifiTimeId = 0

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    _instance = this

    console.log('constructor', dayjs().format('HH:mm:ss'))
  }

  async connect() {
    const now = Date.now()

    const res = await this.connectWifi()

    console.log(`连接${this.SSID}时长：`, Date.now() - now, res, dayjs().format('HH:mm:ss'))

    return res
  }

  connectWifi() {
    return new Promise<{ errCode: number; success: boolean; msg?: string }>((resolve) => {
      const res = { success: true, errCode: 0 }

      wx.getConnectedWifi({
        complete: async (connectedRes) => {
          console.log('getConnectedWifi：complete', connectedRes, dayjs().format('HH:mm:ss'))

          if (connectedRes && (connectedRes as IAnyObject).wifi?.SSID === this.SSID) {
            console.log(`${this.SSID}已连接`)
            resolve(res)
            return
          }

          const systemVersion = parseInt(deviceInfo.system.toLowerCase().replace(deviceInfo.platform, ''))
          const isAndroid10Plus = deviceInfo.platform === 'android' && systemVersion >= 10 // 判断是否Android10+或者是鸿蒙

          wx.connectWifi({
            SSID: this.SSID,
            password: this.pw,
            partialInfo: false,
            maunal: isAndroid10Plus, // Android 微信客户端 7.0.22 以上版本，connectWifi 的实现在 Android 10 及以上的手机无法生效，需要配置 maunal 来连接 wifi。详情参考官方文档
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

              console.log('queryWifiTimeId', this.queryWifiTimeId, this)
              // 避免重复触发轮询逻辑
              if (this.queryWifiTimeId !== 0) {
                return
              }

              // 连接热点超时回调
              this.wifiTimeoutTimeId = setTimeout(() => {
                console.error('连接热点超时')
                clearTimeout(this.queryWifiTimeId)
                this.queryWifiTimeId = 0
                resolve({ success: false, errCode: -1 })
              }, 90000)

              const queryWifi = () => {
                wx.getConnectedWifi({
                  success: (successRes) => {
                    console.log('getConnectedWifi：successRes', successRes, dayjs().format('HH:mm:ss'))

                    if (successRes && (successRes as IAnyObject).wifi?.SSID === this.SSID) {
                      console.info(`连接wifi:${successRes.wifi.SSID}成功`)
                      resolve(res)
                      clearTimeout(this.wifiTimeoutTimeId)
                      this.queryWifiTimeId = 0
                    } else {
                      this.queryWifiTimeId = setTimeout(() => {
                        queryWifi()
                      }, 2000)
                    }
                  },
                  complete: (res) => {
                    console.log('query-getConnectedWifi-complete', res)
                  },
                })
              }

              // 由于onWifiConnected不可靠，在安卓端存在监听不到的情况，改为轮询
              queryWifi()
            },
          })
        },
      })
    })
  }

  async init() {
    const port = this.initUdpSocket()

    console.log(`initUdpSocket`)

    if (port === 0) {
      return { errCode: -1, success: false, msg: 'UDP初始化失败' }
    }

    await delay(1000)

    const ipRes = await this.getDeviceIp()

    console.log(`getDeviceIp`, ipRes)

    if (!ipRes.success) {
      return { errCode: -1, success: false, msg: '获取IP失败' }
    }

    this.initTcpSocket()

    return { errCode: 0, success: true, msg: '' }
  }

  bindUdp = () => {
    console.log('bindUdp', this, dayjs().format('HH:mm:ss'))
    if (this.deviceInfo.isConnectingUdp) {
      console.log('isConnectingUdp')
      return
    }

    this.deviceInfo.isConnectingUdp = true
    const port = udpClient?.bind(6366)

    console.log('port', port)

    if (port === 0) {
      wx.showModal({
        content: '端口被占用，无法正常配网，请重启微信',
        showCancel: false,
      })
    }

    return port
  }

  closeUdp = () => {
    console.log('closeUdp', dayjs().format('HH:mm:ss'))
    if (this.deviceInfo.isConnectingUdp) {
      udpClient?.close()
    }
  }

  initTcpSocket() {
    tcpClient.onMessage((res) => {
      console.log('tcpClient.onMessage', this.time, res)

      this.handleReply(res.message)

      tcpClient.close() // 每次发送完数据，网关都会主动断开TCP连接，app需要配合释放对应tcp资源，否则会影响下一次的连接
    })

    tcpClient.onError((res) => {
      console.log('tcpClient.onError', res)
      // 被动关闭socket时释放对应tcp资源
      // if (res.errMsg.includes('closed')) {
      //   tcpClient.close()
      // }
    })

    tcpClient.onClose((res) => {
      console.log('tcpClient.onClose', res)
    })

    console.log('initTcpSocket', dayjs().format('HH:mm:ss'))
  }

  initUdpSocket() {
    udpClient = wx.createUDPSocket()

    const port = this.bindUdp()

    udpClient.onMessage((res) => {
      this.handleReply(res.message)
    })

    udpClient.onError((res) => {
      console.log('udpClient.onError', res)
    })

    udpClient.onClose((res) => {
      console.log('udpClient.onClose', res)
      this.deviceInfo.isConnectingUdp = false
    })

    // 防止在配网页面直接关闭小程序，导致udp端口没有被占用释放，下次打开时会无法创建同样端口的udp实例，需要在合适时机销毁没用的udp实例
    wx.onAppHide(this.closeUdp)

    wx.onAppShow(this.bindUdp)

    console.log('initUdpSocket', dayjs().format('HH:mm:ss'))

    return port
  }

  handleReply(message: ArrayBuffer) {
    const reply = decodeCmd(message, this.key)
    console.log('reply', reply)

    const callback = this.cmdCallbackMap[reply.reqId]

    if (callback) {
      callback(reply.data)

      delete this.cmdCallbackMap[reply.reqId] // 删除已经执行的callback
    } else {
      this.onMessageHandlerList.map((handler) => handler(reply))
    }
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

  async getDeviceIp() {
    if (this.deviceInfo.ip) {
      return { success: true, msg: '已知IP' }
    }

    await this.sendCmdForDeviceIp()

    // 获取IP重试，存在第一次获取超时的情况，尤其安卓端比较明显
    if (!this.deviceInfo.ip) {
      await this.sendCmdForDeviceIp()
    }

    // android端，短时间内连续连接、关闭tcpsocket,会卡死甚至崩溃
    // 网关固定IP，优先11.1，ip,冲突才会选择33.1
    // const ipList = ['192.168.11.1', '192.168.33.1']

    // for (const ip of ipList) {
    //   console.log('ip:', ip)
    //   const connectTcpRes = await this.connectTcp(ip).catch((err) => ({ success: false, msg: err }))

    //   console.log('connectTcpRes', connectTcpRes)

    //   console.info(`尝试连接${ip}：${connectTcpRes.success}`, dayjs().format('HH:mm:ss'))
    //   if (connectTcpRes.success) {
    //     this.deviceInfo.ip = ip

    //     tcpClient.close()
    //     return { success: true, msg: '固定IP连接成功' }
    //   }
    // }

    return { success: Boolean(this.deviceInfo.ip) }
  }

  // 创建
  connectTcp(IP: string) {
    return new Promise<{ success: boolean; msg?: string }>((resolve) => {
      const start = Date.now()

      const timeId = setTimeout(() => {
        tcpClient.offConnect()
        resolve({ success: false, msg: 'TCP连接超时' })
      }, 10000)

      const listen = (res: WechatMiniprogram.GeneralCallbackResult) => {
        console.log('tcpClient.onConnect port：', res)
        console.debug('TCP连接时间：', Date.now() - start)

        clearTimeout(timeId)
        tcpClient.offConnect()
        resolve({ success: true })
      }

      tcpClient.onConnect(listen)

      tcpClient.connect({
        address: IP,
        port: this.deviceInfo.tcpPort,
        timeout: 10,
      })
    })
  }

  /**
   * 发送udp/tcp指令
   * @param params
   */
  async sendCmd(params: { topic: string; data: IAnyObject; method?: 'TCP' | 'UDP' }) {
    try {
      params.method = params.method || 'TCP'

      if (params.method === 'TCP') {
        await this.connectTcp(this.deviceInfo.ip)
      }

      return new Promise<{ errorCode: number; success: boolean } & IAnyObject>((resolve) => {
        const reqId = Date.now().toString()

        const msgData = {
          reqId,
          topic: params.topic, //指令名称:获取网关IP
          data: params.data,
        }

        console.log(`${params.method}-send: ${params.topic}`, msgData, dayjs().format('HH:mm:ss'))

        const message = aesUtil.encrypt(JSON.stringify(msgData), this.key)
        const sendMsg = strUtil.hexStringToArrayBuffer(message)

        // 超时回复处理
        const timeoutId = setTimeout(() => {
          console.error(`${params.method}-超时回复:`, params.topic)
          this.cmdCallbackMap[reqId] && delete this.cmdCallbackMap[reqId]
          resolve({ errorCode: -1, msg: '请求超时', success: false })
        }, 10000)
        // 由于设备端是异步上报对应的消息回复，通过reqId注册对应命令的消息回调，
        // 后续在消息监听onmessage通过reqId匹配并把对应的回复resolve，达到同步调用的效果
        this.cmdCallbackMap[reqId] = (data: { errorCode: number } & IAnyObject) => {
          console.log(`${params.method}-res:`, params.topic, data)
          clearTimeout(timeoutId)
          console.debug('指令发送-回复时间：', Date.now() - parseInt(reqId))

          resolve({
            ...data,
            success: data.errorCode === 0,
          })
        }

        params.method === 'TCP'
          ? tcpClient.write(sendMsg)
          : udpClient?.send({
              address: '255.255.255.255',
              port: this.deviceInfo.udpPort,
              message: sendMsg,
            })
      })
    } catch (err) {
      return { errorCode: -1, msg: err, success: false }
    }
  }

  /**
   * 释放相关资源
   */
  close(msg?: string) {
    if (!_instance) {
      return
    }

    console.log('socket实例close', msg)
    this.cmdCallbackMap = {}
    this.onMessageHandlerList = []
    tcpClient.close()
    udpClient?.close()

    clearTimeout(this.queryWifiTimeId)
    this.queryWifiTimeId = 0
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
