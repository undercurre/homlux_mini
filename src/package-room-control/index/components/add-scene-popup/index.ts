import { addScene } from '../../../../apis/scene'
import { sceneList } from '../../../../config/index'
import { deviceStore, homeStore, roomStore, sceneStore } from '../../../../store/index'

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
    async handleConfirm() {
      const newSceneData = {
        conditionType: '0',
        deviceActions: [],
        deviceConditions: [],
        houseId: homeStore.currentHomeDetail.houseId,
        roomId: roomStore.roomList[roomStore.currentRoomIndex].roomId,
        sceneIcon: this.data.sceneIcon,
        sceneName: this.data.sceneName,
        sceneType: '0', // todo: 关联没做，先传0测试
      } as Scene.AddSceneDto
      // 补充actions
      const deviceMap = deviceStore.deviceMap
      // switch需要特殊处理
      const switchDeviceMap = {} as Record<string, { ep: number; OnOff: number }[]>
      deviceStore.selectList.forEach((id) => {
        if (id.includes(':')) {
          // 开关
          const deviceId = id.split(':')[0]
          const ep = parseInt(id.split(':')[1])
          const OnOff = deviceMap[deviceId].mzgdPropertyDTOList[ep].OnOff
          if (switchDeviceMap[deviceId]) {
            switchDeviceMap[deviceId].push({
              ep,
              OnOff,
            })
          } else {
            switchDeviceMap[deviceId] = [
              {
                ep,
                OnOff,
              },
            ]
          }
        } else {
          newSceneData.deviceActions.push({
            controlAction: [{ ep: 1, OnOff: deviceMap[id].mzgdPropertyDTOList[1].OnOff }],
            deviceId: id,
            deviceType: deviceMap[id].deviceType.toString(),
            proType: deviceMap[id].proType,
          })
        }
      })
      // 再将switch放到要发送的数据里面
      newSceneData.deviceActions.push(
        ...Object.entries(switchDeviceMap).map(([deviceId, actions]) => ({
          controlAction: actions,
          deviceId: deviceId,
          deviceType: deviceMap[deviceId].deviceType.toString(),
          proType: deviceMap[deviceId].proType,
        })),
      )
      const res = await addScene(newSceneData)
      if (res.success) {
        wx.showToast({
          icon: 'success',
          title: '收藏成功',
        })
        sceneStore.updateSceneList()
      } else {
        wx.showToast({
          icon: 'error',
          title: '收藏失败',
        })
      }
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
