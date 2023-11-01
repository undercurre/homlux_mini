import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { bindMeiju, getMeijuHomeList, queryUserMideaAuthInfo } from '../../../apis/index'
import { delay, storage } from '../../../utils/index'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { homeStore } from '../../../store/index'

type HomeCard = { checked: boolean; index: number } & Meiju.MeijuHome

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
      const index = e.target.dataset.index

      diffData[`homeList[${index}].checked`] = true
      diffData[`homeList[${this.data.currentHome.index}].checked`] = false

      this.setData(diffData)
    },

    async toConfirm() {
      const authRes = await queryUserMideaAuthInfo(this.data.currentHome?.mideaHouseId)

      if (authRes.success && authRes.result.mideaAuthFlag) {
        const houseName = authRes.result.houseName
        await Dialog.confirm({
          title: `当前美居家庭已绑定Homlux家庭【${houseName}】，若绑定至新Homlux家庭请先在Homlux家庭【${houseName}】解绑`,
          showCancelButton: false,
        })

        return
      }

      const entry = storage.get('meiju_auth_entry')

      if (entry === 'distribution-meiju') {
        this.bindMeijuHome()
      } else {
        const url = `/package-auth/pages/device-list/index?homeId=${this.data.currentHome?.mideaHouseId}`
        wx.navigateTo({ url })
      }
    },

    async bindMeijuHome() {
      const res = await bindMeiju({
        mideaHouseId: this.data.currentHome?.mideaHouseId,
        houseId: homeStore.currentHomeId,
      })

      if (res.success) {
        storage.remove('meiju_auth_entry') // 清除缓存标志，以免影响其他逻辑

        wx.redirectTo({
          url: '/package-distribution-meiju/pages/check-auth/index',
        })
      } else {
        Toast(res.msg)
      }
    },
  },
})
