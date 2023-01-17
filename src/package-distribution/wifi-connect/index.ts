import { ComponentWithComputed } from 'miniprogram-computed'

type StatusName = 'none' | 'ready' | 'success' | 'error' | 'openBle'

interface PageData {
  status: StatusName
}

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  /**
   * 页面的初始数据
   */
  data: {
    status: 'ready',
    wifiInfo: {
      name: '222',
      pw: '12',
    },
  } as PageData,

  computed: {
    btnText(data: PageData) {
      const btnTextMap = {
        none: '去连接Wi-Fi',
        ready: '下一步',
        success: '添加设备',
        error: '附近的子设备',
        openBle: '附近的子设备',
      }

      return btnTextMap[data.status]
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },
})
