export default {
  addDeviceInfo: {
    plainSn: '', //设备原始sn
    isWashingMachine: false, //是否是洗衣机
    msmartBleWrite: null, //蓝牙写入
    isCheckGray: false, //默认校验添加设备灰度权限
    combinedDeviceFlag: false, // 存在辅设备标识
  },
  globalData: {
    isLogon: true,
    userData: {
      key: '',
    }
  }
}