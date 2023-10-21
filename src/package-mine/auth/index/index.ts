import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { queryUserThirdPartyInfo } from '../../../apis/index'
import { homeBinding } from '../../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    urls: {
      meiju: '/package-mine/auth/meiju/index',
      deviceList: '/package-mine/auth/device-list/index',
    },
    authList: [] as Meiju.AuthItem[],
  },

  computed: {
    isMeijuAuth(data) {
      return data.authList.length && data.authList[0].authStatus === 1
    },
    meijuLinkText(data) {
      return data.authList.length ? data.authList[0].authStatusName : ''
    },
  },

  methods: {
    async onLoad() {
      const res = await queryUserThirdPartyInfo(this.data.currentHomeId)

      if (res.success) {
        this.setData({
          authList: res.result,
        })
      } else {
        Toast(res.msg)
      }
    },
    toAuth() {
      const url = this.data.isMeijuAuth ? this.data.urls.deviceList : this.data.urls.meiju
      wx.navigateTo({
        url,
      })
    },
  },
})
