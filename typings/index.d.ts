interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo
    svgs?: Record<string, string>
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback
}

type IAnyObject = WechatMiniprogram.IAnyObject

type AnyResType = string | IAnyObject | ArrayBuffer
