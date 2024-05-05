import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '../../../../skyline-components/mz-toast/toast'
import { execScene } from '../../../../apis/index'
import { homeStore } from '../../../../store/index'
import { strUtil } from '../../../../utils/strUtil'

ComponentWithComputed({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    item: {
      type: Object,
      value: {},
    },
  },

  computed: {
    linkDesc(data) {
      if (data.item?.data?.linkName) {
        return '已关联：' + data.item.data.linkName
      }
      return '暂未关联开关'
    },
    sceneName(data) {
      if (data.item?.data?.sceneName?.length && data.item?.data?.sceneName?.length > 10) {
        return data.item.data.sceneName.slice(0, 8) + '...'
      } else {
        return data.item?.data?.sceneName || ''
      }
    },
    icon(data) {
      if (data.item?.data?.sceneIcon) {
        return data.item.data.sceneIcon
      } else {
        return ''
      }
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    tapAnimate: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    async handleExecScene(e: WechatMiniprogram.TouchEvent) {
      if (wx.vibrateShort) wx.vibrateShort({ type: 'heavy' })
      this.setData({
        tapAnimate: true,
      })
      setTimeout(() => {
        this.setData({
          tapAnimate: false,
        })
      }, 700)
      const res = await execScene(e.currentTarget.dataset.item.sceneId)
      if (res.success) {
        Toast('执行成功')
      } else {
        Toast('执行失败')
      }
    },
    toEditScene() {
      if (homeStore.isManager) {
        wx.navigateTo({
          url: strUtil.getUrlWithParams('/package-automation/automation-add/index', {
            sceneInfo: JSON.stringify(this.data.item.data),
          }),
        })
      } else {
        Toast('您当前身份为访客，无法编辑场景')
      }
    },
  },
})
