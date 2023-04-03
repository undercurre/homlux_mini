interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo
    svgs?: Record<string, string>
    firstOnShow: boolean
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback
}

type IAnyObject = WechatMiniprogram.IAnyObject

type AnyResType = string | IAnyObject | ArrayBuffer

/**
 * 声名 Behaviors 方法类型
 * 报错的问题
 * https://developers.weixin.qq.com/community/develop/doc/000c26752b4f9021cf9a31d775b000?_at=1616469525819
 */
declare namespace WechatMiniprogram.Component {
  interface InstanceMethods<D extends DataOption> {
    goBack(): void
  }
}
