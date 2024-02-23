import Toast from '@vant/weapp/toast/toast'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { authQrcode } from '../../../apis/index'
import { userStore } from '../../../store/index'
import cacheData from '../../common/cacheData'
import { productImgDir, PRODUCT_ID } from '../../../config/index'

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {
    // 需要授权的屏的productId
    pid: {
      type: String,
      value: '',
    },
    code: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    mobile: '',
    productIcon: '', // 产品图标
  },

  lifetimes: {
    async ready() {
      this.setData({
        productIcon: `${productImgDir}/${
          this.data.pid === PRODUCT_ID.screen_4 ? '0x16-screen-4.png' : '0x16-screen-10.png'
        }`,
        mobile: userStore.userInfo.mobilePhone.substring(0, 3) + '****' + userStore.userInfo.mobilePhone.substr(7),
      })
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async auth() {
      const authRes = await authQrcode(this.data.code)

      if (authRes.success) {
        Toast({
          message: '授权成功',
          onClose: () => {
            wx.reLaunch({
              url: cacheData.pageEntry,
            })
          },
        })
      } else {
        Toast('授权失败')
      }
    },
  },
})
