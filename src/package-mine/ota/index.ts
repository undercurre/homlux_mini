import { execOtaUpdate } from '../../apis/ota'
import pageBehavior from '../../behaviors/pageBehaviors'
import { otaBinding, otaStore } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'
import { ComponentWithComputed } from 'miniprogram-computed'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [otaBinding] }), pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    autoUpdate: false,
    isLoading: false,
    contentHeight: 0,
    otaData: [{}],
    isUpdating: false,
    hasUpdate: false,
    _pollingTimer: 0,
  },

  computed: {
    remainOtaDevice(data) {
      let count = 0
      data.otaUpdateList?.forEach((device: Ota.OtaUpdate) => {
        if ([0, 1].includes(device.otaUpdateStatus)) {
          count++
        }
      })
      return count
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async onLoad() {
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
      const isSuccess = await otaStore.updateList()
      if (isSuccess) {
        this.setData({
          isUpdating: otaStore.otaProductList.some((product) => product.updateStatus === 1),
          hasUpdate: otaStore.otaProductList.length > 0,
        })
        if (this.data.isUpdating) {
          this.startPollingQuery()
        }
      } else {
        Toast('查询OTA信息失败')
      }
    },
    onUnload() {
      this.stopPolling()
    },
    // todo: 待云端实现
    onChange(e: { detail: boolean }) {
      if (this.data.isLoading) {
        return
      }
      this.setData({
        isLoading: true,
        autoUpdate: e.detail,
      })
      setTimeout(() => {
        this.setData({
          isLoading: !this.data.isLoading,
        })
      }, 1000)
    },
    handleUpdate() {
      this.setData({
        isUpdating: true,
      })
      execOtaUpdate({
        deviceOtaList: otaStore.otaUpdateList,
      }).then((res) => {
        if (res.success) {
          // 下发升级指令成功，轮询直到完成更新
          this.startPollingQuery()
        }
      })
    },
    startPollingQuery() {
      // 下发升级指令成功，轮询直到完成更新
      this.data._pollingTimer = setInterval(async () => {
        const isSuccess = await otaStore.updateList()
        if (isSuccess) {
          this.setData({
            isUpdating: otaStore.otaProductList.some((product) => product.updateStatus === 1),
            hasUpdate: otaStore.otaProductList.length > 0,
          })
        } else {
          Toast('查询OTA信息失败')
        }
      }, 5000)
    },
    stopPolling() {
      if (this.data._pollingTimer) {
        clearInterval(this.data._pollingTimer)
        this.data._pollingTimer = 0
      }
    },
  },
})
