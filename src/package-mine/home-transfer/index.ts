import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import drawQrcode from 'weapp-qrcode-canvas-2d'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding, userBinding } from '../../store/index'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isTransferHome: false,
  },

  computed: {},

  lifetimes: {
    ready: async function () {
      this.generateQrCode()
    },
    moved: function () {},
    detached: function () {},
  },

  methods: {
    generateQrCode() {
      const query = wx.createSelectorQuery()
      query
        .select('#myQrcode')
        .fields({
          node: true,
          size: true,
        })
        .exec((res) => {
          const canvas = res[0].node
          // 调用方法drawQrcode生成二维码
          drawQrcode({
            canvas: canvas,
            canvasId: 'myQrcode',
            width: 520,
            padding: 40,
            background: '#ffffff',
            foreground: '#000000',
            text: '112233',
          })
        })
    },
    toTransferHomeMember() {
      const list = homeBinding.store.homeList.filter((item) => item.houseCreatorFlag)

      if (list.length <= 1) {
        Toast('请至少保留一个创建的家庭')

        return
      }

      if (homeBinding.store.currentHomeDetail.userCount <= 1) {
        Toast('没有其他成员可供转让')

        return
      }

      this.setData({
        isTransferHome: true,
      })
    },

    toTransferByWx() {},

    closeTransferHome() {
      this.setData({
        isTransferHome: false,
      })
    },
  },
})
