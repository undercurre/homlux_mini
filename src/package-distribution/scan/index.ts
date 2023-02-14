import pageBehaviors from '../../behaviors/pageBehaviors'
import { strUtil } from '../../utils/index'

let sacnUrl = '' // 正在解析的url

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  behaviors: [pageBehaviors],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {},

  lifetimes: {
    attached() {
      const systemSetting = wx.getSystemSetting()

      console.log('systemSetting', systemSetting)
    },
  },

  pageLifetimes: {
    show() {
      console.log('show')
    },
    hide() {
      console.log('hide')
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getQrCodeInfo(e: WechatMiniprogram.CustomEvent) {
      wx.vibrateShort({ type: 'heavy' }) // 轻微震动

      console.log('getQrCodeInfo', e)

      sacnUrl = e.detail.result

      const params = strUtil.getUrlParams(sacnUrl)

      console.log('params', params)

      if (params.ssid && params.ssid.includes('midea_16')) {
        this.bindGateway(params)
      }
    },

    toSearchSubDevice() {
      wx.redirectTo({
        url: '/package-distribution/search-subdevice/index',
      })
    },

    bindGateway(params: IAnyObject) {
      wx.navigateTo({
        url: strUtil.getUrlWithParams('/package-distribution/check-gateway/index', {
          ssid: params.ssid,
          dsn: params.dsn,
        }),
      })
    },

    /**
     * 添加附近搜索的子设备
     */
    addNearSubdevice() {
      wx.navigateTo({
        url: '/package-distribution/add-subdevice/index',
      })
    },
  },
})
