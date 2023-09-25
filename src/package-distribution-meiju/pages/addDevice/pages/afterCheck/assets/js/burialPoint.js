import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'
const app = getApp()
export const burialPoint = {
  /**
   * 页面浏览埋点 输入家庭WiFi密码页
   */
  afterCheckoutView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'pages_confirm_rights',
      page_name: '后确权页',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      // device_info: {
      //     "device_session_id": params.deviceSessionId, //一次配网事件标识
      //     "sn": params.sn, //sn码
      //     "sn8": params.sn8, //sn8码
      //     "a0": '', //a0码
      //     "widget_cate": params.type, //设备品类
      //     "wifi_model_version": params.moduleVison, //模组wifi版本
      //     "link_type": 'bluetooth', //连接方式 bluetooth/ap/...
      //     "iot_device_id": '' //设备id
      // }
    })
  },

  afterCheckJumpFail: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'no_plugin_package_obtained',
      page_name: '无法跳转插件页弹窗',
      widget_id: '',
      widget_name: '',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: app.addDeviceInfo.cloudBackDeviceInfo.modelNumber || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: app.addDeviceInfo.blueVersion || '', //模组wifi版本
        link_type: app.addDeviceInfo.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  afterCheckConfirm: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'no_plugin_package_obtained',
      page_name: '无法跳转插件页弹窗',
      widget_id: 'got_it_button',
      widget_name: '我知道了按钮',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: app.addDeviceInfo.cloudBackDeviceInfo.modelNumber || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: app.addDeviceInfo.blueVersion || '', //模组wifi版本
        link_type: app.addDeviceInfo.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },
  afterCheckCancel: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'no_plugin_package_obtained',
      page_name: '无法跳转插件页弹窗',
      widget_id: 'homepage_button',
      widget_name: '返回首页按钮',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: app.addDeviceInfo.cloudBackDeviceInfo.modelNumber || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: app.addDeviceInfo.blueVersion || '', //模组wifi版本
        link_type: app.addDeviceInfo.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },
}
