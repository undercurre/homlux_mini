import { login } from '../../apis/index'
import { storage } from '../../utils/storage'

// pages/login/index.ts
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isAgree: false,
  },

  onLoginClick() {
    if (!this.data.isAgree) {
      wx.showToast({
        title: '请同意协议',
        icon: 'none',
      })
      return
    }
    wx.login({
      success: (res) => {
        if (res.code) {
          this.handleLogin(res.code)
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      },
    })
  },

  async handleLogin(js_code: string) {
    const loginRes = await login(js_code)
    console.log(loginRes)
    if (loginRes.isSuccess && loginRes.data) {
      storage.set('token', loginRes.data.token)
      if (!loginRes.data.phone) {
        // 未绑手机号
        this.handleGetPhone()
      } else if (!loginRes.data.nickname) {
        // 未设置名称头像
        this.handleGetUserInfo()
      } else {
        console.log('去首页')
        wx.navigateTo({
          url: '/pages/index/index',
        })
      }
    }
  },

  handleGetPhone() {},

  handleGetUserInfo() {},

  onAgreeClick(event: { detail: boolean }) {
    console.log(event)
    this.setData({
      isAgree: event.detail,
    })
  },

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
