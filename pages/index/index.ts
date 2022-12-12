import { mobxBehavior } from './behavior';
import { behavior as computedBehavior } from 'miniprogram-computed';

Page({
  behaviors: [mobxBehavior, computedBehavior],
  data: {
    someData: 'string1',
  },
  computed: {
    allSum(data: { numA: number; numB: number; global: { numA: number; numB: number } }) {
      return data.numA + data.numB + data.global.numA + data.global.numB;
    },
  },

  toLog() {
    wx.navigateTo({
      url: '/packages/logs/logs',
    });
  },
  toCamera() {
    wx.navigateTo({
      url: '/packages/camera/camera',
    });
  },

  onLoad: async function () {
    
  },
  onShow() {
    console.log(this.data);
  },
  showdata() {
    console.log(this.data);
  },
});
