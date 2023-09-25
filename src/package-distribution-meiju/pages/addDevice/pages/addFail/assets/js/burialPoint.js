import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'

export const burialPoint = {
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
        wifi_version: params.moduleVison,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: '', //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: '', //模组wifi版本
        link_type: 'bluetooth', //连接方式 bluetooth/ap/...
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
      page_id: 'page_connect_fail',
      page_name: '连接失败页',
      widget_id: 'click_retry',
      widget_name: '重试',
      object_type: '',
      object_id: '',
      object_name: '',
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
        link_type: 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },
}
