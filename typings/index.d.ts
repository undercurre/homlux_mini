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

type ENV_TYPE = 'dev' | 'sit' | 'prod'

type ConfigWithEnv<T> = Record<ENV_TYPE, T>

/**
 * 声名 Behaviors 方法类型
 * 报错的问题
 * https://developers.weixin.qq.com/community/develop/doc/000c26752b4f9021cf9a31d775b000?_at=1616469525819
 */
declare namespace WechatMiniprogram.Component {
  interface InstanceMethods<D extends DataOption> {
    goBack(): void

    /**
     * 绑定由 worklet 驱动的样式到相应的节点，详见 [worklet 动画](https://developers.weixin.qq.com/miniprogram/dev/framework/runtime/skyline/worklet.html)
     *
     * 最低基础库版本：[`2.29.0`](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility.html)
     */
    applyAnimatedStyle(
      selector: string,
      updater: () => Record<string, string>,
      userConfig?: { immediate: boolean; flush: 'sync' | 'async' },
      callback?: (res: { styleId: number }) => void,
    ): void
    /**
     * 清除节点上 worklet 驱动样式的绑定关系
     *
     * 最低基础库版本：[`2.30.1`](https://developers.weixin.qq.com/miniprogram/dev/framework/compatibility.html)
     */
    clearAnimatedStyle(selector: string, styleIds: number[], callback?: () => void): void
  }
}

/**
 * 类似keyof，但是获取value的类型
 * 用法：interface I {a: 1, b: '2', c: true}            ValueOf<I> => 1 | '2' | true
 * 又或者const obj = {a: 1, b: '2', c: true} as const   ValueOf<typeof obj> => 1 | '2' | true
 */
type ValueOf<T> = T[keyof T]

type FunctionType = (...args: unknown[]) => unknown

declare module 'weapp-qrcode-canvas-2d'
