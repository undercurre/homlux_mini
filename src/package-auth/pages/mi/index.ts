import { ComponentWithComputed } from 'miniprogram-computed'
import { getH5BaseUrl } from '../../../config/index'
import { strUtil } from '../../../utils/index'
import { ANTI_CSRF_STATE, MI_APP_ID } from '../../../config/mi'

ComponentWithComputed({
  /**
   * 页面的初始数据
   */
  data: {
    webviewSrc: strUtil.getUrlWithParams('https://account.xiaomi.com/oauth2/authorize', {
      client_id: MI_APP_ID,
      state: ANTI_CSRF_STATE,
      response_type: 'code',
      skip_confirm: false, // 授权有效期内的用户在已登录情况下，是否显示授权页面
      redirect_uri: strUtil.getUrlWithParams(`${getH5BaseUrl()}/index.html`, {
        miniProgramUrl: '/package-auth/pages/sync-mi/index',
      }),
    }),
  },
  computed: {},

  lifetimes: {
    ready() {},
  },

  methods: {
    onWebviewLoad(e: { detail: { src: string } }) {
      const src = e.detail.src
      console.log('bindload', src)
    },
    onMessage(e: { detail: { data: IAnyObject } }) {
      console.log('onMessage', e.detail.data)
    },
  },
})
