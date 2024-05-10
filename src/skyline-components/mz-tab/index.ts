Component({
  relations: {
    '../mz-tabs/index': {
      type: 'ancestor',
      linked: function () {},
      linkChanged: function () {},
      unlinked: function () {},
    },
  },
  properties: {
    dot: {
      type: Boolean,
      observer: 'update',
    },
    info: {
      type: null,
      observer: 'update',
    },
    title: {
      type: String,
      observer: 'update',
    },
    disabled: {
      type: Boolean,
      observer: 'update',
    },
    titleStyle: {
      type: String,
      observer: 'update',
    },
    name: {
      type: null,
      value: '',
    },
  },
  data: {
    _parent: undefined as WechatMiniprogram.Component.TrivialInstance | undefined,
    _index: 0,
    _inited: false,
    active: false,
  },
  lifetimes: {
    attached: function () {
      // 在组件实例进入页面节点树时执行
      Object.defineProperty(this.data, '_parent', {
        get: () => {
          return this.getRelationNodes('../mz-tabs/index')[0]
        },
      })
      Object.defineProperty(this.data, '_index', {
        get: () => {
          let _a, _b
          return (_b = (_a = this.data._parent) === null || _a === void 0 ? void 0 : _a.data._children) === null ||
            _b === void 0
            ? void 0
            : _b.indexOf(this)
        },
      })
    },
  },
  methods: {
    getComputedName: function () {
      if (this.data.name !== '') {
        return this.data.name
      }
      return this.data._index
    },
    updateRender: function (active: boolean, parent: { data: { lazyRender: boolean; animated: boolean } }) {
      const parentData = parent.data
      this.data._inited = this.data._inited || active
      this.setData({
        active: active,
        shouldRender: this.data._inited || !parentData.lazyRender,
        shouldShow: active || parentData.animated,
      })
    },
    update: function () {
      if (this.data._parent) {
        this.data._parent.updateTabs()
      }
    },
  },
})
