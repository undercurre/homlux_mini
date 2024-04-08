Component({
  /**
   * 组件的属性列表
   */
  properties: {
    formType: String,
    icon: String,
    plain: Boolean,
    block: Boolean,
    round: Boolean,
    square: Boolean,
    loading: Boolean,
    hairline: Boolean,
    disabled: Boolean,
    loadingText: String,
    customStyle: String,
    loadingType: {
      type: String,
      value: 'circular',
    },
    type: {
      type: String,
      value: 'primary',
    },
    size: {
      type: String,
      value: 'normal',
    },
    loadingSize: {
      type: String,
      value: '20px',
    },
    color: String,
    openType: String,
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    onClick(event: WechatMiniprogram.BaseEvent) {
      this.triggerEvent('click', event)
      const { openType } = this.data
      if (openType === 'getUserInfo') {
        wx.getUserProfile({
          desc: '  ',
          lang: 'zh_CN',
          complete: (userProfile) => {
            this.triggerEvent('getuserinfo', userProfile)
          },
        })
      }
    },

    onGetUserInfo(event: WechatMiniprogram.BaseEvent) {
      this.triggerEvent('getuserinfo', event)
    },

    onContact(event: WechatMiniprogram.BaseEvent) {
      this.triggerEvent('contact', event)
    },

    onGetPhoneNumber(event: WechatMiniprogram.BaseEvent) {
      this.triggerEvent('getphonenumber', event)
    },

    onError(event: WechatMiniprogram.BaseEvent) {
      this.triggerEvent('error', event)
    },

    onOpenSetting(event: WechatMiniprogram.BaseEvent) {
      this.triggerEvent('opensetting', event)
    },

    onChooseAvatar(event: WechatMiniprogram.BaseEvent) {
      this.triggerEvent('chooseavatar', event)
    },
  },
})
