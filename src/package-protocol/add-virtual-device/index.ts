// pages/protocalList/index.ts
import pageBehavior from '../../behaviors/pageBehaviors'
import { Loggger, emitter } from '../../utils/index'
import { queryDeviceOnlineStatus, bindDevice } from '../../apis/index'
import { homeStore } from '../../store/index'

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
    deviceList: [] as IAnyObject[]
  },

  lifetimes: {
    ready() {
      if (homeStore.currentHomeId === this.data.homeId) {
        emitter.on('bind_device', async (data) => {
          Loggger.log(`收到绑定推送消息：子设备${data.deviceId}`)

          await this.requestBindDevice({deviceId: data.deviceId, deviceName: `网关${data.deviceId.slice(-4)}`})
        })
      }
    },
    detached() {
      emitter.off('bind_device')
      homeStore.updateHomeInfo()
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async scanCode() {
      // 允许从相机和相册扫码
      const res = await wx
        .scanCode({
          scanType: ['qrCode'],
        })
        .catch((err) => err)

      Loggger.log('scanCode', res)

      const sn = res.result

      await this.requestBindDevice({sn, deviceName: `网关${sn.slice(-8, -4)}`})
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
          deviceList: this.data.deviceList.concat([{ deviceId: res.result.deviceId, name: params.deviceName }])
        })
      }
    },
  },
})
