// packages/near-device/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'

type StatusName = 'discover' | 'requesting' | 'finish'

interface PageData {
  deviceList: Array<Device.DeviceItem>
  failList: Array<Device.DeviceItem>
  pageTitle: string
  status: StatusName
}

ComponentWithComputed({
  /**
   * 页面的初始数据
   */
  data: {
    deviceList: Array<Device.DeviceItem>(),
    failList: Array<Device.DeviceItem>(),
    status: 'discover',
  } as PageData,

  computed: {
    pageTitle(data: PageData) {
      const titleMap = {
        discover: '附近的子设备',
        requesting: '添加设备',
        finish: '添加设备',
      }

      return titleMap[data.status]
    },
    checkedDeviceNum(data: PageData) {
      return data.deviceList.filter((item) => item.isChecked).length
    },
  },

  methods: {
    // 切换选择发现的设备
    toggleDevice(e: WechatMiniprogram.CustomEvent) {
      console.log('toggleDevice', e)
      const index = e.currentTarget.dataset.index as number
      const item = this.data.deviceList[index]

      item.isChecked = !item.isChecked

      this.setData({
        deviceList: this.data.deviceList,
      })
    },

    // 确认添加设备
    confirmAdd() {
      this.setData({
        status: 'requesting',
      })
    },

    // 重新添加
    reAdd() {},

    finish() {},
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {
      setTimeout(() => {
        this.setData({
          deviceList: [
            {
              name: '调光灯',
              icon: '../../assets/img/deviceIcon/icon-1.png',
              roomId: '',
              roomName: '客厅',
              isChecked: true,
            },
            {
              name: '调光灯22',
              icon: '../../assets/img/deviceIcon/icon-1.png',
              roomId: '',
              roomName: '',
              isChecked: false,
            },
            {
              name: '调光灯22',
              icon: '../../assets/img/deviceIcon/icon-1.png',
              roomId: '',
              roomName: '',
              isChecked: false,
            },
            {
              name: '调光灯22',
              icon: '../../assets/img/deviceIcon/icon-1.png',
              roomId: '',
              roomName: '',
              isChecked: false,
            },
          ],
          failList: [
            {
              name: '调光灯',
              icon: '../../assets/img/deviceIcon/icon-1.png',
              roomId: '',
              roomName: '客厅',
              isChecked: true,
            },
          ],
        })
      }, 2000)
    },
    moved: function () {},
    detached: function () {},
  },
})
