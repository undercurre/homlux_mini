import { requestAnimationFrame } from '../common/utils'

const getClassNames = (name: string) => ({
  enter: `${name}-enter ${name}-enter-active enter-class enter-active-class`,
  'enter-to': `${name}-enter-to ${name}-enter-active enter-to-class enter-active-class`,
  leave: `${name}-leave ${name}-leave-active leave-class leave-active-class`,
  'leave-to': `${name}-leave-to ${name}-leave-active leave-to-class leave-active-class`,
})

export default Behavior({
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: true,
    },
    duration: {
      type: Number,
      value: 300,
    },
    name: {
      type: String,
      value: 'fade',
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    inited: false,
    status: '',
    classes: '',
    display: false,
    transitionEnded: true,
  },

  observers: {
    show: function (show) {
      console.log('observers-show', show, 'this.data.show', this.data.show)
      show ? this.enter() : this.leave()
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    enter() {
      const { name } = this.data
      const classNames = getClassNames(name)
      this.data.status = 'enter'
      this.triggerEvent('before-enter')
      requestAnimationFrame(() => {
        if (this.data.status !== 'enter') {
          return
        }
        this.triggerEvent('enter')
        this.setData({
          inited: true,
          display: true,
          classes: classNames.enter,
        })
        requestAnimationFrame(() => {
          if (this.data.status !== 'enter') {
            return
          }
          this.data.transitionEnded = false
          this.setData({ classes: classNames['enter-to'] })
        })
      })
    },
    leave() {
      if (!this.data.display) {
        return
      }
      const { name } = this.data
      const classNames = getClassNames(name)
      this.data.status = 'leave'
      this.triggerEvent('before-leave')
      requestAnimationFrame(() => {
        if (this.data.status !== 'leave') {
          return
        }
        this.triggerEvent('leave')
        this.setData({
          classes: classNames.leave,
        })
        requestAnimationFrame(() => {
          if (this.data.status !== 'leave') {
            return
          }
          this.data.transitionEnded = false
          setTimeout(() => this.onTransitionEnd(), this.data.duration)
          this.setData({ classes: classNames['leave-to'] })
        })
      })
    },
    onTransitionEnd() {
      if (this.data.transitionEnded) {
        return
      }

      this.data.transitionEnded = true
      this.triggerEvent(`after-${this.data.status}`)

      const { show, display } = this.data
      if (!show && display) {
        this.setData({ display: false })
      }
    },
  },
})
