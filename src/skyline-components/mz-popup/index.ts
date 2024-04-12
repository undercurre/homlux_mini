import transitionBehavior from '../behaviors/transition'

Component({
  behaviors: [transitionBehavior],
  externalClasses: [
    'custom-class',
    'enter-class',
    'enter-active-class',
    'enter-to-class',
    'leave-class',
    'leave-active-class',
    'leave-to-class',
  ],
  /**
   * 组件的属性列表
   */
  properties: {
    round: Boolean,
    closeable: Boolean,
    customStyle: String,
    overlayStyle: String,
    zIndex: {
      type: Number,
      value: 100,
    },
    overlay: {
      type: Boolean,
      value: true,
    },
    closeIconPosition: {
      type: String,
      value: 'top-right',
    },
    closeOnClickOverlay: {
      type: Boolean,
      value: true,
    },
    position: {
      type: String,
      value: 'center',
    },
    safeAreaInsetBottom: {
      type: Boolean,
      value: true,
    },
    safeAreaInsetTop: {
      type: Boolean,
      value: false,
    },
    safeAreaTabBar: {
      type: Boolean,
      value: false,
    },
    rootPortal: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  observers: {
    position: function () {
      this.observeClass()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    onClickCloseIcon() {
      this.triggerEvent('close')
    },

    onClickOverlay() {
      this.triggerEvent('click-overlay')

      if (this.data.closeOnClickOverlay) {
        this.triggerEvent('close')
      }
    },
    observeClass() {
      const { position } = this.data

      const updateData: { [key: string]: unknown } = {
        name: position,
      }

      this.setData(updateData)
    },
  },
})
