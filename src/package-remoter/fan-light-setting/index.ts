import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
// import Dialog from '@vant/weapp/dialog/dialog'
// import Toast from '@vant/weapp/toast/toast'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import {
  // remoterStore,
  remoterBinding
} from '../../store/index'
import dataBus from '../utils/dataBus'
// import { CMD } from '../../config/remoter'

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [remoterBinding] }), pageBehaviors],
  /**
   * 页面的初始数据
   */
  data: {
    deviceType: '',
    deviceModel: '',
    deviceAddr: '',
    mainOptionIndex: -1,
    funOptionList:[
      {name: '仅开灯', isChoose: false},
      {name: '灯+风扇都开', isChoose: false},
      {name: '仅开风扇', isChoose: false}
    ],
    curDragName: '',
    curOtherArr: [] as string[],
    maskPosY: 0,
    zoomMultiple: 1,
    layout: {
      top: 0,
      left: 0,
    },
    isLayoutReady: false,
    isDraging: false,
    delayTimer: null as null | NodeJS.Timeout
  },
  methods: {
    goBack() {
      wx.navigateBack()
    },
    async onLoad(query: { deviceType: string; deviceModel: string; addr: string }) {
      const { deviceType, deviceModel, addr } = query
      this.setData({ deviceType, deviceModel, deviceAddr: addr })

      dataBus.on('DEVSTATUS', (e) => {
        this.updateView(e)
      })
      this.getAccessCount()
    },
    updateView(status: any) {
      console.log('lmn>>>dev status=', JSON.stringify(status))
    },
    sendBluetoothCMD(paramsArr?: number[]) {
      if (!paramsArr || paramsArr.length == 0) return
      dataBus.emit('DEVSEND', paramsArr)
    },
    onTempCheck() {
      this.setData({
        mainOptionIndex: 0
      })
    },
    onFunctionCheck() {
      this.setData({
        mainOptionIndex: 1
      })
    },
    getAccessCount() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this
      wx.batchGetStorage({
        keyList: ['REMOTERTOTALACCESS'],
        success (res: any) {
          const list = res.dataList
          that.setData({
            totalAccess: list[0] ? parseInt(list[0]) : 0
          })
        }
      })
    },
    init() {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const that = this
      wx.getSystemInfo({
        success(res) {
          const screenWidth = res.screenWidth
          that.setData({
            zoomMultiple: 750 / screenWidth,
          })
        },
      })
    },
    reGetLayout() {
      wx.createSelectorQuery()
        .in(this)
        .select('#dragLayout')
        .boundingClientRect()
        .exec((rect) => {
          this.setData({
            layout: {
              top: rect[0].top * this.data.zoomMultiple,
              left: rect[0].left * this.data.zoomMultiple,
            },
            isLayoutReady: true,
          })
        })
    },
    start(e: any) {
      this.startDelay(e)
      this.setData({ isLayoutReady: false})
      this.reGetLayout()
    },
    startDelay(e: any) {
      const timer = setTimeout(() => {
        this.updateMaskView(e.touches[0].clientY)
        this.setData({
          isDraging: true,
          delayTimer: null
        })
        wx.vibrateShort({ type: 'light' })
      }, 1000)
      this.setData({
        delayTimer: timer
      })
    },
    move(e: any) {
      if (!this.data.isLayoutReady || !this.data.isDraging) return
      this.updateMaskView(e.touches[0].clientY)
      this.updateOptionView(e.touches[0].clientY)
    },
    updateMaskView(clientY: number) {
      const maxHeight = 336
      const maskHeight = 112
      const mY = clientY * this.data.zoomMultiple
      let layoutY = mY - this.data.layout.top
      layoutY = layoutY < 0 ? 0 : layoutY > maxHeight ? maxHeight : layoutY
      let maskY = layoutY - maskHeight / 2
      maskY = maskY < 0 ? 0 : maskY > maxHeight - maskHeight ? maxHeight - maskHeight : maskY
      if (!this.data.curDragName) {
        const dragIndex = Math.floor(layoutY / maskHeight)
        const option = this.data.funOptionList
        if (dragIndex >= 0 && dragIndex <= option.length - 1) {
          const arr = [] as string[]
          for (let i = 0; i < option.length; i++) {
            if (dragIndex !== i) arr.push(option[i].name)
          }
          this.setData({
            curDragName: option[dragIndex].name,
            curOtherArr: arr
          })
        }
      }
      this.setData({
        maskPosY: maskY
      })
    },
    updateOptionView(clientY: number) {
      const maxHeight = 336
      const maskHeight = 112
      const mY = clientY * this.data.zoomMultiple
      let layoutY = mY - this.data.layout.top
      layoutY = layoutY < 0 ? 0 : layoutY > maxHeight ? maxHeight : layoutY

      const dragIndex = Math.floor(layoutY / maskHeight)
      const option = this.data.funOptionList
      if (option[dragIndex].isChoose) return
      let cnt = 0
      for (let i = 0; i < option.length; i++) {
        if (dragIndex === i) {
          option[i].isChoose = true
          option[i].name = this.data.curDragName
        } else {
          option[i].isChoose = false
          option[i].name = this.data.curOtherArr[cnt]
          cnt++
        }
      }
      this.setData({
        funOptionList: option
      })
    },
    end() {
      if (this.data.delayTimer) clearTimeout(this.data.delayTimer)
      const option = this.data.funOptionList
      for (let i = 0; i < option.length; i++) {
        option[i].isChoose = false
      }
      this.setData({ 
        isDraging: false,
        funOptionList: option,
        delayTimer: null,
        curDragName: '',
        curOtherArr: []
      })
    },
  },
  lifetimes: {
    attached: function () {
      this.init()
    },
  },
})
