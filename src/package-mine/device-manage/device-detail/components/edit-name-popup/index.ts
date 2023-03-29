import Toast from '@vant/weapp/toast/toast'
import { validateInputName } from '../../../../../utils/index'

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    value: {
      type: String,
    },
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          this.setData({
            deviceName: this.data.value,
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    deviceName: '',
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      // 校验名字合法性
      if (!validateInputName(this.data.deviceName)) {
        Toast('设备名称不能用特殊符号或表情')
        return
      }
      this.triggerEvent('confirm', this.data.deviceName)
    },
  },
})
