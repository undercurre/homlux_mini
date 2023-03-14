// package-mine/device-replace/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { deviceBinding } from '../../store/index'
import { StatusType } from './typings'
import { deviceReplace } from '../../apis/index'
import { emitter } from '../../utils/eventBus'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [deviceBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    status: 'introduce' as StatusType,
    isSelectOldDevice: false,
    isSelectNewDevice: false,
    oldDeviceItem: <Device.DeviceItem>{},
    newDeviceItem: <Device.DeviceItem>{}
  },

  computed: {
    rightBtnText(data) {
      const textMap = {
        introduce: '开始使用',
        oldDevice: '下一步',
        newDevice: '开始替换',
        processing: '',
        replaceFinish: '完成',
        replaceFail: '重试'
      }

      return textMap[data.status]
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {
      emitter.off('wsReceive')
    },
  },

  methods: {
    // 左边按钮，在选择新设备时或替换失败出现
    prevBtn() {
      this.setData({
        status: 'oldDevice',
      })
    },
    // 只在前三步出现，暂时逐一判断
    async nextBtn() {
       if (this.data.status === 'introduce') {
        this.setData({
          status: 'oldDevice',
        })
        return
      } 
      if (this.data.status === 'oldDevice') {
        this.setData({
          status: 'newDevice',
        })
        return
      } 
      if (this.data.status === 'newDevice') {
        this.setData({
          status: 'processing',
        })

        // 执行替换
        const res = await deviceReplace({
          newDevId: this.data.newDeviceItem.deviceId,
          oldDevId: this.data.oldDeviceItem.deviceId
        })
        console.log('deviceReplace', res)

        if (!res.success) {
          // 接口异常，直接失败
          this.setData({
            status: 'replaceFail',
          })
          return
        }
        const WAITING = 30000
        const st = setTimeout(() => {
          this.setData({
            status: 'replaceFail',
          })
        }, WAITING)

        emitter.on('wsReceive', async (e) => {
          // TODO 事件能否区分成功与失败？
          if (e.result.eventType !== "device_replace") {
            clearTimeout(st)
            this.setData({
              status: 'replaceFinish',
            })
          }
        })
        return
      }
    },

    addOldDevice() {
      this.setData({
        isSelectOldDevice: true,
      })
    },

    addNewDevice() {
      this.setData({
        isSelectNewDevice: true,
      })
    },

    closeDevicePopup() {
      this.setData({
        isSelectOldDevice: false,
        isSelectNewDevice: false
      })
    },

    confirmDevicePopup(event: WechatMiniprogram.CustomEvent<Device.DeviceItem>) {
      if (this.data.isSelectOldDevice) {
        this.setData({
          oldDeviceItem: event.detail
        })
      } else if(this.data.isSelectNewDevice) {
        this.setData({
          newDeviceItem: event.detail
        })
      }
      this.closeDevicePopup()
    }
  },
})
