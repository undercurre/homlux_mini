export const button = Behavior({
  externalClasses: ['hover-class'],

  properties: {
    id: String,
    buttonId: String,
    lang: String,
    businessId: Number,
    sessionFrom: String,
    sendMessageTitle: String,
    sendMessagePath: String,
    sendMessageImg: String,
    showMessageCard: Boolean,
    appParameter: String,
    ariaLabel: String,
    openType: String,
    getUserProfileDesc: String,
  },

  data: {},

  methods: {
    onGetUserInfo(event: WechatMiniprogram.ButtonGetUserInfo) {
      this.triggerEvent('getuserinfo', event.detail)
    },

    onContact(event: WechatMiniprogram.ButtonContact) {
      this.triggerEvent('contact', event.detail)
    },

    onGetPhoneNumber(event: WechatMiniprogram.ButtonGetPhoneNumber) {
      this.triggerEvent('getphonenumber', event.detail)
    },

    onGetRealTimePhoneNumber(event: WechatMiniprogram.ButtonGetPhoneNumber) {
      this.triggerEvent('getrealtimephonenumber', event.detail)
    },

    onError(event: WechatMiniprogram.ButtonError) {
      this.triggerEvent('error', event.detail)
    },

    onLaunchApp(event: WechatMiniprogram.ButtonLaunchApp) {
      this.triggerEvent('launchapp', event.detail)
    },

    onOpenSetting(event: WechatMiniprogram.ButtonOpenSetting) {
      this.triggerEvent('opensetting', event.detail)
    },

    onAgreePrivacyAuthorization(event: WechatMiniprogram.CustomEvent) {
      this.triggerEvent('agreeprivacyauthorization', event.detail)
    },

    onChooseAvatar(
      event: WechatMiniprogram.CustomEvent<WechatMiniprogram.GeneralCallbackResult & { avatarUrl: string }>,
    ) {
      this.triggerEvent('chooseavatar', event.detail)
    },
  },
})
