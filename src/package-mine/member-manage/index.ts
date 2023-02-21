// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding } from '../../store/index'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEditRole: false,
    memberList: [] as object [],
    actionList: [
      {
        text: '设为管理员',
        label: '与创建者相同的设备/场景管理权限',
        isCheck: true,
        isShow: true
      },
      {
        text: '取消管理员',
        isCheck: false,
        isShow: false
      },
      {
        text: '移除该成员',
        isCheck: false,
        isShow: true
      },
      {
        text: '成为管理员',
        label: '与创建者相同的设备/场景管理权限',
        isCheck: true,
        isShow: false
      },
      {
        text: '成为访客',
        label: '仅可使用设备与场景',
        isCheck: false,
        isShow: false
      },
    ],
    curPopupClickText: ''
  },

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {
      this.initData()
    },
    moved: function () {},
    detached: function () {},
  },

  methods: {
    initData() {
      homeBinding.store.updateHomeMemberList().then(() => {
        console.log('lmn>>>homeMemberInfo::' + JSON.stringify(homeBinding.store.homeMemberInfo))
        const result: object [] =  []
        if (homeBinding.store.homeMemberInfo.houseUserList) {
          homeBinding.store.homeMemberInfo.houseUserList.forEach((item: Home.HouseUserItem) => {
            result.push({
              icon: '/assets/img/device/light.png',
              name: item.userName,
              role: item.userHouseAuthName
            })
          })
          this.setData({ memberList: result})
        }
      })
    },
    changeRole() {
      this.setData({
        isEditRole: true,
      })
    },
    cancelChangeRole() {
      this.setData({
        isEditRole: false,
        curPopupClickText: ''
      })
    },
    onPopupClick(data: any) {
      const item = data.currentTarget.dataset.item
      this.setData({ curPopupClickText: item.text })
      console.log('lmn>>>' + JSON.stringify(item))
    },
    comfirmChangeRole() {
      this.setData({isEditRole: false })
      const text = this.data.curPopupClickText
      // if (text === '设为管理员') {
      //
      // } else if (text === '取消管理员') {
      //
      // } else if (text === '移除该成员') {
      //
      // } else if (text === '成为管理员') {
      //
      // } else if (text === '成为访客') {
      //
      // }
      console.log('lmn>>>comfirmChangeRole::' + text)
    }
  },
})
