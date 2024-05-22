import { roomStore } from '../../../../store/index'

Component({
  options: {},
  /**
   * 组件的属性列表
   */
  properties: {
    value: {
      type: String,
    },
    show: {
      type: Boolean,
      observer(value) {
        if (value) {
          this.setData({
            roomSelect: this.data.value,
            roomList: JSON.parse(JSON.stringify(roomStore.roomList)),
          })
        }
      },
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    roomSelect: '',
    roomList: [] as Room.RoomInfo[],
  },

  /**
   * 组件的方法列表
   */
  methods: {
    handleClose() {
      this.triggerEvent('close')
    },
    handleConfirm() {
      this.triggerEvent('confirm', this.data.roomSelect)
    },
    handleCancel() {
      this.triggerEvent('cancel')
    },
    handleRoomSelect(e: { currentTarget: { dataset: { id: string } } }) {
      this.setData({
        roomSelect: e.currentTarget.dataset.id,
      })
    },
  },
})
