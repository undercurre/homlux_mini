# 原生微信小程序开发模板

## 特性
项目已经自带下面的依赖：
- [UnoCSS](https://github.com/MellowCo/unocss-preset-weapp) 功能强大且性能极高的 CSS 引擎
- [MobX](https://github.com/wechat-miniprogram/mobx-miniprogram-bindings) 官方推荐的全局状态管理库
- [computed](https://github.com/wechat-miniprogram/computed) 像写Vue一样写computed和watch吧
- [Vant](https://vant-contrib.gitee.io/vant-weapp) 轻量、可靠的微信小程序组件库
- SvgIcon 自实现svg动态加载组件，使用脚本自动从iconify拉取svg标签

项目配置了一个分包示例，可以按需求进行修改。

## 项目结构
```
HomLux小程序
├── .husky // git hooks
├── build // 一些自动化脚本
├── docs // 项目文档
├── src // 小程序源码
    ├── apis // 后端接口封装
    ├── assets // 资源目录
          ├── svg // 存放svg文件
          └── img // 存放图片文件
    ├── components // 公用组件
    ├── custom-tab-bar // 自定义tabbar
    ├── store // 全局状态
    ├── package-distribution // 配网相关页面分包（添加设备、附近设备、连接wifi等）
    ├── package-mine // 我的相关页面分包（家庭管理、房间管理、设备管理等）
    ├── package-room // 房间相关页面分包（房间页面控制设备、场景管理等）
    ├── pages // 主包的页面（小程序主页、登录）
    └── utils // 公用方法
└── typings // 类型声明文件
```

## 使用方法
1. 使用`npm i`或者`pnpm i`安装依赖
2. 运行`npm run unocss`或者`pnpm unocss`监听wxml文件并生成对应wxss
3. 在微信开发者工具，点击：工具-构建npm
4. 开始编写代码

> Unocss用法和Tailwind基本一致，可以查看[Tailwind](https://tailwindcss.com/)官方文档进行使用，微信小程序的class不支持写`%`，所以要用`/`来代替，比如w-50%可以用w-1/2表示

> SvgIcon用法：SvgIcon组件会从globalData读取svg标签，然后动态生成url，并使用css渲染。项目在build/getIconify.ts实现了读取一个json文件里的`iconList`列表，然后生成js/ts文件，然后导入到globalData即可根据svg的名字加载svg。使用svg

## 项目规范
1. 主包页面存放在pages目录下，分包页面存放在packages目录下，如果分包内容非常多，可以按照packageXXX再进行区分。
2. 全局状态模型定义存放在models目录下，按照业务拆分模块。
3. 接口调用方式封装在apis目录下，可以按照业务区分模块，如果项目比较大有多个后端接口地址，可以归类到不同文件夹进行区分。
4. 接口通用的请求处理、响应处理、失败处理都封装在utils/request目录下，参考`utils/request/defaultRequest.ts`，不通用的数据和逻辑操作通过参数传入。
5. TS类型规范，业务相关的类型定义在typings目录下，按需使用namespace和不同的d.ts进行拆分，如果业务复杂，还可以归类到不同文件夹进行区分。

## 注意点
1. mobx和computed一起使用时，computed的behavior一定要在后面，比如：`behaviors: [testBehavior, computedBehavior]`
2. mobx配合ts使用会有些小问题，可以看：[解决mobx-miniprogram在TS下的一些小问题](https://wyatex.gitee.io/%E5%89%8D%E7%AB%AF/%E8%A7%A3%E5%86%B3mobx-miniprogram%E5%9C%A8TS%E4%B8%8B%E7%9A%84%E4%B8%80%E4%BA%9B%E5%B0%8F%E9%97%AE%E9%A2%98/)
