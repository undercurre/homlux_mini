const app = {
  addDeviceInfo: {
    plainSn: '', //设备原始sn
    msmartBleWrite: null, //蓝牙写入
    combinedDeviceFlag: false, // 存在辅设备标识
    type: '', // 品类码
    sn8: '', // sn8
    linkType: '',
    mode: 0,
    productId: '',
    deviceImg: '', // 设备图片
    isFromScanCode: false,
  },
  globalData: {
    isLogon: true,
    userData: {
      key: '',
    },
    isPx: false,
    isCanClearFound: true,
    systemInfo: {},
  }
}

wx.getSystemInfo({
  success: (res) => {
    app.globalData.systemInfo = res
    console.log('getWxSystemInfo, success, forceUpdate', res)
  },
  fail: (e) => {
    console.log('getWxSystemInfo, fail', e)
  },
})

export function getApp() {
  return app
}

export default app