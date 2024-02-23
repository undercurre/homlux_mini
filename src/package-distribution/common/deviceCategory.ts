import { ossDomain, productImgDir } from '../../config/index'
import { strUtil } from '../../utils/index'

export default {
  '0x13': {
    name: '开关/灯具',
    modelList: [
      {
        icon: `${productImgDir}/0x13.png`,
        name: '吸顶灯',
        source: 'meiju',
        tag: 'wifi',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '13',
          sn8: '7909AC81',
          mode: 0,
        } as Meiju.IProductItem),
      },
      {
        icon: `${productImgDir}/downlight.png`,
        name: '筒射灯',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir}/magnetic-track-light.png`,
        name: '磁吸灯',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir}/tape-light.png`,
        name: 'CW灯带',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?scanType=subdevice',
      },
      {
        icon: `${productImgDir}/switch.png`,
        name: '智能开关',
        tag: 'zigbee',
        path: '/package-distribution/scan/index?scanType=subdevice',
      },
    ],
  },
  '0xAC': {
    name: '空调',
    modelList: [
      {
        icon: `${productImgDir}/0xAC-hang.png`,
        name: '挂机空调',
        source: 'meiju',
        tag: 'wifi',
        path: `/package-distribution/scan/index?scanType=meijuDevice&meijuPath=${encodeURIComponent(
          strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
            proType: 'AC',
            sn8: '22011809,22011901',
            deviceImg: `${productImgDir}/0xAC-hang.png`,
            mode: 0,
          } as Meiju.IProductItem),
        )}`,
      },
      {
        icon: `${productImgDir}/0xAC-cabinet.png`,
        name: '柜机空调',
        source: 'meiju',
        tag: 'wifi',
        path: `/package-distribution/scan/index?scanType=meijuDevice&meijuPath=${encodeURIComponent(
          strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
            proType: 'AC',
            sn8: '222G0077,22050675',
            deviceImg: `${productImgDir}/0xAC-cabinet.png`,
            mode: 0,
          } as Meiju.IProductItem),
        )}`,
      },
      {
        icon: `${productImgDir}/VRF.png`,
        name: 'VRF控制器',
        guideImg: `${ossDomain}/homlux/guide/485.gif`,
        guideDesc:
          '1、中弘网关BUS接口的A\\B口分别与智慧屏的485 接口A\\B口对接。\n2、接通电源并等待中弘网关工作指示灯变为绿色慢闪状态。',
        productId: 'zhonghong.heat.001,zhonghong.air.001,zhonghong.cac.002',
        path: '/package-distribution/connect-guide/index?proType=0xAC&modelId=zhonghong.heat.001,zhonghong.air.001,zhonghong.cac.002',
      },
    ],
  },
  '0xBC': {
    name: '传感器',
    modelList: [
      {
        icon: `${productImgDir}/sensor-body.png`,
        guideImg: `${ossDomain}/homlux/sensor_body.gif`,
        name: '人体传感器',
        guideDesc: '1、确认传感器电池已安装好\n2、长按球体顶部「配网按键」5秒以上，至指示灯开始闪烁（1秒/次）',
        path: `/package-distribution/connect-guide/index?proType=0xBC&modelId=midea.ir.201`,
        productId: 'midea.ir.201',
      },
      {
        icon: `${productImgDir}/sensor-door.png`,
        guideImg: `${ossDomain}/homlux/sensor_door.gif`,
        name: '门磁传感器',
        guideDesc: '1、确认传感器电池已安装好\n2、长按顶部「配网按键」5秒以上，至指示灯开始闪烁（1秒/次）',
        path: `/package-distribution/connect-guide/index?proType=0xBC&modelId=midea.magnet.001.201`,
        productId: 'midea.magnet.001.201',
      },
      {
        icon: `${productImgDir}/sensor-switch.png`,
        guideImg: `${ossDomain}/homlux/sensor_switch.gif`,
        name: '无线开关',
        guideDesc: '1、确认传感器电池已安装好\n2、点击「开关键」，随后立刻长按5秒以上，至指示灯开始闪烁（1秒/次）',
        path: `/package-distribution/connect-guide/index?proType=0xBC&modelId=midea.freepad.001.201`,
        productId: 'midea.freepad.001.201',
      },
    ],
  },
} as ICategoryConfig

export interface IModel {
  icon: string // 产品图标
  name: string // 产品名称
  source?: 'meiju' // 产品来源，meiju：美居wifi设备
  productId?: string // 产品型号标识modelId，暂时只有网关子设备使用
  guideImg?: string // 配网指引图
  guideDesc?: string // 配网指引
  tag?: 'wifi' | 'zigbee' // 产品标签。 wifi：wifi配网  zigbee：zigbee配网
  path: string // 跳转页面路径
}

interface ICategoryConfig {
  [x: string]: {
    name: string // 类别名称
    modelList: IModel[] // 型号列表
  }
}
