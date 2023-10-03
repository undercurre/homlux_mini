const app = {
  addDeviceInfo: {
    plainSn: '', //设备原始sn
    msmartBleWrite: null, //蓝牙写入
    combinedDeviceFlag: false, // 存在辅设备标识
    type: '', // 品类码
    sn8: '', // sn8
    linkType: '',
    mode: 0,
  },
  globalData: {
    isLogon: true,
    userData: {
      key: '',
    },
    isCanClearFound: true,
  }
}

export function getApp() {
  return app
}

export default app