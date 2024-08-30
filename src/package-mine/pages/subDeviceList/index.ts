import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { deviceBinding } from '../../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { emitter } from '../../../utils/eventBus'
import { defaultImgDir, SCREEN_PID } from '../../../config/index'

ComponentWithComputed({
  properties: {
    deviceId: {
      type: String,
      value: '',
    },
  },
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] }), pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
  },

  computed: {
    deviceList(data: IAnyObject) {
      const list = data.allRoomDeviceList?.length ? [...data.allRoomDeviceList] : []

      // 需要排除屏的2路开关
      return list.filter((d) => d.gatewayId === data.deviceId && !SCREEN_PID.includes(d.productId))
    },
  },

  lifetimes: {
    attached: function () {
      // 在组件实例进入页面节点树时执行
      emitter.off('deviceEdit')
      this.loadData()
      // 设备状态编辑更新监听
      emitter.on('deviceEdit', async () => {
        await deviceBinding.store.updateAllRoomDeviceList()
      })
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
      emitter.off('deviceEdit')
    },
  },

  methods: {
    async onPullDownRefresh() {
      try {
        deviceBinding.store.updateAllRoomDeviceList()
      } finally {
        this.setData({
          isRefresh: false,
        })
      }
    },

    async loadData() {
      deviceBinding.store.updateAllRoomDeviceList()
    },

    handleCardClick(e: { currentTarget: { dataset: { deviceId: string; deviceType: number } } }) {
      const { deviceId } = e.currentTarget.dataset

      wx.navigateTo({
        url: `/package-mine/device-manage/device-detail/index?deviceId=${deviceId}`,
      })
    },
  },
})
