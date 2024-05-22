const MIN_DISTANCE = 10
function getDirection(x: number, y: number) {
  if (x > y && x > MIN_DISTANCE) {
    return 'horizontal'
  }
  if (y > x && y > MIN_DISTANCE) {
    return 'vertical'
  }
  return ''
}
export default Behavior({
  data: {
    direction: '',
    deltaX: 0,
    deltaY: 0,
    offsetX: 0,
    offsetY: 0,
    startX: 0,
    startY: 0,
  },
  methods: {
    resetTouchStatus: function () {
      this.data.direction = ''
      this.data.deltaX = 0
      this.data.deltaY = 0
      this.data.offsetX = 0
      this.data.offsetY = 0
    },
    touchStart: function (event: WechatMiniprogram.TouchEvent) {
      this.resetTouchStatus()
      const touch = event.touches[0]
      this.data.startX = touch.clientX
      this.data.startY = touch.clientY
    },
    touchMove: function (event: WechatMiniprogram.TouchEvent) {
      const touch = event.touches[0]
      this.data.deltaX = touch.clientX - this.data.startX
      this.data.deltaY = touch.clientY - this.data.startY
      this.data.offsetX = Math.abs(this.data.deltaX)
      this.data.offsetY = Math.abs(this.data.deltaY)
      this.data.direction = this.data.direction || getDirection(this.data.offsetX, this.data.offsetY)
    },
  },
})
