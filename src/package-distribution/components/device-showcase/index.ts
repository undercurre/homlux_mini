import { ComponentWithComputed } from 'miniprogram-computed'
import { homeStore } from '../../../store/index'
import Dialog from '@vant/weapp/dialog/dialog'
import { queryUserThirdPartyInfo } from '../../../apis/index'
import { Logger, storage, strUtil } from '../../../utils/index'
import { IModel } from '../../common/deviceCategory'

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    deviceInfo: {
      type: Object,
      value: {},
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    ripple: false,
  },

  computed: {},

  /**
   * 组件的方法列表
   */
  methods: {
    async handleCardTap() {
      console.log(this.data.deviceInfo)
      this.setData({
        ripple: true,
      })

      let { path } = this.data.deviceInfo as IModel
      const { source, meijuProductInfo } = this.data.deviceInfo as IModel

      // 绑定美居设备时，检查美居授权。
      if (source === 'meiju') {
        const res = await queryUserThirdPartyInfo(homeStore.currentHomeId, { loading: true })

        const isAuth = res.success ? res.result[0].authStatus === 1 : false

        Logger.log('queryUserThirdPartyInfo', res)
        if (!res.success) {
          return
        }

        if (!isAuth) {
          this.toBindMeijuHome()

          return
        }

        path = `/package-distribution/pages/scan/index?scanType=meijuDevice&meijuPath=${encodeURIComponent(
          strUtil.getUrlWithParams(
            '/package-distribution-meiju/pages/check-auth/index',
            meijuProductInfo as Meiju.IProductItem,
          ),
        )}`
      }

      wx.navigateTo({
        url: path,
      })
    },

    /**
     * 跳转绑定美居账号
     */
    toBindMeijuHome() {
      if (!homeStore.isCreator) {
        Dialog.alert({
          context: this,
          title: '未完成美的美居授权',
          message: '请联系HOMLUX家庭创建者授权，路径：我的-连接其他平台',
          showCancelButton: false,
          confirmButtonText: '我知道了',
        })
        return
      }

      storage.set('meiju_auth_entry', 'distribution-meiju')
      wx.navigateTo({
        url: '/package-auth/pages/confirm-auth/index',
      })
    },
  },
})
