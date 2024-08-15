import { ComponentWithComputed } from 'miniprogram-computed'
import { ossDomain } from '../../config/index'
import Dialog from '@vant/weapp/dialog/dialog'
import { sendDevice } from '../../apis/device'
import { emitter } from '../../utils/index'

type StatusType = 'wakeup' | 'connecting'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },

  properties: {
    show: {
      type: Boolean,
      value: false,
      observer(value) {
        if (value) {
          this.setData({ status: 'wakeup' })

          this.init()

          Dialog.confirm({
            context: this,
            confirmButtonText: '已点亮键盘',
            beforeClose: (action: string) => {
              if (action === 'confirm' && this.data.status === 'wakeup') {
                this.toCountDown()
              } else {
                Dialog.close()
                this.setData({ show: false }) // 设置父组件show属性为false
                clearInterval(this.data._countdownId)
              }
            },
          }).catch(() => {})
        }
      },
    },
    deviceInfo: Object,
  },

  /**
   * 组件的初始数据
   */
  data: {
    pic: `${ossDomain}/homlux/guide/door-wakup.png`,
    status: 'wakeup' as StatusType,
    second: 60,
    _countdownId: 0,
    _wakeupId: 0,
  },

  computed: {
    tips(data) {
      const { status, second } = data
      if (status === 'wakeup') {
        return '门锁已休眠，无法下发控制指令。\n如需唤醒，请点亮门锁键盘，并稍作等待。'
      } else if (status === 'connecting') {
        return `正在连接门锁，请耐心等待 (${second}s)`
      }
      return ''
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    init() {
      emitter.on('device_property', async (e) => {
        console.log('☄ [resume dialog]device_property', e)
        if (e.deviceId === this.data.deviceInfo.deviceId) {
          Dialog.close()
          emitter.off('device_property')
          this.toWakeup()
        }
      })
    },
    async wakeupDoor() {
      const { proType, deviceType, deviceId } = this.data.deviceInfo
      await sendDevice({
        proType,
        deviceType,
        deviceId,
        customJson: { cmdType: 24 },
      })
    },
    toCountDown() {
      this.data._countdownId && clearInterval(this.data._countdownId)
      this.setData({
        status: 'connecting',
        second: 60,
      })

      this.data._countdownId = setInterval(() => {
        this.setData({
          second: this.data.second - 1,
        })
        if (this.data.second <= 0) {
          clearInterval(this.data._countdownId)
          Dialog.close()

          // TODO 弹出离线提示
        }
      }, 1000)
    },
    toWakeup() {
      this.data._wakeupId && clearInterval(this.data._wakeupId)

      this.wakeupDoor()

      // 暂定4s发送一次唤醒指令，门锁10s左右后会陷入休眠
      this.data._wakeupId = setInterval(() => {
        this.wakeupDoor()
      }, 4000)
    },
  },
  detached() {
    console.log('[door-lock-resume detached]')
    this.data._wakeupId && clearInterval(this.data._wakeupId)
    this.data._countdownId && clearInterval(this.data._countdownId)
    emitter.off('device_property')
  },
})
