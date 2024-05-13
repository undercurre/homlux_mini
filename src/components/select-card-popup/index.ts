import { roomStore } from '../../store/index'
interface CheckedDeviceItem extends Device.DeviceItem {
  checked: boolean
  id: string
}

interface CheckedSceneItem extends Scene.SceneItem {
  checked: boolean
  id: string
}
Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    /**
     * 弹窗标题
     */
    title: {
      type: String,
    },

    /**
     * 弹窗标题
     */
    titleLeftBtnText: {
      type: String,
      value: '',
    },
    /**
     * 展示的列表
     * cardType 是 switch light 传入 Device.DeviceItem[]
     * cardType 是 scene 传入 Scene.SceneItem[]
     */
    list: {
      type: Array,
      value: [],
      observer() {
        this.updateList()
      },
    },
    /**
     * 选中的设备的uniId
     * 灯：deviceId ；开关：deviceId:switchId
     */
    selectList: {
      type: Array,
    },

    // 默认显示的房间数据
    defaultRoomId: {
      type: String,
      value: '',
    },

    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (!value) return
        if (this.data.isSingleSelect) {
          this.setData({
            curItemSelectId: this.data.selectList[0] || '',
          })
        }
        if (this.data.roomList.length) {
          let roomSelect = roomStore.currentRoom?.roomId

          if (this.data.roomList.findIndex((item) => item.roomId === roomSelect) < 0) {
            roomSelect = this.data.roomList[0].roomId
          }

          if (this.data.selectList.length) {
            let selectItem = { roomId: '' }
            this.data.selectList.forEach((id: string) => {
              if (selectItem === undefined || !selectItem.roomId) {
                selectItem = this.data.list.find(
                  (item: Device.DeviceItem & Scene.SceneItem) => item.sceneId === id || item.uniId === id,
                )
              }
            })

            if (selectItem && selectItem.roomId) {
              roomSelect = selectItem.roomId
            } else {
              roomSelect = this.data.roomList[0].roomId
            }
          }
          if (this.data.defaultRoomId) {
            roomSelect = this.data.defaultRoomId
          }
          this.setData({
            roomSelect,
            tabIndex: this.data.roomList.findIndex((room) => room.roomId === roomSelect),
          })
        }
      },
    },
    /** 展示类型：light switch scene */
    cardType: {
      type: String,
      value: 'device',
    },
    showCancel: {
      type: Boolean,
      value: true,
    },
    cancelText: {
      type: String,
      value: '上一步',
    },
    showConfirm: {
      type: Boolean,
      value: true,
    },
    confirmText: {
      type: String,
      value: '确定',
    },

    /**
     * 弹窗提示文案
     */
    tipsText: {
      type: String,
    },
    isSingleSelect: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    roomSelect: '',
    offlineDevice: {} as Device.DeviceItem,
    allRoomItem: {} as Record<string, (CheckedDeviceItem | CheckedSceneItem)[]>,
    roomList: [] as Room.RoomInfo[],
    cardTypeUI: 'device',
    curItemSelectId: '', // 仅isSingleSelect为true时有用
    tabIndex: 0,
  },

  /**
   * 组件的方法列表
   */
  methods: {
    updateList() {
      const selectListSet = new Set(this.data.selectList)
      const allRoomItemMap = this.data.list.reduce(
        (acc: Map<string, (CheckedDeviceItem | CheckedSceneItem)[]>, item: Scene.SceneItem | Device.DeviceItem) => {
          const roomId = item.roomId
          if (acc.has(roomId)) {
            acc.get(roomId)!.push({
              ...item,
              checked: selectListSet.has((item as Scene.SceneItem).sceneId || (item as Device.DeviceItem).uniId),
              id: (item as Scene.SceneItem).sceneId || (item as Device.DeviceItem).uniId,
            })
          } else {
            acc.set(roomId, [
              {
                ...item,
                checked: selectListSet.has((item as Scene.SceneItem).sceneId || (item as Device.DeviceItem).uniId),
                id: (item as Scene.SceneItem).sceneId || (item as Device.DeviceItem).uniId,
              },
            ])
          }
          return acc
        },
        new Map<string, (Device.DeviceItem | Scene.SceneItem)[]>(),
      )
      const roomIdSet = new Set(allRoomItemMap.keys())
      const roomList = roomStore.roomList.filter((room) => roomIdSet.has(room.roomId))
      const sortedAllRoomItem = {} as Record<string, (CheckedDeviceItem | CheckedSceneItem)[]>
      roomList.forEach((room) => {
        sortedAllRoomItem[room.roomId] = allRoomItemMap.get(room.roomId)
      })
      this.setData({
        allRoomItem: sortedAllRoomItem,
        roomList,
        cardTypeUI: this.data.cardType,
      })
    },
    handleCardTap(e: { detail: { uniId?: string; sceneId?: string }; currentTarget: { dataset: { index: number } } }) {
      const { index } = e.currentTarget.dataset
      const { roomSelect, allRoomItem } = this.data

      const { checked, id = '' } = allRoomItem[roomSelect][index]
      const selectListSet = new Set(this.data.selectList)
      if (this.data.isSingleSelect) {
        selectListSet.clear()
        selectListSet.add(id)
      } else {
        if (checked) {
          selectListSet.delete(id)
        } else {
          selectListSet.add(id)
        }
      }

      this.data.selectList = Array.from(selectListSet)
      this.setData({
        [`allRoomItem.${this.data.roomSelect}[${index}].checked`]: !checked,
        curItemSelectId: id,
      })
      this.triggerEvent('select', e.detail.sceneId || e.detail.uniId)
    },
    handleOfflineTap(e: { detail: { uniId?: string; sceneId?: string } }) {
      this.triggerEvent('handleOfflineTap', e.detail.sceneId || e.detail.uniId)
    },
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', { selectList: this.data.selectList })
    },
    handleCancel() {
      this.triggerEvent('cancel')
    },
    handleRoomSelect(e: WechatMiniprogram.TouchEvent) {
      this.setData({
        roomSelect: e.currentTarget.dataset.roomid,
        tabIndex: e.currentTarget.dataset.index,
      })
    },
    onTabChanged(e: { detail: { current: number; source: string } }) {
      const { current } = e.detail

      this.setData({
        roomSelect: this.data.roomList[current].roomId,
        tabIndex: current,
      })
    },
    blank() {},
    clickTitleLeftBtn() {
      this.triggerEvent('clickTitleLeftBtn')
    },
  },
})
