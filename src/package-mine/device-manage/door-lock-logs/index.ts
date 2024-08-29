import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehavior from '../../../behaviors/pageBehaviors'
import { deviceTransmit } from '../../../apis/index'
import dayjs from 'dayjs'
import storage from '../../../utils/storage'
import { defaultImgDir } from '../../../config/index'

const WEEKDAY_ARRAY = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const LOG_PAGESIZE = 20 // 每页日志数

ComponentWithComputed({
  behaviors: [pageBehavior],
  /**
   * 页面的初始数据
   */
  data: {
    defaultImgDir,
    logList: [] as Device.DoorLockLog[], // 日志列表
    logTotal: 0,
    haveLogDates: [] as string[],
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
    endTime: dayjs().format('YYYY-MM-DD 23:59:59'),
    minDate: dayjs().subtract(2, 'month').valueOf(), // 日历显示范围
    maxDate: dayjs().valueOf(),
    showCalendar: false,
    refresherTriggered: false,
    isLoaded: false,
    // eslint-disable-next-line
    dayFormatter: (_: IAnyObject) => {}, // 日历日期格式化
    _isLoading: false, // 防止连续多次更新
    _currentPage: 0,
  },

  computed: {
    logListView(data) {
      const result = {} as IAnyObject

      data.logList.forEach((log: Device.DoorLockLog, index: number) => {
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
          textColor: log.isAlarm === '2' ? 'text-hex-ff3849' : 'text-hex-000',
          date,
          time,
        })
      })

      return result
    },
    logDateList(data) {
      return Object.keys(data.logListView)
    },
    hasLogList(data) {
      return !!data.logDateList.length
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
      this.updateLogs(true)
      this.getHaveLogDates()
    },

    /**
     * 更新日志列表
     * @param isRefresh 是否刷新数据；为否时为追加模式
     * @param startTime
     * @param endTime
     */
    async updateLogs(isRefresh = false, startTime?: string, endTime?: string) {
      this.data._isLoading = true
      const res = (await deviceTransmit(
        'GET_DOOR_LOCK_DYNAMIC',
        {
          deviceId: this.data.deviceId,
          startTime: startTime ?? this.data.startTime,
          endTime: endTime ?? this.data.endTime,
          pageNo: ++this.data._currentPage,
          pageSize: LOG_PAGESIZE,
        },
        { loading: true },
      )) as unknown as MzaioResponseRowData<{ list: Device.DoorLockLog[]; total: number }>
      this.setData({
        logList: isRefresh ? res.result.list : [...this.data.logList, ...res.result.list],
        logTotal: res.result.total,
        refresherTriggered: false,
        isLoaded: true,
      })
      this.data._isLoading = false
    },

    /**
     * 获取有日志的日期列表
     */
    async getHaveLogDates() {
      const res = (await deviceTransmit(
        'GET_HAVE_LOG_DATE',
        {
          deviceId: this.data.deviceId,
        },
        { loading: true },
      )) as unknown as MzaioResponseRowData<{ list: string[] }>
      // console.log('getHaveLogDates', res)
      const haveLogDates = res.result.list
      this.setData({
        haveLogDates,
        // dayFormatter: (day: IAnyObject) => {
        //   if (haveLogDates.includes(dayjs(day.date).format('YYYY-MM-DD'))) {
        //     day.className = 'hasLogInfo'
        //   }
        //   return day
        // },
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

      this.updateLogs(true)
    },

    handleCalendar() {
      this.setData({ showCalendar: true })
    },

    handleCalendarClose() {
      this.setData({ showCalendar: false })
    },

    handleCalendarConfirm(e: { detail: Date }) {
      const day = dayjs(e.detail)
      this.updateLogs(true, day.format('YYYY-MM-DD 00:00:00'), day.format('YYYY-MM-DD 23:59:59'))
      this.setData({ showCalendar: false, currentPeriodName: '近一天' })
    },
    scrollToLower() {
      const hasMoreLog = this.data.logList.length < this.data.logTotal
      if (!hasMoreLog || this.data._isLoading) return

      console.log('scrollToLower', { hasMoreLog })
      this.updateLogs()
    },
    refresherstatuschange(e: WechatMiniprogram.CustomEvent<{ status: number }>) {
      if (e.detail.status !== 1) return

      this.setData({
        refresherTriggered: true,
      })
      this.updateLogs(true)
    },
  },
})
