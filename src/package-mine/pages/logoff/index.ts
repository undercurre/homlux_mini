import pageBehavior from '../../../behaviors/pageBehaviors'
import { logoutWxUserInfo } from '../../../apis/index'
import { homluxOssUrl } from '../../../config/index'

Component({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  behaviors: [pageBehavior],
  /**
   * 组件的初始数据
   */
  data: {
    homluxOssUrl,
    _isForceLogut: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async handleConfirm() {
      const res = await logoutWxUserInfo({ confirm: this.data._isForceLogut })

      console.log('logoutWxUserInfo', res)
    },
  },
})
