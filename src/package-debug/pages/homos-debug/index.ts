import pageBehavior from '../../../behaviors/pageBehaviors'
import { deviceBinding, roomBinding } from '../../../store/index'
import homOS from 'js-homos'
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'

const fs = wx.getFileSystemManager()
const logFilePath = homOS.getLogFilePath()

ComponentWithComputed({
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, deviceBinding] }), pageBehavior],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    selectGroupId: '',
    logList: [] as string[],
  },

  computed: {
    showRoomList(data: IAnyObject) {
      const list = data.roomList || []

      return list.map((item: IAnyObject) => ({
        text: `${item.roomName}(${item.deviceNum})`,
        value: item.groupId,
      }))
    },
  },

  lifetimes: {
    ready() {},
  },
  /**
   * 组件的方法列表
   */
  methods: {
    readLogNative() {
      fs.readFile({
        filePath: logFilePath,
        encoding: 'utf8',
        success: (res) => {
          console.log('readFile-success', res)
          const text = res.data as string

          this.setData({
            logList: text.split('\n'),
          })
        },
        fail(err) {
          console.log('readFile-fail', err)
        },
      })
    },

    clearLogNative() {
      fs.writeFile({
        filePath: logFilePath,
        data: '',
        success(res) {
          console.log('removeSavedFile-success', res)
        },
        fail(err) {
          console.log('removeSavedFile-fail', err)
        },
      })
    },
  },
})
