import { autoSceneIconList, sceneImgDir } from '../../../../config/index'

Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.setData({
            icon: this.data.value,
          })
        }
      },
    },
    value: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sceneImgDir,
    icon: '',
    autoSceneIconList,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
      // this.setData({
      //   icon: '',
      // })
    },
    handleConfirm() {
      this.triggerEvent('confirm', this.data.icon)
      // this.setData({
      //   icon: '',
      // })
    },
    handleSceneIconTap(e: { currentTarget: { dataset: { scene: string } } }) {
      this.setData({
        icon: e.currentTarget.dataset.scene,
      })
    },
    blank() {},
  },
})
