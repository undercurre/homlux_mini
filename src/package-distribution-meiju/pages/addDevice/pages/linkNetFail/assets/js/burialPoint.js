import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'

export const burialPoint = {
  /**
   * 页面浏览埋点 输入家庭WiFi密码页
   */
  linkNetFailView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: params.pageId,
      page_name: params.pageName,
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        errorCode: params.errorCode,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },
  /**
   * 点击重试
   */
  clickRetry: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_WiFi_connect_fail',
      page_name: 'WiFi联网失败页',
      widget_id: 'click_retry',
      widget_name: '重试',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: params.moduleVersion || '',
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * WiFi测试中弹窗
   */
  pingWifiDialogShow: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_WiFi_testing',
      page_name: 'WiFi测试中弹窗',
      widget_id: '',
      widget_name: '',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 请连接到WiFi再进行测试弹窗
   */
  linkTargetWifiDialogShow: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_request_connect_WiFi',
      page_name: '请连接到WiFi再进行测试弹窗',
      widget_id: '',
      widget_name: '',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 需要打开WLAN开关并请连接到WiFi弹窗
   */
  openWifiDialogShow: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_open_WLAN_connect_WiFi',
      page_name: '需要打开WLAN开关并请连接到WiFi弹窗',
      widget_id: '',
      widget_name: '',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击测试一下
   */
  clickPingNetTest: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_WiFi_connect_fail',
      page_name: 'WiFi联网失败页',
      widget_id: 'click_test',
      widget_name: '测试一下',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击返回首页
   */
  clickBackToHome: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_WiFi_connect_fail',
      page_name: 'WiFi联网失败页',
      widget_id: 'click_back_page_home',
      widget_name: '返回首页',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击WiFi测试中弹窗 取消
   */
  clickPingWifiDialogCancel: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_WiFi_testing',
      page_name: 'WiFi测试中弹窗',
      widget_id: 'click_cancel',
      widget_name: '取消',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击请连接到WiFi再进行测试弹窗 去设置
   */
  clickRequestWifiDialogSetting: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_request_connect_WiFi',
      page_name: '请连接到WiFi再进行测试弹窗',
      widget_id: 'click_setting',
      widget_name: '去设置',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击请连接到WiFi再进行测试弹窗 取消
   */
  clickRequestWifiDialogCancel: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_request_connect_WiFi',
      page_name: '请连接到WiFi再进行测试弹窗',
      widget_id: 'click_cancel',
      widget_name: '取消',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击需要打开WLAN开关并请连接到WiFi弹窗 去设置
   */
  clickOpenWifiDialogSetting: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_open_WLAN_connect_WiFi',
      page_name: '需要打开WLAN开关并请连接到WiFi弹窗',
      widget_id: 'click_setting',
      widget_name: '去设置',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 点击需要打开WLAN开关并请连接到WiFi弹窗 取消
   */
  clickOpenWifiDialogCancel: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_open_WLAN_connect_WiFi',
      page_name: '需要打开WLAN开关并请连接到WiFi弹窗',
      widget_id: 'click_cancel',
      widget_name: '取消',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 联网失败 点击跳转二次验证网络指引
   */
  clickSecondNetGuide: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_fail',
      page_name: '联网失败页',
      widget_id: 'click_btn_se_network',
      widget_name: '二次网络提示',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 联网失败 点击跳转本地网络指引
   */
  clickLocalNetGuide: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_fail',
      page_name: '联网失败页',
      widget_id: 'click_btn_lo_network',
      widget_name: '本地网络提示',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 联网失败 点击跳转开启路由器白名单指引
   */
  clickWhitelistGuide: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_fail',
      page_name: '联网失败页',
      widget_id: 'click_btn_whitelist',
      widget_name: '路由器白名单提示',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 联网失败 点击跳转开启路由器DHCP功能指引
   */
  clickDHCPGuide: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_fail',
      page_name: '联网失败页',
      widget_id: 'click_btn_DHCP',
      widget_name: 'DHCP提示',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },
  /**
   * 组合失败-重新联网曝光
   * @param {*} params
   */
  reLinkView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_device__failed_detail_page',
      page_name: '辅设备失败详情页-登录云端失败',
      widget_id: '',
      widget_name: '',
      rank: '',
      ext_info: 'reason_cloud_login_failed',
      device_info: {
        device_session_id: params.deviceSessionId || '', //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8 || '', //sn8码
        a0: params.a0 || '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //上报模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },
  /**
   * 组合失败-重新绑定曝光
   * @param {*} params
   */
  reBindView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_device__failed_detail_page',
      page_name: '辅设备失败详情页-绑定失败',
      widget_id: '',
      widget_name: '',
      rank: '',
      ext_info: 'reason_binding_failed',
      device_info: {
        device_session_id: params.deviceSessionId || '', //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8 || '', //sn8码
        a0: params.a0 || '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //上报模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },
  /**
   * 组合失败-点击重新绑定
   */
  clickReLink: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_device__failed_detail_page',
      page_name: '辅设备失败详情页-登录云端失败',
      widget_id: 'retry',
      widget_name: '重新联网',
      rank: '',
      ext_info: 'reason_cloud_login_failed',
      device_info: {
        device_session_id: params.deviceSessionId || '', //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8 || '', //sn8码
        a0: params.a0 || '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //上报模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },
  /**
   * 组合失败-点击重新绑定
   */
  clickReBind: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_device__failed_detail_page',
      page_name: '组合设备失败页-绑定失败',
      widget_id: 'retry',
      widget_name: '重新绑定',
      rank: '',
      ext_info: 'reason_binding_failed',
      device_info: {
        device_session_id: params.deviceSessionId || '', //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8 || '', //sn8码
        a0: params.a0 || '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //上报模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },
}
