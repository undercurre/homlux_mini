# 请求工具封装说明

请求相关的封装代码存放在`/src/utils/request`下，使用 index.ts 一起导出，[baseRequest](../src/utils/request/baseRequest.ts) 是基础通用封装，[mzaiotRequest](../src/utils/request/mzaiotRequest.ts) 是使用 baseRequest 对美智云进行请求的封装。如果需要对其他服务（返回数据结构和美智云不一样的）就可以再对 baseRequest 进行封装，或者如果请求接口不多的可以直接使用 baseRequest。

## baseRequest 使用方式

baseRequest 方法的参数能使用所有的 wx.request 参数，还能传入额外的配置项，baseRequest 类型定义：

```ts
type BaseRequestOptions<T extends AnyResType> = WechatMiniprogram.RequestOption<T> & {
  loading?: boolean
  log?: boolean
  successHandler?: (result: WechatMiniprogram.RequestSuccessCallbackResult<T>) => T
  failHandler?: (result: WechatMiniprogram.GeneralCallbackResult) => T
  generalSuccessHandler?: (result: WechatMiniprogram.RequestSuccessCallbackResult<T>) => T
  generalFailHandler?: (result: WechatMiniprogram.GeneralCallbackResult) => T
}

type BaseRequest = <T extends AnyResType>(requestOptions: BaseRequestOptions<T>) => Promise<T>
```

| 参数项                | 说明                                                       |
| --------------------- | ---------------------------------------------------------- |
| loading               | 是否显示 loading，显示 loading 能添加遮罩，防止多次点击    |
| log                   | 是否打印请求的参数和请求结果                               |
| successHandler        | 特殊请求接口可以使用 successHandler 对请求成功结果进行处理 |
| failHandler           | 特殊请求接口可以使用 failHandler 对请求失败结果进行处理    |
| generalSuccessHandler | 和successHandler类似，主要作用是封装时提供通用的处理回调 |
| generalFailHandler    | 和failHandler类似，主要作用是封装时提供通用的处理回调 |

> **注意，xxxHandler和generalXxxHandler是互斥的**，比如传入了successHandler，就不会使用generalSuccessHandler进行处理。

除了直接调用baseRequest方法，还可以使用类似baseRequest.get的方式，方便的设置请求方法，这时候option传入的method也会失效，因为优先级更低。

## mzaiotRequest 使用方式
mzaiotRequest在baseRequest基础上封装了美智云的通用返回格式：
```ts
type MzaiotResponseRowData<T extends AnyResType = AnyResType> = {
  code: number
  msg: string
  success: boolean
  result?: T
}

type MzaiotRequest = <T extends AnyResType>(options: BaseRequestOptions<T>) => Promise<MzaiotResponseRowData<T>>

// 比如有个业务数据类型：
type UserInfo = { name: string }
// 那么只需要这样用
mzaiotRequest.get<UserInfo>({url: 'xxx'})
// 就能直接拿到类型：
// {
//   code: number
//   msg: string
//   success: boolean
//   result?: UserInfo
// }
```
