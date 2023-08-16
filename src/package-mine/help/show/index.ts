import { storage } from '../../../utils/index'
import { helpList, remoterHelp } from '../help-doc'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { ComponentWithComputed } from 'miniprogram-computed'
import { getEnv } from '../../../config/index'

ComponentWithComputed({
  behaviors: [pageBehavior],

  /**
   * 组件的初始数据
   */
  data: {
    navigationBarAndStatusBarHeight:
      (storage.get<number>('statusBarHeight') as number) +
      (storage.get<number>('navigationBarHeight') as number) +
      'px',
    type: '',
    doc: '',
    title: '',
    url: '',
    width: '',
    height: '',
    remoterHelp,
    helpType: '',
    homLuxHelp: {
      dev: 'https://test.meizgd.com/homlux',
      sit: 'https://test.meizgd.com/homlux',
      prod: 'https://mzaio.meizgd.com/homlux'
    }
  },
  computed: {
    webviewSrc(data) {
      return data.homLuxHelp[getEnv()]
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onLoad(e: { page: string }) {
      console.log(e)
      this.setData({
        helpType: e.page
      })
      const help = helpList.find((h) => h.value === e.page)
      if (help) {
        this.setData({
          title: help.title,
          doc: this.data[help.value],
          type: 'doc',
        })
      }
    },
    handleImgTap() {
      wx.previewMedia({
        sources: [
          {
            url: this.data.url,
            type: 'image',
          },
        ],
        showmenu: true,
      })
    },
  },
})
