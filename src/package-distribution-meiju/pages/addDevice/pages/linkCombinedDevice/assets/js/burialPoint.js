import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'
const app = getApp()

export const burialPoint = {
  /**
   * 组合进度页面浏览埋点
   */
  combinedDeviceView: (params) => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: params.pageId || 'combined_device_networking_page',
      page_name: params.pageName || '辅设备联网页',
      widget_id: '',
      widget_name: '',
      rank: '',
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: plainSn, //sn码
        sn8: sn8, //sn8码
        a0: a0, //a0码
        widget_cate: type, //设备品类
        wifi_model_version: app.addDeviceInfo.moduleVersion || '', //上报模组版本
        link_type: '', //连接方式
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },
  /**
   * 放弃添加设备弹窗
   */
  abandonAddDialogView: () => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_device_networking_cancel_popup',
      page_name: '组合设备联网页-取消联网二次确认弹窗',
      widget_id: '',
      widget_name: '',
      rank: '',
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: plainSn, //sn码
        sn8: sn8, //sn8码
        a0: a0, //a0码
        widget_cate: type, //设备品类
        wifi_model_version: app.addDeviceInfo.moduleVersion || '', //上报模组版本
        link_type: '', //连接方式
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },

  /**
   * 放弃添加设备弹窗 点击再等等
   */
  clickWaitAminuteDialog: () => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_device_networking_cancel_popup',
      page_name: '组合设备联网页-取消联网二次确认弹窗',
      widget_id: 'wait_buttom',
      widget_name: '再等等按钮',
      rank: '',
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: plainSn, //sn码
        sn8: sn8, //sn8码
        a0: a0, //a0码
        widget_cate: type, //设备品类
        wifi_model_version: app.addDeviceInfo.moduleVersion || '', //上报模组版本
        link_type: '', //连接方式
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },
  /**
   * 放弃添加设备弹窗 点击放弃添加
   */
  clickCancelAbandonDialog: () => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_device_networking_cancel_popup',
      page_name: '组合设备联网页-取消联网二次确认弹窗',
      widget_id: 'quit_buttom',
      widget_name: '放弃添加按钮',
      rank: '',
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: plainSn, //sn码
        sn8: sn8, //sn8码
        a0: a0, //a0码
        widget_cate: type, //设备品类
        wifi_model_version: app.addDeviceInfo.moduleVersion || '', //上报模组版本
        link_type: '', //连接方式
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },

  /**
   * 组合失败弹窗
   */
  combinedFailDialogView: () => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_failed_popup',
      page_name: '组合失败提示弹窗',
      widget_id: '',
      widget_name: '',
      rank: '',
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: plainSn, //sn码
        sn8: sn8, //sn8码
        a0: a0, //a0码
        widget_cate: type, //设备品类
        wifi_model_version: app.addDeviceInfo.moduleVersion || '', //上报模组版本
        link_type: '', //连接方式
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },
  /**
   * 组合失败弹窗 点击重试
   */
  clickRetryFailDialog: () => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_failed_popup',
      page_name: '组合失败提示弹窗',
      widget_id: 'retry_buttom',
      widget_name: '重试按钮',
      rank: '',
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: plainSn, //sn码
        sn8: sn8, //sn8码
        a0: a0, //a0码
        widget_cate: type, //设备品类
        wifi_model_version: app.addDeviceInfo.moduleVersion || '', //上报模组版本
        link_type: '', //连接方式
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },
  /**
   * 组合失败弹窗 点击取消
   */
  clickCancelFailDialog: () => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_failed_popup',
      page_name: '组合失败提示弹窗',
      widget_id: 'cancel_buttom',
      widget_name: '取消按钮',
      rank: '',
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: plainSn, //sn码
        sn8: sn8, //sn8码
        a0: a0, //a0码
        widget_cate: type, //设备品类
        wifi_model_version: app.addDeviceInfo.moduleVersion || '', //上报模组版本
        link_type: '', //连接方式
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
  },

  /**
   * 本地网络弹窗浏览埋点
   */
  localNetDialogView: () => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'popus_auth_wechat_local_network',
      page_name: '授权微信获取本地网络权限弹窗',
      object_type: '',
      object_id: '',
      object_name: '',
      device_info: {
        device_session_id: app.globalData.deviceSessionId || '', //一次配网事件标识
        sn: plainSn, //sn码
        a0: a0, //a0码
        widget_cate: type, //设备品类
        wifi_model_version: app.addDeviceInfo.moduleVersion || '', //上报模组版本
        link_type: '', //连接方式
        iot_device_id: '', //设备id
        product_model: '', //设备型号
      },
    })
    console.log('本地网络弹窗浏览埋点')
  },
}
