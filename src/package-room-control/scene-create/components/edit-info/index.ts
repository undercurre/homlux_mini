import { sceneList } from '../../../../config/index'
import { deviceStore, sceneStore } from '../../../../store/index'
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import Dialog from '@vant/weapp/dialog/dialog'

ComponentWithComputed({
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
          this.setData({
            confirmInfo: {
              sceneIcon: 'general',
              sceneName: '',
              linkSwitch: '',
            },
          })
        }
      },
    },
    actions: {
      type: Array,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    isEditName: false, // 是否显示编辑名称弹窗
    isFocusNameInput: false,
    isShowIconPopup: false,
    sceneIcon: '',
    sceneName: '',
    sceneList: sceneList.filter((scene) => !scene[1].isDefault),
    list: [] as (Device.DeviceItem | Scene.SceneItem)[],
    linkSelectList: [] as string[],
    showLinkPopup: false,
    isAddingScene: false,
    confirmInfo: {
      sceneIcon: '',
      sceneName: '',
      linkSwitch: '', // 上一个确认的结果保存在这里
    },
  },

  computed: {
    disabled(data) {
      return !data.sceneName
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleReturn() {
      this.triggerEvent('cancel')
    },

    editName() {
      this.setData({
        isFocusNameInput: true,
        isEditName: true,
      })
    },

    onCloseEditName() {
      this.setData({
        isFocusNameInput: false,
        isEditName: false,
      })
    },

    confirmName() {
      if (!this.data.sceneName) {
        Toast({
          message: '场景名不能为空',
        })
        return
      }
      if (this.data.sceneName.length > 15) {
        Toast({
          message: '场景名称不能超过15个字符',
        })
        return
      }

      this.setData({
        'confirmInfo.sceneName': this.data.sceneName,
        isFocusNameInput: false,
        isEditName: false,
      })
    },

    editIcon() {
      this.setData({
        isShowIconPopup: true,
      })
    },

    onCloseEditIcon() {
      this.setData({
        isShowIconPopup: false,
      })
    },

    confirmIcon() {
      this.setData({
        'confirmInfo.sceneIcon': this.data.sceneIcon,
        isShowIconPopup: false,
      })
    },

    async handleConfirm() {
      this.triggerEvent('confirm', {
        sceneInfo: this.data.confirmInfo,
      })
    },
    handleClear() {
      this.setData({
        sceneName: '',
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
        list: deviceStore.allRoomDeviceFlattenList.filter((item) => {
          if (!item.uniId.includes(':')) {
            return false
          }
          // 排除掉已在待创建场景执行动作中的开关
          return !sceneStore.addSceneActions.some((action) => action.uniId === item.uniId)
        }),
        linkSelectList: this.data.confirmInfo.linkSwitch ? [this.data.confirmInfo.linkSwitch] : [],
      })
    },
    handleLinkPopupClose() {
      this.setData({
        showLinkPopup: false,
      })
    },
    handleLinkPopupConfirm() {
      this.setData({
        showLinkPopup: false,
        'confirmInfo.linkSwitch': this.data.linkSelectList[0] ? this.data.linkSelectList[0] : '',
      })
    },
    handleLinkSelect(e: { detail: string }) {
      if (this.data.linkSelectList[0] && this.data.linkSelectList[0] === e.detail) {
        this.setData({
          linkSelectList: [],
        })
        return
      }
      const isInActions = this.data.actions.some((action: Device.ActionItem) => {
        return action.uniId === e.detail
      })
      if (isInActions) {
        Dialog.confirm({
          message: '此开关已被其他场景使用，是否需要变更？',
          cancelButtonText: '取消',
          confirmButtonText: '变更',
          context: this,
          zIndex: 9999,
        }).then(() => {
          this.setData({
            linkSelectList: [e.detail],
          })
        })
      } else {
        this.setData({
          linkSelectList: [e.detail],
        })
      }
    },
  },
})
