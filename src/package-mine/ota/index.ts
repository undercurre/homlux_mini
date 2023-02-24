import { queryDeviceOtaUpdateList } from '../../apis/ota'
import pageBehavior from '../../behaviors/pageBehaviors'
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
    autoUpdate: false,
    isLoading: false,
    contentHeight: 0,
    otaData: [{}], // todo：mock数据，联调时删除
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
        console.log(res)
      })
    },
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
  },
})
