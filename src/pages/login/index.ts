// import { login } from '../../apis/index'
import { storage } from '../../utils/storage'

// pages/login/index.ts
Page({
  /**
   * 页面的初始数据
   */
  data: {
    isAgree: false,
  },

  onLoginClick(e: { detail: { code: string } }) {
    if (!this.data.isAgree) {
      wx.showToast({
        title: '请同意协议',
        icon: 'none',
      })
      return
    }
    wx.getUserInfo({
      success: (userInfoRes) => {
        wx.login({
          success: (res) => {
            if (res.code) {
              this.handleLogin({
                js_code: res.code,
                phone_code: e.detail.code,
                nickName: userInfoRes.userInfo.nickName,
                avatar: userInfoRes.userInfo.avatarUrl,
              })
            } else {
              console.log('登录失败！' + res.errMsg)
            }
          },
        })
      },
    })
  },

  async handleLogin(data: { js_code: string; phone_code: string; nickName: string; avatar: string }) {
    console.log(data)
    storage.set('token', 'test')
    wx.switchTab({
      url: '/pages/index/index',
    })

    // const loginRes = await login(data)
    // console.log(loginRes)
    // if (loginRes.isSuccess && loginRes.data) {
    //   storage.set('token', loginRes.data.token)
    //   storage.set('phone', loginRes.data.phone)
    //   storage.set('nickName', loginRes.data.nickname)
    //   storage.set('avatar', loginRes.data.avatar)
    //   console.log('去首页')
    //   wx.redirectTo({
    //     url: '/pages/index/index',
    //   })
    // }
  },

  onAgreeClick(event: { detail: boolean }) {
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
