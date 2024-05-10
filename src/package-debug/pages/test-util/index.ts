import pageBehavior from '../../../behaviors/pageBehaviors'

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    async startZigbee() {
      // 只允许从相机扫码
      const res = await wx
        .scanCode({
          onlyFromCamera: true,
          scanType: ['qrCode'],
        })
        .catch((err) => err)

      console.log('scanCode', res)
    },
  },
})
