import dayjs from 'dayjs'
import { mobxBehavior } from './behavior'

Page({
  behaviors: [mobxBehavior],
  data: {
    logs: [],
  },
  onLoad() {
    console.log(this.data)
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map((log: string) => {
        return {
          date: dayjs(new Date(log)).format('YYYY年MM月DD日 HH:mm:ss'),
          timeStamp: log,
        }
      }),
    })
  },
})
