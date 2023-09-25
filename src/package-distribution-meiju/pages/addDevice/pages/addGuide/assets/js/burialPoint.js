import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'

export const burialPoint = {
  /**
   * 页面浏览埋点
   */
  addGuideView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_guide',
      page_name: '配网指引页',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: params.moduleVersion,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
    console.log('上报了配网指引页埋点')
  },

  /**
   * 页面浏览埋点
   */
  nearDecieView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_near_appliance',
      page_name: '靠近设备页',
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
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: '', //设备id
      },
    })
  },

  /**
   * 靠近确权页面点击跳过
   */
  clickSkipNear: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'approach',
      page_name: '靠近确权页面',
      widget_id: 'skip_button',
      widget_name: '跳过按钮',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.blueVersion, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },

  /**
   * 不允许跳过靠近确权弹窗
   */
  nearTimeoutDialogView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'approach_donotskip_popup',
      page_name: '靠近确权页面无法跳过时超时弹窗',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.blueVersion, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },

  /**
   * 不允许跳过靠近确权弹窗-点击重试
   */
  confirmNearTimeoutDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'approach_donotskip_popup',
      page_name: '靠近确权页面无法跳过时超时弹窗',
      widget_id: 'retry_button',
      widget_name: '重试按钮',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.blueVersion, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 不允许跳过靠近确权弹窗-点击退出
   */
  cancelNearTimeoutDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'approach_donotskip_popup',
      page_name: '靠近确权页面无法跳过时超时弹窗',
      widget_id: 'quit_button',
      widget_name: '退出按钮',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.blueVersion, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 跳过靠近弹窗
   */
  skipDialogView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_connect_guide',
      page_name: '连接指引弹窗',
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
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.deviceId || '', //设备id
      },
    })
  },

  /**
   * 跳过靠近弹窗  点击跳过
   */
  clickAbandonNearSkip: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_connect_guide',
      page_name: '连接指引弹窗',
      widget_id: 'click_skip',
      widget_name: '跳过',
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
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: '', //模组版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 跳过靠近弹窗  点击重试Retry
   */
  clickAbandonNearRetry: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_connect_guide',
      page_name: '连接指引弹窗',
      widget_id: 'click_retry',
      widget_name: '重试',
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
        a0: params.A0 || '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 页面浏览埋点
   */
  noFoundView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_no_appliance_found',
      page_name: '未发现设备页',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: params.moduleVersion,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: '', //模组wifi版本
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
      page_id: 'page_no equipment found',
      page_name: '未发现设备页',
      widget_id: 'click_retry',
      widget_name: '重试',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },
  /**
   * 配网指引返回结果
   */
  serverGuideResult: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'device_guidebook_page',
      page_name: '配网指引返回结果',
      widget_id: 'server_return',
      widget_name: '服务器返回',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        code: params.serverCode || '',
        cate: params.serverType || '',
        sn8: params.serverSn8 || '',
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.moduleVison || '', //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },

  /**
   * 下一步
   */
  clickGuideNext: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_guide',
      page_name: '配网指引页',
      widget_id: 'click_next',
      widget_name: '下一步',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: params.moduleVison,
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
   * 多配网指引展示-浏览埋点
   */
  getNewDeviceGuideInfoViewTrack: (params) => {
    rangersBurialPoint('user_page_view', {
      module: 'appliance',
      page_id: 'page_guide_show_switch', //参考接口请求参数“pageId”
      page_name: '配网指引页-展示切换指引', //当前页面的标题，顶部的title
      page_path: getFullPageUrl(), //当前页面的URL
      page_module: 'appliance',
      ext_info: {
        wifi_version: params.moduleVison,
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
   * 多配网指引展示-点击埋点
   */
  clickNewDeviceGuideInfoViewTrack: (params) => {
    rangersBurialPoint('user_behavior_event', {
      module: 'appliance',
      page_id: 'page_guide_show_switch', //参考接口请求参数“pageId”
      page_name: '配网指引页-展示切换指引', //当前页面的标题，顶部的title
      page_path: getFullPageUrl(), //当前页面的URL
      page_module: 'appliance',
      widget_id: 'click_switch_guide',
      widget_name: '切换指引',
      ext_info: {
        wifi_version: params.moduleVison,
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
   * 触屏配网扫码失败
   */
  touchScreenErrorDiolog: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popups_scan_qrcode_fail',
      page_name: '扫码失败弹窗',
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
   * 本地蓝牙 打开插件
   */
  clickDownLoadOpenPlugin: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_guide',
      page_name: '配网指引页',
      widget_id: 'click_download_open_plugin',
      widget_name: '下载并打开插件',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        wifi_version: params.moduleVersion || '',
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn || '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: params.linkType || '', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },
  /**
   * 配网指引页-倒计时结束帮助说明页面浏览埋点
   */
  notFoundDeviceWifiPopupView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_guide_cutdown_end_help',
      page_name: '配网指引页-倒计时结束帮助说明弹窗',
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
   * 帮助弹窗 点击重新设置设备
   */
  clickretrySetDevice: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_guide_cutdown_end_help',
      page_name: '配网指引页-倒计时结束帮助说明弹窗',
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
  clickFeedback: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_guide_cutdown_end_help',
      page_name: '配网指引页-倒计时结束帮助说明弹窗',
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
   * 蓝牙权限提示弹窗曝光埋点
   */
  bluetoothGuideView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_guide_permission_popup',
      page_name: '配网指引页-蓝牙权限弹窗',
      object_type: '',
      object_id: '',
      object_name: params.name || '',
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
   * 点击蓝牙权限指引埋点
   */
  clickBluetoothGuide: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_guide_permission_popup',
      page_name: '配网指引页-蓝牙权限弹窗',
      widget_name: '查看指引',
      widget_id: 'click_check_guide',
      object_type: '',
      object_id: '',
      object_name: params.name || '',
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
   * 点击蓝牙权弹窗点击放弃埋点
   */
  clickBluetoothQuit: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_guide_permission_popup',
      page_name: '配网指引页-蓝牙权限弹窗',
      widget_name: '放弃',
      widget_id: 'quit',
      object_type: '',
      object_id: '',
      object_name: params.name || '',
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
   * 点击蓝牙权限弹窗点击已完成埋点
   */
  clickBluetoothFinish: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_guide_permission_popup',
      page_name: '配网指引页-蓝牙权限弹窗',
      widget_name: '已完成操作',
      widget_id: 'finish',
      object_type: '',
      object_id: '',
      object_name: params.name || '',
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
   * 转换蓝牙配网提示弹窗
   */
  changeBlueDialog: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_guide_switch_bluetooth_pop',
      page_name: '配网指引页_切换蓝牙配网提示弹窗',
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
   * 转换蓝牙配网提示弹窗-点击自动连接
   */
  confirmChangeBlueDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_guide_switch_bluetooth_pop',
      page_name: '配网指引页_切换蓝牙配网提示弹窗',
      widget_id: '蓝牙自动连接',
      widget_name: 'bluetooth_connection',
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
   * 转换蓝牙配网提示弹窗-点击取消
   */
  cancelChangeBlueDialog: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_guide_switch_bluetooth_pop',
      page_name: '配网指引页_切换蓝牙配网提示弹窗',
      widget_id: '保留AP配网',
      widget_name: 'ap_connection',
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
   * 配网指引页-大屏绑定 mode=103 返回首页埋点
   */
  addGuideGoToHome: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'page_guide',
      page_name: '配网指引页',
      widget_id: 'got_it_buttom',
      widget_name: '	我知道了按钮',
      object_type: '',
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
}
