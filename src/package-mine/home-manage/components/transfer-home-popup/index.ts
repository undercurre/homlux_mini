// package-mine/home-manage/components/transfer-home/index.ts
import { BehaviorWithStore } from 'mobx-miniprogram-bindings'
import { homeBinding } from '../../../../store/index'
import { changeUserHouse, queryHouseUserList } from '../../../../apis/index'
import { emitter } from '../../../../utils/eventBus'

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
      await this.queryHomeUsers();

      emitter.on("homeInfoEdit", () => {
        this.queryHomeUsers();
      })
    },
    detached() {
      emitter.off("homeInfoEdit")
    }
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

    async confirm() {
      const item = this.data.userList[this.data.selectIndex]

      const res = await changeUserHouse({ houseId: homeBinding.store.currentHomeId, changeUserId: item.userId })

      if (res.success) {
        homeBinding.store.updateHomeInfo()
      }

      this.triggerEvent('close')
    },
  },
})
