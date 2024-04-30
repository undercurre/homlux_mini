Component({
  options: {
    pureDataPattern: /^_/, // 指定所有 _ 开头的数据字段为纯数据字段
  },
  externalClasses: ['active-class', 'toolbar-class', 'column-class'],
  properties: {
    title: String,
    loading: Boolean,
    showToolbar: Boolean,
    cancelButtonText: {
      type: String,
      value: '取消',
    },
    confirmButtonText: {
      type: String,
      value: '确认',
    },
    visibleItemCount: {
      type: Number,
      value: 6,
    },
    itemHeight: {
      type: Number,
      value: 44,
    },
    valueKey: {
      type: String,
      value: 'text',
    },
    toolbarPosition: {
      type: String,
      value: 'top',
    },
    defaultIndex: {
      type: Number,
      value: 0,
    },
    columns: {
      type: Array,
      value: [],
      observer: function (columns = []) {
        this.data._simple = Boolean(columns.length) && !columns[0].values
        if (Array.isArray(this.data._children) && this.data._children.length) {
          this.setColumns().catch(function () {})
        }
      },
    },
    unit: {
      type: Array,
      value: [],
    },
    unitTranslationX: {
      type: Array,
      value: [32],
    },
  },
  data: {
    _simple: false,
    _children: [] as WechatMiniprogram.Component.TrivialInstance[],
  },
  created: function () {
    Object.defineProperty(this.data, '_children', {
      get: () => {
        return this.selectAllComponents('.mz-picker__column') || []
      },
    })
  },
  methods: {
    noop: function () {},
    setColumns: function () {
      const columns = this.data._simple
        ? [{ values: this.data.columns, defaultIndex: this.data.defaultIndex }]
        : this.data.columns
      const stack = columns.map((column, index) => {
        return this.setColumnValues(index, column.values, column.defaultIndex)
      })
      return Promise.all(stack)
    },
    emit: function (event: { currentTarget: { dataset: { type: any } } }) {
      const type = event.currentTarget.dataset.type
      if (this.data._simple) {
        this.triggerEvent(type, {
          value: this.getColumnValue(0),
          index: this.getColumnIndex(0),
        })
      } else {
        this.triggerEvent(type, {
          value: this.getValues(),
          index: this.getIndexes(),
        })
      }
    },
    onChange: function (event: { currentTarget: { dataset: { index: any } } }) {
      if (this.data._simple) {
        this.triggerEvent('change', {
          picker: this,
          value: this.getColumnValue(0),
          index: this.getColumnIndex(0),
        })
      } else {
        this.triggerEvent('change', {
          picker: this,
          value: this.getValues(),
          index: event.currentTarget.dataset.index,
        })
      }
    },
    // get column instance by index
    getColumn: function (index: number) {
      return this.data._children[index]
    },
    // get column value by index
    getColumnValue: function (index: number) {
      const column = this.getColumn(index)
      return column && column.getValue()
    },
    // set column value by index
    setColumnValue: function (index: number, value: any) {
      const column = this.getColumn(index)
      if (column == null) {
        return Promise.reject(new Error('setColumnValue: 对应列不存在'))
      }
      return column.setValue(value)
    },
    // get column option index by column index
    getColumnIndex: function (columnIndex: number) {
      return (this.getColumn(columnIndex) || {}).data.currentIndex
    },
    // set column option index by column index
    setColumnIndex: function (columnIndex: number, optionIndex: any) {
      const column = this.getColumn(columnIndex)
      if (column == null) {
        return Promise.reject(new Error('setColumnIndex: 对应列不存在'))
      }
      return column.setIndex(optionIndex)
    },
    // get options of column by index
    getColumnValues: function (index: number) {
      return (this.data._children[index] || {}).data?.options
    },
    // set options of column by index
    setColumnValues: function (index: number, options: any, defaultIndex: number, needReset = true) {
      const column = this.data._children[index]
      if (column == null) {
        return Promise.reject(new Error('setColumnValues: 对应列不存在'))
      }
      const isSame =
        JSON.stringify(column.data.options) === JSON.stringify(options) && column.data.currentIndex === defaultIndex
      if (isSame) {
        return Promise.resolve()
      }
      return column.setData({ options: options }, () => {
        if (needReset) {
          column.setIndex(defaultIndex)
        }
      })
    },
    // get values of all columns
    getValues: function () {
      return this.data._children.map(function (child) {
        return child.getValue()
      })
    },
    // set values of all columns
    setValues: function (values: any[]) {
      const stack = values.map((value: any, index: any) => {
        return this.setColumnValue(index, value)
      })
      return Promise.all(stack)
    },
    // get indexes of all columns
    getIndexes: function () {
      return this.data._children.map((child) => {
        return child.data.currentIndex
      })
    },
    // set indexes of all columns
    setIndexes: function (indexes: any[]) {
      const stack = indexes.map((optionIndex, columnIndex) => {
        return this.setColumnIndex(columnIndex, optionIndex)
      })
      return Promise.all(stack)
    },
  },
})
