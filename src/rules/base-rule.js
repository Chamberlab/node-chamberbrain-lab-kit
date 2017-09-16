class BaseRule {
  constructor (id) {
    this._id = id
    this._data = []
    this._maxBuffer = 1
  }
  _evaluate () {
    return true
  }

  get id () {
    return this._id
  }

  get data () {
    return this._data
  }
  set data (val) {
    if (val) {
      this._data.unshift(val)
      if (this.maxBuffer && this._data.length > this.maxBuffer) {
        this._data = this._data.slice(0, this.maxBuffer)
      }
    }
    else {
      this._data = []
    }
  }

  get maxBuffer () {
    return this._maxBuffer
  }
  set maxBuffer (val) {
    this._maxBuffer = val
  }

  get bufferSize () {
    return this._data.length
  }
  get state () {
    return this._evaluate()
  }
}

export default BaseRule
