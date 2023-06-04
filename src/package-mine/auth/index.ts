import { storage } from '../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'

const MEIJU_DOMAIN = 'https://api-prod.smartmidea.net'

// package-mine/auth/index.ts
ComponentWithComputed({
  /**
   * 页面的初始数据
   */
  data: {
    // token
    webviewSrc: 'http://localhost:5000/meiju/?code=w2C7DW7ij1OSJQ04hB7NQppNvN4IxScz&state=1',
    // webviewSrc: 'https://api-prod.smartmidea.net/v2/open/oauth2/authorize?client_id=a1b362741f4a510d44c086b85ab5a872&state=1&response_type=code&redirect_uri=https://test.meizgd.com/mzaio/v1/external/mzgd/auth/bd58e76cfeac4079bdcaa01592a97c3d'
  },

  methods: {
    onWebviewLoad(e: { detail: { src: string } }) {
      console.log('bindload', e.detail.src)
      const src = this.data.webviewSrc
      // 已在美智h5页面范围，并且未带token，则更新webviewSrc
      // token 反转发送，稍提高安全性
      if (src.indexOf(MEIJU_DOMAIN) === -1 && e.detail.src.indexOf('tr=') === -1) {
        const tr = String(storage.get<string>('token')).split('').reverse().join('')
        this.setData({
          webviewSrc: `${src}&tr=${tr}`,
        })
      }
    },
  },
})
