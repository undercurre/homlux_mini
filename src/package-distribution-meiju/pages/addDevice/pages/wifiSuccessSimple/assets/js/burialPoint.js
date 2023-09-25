import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'

export const burialPoint = {
  /**
   * 页面浏览埋点
   */
  addSuccessView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: params.pageId,
      page_name: params.pageName,
      // object_type: '联网成功页',
      object_id: '',
      object_name: '',
      ext_info: {
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
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },
}
