import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'
import { ApBurialPoint } from '../../../assets/js/burialPoint'

export const burialPoint = {
  //本地日志上报
  apLocalLog: (params) => {
    ApBurialPoint.apLocalLog({
      pageId: 'page_connect_appliance_hotspot',
      pageName: '连接设备热点页',
      log: params.log,
    })
  },
  /**
   * 页面浏览埋点
   */
  linkApView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_connect_appliance_hotspot',
      page_name: '连接设备热点页',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },
  /**
   * 点击找不到设备热点
   */
  clickNoFoundDeviceAp: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect_appliance_hotspot',
      page_name: '连接设备热点页',
      widget_name: '找不到设备？',
      widget_id: 'click_cannot_find_appliance',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId, //设备id
      },
    })
  },

  /**
   * 连上设备热点
   */
  connectWifiDeviceHotspot: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect',
      page_name: '连接设备页',
      widget_id: 'connect_wifi_device_hotspot',
      widget_name: '连上设备热点',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        device_ssid: params.ssid,
        rssi: params.rssi,
        wifi_version: params.moduleVersion || '',
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
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
   * 点击去连接设备热点
   */
  goToLinkDeviceWifi: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect_appliance_hotspot',
      page_name: '连接设备热点页',
      widget_id: 'connect_device',
      widget_name: '去连接设备WiFi',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        device_ssid: params.ssid,
        rssi: params.rssi,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   *  页面隐藏
   */
  linkApPageHide: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_connect_appliance_hotspot',
      page_name: '连接设备热点页',
      widget_id: 'background',
      widget_name: '页面隐藏',
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
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },
  /**
   *  页面展示
   */
  linkApPageShow: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_connect_appliance_hotspot',
      page_name: '连接设备热点页',
      widget_id: 'reception',
      widget_name: '页面显示',
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
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

  /**
   * 选择设备wifi弹窗
   */
  showDeviceWifiListSheet: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'popups_page_device_wifi_connect',
      page_name: '选择设备wifi弹窗',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_device_info_list: params.wifiList,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

  /**
   * 关闭 选择设备wifi弹窗
   */
  closeDeviceWifiListSheet: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      page_id: 'popups_page_device_wifi_connect',
      page_name: '选择设备wifi弹窗',
      widget_name: '退出',
      widget_id: 'click_close',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_info_list: params.wifiList,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

  /**
   * 选择设备wifi弹窗 点击使用此wifi
   */
  clickLinkDeviceWifi: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'popups_page_device_wifi_connect',
      page_name: '选择设备wifi弹窗',
      widget_name: '使用此wifi',
      widget_id: 'clici_wifi_connect',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_device_info: params.wifiInfo, //点击的设备WiFi信息
        wifi_device_info_list: params.wifiList, //拉取到的设备wifi信息列表
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

  /**
   * 点击未找到wifi
   */
  clickNoFoundDeviceWifi: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'popups_page_device_wifi_connect',
      page_name: '选择设备wifi弹窗',
      widget_name: '未找到wifi',
      widget_id: 'click_wifi_not_found',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_device_info_list: params.wifiList, //拉取到的设备wifi信息列表
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

  /**
   * 查看连接步骤
   */
  clickLookLinkStep: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_connect_appliance_hotspot',
      page_name: '连接设备热点页',
      widget_name: '查看连接步骤',
      widget_id: 'click_connect_steps',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

  /**
   * 找不到设备wifi帮助说明弹窗浏览埋点
   */
  notFoundDeviceWifiPopupView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_connect_appliance_hotspot_cannot_find_appliance_help',
      page_name: '连接设备热点页-找不到设备wifi帮助说明弹窗',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

  /**
   * 帮助弹窗 点击重新操作设备
   */
  clickreytyDevice: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_connect_appliance_hotspot_cannot_find_appliance_help',
      page_name: '连接设备热点页-找不到设备wifi帮助说明弹窗',
      widget_name: '去重新操作',
      widget_id: 'click_op_again',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

  /**
   * 帮助弹窗 点击去提交问题
   */
  clickfeedback: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_connect_appliance_hotspot_cannot_find_appliance_help',
      page_name: '连接设备热点页-找不到设备wifi帮助说明弹窗',
      widget_name: '去提交问题',
      widget_id: 'click_submit_prob',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

  /**
   * 帮助弹窗 点击关闭
   */
  clickCloseHelpDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_connect_appliance_hotspot_cannot_find_appliance_help',
      page_name: '连接设备热点页-找不到设备wifi帮助说明弹窗',
      widget_name: '关闭',
      widget_id: 'click_off',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },
}
