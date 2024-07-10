import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { ComponentWithComputed } from 'miniprogram-computed'
import Toast from '@vant/weapp/toast/toast'
import pageBehaviors from '../../../behaviors/pageBehaviors'
import { homeBinding, userBinding, homeStore } from '../../../store/index'
import { emitter } from '../../../utils/eventBus'
import { ShareImgUrl } from '../../../config/index'
import {
  getShareId,
  updateHouseUserAuth,
  inviteHouseUserForMobile,
  queryHouseUserList,
  deleteHouseUser,
} from '../../../apis/index'

ComponentWithComputed({
  options: {
    pureDataPattern: /^_/,
  },
  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding, userBinding] }), pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    isShowPopup: false, // 是否弹窗
    isEditRole: false, // 是否编辑角色
    selectAction: 'BE_VIS', // 当前选择的选项key
    memberList: [] as object[],
    curClickUserItem: null as any,
    isAdmin: false,
    isVisitor: false,
    _shareId: '',
    _invite_type: '',
  },

  computed: {
    popupTitle(data) {
      return data.isEditRole ? '权限管理' : '邀请成员'
    },
    actionList(data) {
      // 创建者：1 管理员：2 游客：3
      const actionList: { key: string; text: string; label?: string }[] = []

      if (data.isEditRole) {
        const editUserRole = data.curClickUserItem?.roleCode

        if (homeStore.isCreator && editUserRole === 2) {
          actionList.push({
            key: 'CEL_ADMIN',
            text: '取消管理员',
          })
        }

        if (homeStore.isCreator && editUserRole === 3) {
          actionList.push({
            key: 'SET_ADMIN',
            text: '设为管理员',
            label: '与创建者相同的设备/场景管理权限',
          })
        }

        actionList.push({
          key: 'DEL_MEM',
          text: '移除该成员',
        })
      } else {
        if (homeStore.isCreator) {
          actionList.push({
            key: 'BE_MEM',
            text: '成为管理员',
            label: '与创建者相同的设备/场景管理权限',
          })
        }
        actionList.push({
          key: 'BE_VIS',
          text: '成为访客',
          label: '仅可使用设备与场景',
        })
      }

      return actionList
    },
  },

  lifetimes: {
    // 生命周期函数，可以为函数，或一个在 methods 段中定义的方法名
    attached: function () {
      this.updateShareSetting()
      this.initData()

      emitter.on('invite_user_house', () => {
        this.queryMemberList()
      })
    },
    detached: function () {
      emitter.off('invite_user_house')
    },
  },

  methods: {
    initData() {
      this.setData({
        isAdmin: homeStore.currentHomeDetail.houseUserAuth === 2,
        isVisitor: !homeStore.isManager,
      })
      this.queryMemberList()
    },
    async queryMemberList() {
      const res = await queryHouseUserList({ houseId: homeStore.currentHomeId }, { loading: true })
      if (res.success) {
        const list = res.result.houseUserList
          .sort((a, b) => {
            return a.userHouseAuth - b.userHouseAuth // 按角色权限高低排序
          })
          .map((item) => {
            return {
              icon: item.headImageUrl,
              name: item.userName,
              role: item.userHouseAuthName,
              id: item.userId,
              roleCode: item.userHouseAuth,
              isCanEdit: this.canIEditOther(homeStore.currentHomeDetail.houseUserAuth, item.userHouseAuth),
            }
          })

        this.setData({
          memberList: list,
        })
      } else {
        Toast('获取成员信息失败')
      }
    },
    // 判断当前用户是否可以编辑其他用户的角色
    canIEditOther(mySelf = 0, other: number) {
      // 创建者：1 管理员：2 游客：3
      if (mySelf === other) return false
      if (mySelf === 1) return true
      return false
    },
    onUserItemClick(data: any) {
      const item = data.currentTarget.dataset.item
      if (!item.isCanEdit) return
      this.setData({
        isShowPopup: true,
        isEditRole: true,
        curClickUserItem: item,
      })
    },
    hidePopup() {
      this.setData({
        isShowPopup: false,
        selectAction: '',
      })
    },
    // 获取新的shareId
    async updateShareId() {
      const res = await getShareId({ houseId: homeBinding.store.currentHomeId })

      if (res.success) {
        this.data._shareId = res.result.shareId
      }
    },
    onInviteMemberClick() {
      this.updateShareId()
      // 初始化邀请成员的默认选项
      this.setData({
        isShowPopup: true,
        isEditRole: false,
        selectAction: 'BE_VIS',
      })
    },
    onPopupClick(data: any) {
      const item = data.currentTarget.dataset.item
      this.setData({ selectAction: item.key })
    },
    /**
     * 手机号邀请
     */
    async inviteByMobile() {
      this.setData({
        isShowPopup: false,
      })
      const modalRes = await wx
        .showModal({
          title: '邀请手机号',
          editable: true,
        })
        .catch((err) => err)

      console.log('inviteByMobile', modalRes)

      if (modalRes.confirm) {
        const text = modalRes.content

        const key = this.data.selectAction
        let type = 3
        if (key === 'BE_MEM') {
          type = 2
        }

        const res = await inviteHouseUserForMobile(
          {
            mobilePhone: text,
            houseId: homeStore.currentHomeId,
            houseUserAuth: type,
            subscribeType: 1,
          },
          { loading: true },
        )

        console.log('inviteHouseUserForMobile', res)

        if (res.success) {
          Toast('邀请发送成功')
        } else {
          Toast('邀请发送失败')
        }
      }
    },

    /**
     * 微信邀请
     */
    inviteByWechat() {
      this.hidePopup()
    },
    /**
     * 微信邀请
     */
    onComfirmClick() {
      console.log('选择用户:', this.data.curClickUserItem, '/选择操作:', this.data.selectAction)
      const key = this.data.selectAction
      if (this.data.curClickUserItem) {
        if (key === 'SET_ADMIN') {
          this.changeUserRole(this.data.curClickUserItem.id, 2)
        } else if (key === 'CEL_ADMIN') {
          this.changeUserRole(this.data.curClickUserItem.id, 3)
        } else if (key === 'DEL_MEM') {
          this.deleteUser(this.data.curClickUserItem.id)
        }
      }
    },

    changeUserRole(userId: string, auth: Home.UserRole) {
      this.updateMemberAuth(userId, auth).then(() => {
        this.hidePopup()
        this.queryMemberList()
        emitter.emit('homeInfoEdit')
      })
    },
    /**
     * 删除家庭成员
     */
    async deleteUser(userId: string) {
      const res = await deleteHouseUser({ houseId: homeStore.currentHomeId, userId }, { loading: true })
      if (res.success) {
        this.hidePopup()
        this.queryMemberList()
        emitter.emit('homeInfoEdit')
      } else {
        Toast('删除家庭成员失败')
      }
    },

    /**
     * 更改家庭成员权限
     * 家庭成员权限，创建者：1 管理员：2 游客：3
     */
    async updateMemberAuth(userId: string, auth: Home.UserRole) {
      const res = await updateHouseUserAuth({ userId, auth, houseId: homeStore.currentHomeId }, { loading: true })
      if (res.success) {
        this.queryMemberList()
      } else {
        Toast('设置权限失败')
      }
    },
    updateShareSetting() {
      wx.updateShareMenu({
        withShareTicket: true,
        isPrivateMessage: true,
        //activityId: 'xxx',
        success() {
          wx.showShareMenu({
            withShareTicket: true,
            menus: ['shareAppMessage'],
          })
        },
      })
    },
    onShareAppMessage() {
      const promise = new Promise((resolve) => {
        setTimeout(() => {
          const key = this.data.selectAction
          let type = '3'
          if (key === 'BE_MEM') {
            type = '2'
          }
          const expireTime = new Date().valueOf() + 86400 * 1000 // 过期时间
          resolve({
            title: '邀请你加入我的家庭',
            path: `/pages/index/index?type=${type}&houseId=${homeBinding.store.currentHomeId}&expireTime=${expireTime}&shareId=${this.data._shareId}`,
            imageUrl: ShareImgUrl,
          })
        }, 500)
      })
      return {
        title: '邀请你加入我的家庭',
        path: '/pages/index/index?type=visitor',
        imageUrl: ShareImgUrl,
        promise,
      }
    },
  },
})
