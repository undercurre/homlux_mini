import { rangersBurialPoint } from '../../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../../utils/util'
const app = getApp()

export const burialPoint = {
  /**
   * 正在分析浏览埋点
   */
  isSearchingView() {
    rangersBurialPoint('user_page_view', {
      module: 'appliance',
      page_path: getFullPageUrl(),
      page_id: 'search_hot_spot',
      page_name: '连接设备热点-搜索设备热点弹窗',
      ext_info: {
        wifi_version: app.addDeviceInfo.blueVersion,
      },
      device_info: {
        device_session_id: app.globalData.deviceSessionId, // 一次配网事件标识
        sn: app.addDeviceInfo.sn, // sn码
        sn8: app.addDeviceInfo.sn8, // sn8码
        a0: '', // a0码
        widget_cate: app.addDeviceInfo.type, // 设备品类
        wifi_model_version: '', // 模组wifi版本
        link_type: '', // 配网方式 bluetooth/ap/...
        iot_device_id: app.addDeviceInfo.deviceId, // 设备id
      },
    })
  },
  /**
   * 已找到设备WiFi-浏览埋点
   */
  foundWiFiView() {
    rangersBurialPoint('user_page_view', {
      module: 'appliance',
      page_path: getFullPageUrl(),
      page_id: 'hot_spot_tips',
      page_name: '连接设备热点-有热点提示弹窗',
      ext_info: {
        ext_info: app.addDeviceInfo.blueVersion || '',
      },
      device_info: {
        device_session_id: app.globalData.deviceSessionId, // 一次配网事件标识
        sn: app.addDeviceInfo.sn, // sn码
        sn8: app.addDeviceInfo.sn8, // sn8码
        a0: '', // a0码
        widget_cate: app.addDeviceInfo.type, // 设备品类
        wifi_model_version: '', // 模组wifi版本
        link_type: '', // 配网方式 bluetooth/ap/...
        iot_device_id: app.addDeviceInfo.deviceId, // 设备id
      },
    })
  },
  /**
   * 已找到设备WiFi-点击去连接
   */
  confirmFoundWiFi() {
    rangersBurialPoint('user_behavior_event', {
      module: 'appliance',
      page_path: getFullPageUrl(),
      page_id: 'hot_spot_tips',
      page_name: '连接设备热点-有热点提示弹窗',
      widget_id: 'connect',
      widget_name: '去连接按钮',
      device_info: {
        device_session_id: app.globalData.deviceSessionId, // 一次配网事件标识
        sn: app.addDeviceInfo.sn, // sn码
        sn8: app.addDeviceInfo.sn8, // sn8码
        a0: '', // a0码
        widget_cate: app.addDeviceInfo.type, // 设备品类
        wifi_model_version: '', // 模组版本
        link_type: '', // 配网方式 bluetooth/ap/...
        iot_device_id: app.addDeviceInfo.deviceId, // 设备id
      },
    })
  },
}
