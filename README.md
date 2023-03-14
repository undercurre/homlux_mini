# HomLux

## 特性

项目已经自带下面的依赖：

- [UnoCSS](https://github.com/MellowCo/unocss-preset-weapp) 功能强大且性能极高的 CSS 引擎
- [MobX](https://github.com/wechat-miniprogram/mobx-miniprogram-bindings) 官方推荐的全局状态管理库
- [computed](https://github.com/wechat-miniprogram/computed) 像写 Vue 一样写 computed 和 watch 吧
- [Vant](https://vant-contrib.gitee.io/vant-weapp) 轻量、可靠的微信小程序组件库
- SvgIcon 自实现 svg 动态加载组件，使用脚本自动从 iconify 拉取 svg 标签

项目配置了一个分包示例，可以按需求进行修改。

## 📁 代码结构

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
    ├── behaviors // 共享代码
          ├── pageBehaviors // 页面层级公共代码
          └──  // 
    ├── config // 一些全局公用的配置、数据
    ├── commons // 公共代码
          ├── templates // 公共wxml模板
          └── wxs // 公共wxs module
    ├── custom-tab-bar // 自定义tabbar
    ├── store // 全局状态
    ├── package-distribution // 配网相关页面分包（添加设备、附近设备、连接wifi等）
    ├── package-mine // 我的相关页面分包（家庭管理、房间管理、设备管理等）
    ├── package-room-control // 房间相关页面分包（房间页面控制设备、场景管理等）
    ├── pages // 主包的页面（小程序主页、登录）
    └── utils // 公用方法
└── typings // 类型声明文件
```

## 使用方法

1. 使用`npm i`或者`pnpm i`安装依赖
2. 运行`npm run unocss`或者`pnpm unocss`监听 wxml 文件并生成对应 wxss
3. 在微信开发者工具，点击：工具-构建 npm
4. 开始编写代码

## 组件文档

- [自定义导航栏](docs/components/custom-nav-bar.md)
- [家庭选择下拉菜单](docs/components/home-select-menu.md)
- [SVG图标渲染](docs/components/svg-icon.md)
- [van-button](docs/components/van-button.md)

## 项目规范

1. 主包页面存放在 pages 目录下，分包页面存放在 packages 目录下，如果分包内容非常多，可以按照 packageXXX 再进行区分。
2. 全局状态模型定义存放在 store 目录下，按照业务拆分模块。
3. 接口调用方式封装在 apis 目录下，可以按照业务区分模块，如果项目比较大有多个后端接口地址，可以归类到不同文件夹进行区分。
4. 接口通用的请求处理、响应处理、失败处理都封装在 utils/request 目录下，参考`utils/request/defaultRequest.ts`
   ，不通用的数据和逻辑操作通过参数传入。[参考文档](docs/request使用说明.md)

### CSS 样式

1. 请尽量避免将静态的样式写进 `style` 中，以免影响渲染速度
2. 公共样式

| 样式名              | 描述       |
|------------------|----------|
| `page-container` | 用于一般页面容器 |

3. Unocss 用法和 Tailwind 基本一致，可以查看[Tailwind](https://tailwindcss.com/)官方文档进行使用，微信小程序的 class
   不支持写`%`，所以要用`/`来代替，比如 w-50%可以用 w-1/2 表示
4. `Vant`的`Cell 单元格`样式已根据UI稿调整。可直接使用

### svg 图标

> SvgIcon 用法：SvgIcon 组件会从 globalData 读取 svg 标签，然后动态生成 url，并使用 css 渲染。项目在 build/getIconify.ts
> 实现了读取一个 `/iconify.json` 文件里的`iconList`列表，然后生成 js/ts 文件，然后导入到 globalData 即可根据 svg 的名字加载 svg。使用
> svg

请优先使用图标库：https://icon-sets.iconify.design/icon-park-outline/

### JS

1. 接口命名首字母大写，建议接口前可以加上I
2. TS类型规范，业务相关的类型定义在typings目录下，按需使用namespace和不同的d.ts进行拆分，如果业务复杂，还可以归类到不同文件夹进行区分。

### 跨页面通信

> 使用mobx-miniprogram包，使用reaction监听store里的状态变化即可，使用示例：

```
import { reaction } from 'mobx-miniprogram'
import { store } from './store/index'
component({
    data: {
        _clean: ()=>{}
    },
    methods: {
        onLoad() {
            this.data._clean = reaction(()=>store.xxx, (data, reaction)=>{...}) // 监听store里的xxx
        },
        onUnload() {
            // 页面离开时需要执行clean清除副作用，防止内存泄漏
            this.data._clean()
        }
    }
)
```

## 注意点

1. [mobx 使用注意点](./docs/mobx使用注意点.md)
2. [svg-icon 组件使用注意点](./docs/components/svg-icon.md)
