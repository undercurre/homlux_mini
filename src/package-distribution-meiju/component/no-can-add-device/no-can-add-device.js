import paths from '../../utils/paths'

import { imgBaseUrl } from '../../common/api'
import { rangersBurialPoint } from '../../utils/requestService'
import { getFullPageUrl } from '../../utils/util'
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    autoHeight: {
      type: String,
      value: '',
    },
    type: {
      type: String,
      value: '',
    },
    btnConent: {
      type: String,
      value: '添加智能设备',
    },
    isCanAddDevice: {
      type: Boolean,
      // value: false,
    },
    isLogon: {
      type: Boolean,
      // value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    centerImg: imgBaseUrl.url + '/mideaServices/images/img_no_book@1x.png',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    checkFun() {
      console.log('this.data.type', this.data.type)
      this.triggerEvent('checkNoDeviceBtn', this.data.type)
    },
    goToOtherChancel() {
      wx.navigateTo({
        url: paths.download + '?fm=addDevice',
      })
      rangersBurialPoint('user_behavior_event', {
        page_path: getFullPageUrl(),
        module: 'appliance',
        page_id: 'page_not_support_add_device',
        page_name: '小程序暂不支持配网页',
        widget_name: '其他官方渠道',
        widget_id: 'click_other_channel',
        object_type: '',
        object_id: '',
        object_name: '',
        device_info: {
          device_session_id: getApp().globalData.deviceSessionId || '', //一次配网事件标识
          sn: getApp().addDeviceInfo.sn || '', //sn码
          sn8: getApp().addDeviceInfo.sn8 || '', //sn8码
          a0: '', //a0码
          widget_cate: getApp().addDeviceInfo.type || '', //设备品类
        },
      })
      // this.triggerEvent('goToOtherChancel', '')
    },
  },
})
