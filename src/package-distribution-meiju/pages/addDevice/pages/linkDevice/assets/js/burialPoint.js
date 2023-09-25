import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'
import { ApBurialPoint } from '../../../assets/js/burialPoint'
const app = getApp()

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
  linkDeviceView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: params.pageId || 'page_connect',
      page_name: params.pageName || '连接设备页',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: params.moduleVison, //模组wifi版本
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version || '', //上报模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },
  /**
   * 二次配网安全设置弹窗
   */
  securityDialogView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_security_setting',
      page_name: '安全设置弹窗',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },
  /**
   * 二次配网安全设置弹窗 点击设置
   */
  clickSettingSecurityDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_security_setting',
      page_name: '安全设置弹窗',
      widget_id: 'click_setting',
      widget_name: '设置二次配网',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },
  /**
   * 二次配网安全设置弹窗 点击取消
   */
  clickCancelSecurityDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_security_setting',
      page_name: '安全设置弹窗',
      widget_id: 'click_cancel',
      widget_name: '取消二次配网',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },
  /**
   * 二次配网进度页
   */
  connecTwiceView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_WiFi_connect_twice',
      page_name: '联网进度页-二次配网',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: params.moduleVersion, //模组wifi版本
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version || '', //上报模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },
  /**
   * 放弃添加设备弹窗
   */
  abandonAddDialogView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_connect_quit',
      page_name: '放弃添加设备弹窗',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: params.type, //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVersion, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },

  /**
   * 放弃添加设备弹窗  点击在等等
   */
  clickWait: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_connect_quit',
      page_name: '放弃添加设备弹窗',
      widget_id: 'click_wait',
      widget_name: '再等等',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: '',
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
   * 放弃添加设备弹窗  点击放弃
   */
  clickAbandon: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_connect_quit',
      page_name: '放弃添加设备弹窗',
      widget_id: 'click_quit',
      widget_name: '放弃添加',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: params.moduleVersion,
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
   * 回连路由wifi失败
   */
  autoBackRouteFailure: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect',
      page_name: '连接设备页',
      widget_id: 'auto_back_route_failure',
      widget_name: '回连路由失败',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        device_ssid: params.ssid,
        frequency: params.frequency,
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
   * 回连路由成功
   */
  autoBackRouteSuccess: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect',
      page_name: '连接设备页',
      widget_id: 'auto_back_route_success',
      widget_name: '回连路由成功',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        device_ssid: params.ssid,
        frequency: params.frequency,
        rssi: params.rssi,
        wifi_version: params.moduleVersion, //模组wifi版本
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version || '', //上报模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 连上设备热点 / 蓝牙
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
        wifi_version: params.moduleVersion,
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
    console.log('连上设备热点埋点')
  },

  /**
   * 与设备热点建立数据通道 ap建立UDP通道成功；蓝牙：完成秘钥协商
   */
  connectDeviceSuccess: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect',
      page_name: '连接设备页',
      widget_id: 'connect_device_success',
      widget_name: '与设备热点建立数据通道',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        device_ssid: params.ssid,
        rssi: params.rssi,
        curPhoneIp: params.curIp || '',
        udpBroadcastAddress: params.udpBroadcastAddress,
        wifi_version: params.moduleVersion, //模组wifi版本
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version || '', //上报模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
    console.log('建立了连接通道埋点')
  },

  /**
   * 将密码发送给设备上报
   */
  sendPasswordToDevice: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect',
      page_name: '连接设备页',
      widget_id: 'send_password',
      widget_name: '将密码发送给设备上报',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        setnet_ssid: params.ssid,
        frequency: params.frequency,
        rssi: params.rssi,
        wifi_version: params.moduleVersion, //模组wifi版本
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version || '', //上报模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
    console.log('发送密码信息埋点')
  },

  /**
   * 开始云端发现设备
   */
  searchDevieLinkCloud: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect',
      page_name: '连接设备页',
      widget_id: 'device_networking',
      widget_name: '开始云端发现设备',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: params.moduleVersion, //模组wifi版本
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version || '', //上报模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
    console.log('开始云端发现设备埋点')
  },

  /**
   * 设备成功连上云
   */
  deviceSuccessLinkCloud: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect',
      page_name: '连接设备页',
      widget_id: 'find_device_sn',
      widget_name: '云端发现成功',
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
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
    console.log('云端发现成功埋点')
  },

  /**
   * 设备家庭绑定成功
   */
  deviceSuccessBindFamily: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect',
      page_name: '连接设备页',
      widget_id: 'connect_device_fix',
      widget_name: '家庭绑定成功',
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
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
    console.log('设备家庭绑定成功埋点')
  },

  /**
   * 主动连接wifi结果
   */
  connectWifiResult: (params) => {
    console.log('主动连接wifi埋点开始上报=========', params)
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_connect',
      page_name: '连接设备页',
      widget_id: 'connect_wifi_result',
      widget_name: '主动连接wifi结果',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        error_code: params.code || '',
        SSID: params.ssid || '',
      },
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
    console.log('主动连接wifi结果=========')
  },

  /**
   * 本地网络弹窗浏览埋点
   */
  localNetDialogView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popus_auth_wechat_local_network',
      page_name: '授权微信获取本地网络权限弹窗',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8 || '', //sn8码
        a0: '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
    console.log('本地网络弹窗浏览埋点')
  },
  //授权微信获取本地网络权限弹窗 点击放弃
  localNetDialogClickConfirm: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popus_auth_wechat_local_network',
      page_name: '授权微信获取本地网络权限弹窗',
      object_type: '',
      widget_id: 'click_give_up',
      widget_name: '放弃',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8 || '', //sn8码
        a0: '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
    console.log('授权微信获取本地网络权限弹窗 点击放弃')
  },
  //授权微信获取本地网络权限弹窗 点击查看指引
  localNetDialogClickLookGuide: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popus_auth_wechat_local_network',
      page_name: '授权微信获取本地网络权限弹窗',
      widget_id: 'click_check_guide',
      widget_name: '查看指引',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8 || '', //sn8码
        a0: '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
    console.log('授权微信获取本地网络权限弹窗 点击查看指引')
  },

  /**
   * 蓝牙配网密码错误提示弹窗
   */
  // 蓝牙配网密码错误提示弹窗 浏览埋点
  bluePswFailDialogView: (params) => {
    rangersBurialPoint('content_exposure_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_process',
      page_name: '联网进度页',
      widget_id: 'exposure_wrong_pw',
      widget_name: '密码错误提示弹窗',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8 || '', //sn8码
        a0: '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },
  // 蓝牙配网密码错误提示弹窗 点击重试
  clickRetryBluePswFailDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_process',
      page_name: '联网进度页',
      widget_id: 'click_wrong_pw_btn_retry',
      widget_name: '密码错误提示弹窗-确认按钮',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8 || '', //sn8码
        a0: '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },
  // 蓝牙配网密码错误提示弹窗 点击关闭
  clickCloseBluePswFailDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_process',
      page_name: '联网进度页',
      widget_id: 'click_wrong_pw_btn_closed',
      widget_name: '密码错误提示弹窗-关闭按钮',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8 || '', //sn8码
        a0: '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },
  // 不支持控制弹窗曝光
  unsupportDialogView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'unable_control_prompt_popup',
      page_name: '不支持控制弹窗',
      widget_id: '',
      widget_name: '',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn8: params.sn8 || '', //sn8码
        a0: params.a0 || '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
        product_model: '', //设备型号
      },
    })
  },
  // 不支持控制弹窗 点击继续联网
  clickContinueUnsupportDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'unable_control_prompt_popup',
      page_name: '不支持控制弹窗',
      widget_id: 'continue_networking_button',
      widget_name: '继续联网按钮',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn8: params.sn8 || '', //sn8码
        a0: params.a0 || '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
        product_model: '', //设备型号
      },
    })
  },
  // 不支持控制弹窗 放弃继续联网
  clickCancelUnsupportDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'unable_control_prompt_popup',
      page_name: '不支持控制弹窗',
      widget_id: 'give_up_button',
      widget_name: '放弃按钮',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn8: params.sn8 || '', //sn8码
        a0: params.a0 || '', //a0码
        widget_cate: params.type || '', //设备品类
        wifi_model_version: params.moduleVersion || '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
        product_model: '', //设备型号
      },
    })
  },
}
