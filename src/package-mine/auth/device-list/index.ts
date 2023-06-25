import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { bindMeiju, getMeijuDeviceList, syncMeijuDeviceList, delDeviceSubscribe } from '../../../apis/index'
import { delay } from '../../../utils/index'
import { homeBinding } from '../../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehaviors],

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
      console.log('device list onload', query, this.data.currentHomeId)
      // 带 homeId，未绑定
      if (query?.homeId) {
        const res = await bindMeiju({ mideaHouseId: query.homeId, houseId: this.data.currentHomeId })

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
      const res = await syncMeijuDeviceList(this.data.currentHomeId)
      if (res.success) {
        const deviceList = res.result
        this.setData({
          deviceList,
        })
        Toast('同步成功')
      }
    },

    async debindMeiju() {
      const res = await delDeviceSubscribe(this.data.currentHomeId)
      if (res.success) {
        Toast('已解除绑定')
      }
    },
  },
})
