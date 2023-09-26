import { rangersBurialPoint } from '../../../utils/requestService'
import { getFullPageUrl } from '../../../utils/util'
Component({
  properties: {
    title: {
      type: String,
      value: '标题',
    },
    // 弹窗内容
    content: {
      type: String,
      value: '内容',
    },
    // 弹窗取消按钮文字
    btn_no: {
      type: String,
      value: '取消',
    },
    // 弹窗确认按钮文字
    btn_ok: {
      type: String,
      value: '确定',
    },
    // 弹窗确认按钮文字
    btnz_only: {
      type: String,
      value: '知道了',
    },
    isShowSureDialog: {
      type: Boolean,
      value: false,
      observer(val) {
        this.getShowDialog(val)
      },
    },
    dialogMixinsBtns: {
      type: Array,
      value: [],
    },
    dialogMixinsContentLinks: {
      type: Array,
      value: [],
    },
  },
  options: {
    addGlobalClass: true,
  },
  data: {
    show: false,
    isShowDialog: false,
  },
  methods: {
    //隐藏弹框
    hideDialog: function () {
      this.setData({
        isShowDialog: false,
      })
    },
    //展示弹框
    showDialog() {
      this.setData({
        isShowDialog: true,
      })
    },
    makeSure(e) {
      let { title, content } = this.properties
      const item = e.currentTarget.dataset.item
      //触发成功回调
      this.triggerEvent('makeSure', item)
      if (title == '请开启位置权限') {
        let object_name = []
        if (content.includes('开启手机定位')) {
          object_name.push('开启定位服务')
        }
        if (content.includes('授予微信使用定位的权限')) {
          object_name.push('允许微信获取位置权限')
        }
        if (content.includes('允许本程序使用位置信息')) {
          object_name.push('允许小程序使用位置权限')
        }
        object_name = object_name.join('/')
        rangersBurialPoint('user_behavior_event', {
          page_id: 'popus_open_locate_new',
          page_name: '提示需开启位置权限弹窗',
          page_path: getFullPageUrl(),
          module: 'appliance',
          widget_id: 'click_check_guide',
          widget_name: '查看指引',
          object_type: '弹窗类型',
          object_id: '',
          object_name: object_name || '',
          device_info: {
            device_session_id: getApp().globalData.deviceSessionId || '',
          },
        })
      }
      if (title == '请开启蓝牙权限') {
        let object_name = []
        if (content.includes('开启手机蓝牙')) {
          object_name.push('开启蓝牙服务')
        }
        if (content.includes('授予微信使用蓝牙的权限')) {
          object_name.push('允许微信获取蓝牙权限')
        }
        if (content.includes('允许本程序使用蓝牙')) {
          object_name.push('允许小程序使用蓝牙权限')
        }
        object_name = object_name.join('/')
        rangersBurialPoint('user_behavior_event', {
          page_id: 'popus_open_bluetooth_new',
          page_name: '提示需开启蓝牙权限弹窗',
          page_path: getFullPageUrl(),
          module: 'appliance',
          widget_id: 'click_check_guide',
          widget_name: '查看指引',
          object_type: '弹窗类型',
          object_id: '',
          object_name: object_name || '',
          device_info: {
            device_session_id: getApp().globalData.deviceSessionId || '',
          },
        })
      }
    },
    clickLink(e) {
      const item = e.currentTarget.dataset.item
      console.log('[click link item2]', item)
      //触发成功回调
      this.triggerEvent('clickLink', item)
    },
    getShowDialog(val) {
      this.setData({
        isShowDialog: val,
      })
      if (val) {
        let { title, content } = this.properties
        console.log('getShowDialog=========', title)
        if (title == '请开启位置权限') {
          let object_name = []
          if (content.includes('开启手机定位')) {
            object_name.push('开启定位服务')
          }
          if (content.includes('授予微信使用定位的权限')) {
            object_name.push('允许微信获取位置权限')
          }
          if (content.includes('允许本程序使用位置信息')) {
            object_name.push('允许小程序使用位置权限')
          }
          object_name = object_name.join('/')
          rangersBurialPoint('user_page_view', {
            page_id: 'popus_open_locate_new',
            page_name: '提示需开启位置权限弹窗',
            page_path: getFullPageUrl(),
            module: 'appliance',
            object_type: '弹窗类型',
            object_id: '',
            object_name: object_name || '',
            device_info: {
              device_session_id: getApp().globalData.deviceSessionId || '',
            },
          })
        }
        if (title == '请开启蓝牙权限') {
          let object_name = []
          if (content.includes('开启手机蓝牙')) {
            object_name.push('开启蓝牙服务')
          }
          if (content.includes('授予微信使用蓝牙的权限')) {
            object_name.push('允许微信获取蓝牙权限')
          }
          if (content.includes('允许本程序使用蓝牙')) {
            object_name.push('允许小程序使用蓝牙权限')
          }
          object_name = object_name.join('/')
          rangersBurialPoint('user_page_view', {
            page_id: 'popus_open_bluetooth_new',
            page_name: '提示需开启蓝牙权限弹窗',
            page_path: getFullPageUrl(),
            module: 'appliance',
            object_type: '弹窗类型',
            object_id: '',
            object_name: object_name || '',
            device_info: {
              device_session_id: getApp().globalData.deviceSessionId || '',
            },
          })
        }
      }
    },
  },
  /*组件生命周期*/
  lifetimes: {
    created() {},
    attached() {},
    ready() {},
    moved() {},
    detached() {},
    error() {},
    /*组件所在页面的生命周期 */
    pageLifetimes: {
      show: function () {
        // 页面被展示
        console.log('页面被展示')
      },
      hide: function () {
        // 页面被隐藏
        console.log('页面被隐藏')
      },
      resize: function () {
        // 页面尺寸变化
        console.log('页面尺寸变化')
      },
    },
  },
})
