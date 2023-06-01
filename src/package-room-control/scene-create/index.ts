import { deviceStore, homeStore, sceneStore } from '../../store/index'
import pageBehavior from '../../behaviors/pageBehaviors'
import { proType } from '../../config/index'
import {
  findDevice,
} from '../../apis/index'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'

Component({
  behaviors: [pageBehavior],
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {
    cacaheDeviceList: [], // 缓存选中前的设备状态
    deviceList: [],
  },

  lifetimes: {
    ready() {

    },
  },

  /**
   * 组件的方法列表
   */
  methods: {},
})
