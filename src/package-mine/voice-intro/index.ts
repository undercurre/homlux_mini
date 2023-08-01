// package-mine/hoom-manage/index.ts
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'

ComponentWithComputed({
  options: {},
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    url: {
      duer: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/intro.png',
      mi: 'https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/aIntro.png',
    },
    showImg: '',
  },

  computed: {},

  methods: {
    async onLoad(query: { type: 'duer' | 'mi' }) {
      this.setData({
        showImg: this.data.url[query.type],
      })
    },
  },
})
