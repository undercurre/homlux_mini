import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { delay, Logger } from '../../../utils/index'
import { getToken } from '../../../apis/index'

ComponentWithComputed({
  behaviors: [pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    gatewayList: [
      { name: '网关1', checked: true, auth: true },
      { name: '网关2', checked: true, auth: false },
      { name: '网关3', checked: false, auth: false },
    ],
    listHeight: 0,
    loading: false,
    checkIndex: 0, // 选择的家庭index
  },

  computed: {},

  methods: {
    async onLoad(query: { code: string }) {
      console.log('[onLoad]sync-mi, query.code ===', query.code)

      const res = await getToken(query.code).catch((err) => {
        Logger.error(err)
      })

      console.log('[onLoad] getToken', res)

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

    async toConfirm() {},
  },
})
