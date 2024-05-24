import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { queryUserThirdPartyInfo } from '../../../apis/index'
import { homeBinding, homeStore } from '../../../store/index'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'
import { storage } from '../../../utils/index'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    urls: {
      meiju: '/package-auth/pages/confirm-auth/index',
      deviceList: '/package-auth/pages/device-list/index',
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

  pageLifetimes: {
    async show() {
      const res = await queryUserThirdPartyInfo(this.data.currentHomeId)

      if (res.success) {
        this.setData({
          authList: res.result,
        })
      } else {
        Toast(res.msg)
      }
    },
  },

  methods: {
    toAuth() {
      storage.set('meiju_auth_entry', 'package-auth-index')

      if (!this.data.isMeijuAuth && !homeStore.isCreator) {
        Dialog.alert({
          title: '未完成美的美居授权',
          message: '请联系HOMLUX家庭创建者授权，路径：我的-连接其他平台',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })
        return
      } else if (!homeStore.isCreator) {
        Dialog.alert({
          title: '仅Homlux家庭创建者可以查看、修改美居授权信息',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })
        return
      }

      const url = this.data.isMeijuAuth ? this.data.urls.deviceList : this.data.urls.meiju
      wx.navigateTo({
        url,
      })
    },
  },
})
