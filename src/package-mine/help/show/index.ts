import { storage } from '../../../utils/index'
import { helpList, homLuxHelp, remoterHelp } from '../help-doc'
import pageBehavior from '../../../behaviors/pageBehaviors'
Component({
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
    homLuxHelp,
    remoterHelp
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onLoad(e: { page: string }) {
      console.log(e)
      const help = helpList.find((h) => h.value === e.page)
      if (help) {
        this.setData({
          title: help.title,
          doc: this.data[help.value],
          type: 'doc'
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
