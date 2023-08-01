// package-mine/hoom-manage/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    url: {
      duerVoice: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/intro.png',
      miVoice: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/aIntro.png',
      // TODO
      bleEnable: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/aIntro.png',
    },
    showImg: '',
  },

  computed: {},

  methods: {
    async onLoad(query: { type: 'duerVoice' | 'miVoice' | 'bleEnable' }) {
      this.setData({
        showImg: this.data.url[query.type],
      })
    },
  },
})
