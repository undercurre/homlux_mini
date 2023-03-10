import { addScene } from '../../../../apis/scene'
import { proType, sceneList } from '../../../../config/index'
import { deviceStore, homeStore, roomStore, sceneStore } from '../../../../store/index'
import Toast from '@vant/weapp/toast/toast'

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
          sceneIcon: 'general',
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
    sceneList: sceneList.filter((scene) => !scene[1].isDefault),
    list: [] as (Device.DeviceItem | Scene.SceneItem)[],
    linkSelectList: [] as string[],
    linkSwitch: '', // 上一个确认的结果保存在这里
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
      if (!this.data.sceneName) {
        Toast('场景名不能为空')
        return
      }
      const newSceneData = {
        conditionType: '0',
        deviceActions: [],
        deviceConditions: [],
        houseId: homeStore.currentHomeDetail.houseId,
        roomId: roomStore.roomList[roomStore.currentRoomIndex].roomId,
        sceneIcon: this.data.sceneIcon,
        sceneName: this.data.sceneName,
        sceneType: this.data.linkSwitch ? '1' : '0',
      } as Scene.AddSceneDto
      if (this.data.linkSwitch) {
        // 绑定了开关
        newSceneData.deviceConditions = [
          {
            deviceId: this.data.linkSwitch.split(':')[0],
            controlEvent: [
              {
                ep: Number(this.data.linkSwitch.split(':')[1]),
                ButtonScene: 1,
              },
            ],
          },
        ]
      }
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
        } else if (deviceMap[id].proType === proType.light) {
          newSceneData.deviceActions.push({
            controlAction: [
              {
                ep: 1,
                OnOff: deviceMap[id].mzgdPropertyDTOList[1].OnOff,
                Level: deviceMap[id].mzgdPropertyDTOList[1].Level,
                ColorTemp: deviceMap[id].mzgdPropertyDTOList[1].ColorTemp,
              },
            ],
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
        Toast('收藏成功')
        sceneStore.updateSceneList()
        homeStore.updateRoomCardList()
        this.triggerEvent('addSuccess')
      } else {
        Toast('收藏失败')
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
        list: deviceStore.deviceFlattenList.filter(
          (item) => item.uniId.includes(':') && !deviceStore.selectList.includes(item.uniId),
        ),
        linkSelectList: this.data.linkSwitch ? [this.data.linkSwitch] : [],
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
        linkSwitch: this.data.linkSelectList[0] ? this.data.linkSelectList[0] : '',
      })
    },
    handleLinkSelect(e: { detail: string }) {
      if (deviceStore.switchSceneMap[e.detail]) {
        Toast('开关已绑定场景')
        return
      }
      if (this.data.linkSelectList[0] && this.data.linkSelectList[0] === e.detail) {
        this.setData({
          linkSelectList: [],
        })
        return
      }
      this.setData({
        linkSelectList: [e.detail],
      })
    },
  },
})
