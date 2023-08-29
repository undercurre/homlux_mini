// 设备能力开关、授权相关

import { Logger } from './index'

/**
 * @description
 * @param mode 'peripheral' 从机模式, 'central' 主机模式
 * 前置条件：用户授权：需要 scope.bluetooth；小程序发布时选择“引用用户隐私”
 */
export const checkWxBlePermission = async () => {
  // 初始化蓝牙模块
  const openBleRes = (await wx
    .openBluetoothAdapter({ mode: 'peripheral' })
    .catch((err: WechatMiniprogram.BluetoothError) => err)) as WechatMiniprogram.BluetoothError & { errno?: number }
    // IOS
    const openCenterBleRes = (await wx
      .openBluetoothAdapter({ mode: 'central' })
      .catch((err: WechatMiniprogram.BluetoothError) => err)) as WechatMiniprogram.BluetoothError & { errno?: number }

  Logger.console('[openBluetoothAdapter]', openBleRes)
  Logger.console('[openBluetoothAdapter]', openCenterBleRes)

  // 判断是否授权蓝牙 安卓、iOS返回错误格式不一致
  if (openBleRes.errno === 103 || openBleRes.errMsg.includes('auth deny')) {
    return false
  }
  return true
}
