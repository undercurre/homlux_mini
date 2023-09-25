import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'

import { ApBurialPoint } from '../../../assets/js/burialPoint'

export const burialPoint = {
  //本地日志上报
  apLocalLog: (params) => {
    ApBurialPoint.apLocalLog({
      pageId: 'page_WiFi_edit',
      pageName: '输入家庭WiFi密码页',
      log: params.log,
    })
  },
  /**
   * 页面浏览埋点 输入家庭WiFi密码页
   */
  inputWifiView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_connect_WiFi_notice',
      page_name: '请将手机连接上WiFi页',
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
   * 获取到wifi信息后上报
   */
  wifiInfo: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_WiFi_edit',
      page_name: '输入家庭WiFi密码页',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        ssid: params.ssid,
        frequency: params.frequency,
        rssi: params.rssi,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: params.type, //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId, //设备id
      },
    })
  },
  /**
   * 获取到wifi信息后上报
   */
  clickNext: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_WiFi_edit',
      page_name: '输入家庭WiFi密码页',
      widget_name: params.widgetName,
      widget_id: params.widgetId || 'click_next',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        ssid: params.ssid,
        frequency: params.frequency,
        rssi: params.rssi,
        wifi_version: params.moduleVison,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId, //设备id
      },
    })
  },
  /**
   * 获取到wifi信息后上报
   */
  clickSkip: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_WiFi_edit',
      page_name: '输入家庭WiFi密码页',
      widget_name: '跳过',
      widget_id: 'click_skip',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
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
   * 点击切换wifi
   */
  clickSwitchWifi: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_WiFi_edit',
      page_name: '输入家庭WiFi密码页',
      widget_name: '切换wifi',
      widget_id: 'wifi_change_click',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
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
   * 点击连接wifi
   */
  clickLinkWifi: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect_WiFi_notice',
      page_name: '请将手机连接上WiFi页',
      widget_name: '去连接wifi',
      widget_id: 'click_connect_WiFi',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: params.moduleVison || '',
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },

  /**
   * 跳过，去近距离控制
   */
  clickSkipToBlueControl: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: params.pageId,
      page_name: params.pageName,
      widget_name: '跳过',
      widget_id: 'click_skip',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },

  /**
   * 选择家庭wifi弹窗
   */
  showWifiListSheet: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'popups_page_home_wifi_connect',
      page_name: '选择家庭wifi弹窗',
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
   * 关闭 选择家庭wifi弹窗
   */
  closeWifiListSheet: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'popups_page_home_wifi_connect',
      page_name: '选择家庭wifi弹窗',
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
   * 使用此家庭wifi
   */
  clickLinkFamilyWifi: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'popups_page_home_wifi_connect',
      page_name: '选择家庭wifi弹窗',
      widget_name: '使用此wifi',
      widget_id: 'clici_wifi_connect',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_info: params.wifiInfo,
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
   * 点击未找到wifi
   */
  clickNoFoundFamilyWifi: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'popups_page_home_wifi_connect',
      page_name: '选择家庭wifi弹窗',
      widget_name: '未找到想连接的wifi？',
      widget_id: 'click_wifi_not_found',
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
   * 点击已连接wifi
   */
  clickconnectedWifi: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_connect_WiFi_notice',
      page_name: '请将手机连接上WiFi页',
      widget_name: '已连接家庭WiFi',
      widget_id: 'click_connect_WiFi',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
      },
    })
  },

  /**
   * 已连接WiFi提示弹窗 提示升级版本
   */
  viewTipUpVersion: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'popup_connected_WiFi',
      page_name: '已连接WiFi提示弹窗',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
      },
    })
  },

  /**
   * 请将手机连上wifi页 show and hide
   */
  noticeWifiPageStatus: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect_WiFi_notice',
      page_name: '请将手机连接上WiFi页',
      widget_name: params.pageStatus == 'show' ? '页面显示' : '页面隐藏',
      widget_id: params.pageStatus == 'show' ? 'reception' : 'background',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
      },
    })
    console.log('请将手机连上wifi页 show and hide')
  },

  /**
   * 输入家庭WiFi密码页 show and hide
   */
  editWifiPageStatus: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_WiFi_edit',
      page_name: '输入家庭WiFi密码页',
      widget_name: params.pageStatus == 'show' ? '页面显示' : '页面隐藏',
      widget_id: params.pageStatus == 'show' ? 'reception' : 'background',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
      },
    })
    console.log('输入家庭WiFi密码页 show and hide')
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
   * AP配网自动转换蓝牙配网vv
   */
  autoChangeBlue: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_WiFi_edit',
      page_name: 'wifi登记页',
      widget_id: '优先蓝牙配网-切换成功',
      widget_name: 'api_prior_bluetooth_success',
      ext_info: {
        wifi_version: params.blueVersion,
      },
      device_info: {
        device_session_id: params.deviceSessionId, // 一次配网事件标识
        wifi_model_version: '', // 模组wifi版本
        iot_device_id: params.deviceId, // 设备id
        link_type: params.linkType || 'bluetooth', // 连接方式 bluetooth/ap/...
        sn: params.sn, // sn码
        sn8: params.sn8, // sn8码
        widget_cate: params.type, // 设备品类
      },
    })
  },

  /**
   * 点击已连接wifi  new 2.31
   */
  connectedWifi: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_id: 'found_wifi',
      page_name: 'wifi登记页-已连接wifi',
      module: 'appliance',
      widget_id: '',
      widget_name: '',
      open_id: '',
      page_path: getFullPageUrl(),
      object_type: '',
      object_id: '',
      click_id: '',
      object_name: '',
      page_title: '',
      device_info: {
        device_session_id: params.deviceSessionId, // 一次配网事件标识
        wifi_model_version: '', // 模组wifi版本
        iot_device_id: params.deviceId, // 设备id
        link_type: params.linkType || 'bluetooth', // 连接方式 bluetooth/ap/...
        sn: params.sn, // sn码
        sn8: params.sn8, // sn8码
        widget_cate: params.type, // 设备品类
      },
      ext_info: {},
    })
  },

  /**
   * 手动输入提示弹窗  显示时埋点
   */
  showManualInputWiFi: (params) => {
    rangersBurialPoint('user_page_view', {
      page_id: 'manual_input_pop',
      page_name: '已连接wifi-手动输入弹窗',
      module: 'appliance',
      widget_id: '',
      widget_name: '',
      open_id: '',
      page_path: getFullPageUrl(),
      object_type: '',
      object_id: '',
      click_id: '',
      object_name: '',
      page_title: '',
      device_info: {
        device_session_id: params.deviceSessionId, // 一次配网事件标识
        wifi_model_version: '', // 模组wifi版本
        iot_device_id: params.deviceId, // 设备id
        link_type: params.linkType || 'bluetooth', // 连接方式 bluetooth/ap/...
        sn: params.sn, // sn码
        sn8: params.sn8, // sn8码
        widget_cate: params.type, // 设备品类
      },
      ext_info: {},
    })
  },

  /**
   * 点击手动输入
   */
  clickManualInputWiFiButton: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_id: 'manual_input_pop',
      page_name: '已连接wifi-手动输入弹窗',
      module: 'appliance',
      widget_id: 'manual_input',
      widget_name: '手动输入',
      open_id: '',
      page_path: getFullPageUrl(),
      object_type: '',
      object_id: '',
      click_id: '',
      object_name: '',
      page_title: '',
      device_info: {
        device_session_id: params.deviceSessionId, // 一次配网事件标识
        wifi_model_version: '', // 模组wifi版本
        iot_device_id: params.deviceId, // 设备id
        link_type: params.linkType || 'bluetooth', // 连接方式 bluetooth/ap/...
        sn: params.sn, // sn码
        sn8: params.sn8, // sn8码
        widget_cate: params.type, // 设备品类
      },
      ext_info: {},
    })
  },

  /**
   * 显示精准位置提示弹窗
   */
  showPreciseLocation: (params) => {
    rangersBurialPoint('user_page_view', {
      page_id: 'open_the_precise_position',
      page_name: '打开精准位置弹窗',
      module: 'appliance',
      widget_id: '',
      widget_name: '',
      open_id: '',
      page_path: getFullPageUrl(),
      object_type: '',
      object_id: '',
      click_id: '',
      object_name: '',
      page_title: '',
      device_info: {
        device_session_id: params.deviceSessionId, // 一次配网事件标识
        wifi_model_version: '', // 模组wifi版本
        iot_device_id: params.deviceId, // 设备id
        link_type: params.linkType || 'bluetooth', // 连接方式 bluetooth/ap/...
        sn: params.sn, // sn码
        sn8: params.sn8, // sn8码
        widget_cate: params.type, // 设备品类
      },
      ext_info: {},
    })
  },

  /**
   * 点击去操作
   */
  clickSetting: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_id: 'open_the_precise_position',
      page_name: '打开精准位置弹窗',
      module: 'appliance',
      widget_id: 'to_operate',
      widget_name: '去操作',
      open_id: '',
      page_path: getFullPageUrl(),
      object_type: '',
      object_id: '',
      click_id: '',
      object_name: '',
      page_title: '',
      device_info: {
        device_session_id: params.deviceSessionId, // 一次配网事件标识
        wifi_model_version: '', // 模组wifi版本
        iot_device_id: params.deviceId, // 设备id
        link_type: params.linkType || 'bluetooth', // 连接方式 bluetooth/ap/...
        sn: params.sn, // sn码
        sn8: params.sn8, // sn8码
        widget_cate: params.type, // 设备品类
      },
      ext_info: {},
    })
  },
  /**
   * 点击查看操作指引
   */
  clickToOperate: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_id: 'open_the_precise_position',
      page_name: '打开精准位置弹窗',
      module: 'appliance',
      widget_id: 'view_guidance',
      widget_name: '查看操作指引',
      open_id: '',
      page_path: getFullPageUrl(),
      object_type: '',
      object_id: '',
      click_id: '',
      object_name: '',
      page_title: '',
      device_info: {
        device_session_id: params.deviceSessionId, // 一次配网事件标识
        wifi_model_version: '', // 模组wifi版本
        iot_device_id: params.deviceId, // 设备id
        link_type: params.linkType || 'bluetooth', // 连接方式 bluetooth/ap/...
        sn: params.sn, // sn码
        sn8: params.sn8, // sn8码
        widget_cate: params.type, // 设备品类
      },
      ext_info: {},
    })
  },
  /**
   * 显示手动输入wifi名页面
   */
  showManualInputWiFiPage: (params) => {
    rangersBurialPoint('user_page_view', {
      page_id: 'wifi_manual_input',
      page_name: 'wifi登记页-手动输入名称',
      module: 'appliance',
      widget_id: '',
      widget_name: '',
      open_id: '',
      page_path: getFullPageUrl(),
      object_type: '',
      object_id: '',
      click_id: '',
      object_name: '',
      page_title: '',
      device_info: {
        device_session_id: params.deviceSessionId, // 一次配网事件标识
        wifi_model_version: '', // 模组wifi版本
        iot_device_id: params.deviceId, // 设备id
        link_type: params.linkType || 'bluetooth', // 连接方式 bluetooth/ap/...
        sn: params.sn, // sn码
        sn8: params.sn8, // sn8码
        widget_cate: params.type, // 设备品类
      },
      ext_info: {},
    })
  },
}
