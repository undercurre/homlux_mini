import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { deviceTransmit } from '../../../apis/index'
import dayjs from 'dayjs'
import storage from '../../../utils/storage'

const WEEKDAY_ARRAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    logList: [] as IAnyObject[], // 日志列表
    deviceId: '',
    currentPeriod: 'weekly',
    currentPeriodName: '近一周',
    periodMenu: {
      x: '30rpx',
      y: (storage.get('statusBarHeight') as number) + (storage.get('navigationBarHeight') as number) + 60 + 'px',
      arrowX: 60,
      width: 280,
      height: 300,
      isShow: false,
      list: [
        {
          name: '近一周',
          value: 'weekly',
          checked: true,
        },
        {
          name: '近一个月',
          value: 'monthly',
          checked: false,
        },
        {
          name: '近两个月',
          value: 'bimonthly',
          checked: false,
        },
      ],
    },
    startTime: dayjs().subtract(1, 'week').format('YYYY-MM-DD 00:00:00'),
    showCalendar: false,
  },

  computed: {
    logListView(data) {
      const result = {} as IAnyObject

      data.logList.forEach((log, index) => {
        const { createTime } = log
        const [date, time] = createTime.split(' ')
        if (!Object.prototype.hasOwnProperty.call(result, date)) {
          result[date] = {
            dateStr: dayjs(date).format('YYYY年M月D日'),
            weekday: WEEKDAY_ARRAY[Number(dayjs(date).format('d'))],
            list: [],
          }
        }
        result[date].list.push({
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
    onLoad({ deviceId }: { deviceId: string }) {
      console.log('onLoad', deviceId)
      this.setData({
        deviceId,
      })
    },
    onShow() {
      this.updateLogs()
    },

    async updateLogs() {
      // const startTime = dayjs().format('YYYY-MM-DD 00:00:00')
      const endTime = dayjs().format('YYYY-MM-DD 23:59:59')
      const res = (await deviceTransmit('GET_DOOR_LOCK_DYNAMIC', {
        deviceId: this.data.deviceId,
        startTime: this.data.startTime,
        endTime,
        pageNo: 1,
        pageSize: 100,
      })) as IAnyObject
      this.setData({
        logList: res.result.list,
      })
    },

    handlePeriodMenu() {
      this.setData({
        ['periodMenu.isShow']: !this.data.periodMenu.isShow,
      })
    },

    handleMenuTap(e: { detail: string }) {
      const checked = e.detail
      if (checked === this.data.currentPeriod) return // 没有变化

      const index = this.data.periodMenu.list.findIndex((item) => item.value === checked)
      const diffData = {
        'periodMenu.isShow': false,
        currentPeriod: checked,
        currentPeriodName: this.data.periodMenu.list[index].name,
      } as IAnyObject
      for (const i in this.data.periodMenu.list) {
        diffData[`periodMenu.list[${i}].checked`] = Number(i) === index
      }
      switch (checked) {
        case 'weekly':
          diffData.startTime = dayjs().subtract(1, 'week').format('YYYY-MM-DD 00:00:00')
          break
        case 'monthly':
          diffData.startTime = dayjs().subtract(1, 'month').format('YYYY-MM-DD 00:00:00')
          break
        case 'bimonthly':
          diffData.startTime = dayjs().subtract(2, 'month').format('YYYY-MM-DD 00:00:00')
          break
      }
      this.setData(diffData)

      this.updateLogs()
    },

    handleCalendar() {
      this.setData({ showCalendar: true })
    },
  },
})
