import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { deviceTransmit } from '../../../apis/device'
import { defaultImgDir } from '../../../config/index'

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    defaultTabType: '1',
    tabIndex: 0,
    deviceId: '',
    typeList: [
      { name: '密码', type: '1', list: [] },
      { name: '指纹', type: '2', list: [] },
      { name: '人脸', type: '7', list: [] },
      { name: '门卡', type: '3', list: [] },
    ],
  },

  computed: {
    typeTabs(data) {
      return data.typeList.map((item) => ({
        title: `${item.name}·${item.list.length}`,
        id: item.type,
      }))
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad({ deviceId }: { deviceId: string }) {
      console.log('onLoad', deviceId)
      this.setData({
        deviceId,
      })

      for (let i = 0; i < this.data.typeList.length; i++) {
        this.updateUsers(this.data.typeList[i].type).then((res) => {
          this.setData({
            [`typeList[${i}].list`]: res,
          })
        })
      }
    },

    onShow() {},

    onSwiperChanged(e: { detail: { current: number; source: string } }) {
      const { current, source = '' } = e.detail
      if (source === 'touch') {
        this.setData({
          tabIndex: current,
        })
      }
    },

    onTabChanged(e: WechatMiniprogram.CustomEvent<{ selectedIndex: number }>) {
      this.setData({
        tabIndex: e.detail.selectedIndex,
      })
      console.log('onTabChanged', this.data.tabIndex, e)
    },

    async updateUsers(pwdType: string) {
      const res = (await deviceTransmit('PWD_LIST', {
        deviceId: this.data.deviceId,
        pwdType,
      })) as IAnyObject

      if (!res.success) return []
      return res.result.list
    },
  },
})
