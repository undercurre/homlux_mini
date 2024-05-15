import { ComponentWithComputed } from 'miniprogram-computed'
import { runOnJS, Easing, timing, GestureState } from '../common/worklet'

type GestureEvent = {
  state: GestureState
}

ComponentWithComputed({
  properties: {
    disabled: Boolean,
    icon: {
      type: String,
      value: '',
    },
    iconActive: {
      type: String,
      value: '',
    },
    text: {
      type: String,
      value: '',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {},

  computed: {},

  methods: {
    handleTap(e: GestureEvent) {
      'worklet'
      console.log('handleTap', e)
      if (e.state === GestureState.CANCELLED) {
        return
      }
    },
  },
})
