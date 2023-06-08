import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { bindMeiju, getMeijuDeviceList, syncMeijuDeviceList, delDeviceSubscribe } from '../../../apis/index'
import { delay } from '../../../utils/index'

ComponentWithComputed({
  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    deviceList: [] as Auth.MeijuDevice[],
    listHeight: 0,
  },

  computed: {},

  methods: {
    async onLoad(query: { homeId: string }) {
      console.log('device list onload', query)
      // 带 homeId，未绑定
      if (query?.homeId) {
        const res = await bindMeiju(query.homeId)

        if (res.success) {
          const deviceList = res.result
          this.setData({
            deviceList,
          })
        }
      }
      // 不带 homeId，从第三方列表页直接进入
      else {
        const res = await getMeijuDeviceList()
        if (res.success) {
          const deviceList = res.result
          this.setData({
            deviceList,
          })
        }
      }

      await delay(500)
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              listHeight: res[0].height - 20,
            })
          }
        })
    },

    async syncMeijuDevice() {
      const res = await syncMeijuDeviceList()
      if (res.success) {
        const deviceList = res.result
        this.setData({
          deviceList,
        })
      }
    },

    debindMeiju() {
      delDeviceSubscribe()
    },
  },
})
