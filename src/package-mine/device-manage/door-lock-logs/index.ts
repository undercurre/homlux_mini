import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { deviceTransmit } from '../../../apis/index'
import dayjs from 'dayjs'

const WEEKDAY_ARRAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    logList: [] as IAnyObject[], // 日志列表
  },

  computed: {
    logListView(data) {
      const result = {} as IAnyObject

      data.logList.forEach((log, index) => {
        const { createTime } = log
        const [date, time] = createTime.split(' ')
        const key = String(data)
        if (!Object.prototype.hasOwnProperty.call(result, key)) {
          result[key] = {
            dateStr: dayjs(date).format('YYYY年M月D日'),
            weekday: WEEKDAY_ARRAY[Number(dayjs(date).format('d'))],
            list: [],
          }
        }
        result[key].list.push({
          index,
          content: log.content,
          date,
          time,
        })
      })

      return result
    },
  },

  methods: {
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {},

    onShow() {
      this.updateLogs()
    },

    async updateLogs() {
      const startTime = '2022-05-26 00:00:00'
      const endTime = '2024-09-25 23:59:59'
      // const startTime = dayjs().format('YYYY-MM-DD 00:00:00')
      // const endTime = dayjs().format('YYYY-MM-DD 23:59:59')
      const res = (await deviceTransmit('GET_DOOR_LOCK_DYNAMIC', {
        deviceId: '177021372098906',
        startTime,
        endTime,
        pageNo: 1,
        pageSize: 3,
        homeId: '67213056',
        userId: '63868780',
        messageId: '8537',
      })) as IAnyObject
      this.setData({
        logList: [...res.result.list, ...res.result.list, ...res.result.list, ...res.result.list, ...res.result.list],
      })
    },
  },
})
