import { ComponentWithComputed } from 'miniprogram-computed'
import { getEnv } from '../../../config/index'

ComponentWithComputed({
  /**
   * 页面的初始数据
   */
  data: {
    src: {
      dev: 'https://api-sit.smartmidea.net/v2/open/oauth2/authorize?client_id=5324570e51b5048bf74a27b97f0178e2&state=1&response_type=code&redirect_uri=https://test.meizgd.com/meiju/index.html',
      sit: 'https://api-sit.smartmidea.net/v2/open/oauth2/authorize?client_id=6f54fcabcf63943cd8793d193bb3b139&state=1&response_type=code&redirect_uri=https://sit.meizgd.com/meiju/index.html',
      prod: 'https://api-prod.smartmidea.net/v2/open/oauth2/authorize?client_id=e7dcf22e23bcc7d574aa7d9b1d45736b&state=1&response_type=code&redirect_uri=https://mzaio.meizgd.com/meiju/index.html',
    },
  },
  computed: {
    webviewSrc(data) {
      return data.src[getEnv()]
    },
  },

  methods: {
    onWebviewLoad(e: { detail: { src: string } }) {
      const src = e.detail.src
      console.log('bindload', src)
      // 已在美智h5页面范围，并且未带token，则更新webviewSrc
      // if (src.indexOf(MEIJU_DOMAIN) === -1 && src.indexOf('tr=') === -1) {
      //   // token 反转发送，稍提高安全性
      //   const tr = String(storage.get<string>('token')).split('').reverse().join('')
      //   const webviewSrc = `${src}&tr=${tr}`
      //   this.setData({
      //     webviewSrc,
      //   })
      // }
    },
    onMessage(e: { detail: { data: IAnyObject } }) {
      console.log('onMessage', e.detail.data)
    },
  },
})
