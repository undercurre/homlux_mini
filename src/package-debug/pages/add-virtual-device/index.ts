import pageBehavior from '../../../behaviors/pageBehaviors'
import { Logger, emitter, strUtil, aesUtil } from '../../../utils/index'
import { queryDeviceOnlineStatus, sendCmdAddSubdevice, bindDevice } from '../../../apis/index'
import { deviceStore, homeStore } from '../../../store/index'

let udpClient: WechatMiniprogram.UDPSocket = wx.createUDPSocket()
const key = 'homlux@midea5504'

function decodeCmd(message: ArrayBuffer, key: string) {
  const msg = strUtil.ab2hex(message)

  console.log('decodeCmd', msg)

  const reply = aesUtil.decrypt(msg, key)

  console.log('reply', reply)

  // return JSON.parse(reply) as { topic: string; reqId: string; data: IAnyObject }
}

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    homeId: 'd61261d887d74cf9bec90c827615ea8a', // 固定虚拟家庭Id
    roomId: '11e70cffcb4c4af1bf6960994b4d3480',
    gatewayId: '',
    _timeId: 0,
    deviceList: [] as IAnyObject[],
  },

  lifetimes: {
    ready() {
      console.log('test--ready')
      if (homeStore.currentHomeId === this.data.homeId) {
        emitter.on('bind_device', async (data) => {
          Logger.log(`收到绑定推送消息：子设备${data.deviceId}`)

          await this.requestBindDevice({ deviceId: data.deviceId, deviceName: `子设备${data.deviceId.slice(-4)}` })
        })
      }

      this.initUdpSocket()
    },
    detached() {
      console.log('test--detached')
      emitter.off('bind_device')
      clearInterval(this.data._timeId)
      homeStore.updateHomeInfo()
      udpClient.close()
    },
  },
  pageLifetimes: {
    show() {},
    hide() {
      console.log('test--hide')
      udpClient.close()
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    initUdpSocket() {
      console.log('test--initUdpSocket')
      udpClient = wx.createUDPSocket()

      const port = udpClient.bind(6366)

      Logger.log('port', port)

      udpClient.onMessage((res) => {
        Logger.log('udpClient.onMessage', res)
        const reply = decodeCmd(res.message, key)

        Logger.log('udpClient.reply', reply)
      })

      udpClient.onError((res) => {
        Logger.log('udpClient.onError', res)
      })

      udpClient.onClose((res) => {
        Logger.log('udpClient.onClose', res)
      })

      return port
    },
    sendUdp() {
      const reqId = Date.now().toString()

      udpClient.send({
        address: '255.255.255.255',
        port: 6266,
        message: `test-${reqId}`,
        setBroadcast: true,
      })

      console.log('sendUdp', reqId)
    },
    async scanCode() {
      // 允许从相机和相册扫码
      const res = await wx
        .scanCode({
          scanType: ['qrCode'],
        })
        .catch((err) => err)

      Logger.log('scanCode', res)

      const sn = res.result

      await this.requestBindDevice({ sn, deviceName: `网关${sn.slice(-8, -4)}` })
    },

    async addSubDevice() {
      const list = deviceStore.allRoomDeviceList.filter((item) => item.deviceType === 1)

      const action = await wx
        .showActionSheet({
          itemList: list.map((item) => item.deviceName),
        })
        .catch((err) => err)

      if (action.tapIndex === undefined) {
        return
      }

      this.data.gatewayId = list[action.tapIndex].deviceId

      clearInterval(this.data._timeId)

      this.sendCmdAddSubdevice(this.data.gatewayId)

      this.data._timeId = setInterval(async () => {
        this.sendCmdAddSubdevice(this.data.gatewayId)
      }, 50000)
    },

    async sendCmdAddSubdevice(deviceId: string) {
      await sendCmdAddSubdevice({
        deviceId,
        expire: 60,
        buzz: 1,
      })
    },

    async requestBindDevice(params: { sn?: string; deviceId?: string; deviceName: string }) {
      if (!params.deviceId) {
        const queryRes = await queryDeviceOnlineStatus({ sn: params.sn, deviceType: '1' })

        console.log('queryDeviceOnlineStatus', queryRes)
        params.deviceId = queryRes.result.deviceId
      }

      const res = await bindDevice({
        deviceId: params.deviceId,
        houseId: this.data.homeId,
        roomId: this.data.roomId,
        sn: params.sn ?? '',
        deviceName: params.deviceName,
      })

      if (res.success) {
        wx.showToast({ title: `${params.deviceName}绑定成功` })

        this.setData({
          deviceList: this.data.deviceList.concat([{ deviceId: res.result.deviceId, name: params.deviceName }]),
        })
      }
    },

    toMeiju() {
      wx.openEmbeddedMiniProgram({
        appId: 'wxb12ff482a3185e46',
        path: '/package-distribution-meiju/pages//scan-devices/pages/scan-device/scan-device',
        // envVersion: 'trial',
        complete(res) {
          Logger.log('openEmbeddedMiniProgram', res)
        },
      })
    },
  },
})
