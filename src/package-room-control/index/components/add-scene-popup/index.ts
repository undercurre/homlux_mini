import { sceneList } from '../../../../config/index'

Component({
  options: {
    styleIsolation: 'apply-shared',
  },
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          setTimeout(() => {
            this.getHeight()
          }, 100)
        }
        this.setData({
          sceneIcon: '',
          sceneName: '',
        })
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    sceneIcon: '',
    sceneName: '',
    contentHeight: 0,
    sceneList,
    linkList: [] as string[],
    showLinkPopup: false,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    getHeight() {
      this.createSelectorQuery()
        .select('#content')
        .boundingClientRect()
        .exec((res) => {
          if (res[0] && res[0].height) {
            this.setData({
              contentHeight: res[0].height,
            })
          }
        })
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      // todo:
      this.triggerEvent('close')
    },
    handleClear() {
      this.setData({
        sceneName: '',
      })
    },
    handleSceneNameInput(e: { detail: { value: string } }) {
      this.setData({
        sceneName: e.detail.value,
      })
    },
    handleSceneIconTap(e: { currentTarget: { dataset: { scene: string } } }) {
      this.setData({
        sceneIcon: e.currentTarget.dataset.scene,
      })
    },
    handleLinkSwitchPopup() {
      this.setData({
        showLinkPopup: true,
      })
    },
    handleLinkPopupClose() {
      this.setData({
        showLinkPopup: false,
      })
    },
    handleLinkPopupConfirm(e: { detail: string[] }) {
      this.setData({
        showLinkPopup: false,
        linkList: e.detail,
      })
    },
  },
})
