// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Dialog from '@vant/weapp/dialog/dialog'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { roomBinding, homeBinding, userBinding } from '../../store/index'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [roomBinding, homeBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    selectHomeMenu: {
      x: '0px',
      y: '0px',
      isShow: false,
    },
    homeInfo: {
      name: ''
    },
    isEditName: false,
    isShowSettig: false,
    isTransferHome: false,
    settingActions: [
      {
        name: '重命名',
      },
      {
        name: '解散家庭',
      },
    ],
  },

  computed: {
    currentHomeName(data) {
      const homeList: Home.HomeInfo[] = data.homeList

      return homeList?.find((item) => item.home_id === (data.currentHomeId as string))?.home_name
    },
    selectHomeList(data): Home.DropdownItem[] {
      console.log('selectHomeList', data.currentHomeId)
      return data.homeList?.map((item: Home.HomeInfo) => ({
        value: item.home_id,
        name: item.home_name,
        isSelect: data.currentHomeId === item.home_id,
        isCreator: data.userInfo?.id === item.master_uid,
      }))
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {},
    moved: function () {},
    detached: function () {},
  },

  methods: {
    /**
     * 用户点击展示/隐藏家庭选择
     */
    async handleShowHomeSelectMenu() {
      const query = wx.createSelectorQuery()
      query.select('#homeName').boundingClientRect((res) => {
        console.log(111, res)
        this.doHomeSelectArrowAnimation(!this.data.selectHomeMenu.isShow, this.data.selectHomeMenu.isShow)
        this.setData({
          selectHomeMenu: {
            x: `${res.left + 10}px`,
            y: `${res.bottom + 10}px`,
            isShow: !this.data.selectHomeMenu.isShow,
          },
          'dropdownMenu.isShow': false,
        })
      })
      query.exec()
    },

    doHomeSelectArrowAnimation(newValue: boolean, oldValue: boolean) {
      if (newValue === oldValue) {
        return
      }
      if (newValue) {
        this.animate(
          '#homeSelectArrow',
          [
            {
              rotateZ: 0,
            },
            {
              rotateZ: 180,
            },
          ],
          200,
        )
      } else {
        this.animate(
          '#homeSelectArrow',
          [
            {
              rotateZ: 180,
            },
            {
              rotateZ: 0,
            },
          ],
          200,
        )
      }
    },

    toSetting() {
      this.setData({
        isShowSettig: true
      })
    },
    onCloseSetting() {
      this.setData({
        isShowSettig: false
      })
    },
    onSelectSetting(e: WechatMiniprogram.CustomEvent) {
      console.log('onSelectSetting', e.detail)
      let name = e.detail.name

      if (name === '重命名') {
        this.editName()
      } if (name === '解散家庭') {
        this.delHome()
      }
    },
    editName() {
      this.setData({
        isEditName: true,
      })
    },
    onCloseEditName() {
      this.setData({
        isEditName: false,
      })
    },
    async delHome() {
      let res = await Dialog.confirm({
        message: '是否解散当前家庭',
      }).catch(() => 'cancel')

      console.log('delHome', res);
    },

    toTransferHome() {
      this.setData({
        isTransferHome: true,
      })
    },
  },
})
