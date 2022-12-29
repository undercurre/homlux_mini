import { observable, runInAction, action } from 'mobx-miniprogram'

export const global = observable({
  isLoadedSvg: false,
  homeList: [
    {
      home_id: '111',
      home_name: '7071的家',
      master_uid: '7071',
    },
    {
      home_id: '112',
      home_name: '4321的家',
      master_uid: '4321',
    },
    {
      home_id: '113',
      home_name: '2314的家',
      master_uid: '2314',
    },
  ] as Home.HomeInfo[],
  currentHomeId: '111',

  numA: 1,
  numB: 2,

  get sum() {
    return this.numA + this.numB
  },

  setIsLoadSvg: function () {
    runInAction(() => {
      global.isLoadedSvg = true
    })
  },

  // 使用action没办法使用this（TS报错），而且不能像上面runInAction一样使用async封装一下（action放在async函数里应该会丢失响应式）
  update1: action(() => {
    const sum = global.sum
    global.numA = global.numB
    global.numB = sum
  }),
})
