import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'
const app = getApp()

export const burialPoint = {
  /**
   * 组合失败页面浏览埋点
   */
  combinedFailView: (params) => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_device__failed_page',
      page_name: params.pageName || '组合设备失败页',
      widget_id: '',
      widget_name: '',
      rank: '',
      ext_info: params.extInfo,
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
   * 点击完成
   */
  clickFinish: () => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_device__failed_page',
      page_name: '组合设备失败页-联网失败',
      widget_id: 'finish',
      widget_name: '完成按钮',
      rank: '',
      ext_info: 'reason_networking_failed',
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
   * 点击查看原因
   */
  clickViewReason: () => {
    const { type, plainSn, sn8, a0 } = app.combinedDeviceInfo[0]
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: 'combined_device__failed_page',
      page_name: '组合设备失败页-联网失败',
      widget_id: 'view_reason',
      widget_name: '查看原因按钮',
      rank: '',
      ext_info: 'reason_networking_failed',
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
}
