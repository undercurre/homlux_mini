// package-mine/hoom-manage/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../behaviors/pageBehaviors'
import { homeBinding, userBinding } from '../../store/index'

ComponentWithComputed({
  options: {
    addGlobalClass: true,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isEditRole: false,
    memberList: [] as object[],
    actionList: [
      {
        key: 'SET_ADMIN',
        text: '设为管理员',
        label: '与创建者相同的设备/场景管理权限',
        isCheck: false,
        isShow: false,
      },
      {
        key: 'CEL_ADMIN',
        text: '取消管理员',
        isCheck: false,
        isShow: false,
      },
      {
        key: 'DEL_MEM',
        text: '移除该成员',
        isCheck: false,
        isShow: false,
      },
      {
        key: 'BE_MEM',
        text: '成为管理员',
        label: '与创建者相同的设备/场景管理权限',
        isCheck: false,
        isShow: false,
      },
      {
        key: 'BE_VIS',
        text: '成为访客',
        label: '仅可使用设备与场景',
        isCheck: false,
        isShow: false,
      },
    ],
    curClickUserItem: null as any,
    curOptionItem: null as any,
    curUser: { userHouseAuth: 0 } as Home.HouseUserItem,
  },

  computed: {},

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {
      userBinding.store.updateUserInfo().then(() => {
        this.initData()
      })
    },
    moved: function () {},
    detached: function () {},
  },

  methods: {
    initData() {
      homeBinding.store.updateHomeMemberList().then(() => {
        this.updateView()
      })
    },
    updateView() {
      const curUserId = userBinding.store.userInfo.userId
      const result: object[] = []
      const list = homeBinding.store.homeMemberInfo.houseUserList
      if (list) {
        const curUser = list.find((item: Home.HouseUserItem) => {
          return item.userId === curUserId
        })
        if (curUser) this.setData({ curUser: curUser })
        list.forEach((item: Home.HouseUserItem) => {
          let isCanEdit = false
          if (curUser?.userId === item.userId) isCanEdit = false
          else isCanEdit = this.canIEditOther(curUser?.userHouseAuth, item.userHouseAuth)
          result.push({
            icon: item.headImageUrl,
            name: item.userName,
            role: item.userHouseAuthName,
            id: item.userId,
            roleCode: item.userHouseAuth,
            isCanEdit: isCanEdit,
          })
        })
        this.setData({ memberList: result })
      }
    },
    canIEditOther(mySelf = 0, other: number) {
      //创建者：1 管理员：2 游客：3
      if (mySelf === other) return false
      if (mySelf === 1) return true
      return false
    },
    onUserItemClick(data: any) {
      const item = data.currentTarget.dataset.item
      if (!item.isCanEdit) return
      this.configPopupRoleOption(this.data.curUser.userHouseAuth, item.roleCode)
      this.setData({
        isEditRole: true,
        curClickUserItem: item,
      })
    },
    configPopupRoleOption(mySelf: number, other: number) {
      //创建者：1 管理员：2 游客：3
      const actionList = this.data.actionList
      actionList.forEach((item) => {
        if (mySelf === 1) {
          if (other === 2 && (item.key === 'CEL_ADMIN' || item.key === 'DEL_MEM')) {
            item.isCheck = false
            item.isShow = true
          } else if (other === 3 && (item.key === 'SET_ADMIN' || item.key === 'DEL_MEM')) {
            item.isCheck = false
            item.isShow = true
          }
        } else {
          item.isCheck = false
          item.isShow = false
        }
      })
      this.setData({ actionList: actionList })
    },
    configPopupInviteOption() {
      const actionList = this.data.actionList
      actionList.forEach((item) => {
        if (item.key === 'BE_MEM' || item.key === 'BE_VIS') {
          item.isCheck = false
          item.isShow = true
        } else {
          item.isCheck = false
          item.isShow = false
        }
      })
      this.setData({ actionList: actionList })
    },
    clearOptionList() {
      const actionList = this.data.actionList
      actionList.forEach((item) => {
        item.isCheck = false
        item.isShow = false
      })
      this.setData({ actionList: actionList })
    },
    setPopupOptionPick(key: string) {
      const actionList = this.data.actionList
      actionList.forEach((item) => {
        if (item.key === key) {
          item.isCheck = !item.isCheck
        } else {
          item.isCheck = false
        }
      })
      this.setData({ actionList: actionList })
    },
    hidePopup() {
      this.setData({
        isEditRole: false,
        curClickUserItem: null,
        curOptionItem: null,
      })
      setTimeout(() => {
        this.clearOptionList()
      }, 300)
    },
    onInviteMemberClick() {
      this.configPopupInviteOption()
      this.setData({
        isEditRole: true,
        curClickUserItem: null,
      })
    },
    onPopupClick(data: any) {
      const item = data.currentTarget.dataset.item
      this.setData({ curOptionItem: item })
      this.setPopupOptionPick(item.key)
    },
    onComfirmClick() {
      this.setData({ isEditRole: false })
      console.log(
        'lmn>>>选择用户:' +
          JSON.stringify(this.data.curClickUserItem) +
          '/选择操作:' +
          JSON.stringify(this.data.curOptionItem),
      )
      if (this.data.curClickUserItem && this.data.curOptionItem) {
        const key = this.data.curOptionItem.key
        if (key === 'SET_ADMIN') {
          this.changeUserRole(this.data.curClickUserItem.id, 2)
        } else if (key === 'CEL_ADMIN') {
          this.changeUserRole(this.data.curClickUserItem.id, 3)
        } else if (key === 'DEL_MEM') {
          this.deleteUser(this.data.curClickUserItem.id)
        }
      } else if (this.data.curOptionItem) {
        const key = this.data.curOptionItem.key
        if (key === 'BE_MEM') {
          // TODO
        } else if (key === 'BE_VIS') {
          // TODO
        }
      }
      this.setData({
        curClickUserItem: null,
        curOptionItem: null,
      })
    },
    changeUserRole(userId: string, auth: number) {
      homeBinding.store.updateMemberAuth(userId, auth).then(() => {
        this.updateView()
      })
    },
    deleteUser(userId: string) {
      homeBinding.store.deleteMember(userId).then(() => {
        this.updateView()
      })
    },
  },
})
