import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { getMeijuHomeList } from '../../../apis/index'
import { delay } from '../../../utils/index'
import Toast from '@vant/weapp/toast/toast'

type HomeCard = { checked: boolean; index: number } & Auth.MeijuHome

// package-mine/auth/index.ts
ComponentWithComputed({
  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    homeList: [] as HomeCard[],
    listHeight: 0,
  },

  computed: {
    currentHome(data) {
      return data.homeList.find((home) => home.checked) || ({} as HomeCard)
    },
  },

  methods: {
    async onLoad(query: { code: string }) {
      console.log('onLoad of homeList, query.code ===', query.code)

      const res = await getMeijuHomeList(query.code)

      if (res.success) {
        const homeList = res.result.mideaHouseList.map((home, index) => ({
          ...home,
          index,
          checked: index === 0, // 默认选中第一个
        }))
        this.setData({
          homeList,
        })
      } else {
        Toast(res.msg)
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

    onCheckHome(e: { target: { dataset: { index: number } } }) {
      const diffData = {} as IAnyObject
      diffData[`homeList[${e.target.dataset.index}].checked`] = true
      diffData[`homeList[${this.data.currentHome.index}].checked`] = false

      this.setData(diffData)
    },

    toDevicePage() {
      const url = `/package-mine/auth/device-list/index?homeId=${this.data.currentHome?.mideaHouseId}`
      wx.navigateTo({ url })
    },
  },
})
