type StatusName = 'networking' | 'success' | 'error' | 'bind'

interface PageData {
  status: StatusName
  currentStep: string
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    status: 'success',
    currentStep: '连接设备',
    stepList: [
      {
        text: '连接设备',
        isCheck: true
      },
      {
        text: '设备联网',
        isCheck: false
      },
      {
        text: '账号绑定',
        isCheck: false
      }
    ]
  } as PageData,

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {},

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
})
