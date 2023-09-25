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
        isTwice: params.isTwice ? 1 : 0, //是否二次配网：1为是，0为否
        wifi_version: params.moduleVersion,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
      },
    })
  },
  /**
   * 点击保存
   */
  clickSave: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      module: 'appliance',
      page_id: params.pageId,
      page_name: params.pageName,
      widget_name: '完成',
      widget_id: 'click_finish',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        appliance_name: params.deviceName,
        family: params.family,
        room: params.room,
        isTwice: params.isTwice ? 1 : 0, //是否二次配网：1为是，0为否
        wifi_version: params.moduleVersion,
      },
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode, //设备id
      },
    })
  },

  /**
   * 新增房间弹窗
   */
  increaseRoomView: (params) => {
    rangersBurialPoint('user_page_view', {
      module: 'appliance',
      page_id: params.pageId,
      page_name: params.pageName,
      widget_id: '',
      widget_name: '',
      rank: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
        product_model: '',
      },
    })
  },

  /**
   * 取消新增房间弹窗
   */
  cancelAddRoom: (params) => {
    rangersBurialPoint('user_behavior_event', {
      module: 'appliance',
      page_id: params.pageId,
      page_name: params.pageName,
      widget_id: 'cancel_button',
      widget_name: '取消按钮',
      rank: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
        product_model: '',
      },
    })
  },

  /**
   * 确定新增房间弹窗
   */
  confirmAddRoom: (params) => {
    rangersBurialPoint('user_behavior_event', {
      module: 'appliance',
      page_id: params.pageId,
      page_name: params.pageName,
      widget_id: 'sure_button',
      widget_name: '确定按钮',
      rank: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
        product_model: '',
      },
    })
  },

  /**
   * 创建房间失败弹窗
   */
  failIncreaseRoom(params) {
    rangersBurialPoint('user_page_view', {
      module: 'appliance',
      page_id: params.pageId,
      page_name: params.pageName,
      widget_id: '',
      widget_name: '',
      rank: '',
      ext_info: {},
      device_info: {
        device_session_id: params.deviceSessionId, //一次配网事件标识
        sn: params.sn, //sn码
        sn8: params.sn8, //sn8码
        a0: '', //a0码
        widget_cate: params.type, //设备品类
        wifi_model_version: params.wifi_version, //模组wifi版本
        link_type: params.linkType || 'bluetooth', //连接方式 bluetooth/ap/...
        iot_device_id: params.applianceCode || '', //设备id
        product_model: '',
      },
    })
  },
}
