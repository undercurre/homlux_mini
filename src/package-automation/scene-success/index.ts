// package-automation/scene-success/index.ts
Component({
  methods: {
    go2SceneIndex() {
      wx.navigateBack({
        delta: 1,
      })
    },
  },
})
