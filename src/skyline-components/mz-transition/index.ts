import transitionBehavior from '../behaviors/transition'

Component({
  behaviors: [transitionBehavior],
  externalClasses: [
    'custom-class',
    'enter-class',
    'enter-active-class',
    'enter-to-class',
    'leave-class',
    'leave-active-class',
    'leave-to-class',
    'close-icon-class',
  ],
  /**
   * 组件的属性列表
   */
  properties: {},

  /**
   * 组件的初始数据
   */
  data: {},

  observers: {},

  /**
   * 组件的方法列表
   */
  methods: {},
})
