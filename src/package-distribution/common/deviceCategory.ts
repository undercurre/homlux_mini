import { productImgDir } from '../../config/index'
import { strUtil } from '../../utils/index'

export default {
  '0x13': {
    name: '开关/灯具',
    modelList: [
      {
        icon: `${productImgDir}/light-wifi.png`,
        name: '吸顶灯',
        source: 'meiju',
        tag: 'wifi',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: '13',
          sn8: '7909AC81',
          productId: '美的智能吸顶灯',
          deviceImg: `${productImgDir}/light-wifi.png`,
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
        icon: `${productImgDir}/air-conditioner-hang.png`,
        name: '挂机空调',
        tag: 'wifi',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: 'AC',
          sn8: '222Z3131',
          productId: 'KFR-72L/DX1-1[Y]',
          deviceImg: `${productImgDir}/air-conditioner-hang.png`,
          mode: 0,
        } as Meiju.IProductItem),
      },
      {
        icon: `${productImgDir}/air-conditioner-cabinet.png`,
        name: '挂机空调',
        tag: 'wifi',
        path: strUtil.getUrlWithParams('/package-distribution-meiju/pages/check-auth/index', {
          proType: 'AC',
          sn8: '22251659',
          productId: 'KFR-51L/DX1-1',
          deviceImg: `${productImgDir}/air-conditioner-cabinet.png`,
          mode: 0,
        } as Meiju.IProductItem),
      },
      {
        icon: `${productImgDir}/VRF.png`,
        name: 'VRF控制器',
        tag: 'zigbee',
        path: '/package-distribution/connect-guide/index?modelId=zhonghong.cac.002',
      },
    ],
  },
} as ICategoryConfig

export interface IModel {
  icon: string // 产品图标
  name: string // 产品名称
  source?: 'meiju' // 产品来源
  tag: 'wifi' | 'zigbee' // 产品标签
  path: string // 跳转页面路径
}

interface ICategoryConfig {
  [x: string]: {
    name: string // 类别名称
    modelList: IModel[] // 型号列表
  }
}
