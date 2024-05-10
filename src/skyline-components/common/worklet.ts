export const { shared, spring, timing, runOnJS, Easing } = wx.worklet

// 事件状态
export enum GestureState {
  // 手势未识别
  POSSIBLE = 0,
  // 手势已识别
  BEGIN = 1,
  // 连续手势活跃状态
  ACTIVE = 2,
  // 手势终止
  END = 3,
  // 手势取消
  CANCELLED = 4,
}
