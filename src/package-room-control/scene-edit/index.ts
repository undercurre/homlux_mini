import { sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
Component({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    sceneId: '',
    sceneName: '',
    sceneIcon: '',
    contentHeight: 0,
    sceneDevice: [
      {
        image: '/assets/img/device/light.png',
        title: '筒灯 | 客厅',
        desc: '打开 亮度100% 色温3000K',
      },
      {
        image: '/assets/img/device/curtain.png',
        title: '窗帘 | 客厅',
        desc: '打开 亮度100% 色温3000K',
      },
      {
        image: '/assets/img/device/switch.png',
        title: '筒灯 | 客厅',
        desc: '打开 亮度100% 色温3000K',
      },
    ],
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
      wx.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
              sceneId: sceneStore.selectScene.sceneId,
              sceneName: sceneStore.selectScene.sceneName,
              sceneIcon: sceneStore.selectScene.sceneIcon,
            })
          }
        })
    },
    handleDelete() {},
    handleSave() {},
  },
})
