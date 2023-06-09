// import { storage } from '../../../utils/index'
import { ComponentWithComputed } from 'miniprogram-computed'

// const MEIJU_DOMAIN = 'https://api-prod.smartmidea.net'

// package-mine/auth/index.ts
ComponentWithComputed({
  /**
   * 页面的初始数据
   */
  data: {
    // token
    // webviewSrc: 'https://test.meizgd.com/meiju/index.html?code=1o2SoIiK13ARIPwJdpDSPhCV5AJCJ4bK&state=1',
    // webviewSrc: 'http://localhost:5000/meiju/index.html?code=1o2SoIiK13ARIPwJdpDSPhCV5AJCJ4bK&state=1',
    // webviewSrc: 'http://localhost:5500/index.html?code=1o2SoIiK13ARIPwJdpDSPhCV5AJCJ4bK&state=1',
    webviewSrc:
      'https://api-prod.smartmidea.net/v2/open/oauth2/authorize?client_id=a1b362741f4a510d44c086b85ab5a872&state=1&response_type=code&redirect_uri=https://test.meizgd.com/meiju/index.html',
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
