// package-mine/home-manage/components/transfer-home/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding } from '../../../../store/index'
import { changeUserHouse, queryHouseUserList, quitUserHouse } from '../../../../apis/index'
import { emitter } from '../../../../utils/eventBus'
import Dialog from '@vant/weapp/dialog/dialog'
import Toast from '@vant/weapp/toast/toast'

Component({
  options: {
    addGlobalClass: true,
  },

  behaviors: [BehaviorWithStore({ storeBindings: [homeBinding] })],
  /**
   * 组件的属性列表
   */
  properties: {
    show: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * 组件的初始数据
   */
  data: {
    selectIndex: -1,
    userList: [] as Home.HouseUserItem[],
  },

  lifetimes: {
    async attached() {
      await this.queryHomeUsers()

      emitter.on('homeInfoEdit', () => {
        this.queryHomeUsers()
      })
    },
    detached() {
      emitter.off('homeInfoEdit')
    },
  },
  /**
   * 组件的方法列表
   */
  methods: {
    async queryHomeUsers() {
      const res = await queryHouseUserList({ houseId: homeBinding.store.currentHomeId })
      if (res.success) {
        this.setData({
          userList: res.result.houseUserList.filter((item) => item.userHouseAuth !== 1), // 过滤创建者，不能转让给自己
        })
      }
    },
    selectUser(event: WechatMiniprogram.CustomEvent) {
      const { index } = event.currentTarget.dataset

      this.setData({
        selectIndex: index,
      })
    },

    close() {
      this.triggerEvent('close')
    },

    /*
     * 确认转让家庭
     * 需要二次确认
     * 转让角色后同时退出家庭
     **/
    async handleConfirm() {
      this.triggerEvent('close')

      const dialog = await Dialog.confirm({
        message: '是否转让当前家庭',
      }).catch(() => 'cancel')
      if (dialog === 'cancel') return

      const item = this.data.userList[this.data.selectIndex]

      const changeRes = await changeUserHouse({ houseId: homeBinding.store.currentHomeId, changeUserId: item.userId })

      if (!changeRes.success) {
        Toast('转让失败')
        return
      }

      const delRes = await quitUserHouse(homeBinding.store.currentHomeDetail.houseId)
      Toast(delRes.success ? '转让成功' : '转让失败')
      homeBinding.store.updateHomeInfo()

      emitter.emit('homeInfoEdit')
    },
  },
})
