import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'

export const burialPoint = {
  /**
   * 触屏配网提示绑定弹窗
   */
  touchScreenDiolog: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_add_appliance_notice',
      page_name: '设备添加提示弹窗',
      widget_id: '',
      widget_name: '',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        code: params.code || '',
        msg: params.msg || '',
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: 'screen_touch', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击触屏配网弹窗 是
   */
  touchScreenDiologConfirm: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_add_appliance_notice',
      page_name: '设备添加提示弹窗',
      widget_id: 'click_confirm',
      widget_name: '是',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: 'screen_touch', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击触屏配网弹窗 否
   */
  touchScreenDiologCancel: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_add_appliance_notice',
      page_name: '设备添加提示弹窗',
      widget_id: 'click_cancel',
      widget_name: '否',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: 'screen_touch', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 触屏配网扫码失败 点击知道了
   */
  touchScreenDiologClickKnow: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_scan_qrcode_fail',
      page_name: '扫码失败弹窗',
      widget_id: 'click_confirm',
      widget_name: '好的',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: 'screen_touch', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 小程序暂不支持配网页 浏览
   */
  viewNoSupportPage: (params) => {
    let { sn, sn8, type } = getApp().addDeviceInfo
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_not_support_add_device',
      page_name: '小程序暂不支持配网页',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: sn, //sn码
        sn8: sn8, //sn8码
        a0: '', //a0码
        widget_cate: type, //设备品类
      },
    })
  },

  /**
   * 5s搜不到设备二维码指引文案 浏览
   */
  viewScanHint: () => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_add_device',
      page_name: '添加设备页',
      widget_id: 'exposure_word_try_scanning',
      widget_name: '搜索不到设备尝试扫码提示',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
    })
  },
  /**
   * 5s搜不到设备点击二维码 跳转指引
   */
  clickScanHint: () => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_add_device',
      page_name: '添加设备页',
      widget_id: 'click_word_try_scanning',
      widget_name: '搜索不到设备尝试扫码提示',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
    })
  },
  /**
   * 调用微信扫一扫接口失败弹窗预览埋点
   */
  toClickToGuide: () => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_qrcode_unrecognized',
      page_name: '该二维码无法识别，请扫描正确的二维码弹窗',
      widget_id: 'click_confirm',
      widget_name: '查看指引',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
    })
  },
}
