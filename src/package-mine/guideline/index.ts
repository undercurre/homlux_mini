import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { storage } from '../../utils/index'

// 设备类型
const system = (storage.get<string>('system') as string).toLocaleLowerCase().indexOf('ios') > -1 ? 'ios' : 'android'

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
      bleEnable: `https://mzgd-oss-bucket.oss-cn-shenzhen.aliyuncs.com/homlux/ble-${system}.png`,
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
