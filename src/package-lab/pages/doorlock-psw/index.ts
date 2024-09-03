import { ComponentWithComputed } from 'miniprogram-computed'
import pageBehaviors from '../../../behaviors/pageBehaviors'

ComponentWithComputed({
  behaviors: [pageBehaviors],

  /**
   * 页面的初始数据
   */
  data: {
    urls: {},
  },

  computed: {},

  pageLifetimes: {
    async show() {},
  },

  methods: {},
})
