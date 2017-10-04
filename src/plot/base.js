class BasePlot {
  constructor (options = {}) {
    this._data = undefined
    this._options = options
  }

  set data (val) {
    this._data = val
  }
  get data () {
    return this._data
  }

  async makePlot () {
    return Promise.resolve()
  }
}

export default BasePlot
