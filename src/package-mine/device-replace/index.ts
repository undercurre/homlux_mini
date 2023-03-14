// package-mine/device-replace/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceBinding } from '../../store/index'
import { StatusType } from './typings'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    status: 'introduce' as StatusType,
    isSelectDevice: false,
  },

  computed: {
    rightBtnText(data) {
      const textMap = {
        introduce: '开始使用',
        oldDevice: '下一步',
        newDevice: '开始替换',
        processing: '',
      }

      return textMap[data.status]
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {
    clickBtn() {
      if (this.data.status === 'introduce') {
        this.setData({
          status: 'oldDevice',
        })
      }
    },

    addDevice() {
      this.setData({
        isSelectDevice: true,
      })
    },

    closeDevicePopup() {
      this.setData({
        isSelectDevice: false,
      })
    },
  },
})
