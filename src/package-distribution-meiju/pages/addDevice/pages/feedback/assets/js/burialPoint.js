import { rangersBurialPoint } from '../../../../../../utils/requestService'
import { getFullPageUrl } from '../../../../../../utils/util'

import { ApBurialPoint } from '../../../assets/js/burialPoint'

export const burialPoint = {
  //本地日志上报
  apLocalLog: (params) => {
    ApBurialPoint.apLocalLog({
      pageId: 'page_feedback',
      pageName: '问题反馈页面',
      log: params.log,
    })
  },
  /**
   * 问题反馈页面浏览埋点
   */
  feedbackView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_prob_feedback',
      page_name: '问题反馈页面',
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
   * 问题反馈提交成功弹窗
   */
  feedbackSuccessDialogView: (params) => {
    rangersBurialPoint('user_page_view', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_prob_feedback_success_pop',
      page_name: '问题反馈提交成功弹窗',
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
   * 帮助弹窗 点击提交
   */
  clickFeedbackSubmit: (params) => {
    rangersBurialPoint('user_behavior_event', {
      page_path: getFullPageUrl(),
      page_title: '',
      module: 'appliance',
      page_id: 'page_prob_feedback',
      page_name: '问题反馈页面',
      widget_name: '提交',
      widget_id: 'click_submit',
      object_type: '',
      object_id: '',
      object_name: '',
      ext_info: {
        content: params.question,
        phone: params.phone,
      },
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
