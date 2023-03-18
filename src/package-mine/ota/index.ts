import { execOtaUpdate, queryDeviceOtaUpdateList } from '../../apis/ota'
import pageBehavior from '../../behaviors/pageBehaviors'
import { homeStore } from '../../store/index'
import Toast from '@vant/weapp/toast/toast'
import { ComponentWithComputed } from 'miniprogram-computed'
ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    autoUpdate: false,
    isLoading: false,
    contentHeight: 0,
    otaData: [{}], // todo：mock数据，联调时删除
    otaProductList: [] as Ota.OtaProduct[],
    otaUpdateList: [] as Ota.OtaUpdate[],
    isUpdating: false,
    hasUpdate: false,
    _pollingTimer: 0 as number | NodeJS.Timeout,
  },

  computed: {
    remainOtaDevice(data) {
      let count = 0
      data.otaUpdateList.forEach((device) => {
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
    onLoad() {
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
      queryDeviceOtaUpdateList(homeStore.currentHomeDetail.houseId).then((res) => {
        if (res.success) {
          this.setData({
            otaProductList: res.result.otaProductList,
            otaUpdateList: res.result.otaUpdateList,
            isUpdating: res.result.otaProductList.some((product) => product.updateStatus === 1),
            hasUpdate: res.result.otaProductList.length > 0,
          })
          if (this.data.isUpdating) {
            this.startPollingQuery()
          }
        } else {
          Toast('查询OTA信息失败')
        }
      })
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
        deviceOtaList: this.data.otaUpdateList,
      }).then((res) => {
        if (res.success) {
          // 下发升级指令成功，轮询直到完成更新
          this.startPollingQuery()
        }
      })
    },
    startPollingQuery() {
      // 下发升级指令成功，轮询直到完成更新
      this.data._pollingTimer = setInterval(() => {
        queryDeviceOtaUpdateList(homeStore.currentHomeDetail.houseId).then((res) => {
          if (res.success) {
            this.setData({
              otaProductList: res.result.otaProductList,
              otaUpdateList: res.result.otaUpdateList,
              isUpdating: res.result.otaProductList.some((product) => product.updateStatus === 1),
              hasUpdate: res.result.otaProductList.length > 0,
            })
            if (!this.data.hasUpdate) {
              this.stopPolling()
            }
          } else {
            Toast('查询OTA信息失败')
          }
        })
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
