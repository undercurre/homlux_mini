import pageBehavior from '../../../behaviors/pageBehaviors'
import Toast from '../../../skyline-components/mz-toast/toast'
import Dialog from '../../../skyline-components/mz-dialog/dialog'

Component({
  behaviors: [pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    showPopup: false,
    showPopup2: false,
    showPopMenu: false,
    disabled: false,
    roomTab: Array.from({ length: 9 }, (_, i) => ({
      roomName: `卧室${i + 1}`,
      roomId: `room${i + 1}`,
      name: `room${i + 1}`,
    })),
    tabActive: 'room2',
    switchStatus: false,
    columns: ['广州', '深圳', '佛山', '中山', '珠海', '肇庆', '清远'],
  },

  lifetimes: {
    ready() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    toggleDisabled() {
      this.setData({
        disabled: !this.data.disabled,
      })
    },
    handlePopMenu() {
      this.setData({
        showPopMenu: true,
      })
    },
    toClick() {
      console.log('toClick')
    },
    togglePopup(event: WechatMiniprogram.BaseEvent) {
      const data = {} as IAnyObject
      const key = event.currentTarget.dataset.key as 'showPopup' | 'showPopup2'

      data[key] = !this.data[key]
      this.setData(data)
    },
    showToast() {
      Toast({
        message: '请至少保留一个创建的家庭',
      })
    },
    async showDialog() {
      const res = await Dialog.confirm({
        title: '当前家庭已绑定美居账号，转让家庭必须先解绑，确认是否解绑',
      }).catch(() => 'cancel')

      console.log('delHome', res)
    },
    onRoomChange(event: { detail: { name: string } }) {
      console.log('onRoomChange', event)
      this.setData({
        tabActive: event.detail.name,
      })
    },
    hange(event: { detail: { name: string } }) {
      console.log('onRoomChange', event)
      this.setData({
        tabActive: event.detail.name,
      })
    },
    toggleSwitch(e: { detail: boolean }) {
      console.log('toggleSwitch', e)
      this.setData({ switchStatus: e.detail })
    },
    onPickerChange(event: { detail: { value: string; index: number } }) {
      console.log('onPickerChange', event)
      const { value, index } = event.detail
      Toast(`当前值：${value}, 当前索引：${index}`)
    },
  },
})
