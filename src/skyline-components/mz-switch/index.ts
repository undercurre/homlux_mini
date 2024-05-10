Component({
  behaviors: ['wx://form-field'],
  externalClasses: ['node-class'],
  properties: {
    checked: null,
    loading: Boolean, //TODO
    disabled: Boolean,
    activeColor: String,
    inactiveColor: String,
    activeValue: {
      type: null,
      value: true,
    },
    inactiveValue: {
      type: null,
      value: false,
    },
  },
  methods: {
    onClick: function () {
      const activeValue = this.data.activeValue
      const inactiveValue = this.data.inactiveValue
      const disabled = this.data.disabled
      const loading = this.data.loading
      if (disabled || loading) {
        return
      }
      const checked = this.data.checked === activeValue
      const value = checked ? inactiveValue : activeValue
      this.triggerEvent('input', value)
      this.triggerEvent('change', value)
    },
  },
})
